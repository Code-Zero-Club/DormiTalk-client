const { exec, spawn } = require('child_process');
const readline = require('readline');
const util = require('util');
const fs = require('fs').promises;
const path = require('path');

const execPromise = util.promisify(exec);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 설정 로드 함수
async function loadConfig() {
  try {
    const configPath = path.join(__dirname, 'config.json');
    const configFile = await fs.readFile(configPath, 'utf8');
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

// yt-dlp 옵션을 문자열로 변환하는 함수
function buildYtdlpOptions(options) {
  const optionsArray = [];
  if (options.format) optionsArray.push(`--format ${options.format}`);
  if (options.geoBypass) optionsArray.push('--geo-bypass');
  if (options.noCheckCertificate) optionsArray.push('--no-check-certificate');
  if (options.audioFormat) optionsArray.push(`--audio-format ${options.audioFormat}`);
  if (options.audioQuality !== undefined) optionsArray.push(`--audio-quality ${options.audioQuality}`);
  return optionsArray.join(' ');
}

// mpv 옵션을 배열로 변환하는 함수
function buildMpvOptions(options, url) {
  const optionsArray = [];
  if (options.noVideo) optionsArray.push('--no-video');
  if (options.audioDevice) optionsArray.push(`--audio-device=${options.audioDevice}`);
  if (options.volume) optionsArray.push(`--volume=${options.volume}`);
  if (options.termOsdBar) optionsArray.push('--term-osd-bar');
  optionsArray.push(url);
  return optionsArray;
}

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

async function playAudio(videoId, title, config) {
  try {
    const audioUrl = await getAudioUrl(videoId, config);
    if (!audioUrl) {
      console.error('Failed to get audio URL');
      return;
    }
    console.log(`\nPlaying: ${title}`);

    const mpvOptions = buildMpvOptions(config.mpv.options, audioUrl);
    const mpv = spawn('mpv', mpvOptions);

    let duration = null;
    let currentTime = 0;

    mpv.stdout.on('data', (data) => {
      const output = data.toString().trim();
      
      // Duration 파싱
      if (output.includes('Duration:')) {
        const durationMatch = output.match(/Duration: (\d+):(\d+):(\d+)/);
        if (durationMatch) {
          const [_, hours, minutes, seconds] = durationMatch;
          duration = (parseInt(hours) * 3600) + (parseInt(minutes) * 60) + parseInt(seconds);
        }
      }
      
      // 현재 재생 시간 파싱
      if (output.includes('A:')) {
        const timeMatch = output.match(/A:\s*(\d+):(\d+):(\d+)/);
        if (timeMatch) {
          const [_, hours, minutes, seconds] = timeMatch;
          currentTime = (parseInt(hours) * 3600) + (parseInt(minutes) * 60) + parseInt(seconds);
          
          // 진행률 계산
          const progress = duration ? Math.floor((currentTime / duration) * 100) : 0;
          
          // 프로그레스 바 생성
          const barLength = 30;
          const completedLength = Math.floor((progress * barLength) / 100);
          const progressBar = '█'.repeat(completedLength) + '▒'.repeat(barLength - completedLength);
          
          // 이전 줄을 지우고 새로운 진행 상황 표시
          process.stdout.write('\r\x1B[K');
          process.stdout.write(`${progressBar} ${formatTime(currentTime)} / ${formatTime(duration)} (${progress}%)`);
        }
      }
    });

    mpv.stderr.on('data', (data) => {
      const error = data.toString().trim();
      // 중요한 오류만 표시
      if (error.includes('ERROR') || error.includes('Failed')) {
        console.error(`\nmpv error: ${error}`);
      }
    });

    let playbackEnded = false;
    await new Promise(resolve => {
      mpv.on('close', (code) => {
        if (!playbackEnded) {
          playbackEnded = true;
          console.log(`\nPlayback ended (exit code: ${code})`);
          resolve();
        }
      });
      
      rl.question('\nPress Enter to stop playback...', () => {
        if (!playbackEnded) {
          playbackEnded = true;
          mpv.kill();
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Error playing audio:', error.message);
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

function formatTime(seconds) {
  if (!seconds) return '00:00:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

async function checkDependencies(config) {
  try {
    const { stdout: ytdlpVersion } = await execPromise(`${config.ytdlp.path} --version`);
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
  const config = await loadConfig();
  console.log('YouTube Music Player for Raspbian');
  await checkDependencies(config);

  while (true) {
    const query = await new Promise(resolve => rl.question('\nEnter a song to search (or "quit" to exit): ', resolve));
    
    if (query.toLowerCase() === 'quit') {
      rl.close();
      break;
    }

    const videos = await searchYouTube(query, config);
    if (videos.length === 0) {
      console.log('No results found.');
      continue;
    }

    console.log('\nSearch results:');
    videos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title}`);
    });

    const choice = await new Promise(resolve => rl.question('\nEnter the number of the song to play: ', resolve));
    const index = parseInt(choice) - 1;

    if (index >= 0 && index < videos.length) {
      await playAudio(videos[index].id, videos[index].title, config);
    } else {
      console.log('Invalid choice.');
    }
  }
}

main();