const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs-extra');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');

dotenv.config();

const InstagramScraper = require('./scraper');
const scraper = new InstagramScraper();
const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Create cache directory
const cacheDir = path.join(__dirname, 'cache');
fs.ensureDirSync(cacheDir);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, please try again later.'
  }
});
app.use('/api/', limiter);

// Serve static files (for cached videos)
app.use('/cache', express.static(cacheDir));

// Routes
app.get('/', (req, res) => {
  res.json({
    name: 'Instagram Scraper API',
    version: '2.0.0',
    author: 'Your Name',
    endpoints: {
      '/api/scrape?url=[instagram_url]': 'Scrape Instagram video',
      '/api/download?url=[instagram_url]': 'Download and return video',
      '/api/info?url=[instagram_url]': 'Get video info only',
      '/api/health': 'Check API status'
    },
    notes: {
      rateLimit: '50 requests per 15 minutes',
      cache: 'Results cached for 1 hour',
      methods: 'HTML scraping → Public APIs → Puppeteer'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Scrape endpoint
app.get('/api/scrape', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Missing url parameter'
      });
    }

    if (!url.includes('instagram.com')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Instagram URL'
      });
    }

    // Check cache
    const cacheKey = `scrape_${url}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('📦 Serving from cache');
      return res.json({
        success: true,
        cached: true,
        ...cached
      });
    }

    // Scrape
    const result = await scraper.scrape(url);

    if (!result.success) {
      return res.status(404).json(result);
    }

    // Cache result
    cache.set(cacheKey, result);

    res.json({
      success: true,
      cached: false,
      ...result
    });

  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Download endpoint
app.get('/api/download', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Missing url parameter'
      });
    }

    // Scrape first
    const result = await scraper.scrape(url);

    if (!result.success || !result.videoUrl) {
      return res.status(404).json({
        success: false,
        error: 'Could not extract video URL'
      });
    }

    // Download video
    const videoUrl = result.videoUrl;
    const fileName = `insta_${Date.now()}.mp4`;
    const filePath = path.join(cacheDir, fileName);

    const response = await axios({
      method: 'GET',
      url: videoUrl,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on('finish', () => {
      // Send file
      res.download(filePath, fileName, (err) => {
        if (err) {
          console.error('Download error:', err);
        }
        // Clean up after sending
        fs.unlink(filePath).catch(console.error);
      });
    });

    writer.on('error', (error) => {
      console.error('Write error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to save video'
      });
    });

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Info endpoint
app.get('/api/info', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Missing url parameter'
      });
    }

    const info = await scraper.getInfo(url);

    res.json({
      success: true,
      ...info
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Batch scrape endpoint
app.post('/api/batch', async (req, res) => {
  try {
    const { urls } = req.body;

    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({
        success: false,
        error: 'Missing urls array in body'
      });
    }

    if (urls.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 10 URLs per batch'
      });
    }

    const results = [];
    for (const url of urls) {
      const result = await scraper.scrape(url);
      results.push({
        url,
        ...result
      });
      // Delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    res.json({
      success: true,
      total: results.length,
      results
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
  🚀 Instagram Scraper API
  ─────────────────────────
  📡 Server: http://localhost:${PORT}
  📚 Docs: http://localhost:${PORT}/
  🔧 Methods: HTML → API → Puppeteer
  ⚡ Rate Limit: 50/15min
  📦 Cache: 1 hour
  ─────────────────────────
  `);
});