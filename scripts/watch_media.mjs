import fs from 'node:fs';
import path from 'node:path';
import { execSync, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import OpenAI from 'openai';

const ROOT = process.cwd();
const WORKSPACE_FILE = path.join(ROOT, 'data', 'workspace.json');
const PUBLIC_MEDIA = path.join(ROOT, 'public', 'media');
const WATCH_DIR = process.env.WATCH_MEDIA_DIR || 'C:\\Users\\TP2\\Desktop\\veriburada medya\\video';

let openaiClient = null;
try {
  const envText = fs.existsSync(path.join(ROOT, '.env')) ? fs.readFileSync(path.join(ROOT, '.env'), 'utf8') : '';
  const match = envText.match(/OPENAI_API_KEY=(.+)/);
  if (match) openaiClient = new OpenAI({ apiKey: match[1].trim() });
} catch {}

function log(msg) {
  const ts = new Date().toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul' });
  console.log(`[${ts}] 🎬 [Media Watcher] ${msg}`);
}

function loadWorkspace() {
  return JSON.parse(fs.readFileSync(WORKSPACE_FILE, 'utf8'));
}

function saveWorkspace(db) {
  fs.writeFileSync(WORKSPACE_FILE, JSON.stringify(db, null, 2), 'utf8');
}

function getNextOptimalSlot(posts) {
  const reels = posts
    .filter(p => p.kind === 'reel' && p.scheduledAt)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  let baseDate = new Date();
  if (reels.length > 0) {
    const lastReelDate = new Date(reels[reels.length - 1].scheduledAt);
    if (lastReelDate.getTime() > baseDate.getTime()) {
      baseDate = lastReelDate;
    }
  }

  // Add 2 days
  const nextDate = new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000);
  
  // Alternate between 12:45 and 18:45 Istanbul time (UTC+3)
  // In UTC: 09:45 or 15:45
  const isEvening = baseDate.getUTCHours() < 12; // if last was morning, make this evening
  const targetHourUTC = isEvening ? 15 : 9;
  const targetMinUTC = 45;

  nextDate.setUTCHours(targetHourUTC, targetMinUTC, 0, 0);
  return nextDate.toISOString();
}

async function generateCaption(filename, titleHint = '') {
  const defaultPrompt = `Instagram Reels için yüksek etkileşimli, kurumsal ve güven veren Türkçe B2B açıklaması üret.
Marka: VeriBurada (veriburada.com - Türkiye İş ve Şirket Rehberi).
Konu: Doğrulanmış işletme verileri, firma telefonları, adresler, web siteleri, lokasyon analizi ve saha satış ekipleri için potansiyel müşteri listesi.
Video dosya adı: ${filename} ${titleHint}

Format:
- Dikkat çekici ilk 3 saniye kancası (Soru veya çarpıcı tespit)
- 2-3 cümlelik değer sunumu (Zaman kazancı, doğrudan karar vericiye ulaşma, güncel veriler)
- Net Harekete Geçirici Mesaj (CTA): "Ücretsiz örnek listeyi profildeki linkten (veriburada.com) hemen indirin."
- 15-18 adet popüler ve hedefe yönelik hashtag (#veriburada #b2b #isletme #girisimcilik #pazarlama #satis #esnaf #lokasyon #firma vb.)

Sadece hazır metni döndür.`;

  if (openaiClient) {
    try {
      const completion = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: defaultPrompt }],
        temperature: 0.7,
      });
      return completion.choices[0]?.message?.content?.trim();
    } catch (e) {
      log(`OpenAI API hatası: ${e.message}, hazır şablon kullanılıyor.`);
    }
  }

  return `B2B Satışta Hedef Kitlenize Ulaşmanın En Hızlı Yolu! 🎯

Doğru müşteriye ulaşmak için günlerce firma aramakla vakit kaybetmeyin. VeriBurada ile Türkiye genelindeki işletmelerin güncel telefon, adres, web sitesi ve yetkili bilgilerine tek tıkla ulaşın.

Saha ekibinizi ve satışlarınızı doğrudan karar vericilerle buluşturun.

👉 Ücretsiz örnek listeyi incelemek için profildeki linke tıklayın: veriburada.com

#veriburada #b2btürkiye #isletmeler #girisimcilik #satışvepazarlama #lokasyonanalizi #esnaf #kobi #şirketrehberi #pazaryeri #musteri #dijitalpazarlama`;
}

