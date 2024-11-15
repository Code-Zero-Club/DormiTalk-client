const { getSongs, getSchedulers } = require('./services/dormiTalkService');
const { saveJsonToFile, readJsonFromFile } = require('./utils/dataSave');

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

async function checkStartTime() {
  const now = new Date();
  const schedulerData = await readJsonFromFile('schedulers');
  const { start_time, play_time } = schedulerData[0];

  const [startHour, startMinute, startSecond] = start_time.split(':').map(Number);
  const [playHour, playMinute, playSecond] = play_time.split(':').map(Number);

  let endHour = startHour + playHour;
  let endMinute = startMinute + playMinute;
  let endSecond = startSecond + playSecond;

  endMinute += Math.floor(endSecond / 60);
  endSecond %= 60;

  endHour += Math.floor(endMinute / 60);
  endMinute %= 60;

  endHour %= 24;

  const nowHour = now.getHours();
  const nowMinute = now.getMinutes();
  const nowSecond = now.getSeconds();

  if (nowHour > endHour) return true;
  if (nowHour < endHour) return false;

  if (nowMinute > endMinute) return true;
  if (nowMinute < endMinute) return false;

  return nowSecond >= endSecond;
}

async function main() {
  console.log('DormiTalk Client 시작:', new Date().toLocaleString());
  console.log(' ');
  
  await saveData();

  setInterval(async () => {
    await saveData();
  }, 10000);
}

process.on('unhandledRejection', (error) => {
  console.error('처리되지 않은 Promise 거부:', error);
});

main();