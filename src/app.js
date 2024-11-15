const { getSongs, getSchedulers } = require('./services/dormiTalkService');
const { saveJsonToFile } = require('./utils/dataSave');

async function saveData() {
  try {
    const songs = await getSongs();
    const schedulers = await getSchedulers();

    await saveJsonToFile('songs', songs);
    await saveJsonToFile('schedulers', schedulers);

    console.log('데이터 저장 완료:', new Date().toLocaleString());
  } catch (error) {
    console.error('데이터 저장 중 오류 발생:', error);
  }
}

async function main() {
  await saveData();

  setInterval(async () => {
    await saveData();
  }, 10000);

  console.log('데이터 자동 저장이 시작되었습니다.');
}

process.on('unhandledRejection', (error) => {
  console.error('처리되지 않은 Promise 거부:', error);
});

main();