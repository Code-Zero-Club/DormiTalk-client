const { exec } = require('child_process');
const util = require('util');
const { buildYtdlpOptions } = require('../utils/optionsBuilder');

const execPromise = util.promisify(exec);

async function searchYouTube(query, config) {
  try {
    const options = buildYtdlpOptions(config.ytdlp.options);
    const { stdout } = await execPromise(`${config.ytdlp.path} ${options} ytsearch:"${query}" --get-id --get-title`);
    const results = stdout.trim().split('\n');
    const videos = [];
    for (let i = 0; i < results.length; i += 2) {
      videos.push({ title: results[i], id: results[i + 1] });
    }
    return videos;
  } catch (error) {
    console.error('Error searching YouTube:', error);
    return [];
  }
}

async function getAudioUrl(videoId, config) {
  try {
    const options = buildYtdlpOptions(config.ytdlp.options);
    const { stdout, stderr } = await execPromise(`${config.ytdlp.path} ${options} -g "https://www.youtube.com/watch?v=${videoId}"`);
    if (stderr && !stderr.includes('YouTube video')) {
      console.error('yt-dlp stderr:', stderr);
    }
    return stdout.trim();
  } catch (error) {
    console.error('Error getting audio URL:', error.message);
    return null;
  }
}

module.exports = { searchYouTube, getAudioUrl };