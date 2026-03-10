// NO express, NO complicated stuff - just pure serverless function
const axios = require('axios');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;

  // Validate URL
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

  console.log('Processing URL:', url);

  try {
    // Try multiple public APIs (these are free and work on Vercel)
    const apis = [
      `https://api.akuari.my.id/downloader/instagram?link=${encodeURIComponent(url)}`,
      `https://api.ryzendesu.vip/api/downloader/igdl?url=${encodeURIComponent(url)}`,
      `https://rest-api.akuari.my.id/downloader/igdl?url=${encodeURIComponent(url)}`,
      `https://violetics.pw/api/downloader/instagram?apikey=beta&url=${encodeURIComponent(url)}`
    ];

    let lastError = null;
    
    // Try each API in order
    for (const apiUrl of apis) {
      try {
        console.log('Trying API:', apiUrl.split('/')[2]);
        
        const response = await axios.get(apiUrl, { 
          timeout: 8000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        // Check different response formats
        const data = response.data;
        
        if (data?.url) {
          return res.json({
            success: true,
            videoUrl: data.url,
            thumbnail: data.thumbnail || null,
            title: data.title || 'Instagram Video',
            via: apiUrl.split('/')[2]
          });
        }
        
        if (data?.videoUrl) {
          return res.json({
            success: true,
            videoUrl: data.videoUrl,
            thumbnail: data.thumbnail || null,
            title: data.title || 'Instagram Video',
            via: apiUrl.split('/')[2]
          });
        }

        if (data?.result?.url) {
          return res.json({
            success: true,
            videoUrl: data.result.url,
            via: apiUrl.split('/')[2]
          });
        }

      } catch (err) {
        lastError = err.message;
        console.log(`API ${apiUrl.split('/')[2]} failed:`, err.message);
        continue; // Try next API
      }
    }

    // If all APIs fail, try direct HTML scraping as last resort
    try {
      console.log('Trying direct HTML scrape...');
      const htmlResponse = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
        },
        timeout: 5000
      });

      const html = htmlResponse.data;
      
      // Look for video URL in HTML
      const videoMatch = html.match(/"video_url":"([^"]+\.mp4[^"]*)"/);
      if (videoMatch) {
        return res.json({
          success: true,
          videoUrl: videoMatch[1].replace(/\\u0026/g, '&'),
          method: 'html-scrape',
          via: 'direct'
        });
      }
    } catch (htmlErr) {
      console.log('HTML scrape failed:', htmlErr.message);
    }

    // Everything failed
    return res.status(404).json({
      success: false,
      error: 'Could not fetch video. The URL might be private or invalid.',
      details: lastError
    });

  } catch (error) {
    console.error('Fatal error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error: ' + error.message
    });
  }
};