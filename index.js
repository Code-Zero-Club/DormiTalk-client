const { exec } = require('child_process');
const readline = require('readline');
const util = require('util');

const execPromise = util.promisify(exec);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// yt-dlp 경로 수동 지정
const YT_DLP_PATH = '/usr/local/bin/yt-dlp';
const YT_DLP_OPTIONS = '--format bestaudio --geo-bypass --no-check-certificate';

async function searchYouTube(query) {
  try {
    const { stdout } = await execPromise(`${YT_DLP_PATH} ${YT_DLP_OPTIONS} ytsearch:"${query}" --get-id --get-title`);
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

async function playAudio(videoId) {
  try {
    const audioUrl = await getAudioUrl(videoId);
    if (!audioUrl) {
      console.error('Failed to get audio URL');
      return;
    }
    console.log('Playing audio:', audioUrl);
    await execPromise(`mpv "${audioUrl}"`);
  } catch (error) {
    console.error('Error playing audio:', error.message);
    if (error.stdout) console.error('mpv stdout:', error.stdout);
    if (error.stderr) console.error('mpv stderr:', error.stderr);
  }
}

async function getAudioUrl(videoId) {
  try {
    const { stdout, stderr } = await execPromise(`${YT_DLP_PATH} ${YT_DLP_OPTIONS} -g "https://www.youtube.com/watch?v=${videoId}"`);
    if (stderr) console.error('yt-dlp stderr:', stderr);
    return stdout.trim();
  } catch (error) {
    console.error('Error getting audio URL:', error.message);
    if (error.stdout) console.error('yt-dlp stdout:', error.stdout);
    if (error.stderr) console.error('yt-dlp stderr:', error.stderr);
    return null;
  }
}

async function checkDependencies() {
  try {
    const { stdout: ytdlpVersion } = await execPromise(`${YT_DLP_PATH} --version`);
    const { stdout: mpvVersion } = await execPromise('mpv --version');
    console.log('yt-dlp version:', ytdlpVersion.trim());
    console.log('mpv version:', mpvVersion.split('\n')[0]);
  } catch (error) {
    console.error('Error: Some dependencies are missing or not in the correct path.');
    console.error('Please make sure yt-dlp and mpv are installed and in your system PATH.');
    process.exit(1);
  }
}

async function main() {
  await checkDependencies();

  while (true) {
    const query = await new Promise(resolve => rl.question('Enter a song to search (or "quit" to exit): ', resolve));
    
    if (query.toLowerCase() === 'quit') {
      rl.close();
      break;
    }

    const videos = await searchYouTube(query);
    if (videos.length === 0) {
      console.log('No results found.');
      continue;
    }

    console.log('Search results:');
    videos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title}`);
    });

    const choice = await new Promise(resolve => rl.question('Enter the number of the song to play: ', resolve));
    const index = parseInt(choice) - 1;

    if (index >= 0 && index < videos.length) {
      console.log(`Playing: ${videos[index].title}`);
      await playAudio(videos[index].id);
    } else {
      console.log('Invalid choice.');
    }
  }
}

main();