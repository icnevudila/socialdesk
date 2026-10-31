import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs';

const root = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(root, '..', 'data');
const historyFile = path.join(dataDir, 'growth_history.json');
const logFile = path.join(dataDir, 'growth_daemon.log');

const TARGET_TAGS = [
  'isletme',
  'yerelisletme',
  'lokasyon',
  'girisimcilik',
  'esnaf',
  'kobiler',
  'pazarlama',
  'restoran'
];

const CURATED_COMMENTS = [
  'Bölgesel pazar ve lokasyon analizi işletmelerin büyümesinde gerçekten en kritik adımlardan biri.',
  'Yeni şube veya işletme açarken doğru saha verilerini ve çevre yoğunluğunu analiz etmek büyük fark yaratıyor.',
  'Yerel işletmelerin dijitalde görünür olması ve hedef kitleye doğru lokasyonda ulaşması harika bir strateji.',
  'Saha araştırması yaparken doğrulanmış lokasyon verisi kullanmak zaman ve maliyet tasarrufu sağlıyor, tebrikler.',
  'Doğru konum, doğru müşteri kitlesiyle buluşmanın ilk anahtarıdır. Çok yerinde bir paylaşım.'
];

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(logFile, line + '\n', 'utf-8');
  } catch {}
}

function loadHistory() {
  try {
    if (fs.existsSync(historyFile)) {
      return JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
    }
  } catch {}
  return { processedUrls: [], actionsToday: { likes: 0, comments: 0, stories: 0, date: '' } };
}

function saveHistory(hist) {
  try {
    fs.writeFileSync(historyFile, JSON.stringify(hist, null, 2), 'utf-8');
  } catch {}
}

function runPython(args, stdinData = null) {
  const python = path.join(root, '..', '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
  const cli = path.join(root, 'private_cli.py');
  return new Promise((resolve, reject) => {
    const child = spawn(python, [cli, ...args], {
      cwd: path.join(root, '..'),
      env: {...process.env, SOCIALDESK_DATA_DIR: dataDir, PYTHONIOENCODING: 'utf-8'}
    });
    let out = '', err = '';
    child.stdout.on('data', d => out += d);
    child.stderr.on('data', d => err += d);
    if (stdinData) {
      child.stdin.write(stdinData);
      child.stdin.end();
    }
    child.on('close', code => {
      if (code !== 0) {
        try {
          const parsed = JSON.parse(out);
          return reject(new Error(parsed.error || `Exit code ${code}`));
        } catch {}
        return reject(new Error(err.trim() || out.trim() || `Exit code ${code}`));
      }
      try {
        resolve(JSON.parse(out));
      } catch {
        resolve({ raw: out });
      }
    });
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function cycle() {
  const todayStr = new Date().toISOString().slice(0, 10);
  const hist = loadHistory();
  if (hist.actionsToday.date !== todayStr) {
    hist.actionsToday = { likes: 0, comments: 0, stories: 0, date: todayStr };
    saveHistory(hist);
  }

  // Daily limits: 50 likes, 40 stories, 8 comments max
  if (hist.actionsToday.likes >= 50 && hist.actionsToday.comments >= 8) {
    log('Günlük güvenli etkileşim sınırlarına ulaşıldı. Yarın devam edilecek.');
    return;
  }

  const tag = TARGET_TAGS[Math.floor(Math.random() * TARGET_TAGS.length)];
  log(`Hashtag taranıyor: #${tag}...`);

  let discoverResult;
  try {
    discoverResult = await runPython(['discover', '--tag', tag]);
  } catch (err) {
    log(`Hashtag keşif hatası: ${err.message}`);
    if (err.message.includes('checkpoint') || err.message.includes('suspended') || err.message.includes('challenge')) {
      log('Instagram kontrolü algılandı! 60 dakika soğuma moduna geçiliyor.');
      await sleep(60 * 60 * 1000);
    }
    return;
  }

  const items = discoverResult.items || [];
  log(`${items.length} adet gönderi bulundu.`);

  const processedSet = new Set(hist.processedUrls);
  const candidate = items.find(i => !processedSet.has(i.url));

  if (!candidate) {
    log('Bu etikette yeni işlenecek gönderi kalmadı.');
    return;
  }

  log(`Aday gönderi seçildi: ${candidate.url} (@${candidate.username})`);

  // 1. Organic Story View
  if (candidate.username && hist.actionsToday.stories < 40) {
    try {
      const sRes = await runPython(['story', '--username', candidate.username]);
      if (sRes.seen) {
        hist.actionsToday.stories++;
        log(`✓ Hikaye izlendi: @${candidate.username} (${sRes.count} adet)`);
      }
    } catch (e) {
      log(`Hikaye izleme hatası: ${e.message}`);
    }
  }

  // 2. Organic Like
  if (hist.actionsToday.likes < 50) {
    try {
      const lRes = await runPython(['like', '--url', candidate.url]);
      if (lRes.liked) {
        hist.actionsToday.likes++;
        log(`✓ Gönderi beğenildi: ${candidate.url} (Bugün toplam: ${hist.actionsToday.likes}/50)`);
      }
    } catch (e) {
      log(`Beğeni hatası: ${e.message}`);
    }
  }

  // 3. Rare, high-value organic comment (1 in every 5 posts, max 8/day)
  if (hist.actionsToday.comments < 8 && Math.random() < 0.25) {
    const commentText = CURATED_COMMENTS[Math.floor(Math.random() * CURATED_COMMENTS.length)];
    try {
      await sleep(15000); // 15s delay before typing comment
      const cRes = await runPython(['comment', '--url', candidate.url], JSON.stringify({ message: commentText }));
      if (cRes.id) {
        hist.actionsToday.comments++;
        log(`✓ Yorum paylaşıldı: "${commentText}" -> ${candidate.url} (Bugün toplam: ${hist.actionsToday.comments}/8)`);
      }
    } catch (e) {
      log(`Yorum hatası: ${e.message}`);
    }
  }

  hist.processedUrls.push(candidate.url);
  if (hist.processedUrls.length > 500) hist.processedUrls.shift();
  saveHistory(hist);
}

async function main() {
  log('Organik Instagram Büyüme Motoru (Human-Paced Growth Daemon) Başlatıldı.');
  while (true) {
    try {
      await cycle();
    } catch (err) {
      log(`Döngü hatası: ${err.message}`);
    }
    // Safe organic sleep: 240s to 360s (4 to 6 minutes between interactions)
    const delaySec = Math.floor(240 + Math.random() * 120);
    log(`Sonraki organik etkileşime kadar bekleniyor: ${delaySec} saniye (~${Math.round(delaySec/60)} dk)...`);
    await sleep(delaySec * 1000);
  }
}

main().catch(e => log('Fatal error: ' + e.message));
