import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs';

const root = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(root, '..', 'data');
const wsPath = path.join(dataDir, 'workspace.json');

const POSTS = [
  {
    index: 1,
    title: 'Dağınık Bilgilerden Düzenli Listelere',
    file: path.join(root, '..', 'public', 'media', '02_duzenli_listeler.jpg'),
    caption: 'İnternetteki parça parça ve güncelliğini yitirmiş rehberlerle vakit kaybetmeyin. İşletme adı, iletişim bilgileri ve konum verilerini tek bir düzenli CSV dosyasında toplayın. Örnek listeleri incelemek için: veriburada.com\n\n#düzenliveri #işletmelistesi #csv #verimodelleme #veriburada'
  },
  {
    index: 2,
    title: 'Şehrinizde Yeni Kim Var? Aylık Liste',
    file: path.join(root, '..', 'public', 'media', '03_yeni_acilan_isletmeler.jpg'),
    caption: 'Şehrinizde kapılarını yeni açan işletmelerden ilk siz haberdar olun. Tedarikçi, toptancı ve ajanslar için her ay güncellenen yeni açılan işletmeler listesini veriburada.com üzerinden temin edebilirsiniz.\n\n#yeniaçılanişletmeler #sıcakfırsatlar #tedarikçi #b2bsatış #veriburada'
  },
  {
    index: 4,
    title: 'Listenize Giden 3 Kolay Adım',
    file: path.join(root, '..', 'public', 'media', '05_uc_adimda_liste.jpg'),
    caption: '1. İlinizi seçin. 2. Sektörünüzü belirleyin. 3. İşletme listenizi CSV formatında indirin. Satış ve pazarlama ekiplerinin aradığı hız veriburada.com adresinde.\n\n#üçadımdaveri #kolayfiltre #pazararaştırması #hızlıerişim #veriburada'
  },
  {
    index: 5,
    title: 'Telefon, Web ve Adres Tek Listede',
    file: path.join(root, '..', 'public', 'media', '06_telefon_web_adres.jpg'),
    caption: 'Hatalı numaralar ve kapanmış adreslerle zaman kaybetmeyin. Doğrulanmış telefon, aktif web sitesi ve açık adres verilerini düzenli sütunlarda incelemek için veriburada.com\'daki örnek CSV dökümüne göz atın.\n\n#doğrulanmışveri #telefonadresi #müşteriverisi #b2bveri #veriburada'
  }
];

function runPublish(file, caption) {
  const python = path.join(root, '..', '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
  const cli = path.join(root, 'private_cli.py');
  return new Promise((resolve, reject) => {
    const child = spawn(python, [cli, 'publish', '--file', file, '--caption', caption], {
      cwd: path.join(root, '..'),
      env: {...process.env, SOCIALDESK_DATA_DIR: dataDir, PYTHONIOENCODING: 'utf-8'}
    });
    child.stdin.end();
    let out = '', err = '';
    child.stdout.on('data', d => out += d);
    child.stderr.on('data', d => err += d);
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

async function main() {
  console.log(`[Showcase Publisher] 4 Gönderilik Vitrin Yayınlama İşlemi Başlıyor...`);

  for (let i = 0; i < POSTS.length; i++) {
    const item = POSTS[i];
    console.log(`\n--------------------------------------------------`);
    console.log(`[${i + 1}/4] Yayına alınıyor: "${item.title}"`);
    console.log(`Görsel: ${item.file}`);
    
    try {
      const res = await runPublish(item.file, item.caption);
      console.log(`✓ Başarıyla yayınlandı!`);
      console.log(`  ID: ${res.id}`);
      console.log(`  Bağlantı: ${res.permalink}`);

      // Update workspace.json
      try {
        const ws = JSON.parse(fs.readFileSync(wsPath, 'utf-8'));
        const target = ws.posts[item.index] || ws.posts.find(p => p.title === item.title);
        if (target) {
          target.status = 'published';
          target.publishedId = String(res.id);
          target.publishedAt = new Date().toISOString();
          target.permalink = res.permalink;
          fs.writeFileSync(wsPath, JSON.stringify(ws, null, 2), 'utf-8');
        }
      } catch (err) {
        console.warn('Workspace senkron hatası:', err.message);
      }

    } catch (err) {
      console.error(`✗ Yayınlama hatası: ${err.message}`);
      if (err.message.includes('checkpoint') || err.message.includes('suspended')) {
        console.error('Güvenlik uyarısı nedeniyle işlem durduruldu.');
        break;
      }
    }

    if (i < POSTS.length - 1) {
      console.log(`\n⏳ Instagram spam koruması için 120 saniye bekleniyor...`);
      await sleep(120000);
    }
  }

  console.log(`\n==================================================`);
  console.log(`[Showcase Publisher] Vitrin yayınlama tamamlandı!`);
}

main().catch(console.error);
