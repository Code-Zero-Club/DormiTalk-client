const { loadConfig } = require('./utils/configLoader');
const CLI = require('./cli/interface');

const { getSongs, getSchedulers } = require('./services/dormiTalkService');
const { saveJsonToFile, readJsonFromFile } = require('./utils/dataSave');
const { checkPlayTime } = require('./utils/checkScheduler');

let isPlaying = false;

async function saveData() {
  try {
    const songs = await getSongs();
    const schedulers = await getSchedulers();

    await saveJsonToFile('songs', songs);
    await saveJsonToFile('schedulers', schedulers);

    console.log('[APISyncService] 데이터 저장 완료:', new Date().toLocaleString());
  } catch (error) {
    console.error('[APISyncService] 데이터 저장 중 오류 발생:', error);
  }
}

function extractYoutubeId(youtubeLink) {
  const regex = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|v\/|embed\/))([^?&]+)/;
  const match = youtubeLink.match(regex);
  return match ? match[1] : null;
}

async function exportSongs() {
  const songs = await readJsonFromFile('songs');
  return songs.map(song => ({
    ...song,
    id: extractYoutubeId(song.youtube_link)
  }));
}

async function play() {
  if (isPlaying) return;

  if (await checkPlayTime()) {
    console.log('[TimeCheckService] 플레이 시간입니다.');
    const config = await loadConfig();
    const cli = new CLI();

    try {
      isPlaying = true;
      const processedSongs = await exportSongs();
      await cli.start(config, processedSongs);
    } finally {
      isPlaying = false;
    }
  } else {
    console.log('[TimeCheckService] 플레이 시간이 아닙니다.');
  }
}

async function main() {
  console.log('DormiTalk Client 시작:', new Date().toLocaleString());
  console.log(' ');
  
  await saveData();

  setInterval(async () => {
    await saveData();
    await play();
  }, 10000);
}

process.on('unhandledRejection', (error) => {
  console.error('처리되지 않은 Promise 거부:', error);
});

main();