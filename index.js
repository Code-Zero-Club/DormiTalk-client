const { exec } = require('child_process');
const readline = require('readline');
const util = require('util');

const execPromise = util.promisify(exec);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 전체 경로 설정
const YOUTUBE_DL_PATH = '/usr/local/bin/youtube-dl';
const MPV_PATH = '/usr/bin/mpv';

async function searchYouTube(query) {
  try {
    const { stdout } = await execPromise(`${YOUTUBE_DL_PATH} ytsearch:"${query}" --get-id --get-title`);
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
    await execPromise(`${MPV_PATH} "${audioUrl}"`);
  } catch (error) {
    console.error('Error playing audio:', error);
  }
}

async function getAudioUrl(videoId) {
  try {
    const { stdout } = await execPromise(`${YOUTUBE_DL_PATH} -g -f bestaudio "https://www.youtube.com/watch?v=${videoId}"`);
    return stdout.trim();
  } catch (error) {
    console.error('Error getting audio URL:', error);
    return null;
  }
}

async function checkDependencies() {
  try {
    await execPromise(`${YOUTUBE_DL_PATH} --version`);
    await execPromise(`${MPV_PATH} --version`);
    console.log('All dependencies are installed correctly.');
  } catch (error) {
    console.error('Error: Some dependencies are missing or not in the correct path.');
    console.error('Please make sure youtube-dl and mpv are installed and in your system PATH.');
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