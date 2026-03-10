
# 📚 Instagram Scraper API Documentation

## Base URL
```

http://localhost:3000

```

## Endpoints

### 1. Health Check
```

GET /api/health

```
**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45
}
```

2. Scrape Video Info

```
GET /api/scrape?url=INSTAGRAM_URL
```

Parameters:

· url (required): Instagram post/reel URL

Response:

```json
{
  "success": true,
  "videoUrl": "https://...mp4",
  "type": "video",
  "method": "html",
  "cached": false
}
```

3. Download Video

```
GET /api/download?url=INSTAGRAM_URL
```

Returns video file as attachment

4. Batch Scrape

```
POST /api/batch
Content-Type: application/json

{
  "urls": ["url1", "url2"]
}
```

Rate Limits

· 50 requests per 15 minutes per IP
· Batch: max 10 URLs

Caching

· Results cached for 1 hour
· Cache headers included in response

```

### **10. Complete `README.md`**
```markdown
# 📸 Instagram Scraper API

<p align="center">
  <img src="https://img.shields.io/badge/Version-2.0.0-purple?style=for-the-badge">
  <img src="https://img.shields.io/badge/Node.js-Express-green?style=for-the-badge">
  <img src="https://img.shields.io/badge/Puppeteer-Stealth-blue?style=for-the-badge">
  <img src="https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge">
</p>

<p align="center">
  <b>Self-hosted Instagram video/reel scraper API with multiple fallback methods</b>
</p>

---

## 🎯 Features

- 🔄 **3 Scraping Methods**: HTML → Public APIs → Puppeteer
- 📦 **Built-in Caching**: 1 hour cache to reduce requests
- ⚡ **Rate Limiting**: 50 requests per 15 minutes
- 📱 **Mobile Support**: Works with Reels, Posts, IGTV
- 🚀 **Batch Processing**: Scrape up to 10 URLs at once
- 🔒 **Self-Hosted**: Complete control, no API keys needed

---

## 🚀 Quick Deploy

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Dbz-Mahin7x/instagram-scraper-api)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/instagram-scraper)

### Local Setup
```bash
git clone https://github.com/Dbz-Mahin7x/instagram-scraper-api.git
cd instagram-scraper-api
npm install
cp .env.example .env
npm run dev
```

---

📦 Environment Variables

Variable Description Default
PORT Server port 3000
NODE_ENV Environment production
RATE_LIMIT_WINDOW Rate limit window (ms) 900000
RATE_LIMIT_MAX Max requests per window 50
CACHE_TTL Cache TTL (seconds) 3600

---

📡 API Endpoints

Method Endpoint Description
GET /api/health Health check
GET /api/scrape?url=... Get video info
GET /api/download?url=... Download video
POST /api/batch Batch scrape

---

🐳 Docker Deployment

```bash
# Build image
docker build -t insta-scraper-api .

# Run container
docker run -p 3000:3000 --env-file .env insta-scraper-api

# Or use docker-compose
docker-compose up -d
```

---

📝 License

MIT © Mahin Ahmed

---

<p align="center">
  Made with ❤️ in Bangladesh 🇧🇩
</p>