const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000';

const testUrls = [
  'https://www.instagram.com/reel/DSM-1eoE3mW/?igsh=MWhidzE4NWozcjU2bQ==', // Replace with real URL
  'https://www.instagram.com/reel/DSZKMexkeL3/?igsh=MW9oZnlyem5lcTA0MQ=='      // Replace with real URL
];

async function testAPI() {
  console.log('🧪 Testing Instagram Scraper API...\n');

  // Test health
  try {
    const health = await axios.get(`${API_URL}/api/health`);
    console.log('✅ Health check:', health.data);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }

  // Test scrape
  for (const url of testUrls) {
    console.log(`\n📥 Testing: ${url}`);
    try {
      const response = await axios.get(`${API_URL}/api/scrape`, {
        params: { url }
      });
      console.log('✅ Success:', response.data.success);
      if (response.data.success) {
        console.log('📹 Video URL:', response.data.videoUrl?.substring(0, 50) + '...');
        console.log('🔧 Method:', response.data.method);
      }
    } catch (error) {
      console.log('❌ Failed:', error.message);
    }
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

testAPI();