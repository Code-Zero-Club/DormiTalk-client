const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function searchYouTube(query, config) {
  try {
    if (!query.trim()) {
      return [];
    }
    
    const command = `${config.ytdlp.path} ytsearch:"${query}" --get-id --get-title --no-warnings`;
    const { stdout } = await execPromise(command);
    
    const results = stdout.trim().split('\n');
    const videos = [];
    
    for (let i = 0; i < results.length; i += 2) {
      if (results[i] && results[i + 1]) {
        videos.push({ 
          title: results[i], 
          id: results[i + 1] 
        });
      }
    }
    
    return videos;
  } catch (error) {
    console.error('Error searching YouTube:', error);
    return [];
  }
}

async function getAudioUrl(videoId, config) {
  try {
    const command = `${config.ytdlp.path} -g "https://www.youtube.com/watch?v=${videoId}"`;
    const { stdout } = await execPromise(command);
    return stdout.trim();
  } catch (error) {
    console.error('Error getting audio URL:', error.message);
    return null;
  }
}

module.exports = { searchYouTube, getAudioUrl };