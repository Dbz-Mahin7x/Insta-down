const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');
const NodeCache = require('node-cache');

const app = express();
const cache = new NodeCache({ stdTTL: 3600 });

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

// Simple HTML scraper (no Puppeteer for Vercel)
async function scrapeInstagram(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 10000
    });

    const html = response.data;
    
    // Method 1: Meta tags
    const metaMatch = html.match(/<meta property="og:video" content="([^"]+)"/);
    if (metaMatch) {
      return { success: true, videoUrl: metaMatch[1], method: 'meta' };
    }

    // Method 2: JSON data
    const jsonMatch = html.match(/"video_url":"([^"]+\.mp4[^"]*)"/);
    if (jsonMatch) {
      return { 
        success: true, 
        videoUrl: jsonMatch[1].replace(/\\u0026/g, '&'),
        method: 'json' 
      };
    }

    // Method 3: Fallback to public API
    const apiResponse = await axios.get(`https://api.akuari.my.id/downloader/instagram?link=${encodeURIComponent(url)}`, {
      timeout: 5000
    });
    
    if (apiResponse.data && apiResponse.data.url) {
      return { success: true, videoUrl: apiResponse.data.url, method: 'api' };
    }

    return { success: false };

  } catch (error) {
    console.error('Scrape error:', error.message);
    return { success: false, error: error.message };
  }
}

// Routes
app.get('/', (req, res) => {
  res.json({
    name: 'Instagram Scraper API',
    version: '2.0.0 (Vercel Optimized)',
    endpoints: {
      '/api/scrape?url=': 'Scrape Instagram video',
      '/api/health': 'Health check'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/scrape', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url || !url.includes('instagram.com')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid Instagram URL required' 
      });
    }

    // Check cache
    const cached = cache.get(url);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    // Scrape
    const result = await scrapeInstagram(url);
    
    if (!result.success) {
      return res.status(404).json({ 
        success: false, 
        error: 'Could not extract video' 
      });
    }

    // Cache result
    cache.set(url, result);

    res.json({ ...result, cached: false });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Export for Vercel
module.exports = app;