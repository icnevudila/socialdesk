import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const wsPath = 'data/workspace.json';
const ws = JSON.parse(fs.readFileSync(wsPath, 'utf8'));
const accountId = '016c1c8f-1d53-4264-8668-87bacef67d0e';

// 1. Update 30 Visual Posts with actual files
for (let i = 1; i <= 30; i++) {
  const num = String(i).padStart(2, '0');
  const fileName = `${num}_Veriburada.png`;
  const post = ws.posts.find(p => p.mediaUrl && p.mediaUrl.includes('post_' + num));
  if (post) {
    post.mediaUrl = `https://socialdesk-sage.vercel.app/media/${fileName}`;
    post.localMediaUrl = `/media/${fileName}`;
  }
}

// 2. Add 3 New Video Reels
const newVideos = [
  {
    title: 'Şehrinizdeki Yeni İşletmeleri Haritada Keşfedin',
    fileName: 'video2.mp4',
    date: '2026-11-04T10:00:00.000Z', // 13:00 TSİ
    caption: 'Saha araştırması yaparken eski ve kapanmış işletmelerle vakit kaybetmeyin. Veriburada ile şehrinizde kapılarını yeni açan işletmeleri, iletişim bilgilerini ve konum yoğunluğunu tek tıkla listeleyin.\n\nÖrnek listeleri ve saha dökümlerini incelemek için: veriburada.com\n\n#reels #yeniaçılanişletmeler #lokasyonanalizi #sahaaraştırması #veriburada #b2b'
  },
  {
    title: 'Doğru Lokasyon Seçimi Nasıl Yapılır?',
    fileName: 'video3.mp4',
    date: '2026-11-08T10:00:00.000Z', // 13:00 TSİ
    caption: 'Yeni bir şube veya mağaza açarken çevredeki rakip ve müşteri yoğunluğunu bilmek başarının yarısıdır. Veriburada lokasyon analitiği sayesinde cadde cadde, mahalle mahalle işletme dağılımını görün, riskleri en aza indirin.\n\nDetaylı sektör analizleri için: veriburada.com\n\n#lokasyonanalizi #fizibilite #işgeliştirme #yatırım #veriburada #reels'
  },
  {
    title: 'CSV Formatında Hazır İşletme Listeleri',
    fileName: 'video4.mp4',
    date: '2026-11-12T10:00:00.000Z', // 13:00 TSİ
    caption: 'Satış ve pazarlama ekiplerinin en çok zaman kaybettiği konu: doğrulanmış müşteri verisi bulmak. İlinizi seçin, sektörünüzü filtreleyin ve güncel işletme listesini doğrudan CSV formatında indirin.\n\nHazır örnek listeleri hemen inceleyin: veriburada.com\n\n#csv #müşterilistesi #b2bveri #satışstratejisi #veriburada #reels'
  }
];

for (const v of newVideos) {
  const existing = ws.posts.find(p => p.mediaUrl && p.mediaUrl.includes(v.fileName));
  if (!existing) {
    ws.posts.push({
      id: randomUUID(),
      title: v.title,
      caption: v.caption,
      kind: 'reel',
      status: 'scheduled',
      scheduledAt: v.date,
      mediaUrl: `https://socialdesk-sage.vercel.app/media/${v.fileName}`,
      localMediaUrl: `/media/${v.fileName}`,
      accountId,
      theme: 'forest',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
}

// Ensure sorting by scheduled date
ws.posts.sort((a, b) => {
  const da = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
  const db = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
  return da - db;
});

fs.writeFileSync(wsPath, JSON.stringify(ws, null, 2), 'utf8');
console.log('Total posts in workspace now:', ws.posts.length);
console.log('Total reels now:', ws.posts.filter(p => p.kind === 'reel').length);
