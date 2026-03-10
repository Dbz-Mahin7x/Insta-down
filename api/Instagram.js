const axios = require('axios');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;

  // Validate URL
  if (!url) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing Instagram URL' 
    });
  }

  try {
    // Working public API (no key needed)
    const apiUrl = `https://api.akuari.my.id/downloader/instagram?link=${encodeURIComponent(url)}`;
    
    const response = await axios.get(apiUrl, { 
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const data = response.data;

    // Handle different response formats
    if (data?.url) {
      return res.json({
        success: true,
        videoUrl: data.url,
        thumbnail: data.thumbnail || null,
        title: data.title || 'Instagram Video'
      });
    }

    if (data?.videoUrl) {
      return res.json({
        success: true,
        videoUrl: data.videoUrl,
        thumbnail: data.thumbnail || null
      });
    }

    if (data?.result?.url) {
      return res.json({
        success: true,
        videoUrl: data.result.url
      });
    }

    // If no video found
    return res.status(404).json({
      success: false,
      error: 'Could not extract video from this URL'
    });

  } catch (error) {
    console.error('Error:', error.message);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch video: ' + error.message
    });
  }
};