function generateThumbnail(videoPath, thumbPath) {
  try {
    execSync(`ffmpeg -y -ss 00:00:01 -i "${videoPath}" -vframes 1 -q:v 2 "${thumbPath}"`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function processVideo(filePath) {
  const filename = path.basename(filePath);
  const ext = path.extname(filename).toLowerCase();
  if (ext !== '.mp4' && ext !== '.mov') return;

  log(`Yeni video tespit edildi: ${filename}`);

  const db = loadWorkspace();
  const existingPost = db.posts.find(p => p.mediaUrl && p.mediaUrl.includes(filename));
  if (existingPost) {
    log(`${filename} zaten takvimde mevcut (ID: ${existingPost.id}). Atlanıyor.`);
    return;
  }

  // Copy to public/media if not already there
  const destPath = path.join(PUBLIC_MEDIA, filename);
  if (!fs.existsSync(destPath) || fs.statSync(destPath).size !== fs.statSync(filePath).size) {
    fs.copyFileSync(filePath, destPath);
    log(`${filename} -> public/media/ klasörüne kopyalandı.`);
  }

  // Generate thumbnail
  const thumbName = filename.replace(/\.(mp4|mov)$/i, '_thumb.jpg');
  const thumbPath = path.join(PUBLIC_MEDIA, thumbName);
  if (!fs.existsSync(thumbPath)) {
    generateThumbnail(destPath, thumbPath);
    log(`Kapak görseli oluşturuldu: ${thumbName}`);
  }

  // Calculate schedule
  const scheduledAt = getNextOptimalSlot(db.posts);
  const scheduledLocal = new Date(scheduledAt).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });
  log(`Hesaplanan yayın zamanı: ${scheduledLocal}`);

  // Generate caption
  const caption = await generateCaption(filename);

  const newPost = {
    id: randomUUID(),
    kind: 'reel',
    status: 'scheduled',
    title: `VeriBurada B2B Reel - ${filename.replace(/\.(mp4|mov)$/i, '')}`,
    caption,
    mediaUrl: `https://socialdesk-sage.vercel.app/media/${filename}`,
    thumbnailUrl: `https://socialdesk-sage.vercel.app/media/${thumbName}`,
    scheduledAt,
    createdAt: new Date().toISOString(),
    autoIngested: true,
  };

  db.posts.push(newPost);
  saveWorkspace(db);
  log(`✓ ${filename} başarıyla takvime eklendi ve planlandı!`);

  // Sync to Oracle VM
  try {
    const keyPath = 'C:\\Users\\TP2\\Downloads\\ssh-key-2026-10-31.key';
    if (fs.existsSync(keyPath)) {
      execSync(`scp -o StrictHostKeyChecking=no -i "${keyPath}" "${WORKSPACE_FILE}" opc@92.5.30.109:/home/opc/socialdesk-growth/data/workspace.json`, { stdio: 'ignore' });
      execSync(`scp -o StrictHostKeyChecking=no -i "${keyPath}" "${destPath}" opc@92.5.30.109:/home/opc/socialdesk-growth/public/media/${filename}`, { stdio: 'ignore' });
      if (fs.existsSync(thumbPath)) {
        execSync(`scp -o StrictHostKeyChecking=no -i "${keyPath}" "${thumbPath}" opc@92.5.30.109:/home/opc/socialdesk-growth/public/media/${thumbName}`, { stdio: 'ignore' });
      }
      log(`✓ Oracle VM ile senkronize edildi.`);
    }
  } catch (err) {
    log(`Oracle VM senkronizasyon uyarısı: ${err.message}`);
  }
}

export async function scanAllVideos() {
  log(`Klasörler taranıyor...`);
  const dirsToScan = [WATCH_DIR, PUBLIC_MEDIA].filter(d => fs.existsSync(d));

  for (const dir of dirsToScan) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      if (f.endsWith('.mp4') || f.endsWith('.mov')) {
        await processVideo(path.join(dir, f));
      }
    }
  }
}

export function startWatcher() {
  log(`Medya İzleyici Başlatıldı.`);
  log(`İzlenen Klasör: ${WATCH_DIR}`);
  log(`Hedef Medya Deposu: ${PUBLIC_MEDIA}`);

  // Initial scan
  scanAllVideos().then(() => {
    log(`İlk tarama tamamlandı. Klasör dinleniyor...`);
  });

  if (fs.existsSync(WATCH_DIR)) {
    fs.watch(WATCH_DIR, async (eventType, filename) => {
      if (!filename || (!filename.endsWith('.mp4') && !filename.endsWith('.mov'))) return;
      const fullPath = path.join(WATCH_DIR, filename);
      // Wait a moment for file write completion
      setTimeout(async () => {
        if (fs.existsSync(fullPath)) {
          await processVideo(fullPath);
        }
      }, 3000);
    });
  }
}

if (process.argv[1]?.endsWith('watch_media.mjs')) {
  startWatcher();
}
