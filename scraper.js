const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

class InstagramScraper {
  constructor() {
    this.userAgents = [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (Linux; Android 11; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.210 Mobile Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
    ];
  }

  // Method 1: Fast HTML Scraping (Works for public posts)
  async scrapeHTML(url) {
    try {
      const userAgent = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        timeout: 10000
      });

      const html = response.data;
      const $ = cheerio.load(html);

      // Extract video URL from meta tags
      let videoUrl = $('meta[property="og:video"]').attr('content') ||
                    $('meta[property="og:video:secure_url"]').attr('content') ||
                    $('meta[name="twitter:player:stream"]').attr('content');

      if (videoUrl && videoUrl.includes('.mp4')) {
        return {
          success: true,
          videoUrl: videoUrl,
          type: 'video',
          method: 'html'
        };
      }

      // Extract from JSON in script tags
      const jsonData = this.extractJSON(html);
      if (jsonData) {
        return jsonData;
      }

      return { success: false, method: 'html' };

    } catch (error) {
      console.error('HTML scraping error:', error.message);
      return { success: false, method: 'html', error: error.message };
    }
  }

  // Extract video from embedded JSON
  extractJSON(html) {
    try {
      // Method 1: window._sharedData
      const sharedDataMatch = html.match(/window\._sharedData = ({.*?});<\/script>/);
      if (sharedDataMatch && sharedDataMatch[1]) {
        const data = JSON.parse(sharedDataMatch[1]);
        const media = this.extractMediaFromSharedData(data);
        if (media) return media;
      }

      // Method 2: Look for video URL patterns
      const patterns = [
        /"video_url":"([^"]+\.mp4[^"]*)"/,
        /"contentUrl":"([^"]+\.mp4[^"]*)"/,
        /"url":"([^"]+\.mp4[^"]*)"/
      ];

      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          return {
            success: true,
            videoUrl: match[1].replace(/\\u0026/g, '&').replace(/\\/g, ''),
            type: 'video',
            method: 'json-pattern'
          };
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  // Method 2: Puppeteer for difficult content
  async scrapePuppeteer(url) {
    let browser = null;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920x1080'
        ]
      });

      const page = await browser.newPage();
      
      // Random user agent
      const userAgent = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
      await page.setUserAgent(userAgent);

      // Set viewport
      await page.setViewport({ width: 1920, height: 1080 });

      // Add cookies to appear more human
      await page.setCookie({
        name: 'ig_cb',
        value: '1',
        domain: '.instagram.com'
      });

      // Navigate to page
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for content to load
      await page.waitForTimeout(5000);

      // Extract video URL
      const videoData = await page.evaluate(() => {
        // Try to find video element
        const video = document.querySelector('video');
        if (video && video.src) {
          return {
            videoUrl: video.src,
            type: 'video'
          };
        }

        // Check meta tags
        const metaVideo = document.querySelector('meta[property="og:video"]');
        if (metaVideo) {
          return {
            videoUrl: metaVideo.content,
            type: 'video'
          };
        }

        // Look for JSON data
        const scripts = document.querySelectorAll('script[type="text/javascript"]');
        for (const script of scripts) {
          const content = script.textContent;
          if (content.includes('video_url')) {
            const match = content.match(/"video_url":"([^"]+\.mp4[^"]*)"/);
            if (match) {
              return {
                videoUrl: match[1].replace(/\\u0026/g, '&'),
                type: 'video'
              };
            }
          }
        }

        return null;
      });

      if (videoData && videoData.videoUrl) {
        return {
          success: true,
          ...videoData,
          method: 'puppeteer'
        };
      }

      return { success: false, method: 'puppeteer' };

    } catch (error) {
      console.error('Puppeteer error:', error.message);
      return { success: false, method: 'puppeteer', error: error.message };
    } finally {
      if (browser) await browser.close();
    }
  }

  // Method 3: Rapid fallback using public APIs
  async scrapeViaPublicAPI(url) {
    const apis = [
      `https://api.akuari.my.id/downloader/instagram?link=${encodeURIComponent(url)}`,
      `https://api.ryzendesu.vip/api/downloader/igdl?url=${encodeURIComponent(url)}`,
      `https://rest-api.akuari.my.id/downloader/igdl?url=${encodeURIComponent(url)}`
    ];

    for (const apiUrl of apis) {
      try {
        const response = await axios.get(apiUrl, { timeout: 5000 });
        
        if (response.data && response.data.videoUrl) {
          return {
            success: true,
            videoUrl: response.data.videoUrl,
            type: 'video',
            method: 'public-api',
            api: apiUrl.split('/')[2]
          };
        }
        
        if (response.data && response.data.url) {
          return {
            success: true,
            videoUrl: response.data.url,
            type: 'video',
            method: 'public-api',
            api: apiUrl.split('/')[2]
          };
        }
      } catch (error) {
        continue; // Try next API
      }
    }

    return { success: false, method: 'public-api' };
  }

  // Main scrape method with fallbacks
  async scrape(url) {
    console.log(`🎯 Scraping: ${url}`);

    // Try HTML method first (fastest)
    let result = await this.scrapeHTML(url);
    if (result.success) {
      console.log('✅ Success via HTML method');
      return result;
    }

    // Try public APIs
    result = await this.scrapeViaPublicAPI(url);
    if (result.success) {
      console.log('✅ Success via public API');
      return result;
    }

    // Try Puppeteer (slow but thorough)
    result = await this.scrapePuppeteer(url);
    if (result.success) {
      console.log('✅ Success via Puppeteer');
      return result;
    }

    // All methods failed
    return {
      success: false,
      error: 'All scraping methods failed',
      url: url
    };
  }

  // Get video info (title, author, etc)
  async getInfo(url) {
    try {
      const userAgent = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
      
      const response = await axios.get(url, {
        headers: { 'User-Agent': userAgent }
      });

      const $ = cheerio.load(response.data);
      
      const title = $('meta[property="og:title"]').attr('content') || 'Instagram Video';
      const description = $('meta[property="og:description"]').attr('content') || '';
      const image = $('meta[property="og:image"]').attr('content') || '';

      return {
        success: true,
        title: title,
        description: description,
        thumbnail: image
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = InstagramScraper;