# 📡 Webhook Documentation

Panduan integrasi webhook untuk menerima event real-time dari TikTok Live Monitor.

---

## 🚀 Cara Menggunakan

### Step 1: Jalankan Aplikasi

```bash
npm install
npm run dev
```

Buka browser: **http://localhost:3000**

---

### Step 2: Buka Settings

1. Klik icon **⚙️ Gear** di pojok kanan atas header
2. Modal settings akan muncul

---

### Step 3: Masukkan Webhook URL

1. Isi field **Webhook URL** dengan endpoint server Anda
   - Contoh: `https://your-api.com/webhook`
   - Untuk testing lokal: `https://abc123.ngrok.io/webhook`
2. Klik **Save**

---

### Step 4: Connect ke Live TikTok

1. Masukkan **username TikTok** (tanpa `@`, contoh: `cristiano`)
2. Klik **Connect**
3. Webhook akan aktif menerima event ketika terhubung

---

### Step 5: Disconnect

Klik **Disconnect** untuk stop menerima event dari webhook.

---

## 📦 Event Schema

### 💬 Chat Event

```json
{
  "type": "chat",
  "roomId": "7234567890123456789",
  "data": {
    "id": "uuid-123",
    "uniqueId": "username",
    "nickname": "Display Name",
    "comment": "Hello!",
    "profilePictureUrl": "https://...",
    "timestamp": 1710067200000
  }
}
```

### 🎁 Gift Event

```json
{
  "type": "gift",
  "roomId": "7234567890123456789",
  "data": {
    "id": "uuid-456",
    "uniqueId": "gifter",
    "nickname": "Gifter Name",
    "giftName": "Rose",
    "repeatCount": 10,
    "profilePictureUrl": "https://...",
    "timestamp": 1710067260000
  }
}
```

> **Note:** Gift dengan `repeatEnd = false` tidak dikirim (streak in progress).

---

## 💻 Contoh Implementasi

### Node.js + Express

```javascript
const express = require('express');
const app = express();

app.use(express.json());

app.post('/webhook', (req, res) => {
  const { type, data } = req.body;

  if (type === 'chat') {
    console.log(`${data.nickname}: ${data.comment}`);
  } else if (type === 'gift') {
    console.log(`${data.nickname} sent ${data.giftName} x${data.repeatCount}`);
  }

  res.status(200).json({ received: true });
});

app.listen(3001);
```

### Python + Flask

```python
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/webhook', methods=['POST'])
def webhook():
    payload = request.json
    if payload['type'] == 'chat':
        print(f"{payload['data']['nickname']}: {payload['data']['comment']}")
    elif payload['type'] == 'gift':
        print(f"{payload['data']['nickname']} sent {payload['data']['giftName']}")
    return jsonify({'received': True})

if __name__ == '__main__':
    app.run(port=3001)
```

### PHP

```php
<?php
$payload = json_decode(file_get_contents('php://input'), true);

if ($payload['type'] === 'chat') {
    error_log($payload['data']['nickname'] . ': ' . $payload['data']['comment']);
} elseif ($payload['type'] === 'gift') {
    error_log($payload['data']['nickname'] . ' sent ' . $payload['data']['giftName']);
}

echo json_encode(['received' => true]);
?>
```

---

## 💡 Use Cases

### Forward ke Discord

```javascript
const DISCORD_URL = 'https://discord.com/api/webhooks/xxx/yyy';

async function forwardToDiscord(payload) {
  const embed = {
    title: payload.type === 'chat' ? '💬 Chat' : '🎁 Gift',
    color: payload.type === 'chat' ? 0x3498db : 0xe74c3c,
    fields: [
      { name: 'User', value: payload.data.nickname },
      { name: 'Content', value: payload.type === 'chat' ? payload.data.comment : `${payload.data.giftName} x${payload.data.repeatCount}` },
    ],
  };

  await fetch(DISCORD_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds: [embed] }),
  });
}
```

### Simpan ke Database

```javascript
app.post('/webhook', async (req, res) => {
  await db.collection('events').insertOne({
    ...req.body,
    receivedAt: new Date(),
  });
  res.status(200).json({ received: true });
});
```

### Filter Chat

```javascript
const bannedWords = ['spam', 'scam'];

app.post('/webhook', (req, res) => {
  if (req.body.type === 'chat') {
    const comment = req.body.data.comment.toLowerCase();
    if (!bannedWords.some(w => comment.includes(w))) {
      broadcast(req.body.data);
    }
  }
  res.status(200).json({ received: true });
});
```

---

## 🧪 Testing

### Test dengan curl

```bash
curl -X POST http://localhost:3001/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "chat",
    "roomId": "123",
    "data": {
      "uniqueId": "test",
      "nickname": "Test User",
      "comment": "Hello"
    }
  }'
```

### Test dengan ngrok (Local Development)

```bash
# Expose local server
ngrok http 3001

# Gunakan URL ngrok di settings
```

---

## ⚠️ Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Webhook tidak diterima | Pastikan URL bisa diakses dari internet (gunakan ngrok untuk local) |
| Timeout | Response cepat dengan status 200 OK |
| Invalid JSON | Pastikan endpoint menerima `application/json` |

---

## 📝 Tips

1. **Response cepat** - Selalu kirim status 200 OK
2. **Process async** - Queue heavy processing di background
3. **Error handling** - Catch errors agar tidak crash
4. **Rate limiting** - Batasi request untuk prevent abuse
