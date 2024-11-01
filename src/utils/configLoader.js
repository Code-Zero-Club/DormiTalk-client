const fs = require('fs').promises;
const path = require('path');

async function loadConfig() {
  try {
    const configPath = path.join(__dirname, '../../config/default.json');
    const configFile = await fs.readFile(configPath, 'utf8');
    console.log('Config loaded successfully.');
    return JSON.parse(configFile);
  } catch (error) {
    console.error('Error loading config:', error.message);
    console.error('Using default configuration...');
    return {
      ytdlp: {
        path: '/usr/local/bin/yt-dlp',
        options: {
          format: 'bestaudio',
          geoBypass: true,
          noCheckCertificate: true,
          audioFormat: 'mp3',
          audioQuality: 0
        }
      },
      mpv: {
        path: '/usr/bin/mpv',
        options: {
          noVideo: true,
          audioDevice: 'alsa/default',
          volume: 100,
          termOsdBar: true
        }
      }
    };
  }
}

module.exports = { loadConfig };