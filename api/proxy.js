const axios = require('axios');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { url } = req.query;
  
  if (!url) {
    return res.json({ error: 'no url' });
  }

  try {
    // Use just one reliable API
    const response = await axios.get(
      `https://api.akuari.my.id/downloader/instagram?link=${url}`
    );
    
    res.json(response.data);
  } catch (e) {
    res.json({ error: e.message });
  }
};