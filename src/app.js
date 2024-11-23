const { loadConfig } = require('./utils/configLoader');
const CLI = require('./cli/interface');

const { saveData } = require('./utils/dataSave');
const { checkPlayTime } = require('./utils/checkScheduler');
const { exportSongs } = require('./utils/extractYoutube');

let isPlaying = false;
let cli = null;

async function play() {
  if (isPlaying) return;

  if (await checkPlayTime()) {
    console.log('[TimeCheckService] 플레이 시간입니다.');
    const config = await loadConfig();
    
    if (!cli) {
      cli = new CLI();
    }

    try {
      isPlaying = true;
      const processedSongs = await exportSongs();
      await cli.start(config, processedSongs);
    } catch (error) {
      console.error('[PlayService] 재생 중 오류 발생:', error);
    } finally {
      isPlaying = false;
      cli = null;
    }
  } else {
    console.log('[TimeCheckService] 플레이 시간이 아닙니다.');
  }
}

async function checkAndStopIfNeeded() {
  const isPlayTime = await checkPlayTime();
  if (!isPlayTime && isPlaying && cli) {
    await cli.setShouldStop();
    isPlaying = false;
    cli = null;
  }
}

async function main() {
  console.log('DormiTalk Client 시작:', new Date().toLocaleString());
  console.log(' ');
  
  await saveData();

  setInterval(checkAndStopIfNeeded, 5000);

  setInterval(async () => {
    await saveData();
    if (!isPlaying) {
      await play();
    }
  }, 10000);
}

process.on('unhandledRejection', (error) => {
  console.error('처리되지 않은 Promise 거부:', error);
});

main();