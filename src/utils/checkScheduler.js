const { readJsonFromFile } = require('./dataSave');

async function checkWeekday() {
  const now = new Date();
  const schedulerData = await readJsonFromFile('schedulers');
  const { day_of_week } = schedulerData[0];
  
  const currentDay = now.getDay();
  const isScheduledDay = day_of_week.includes(currentDay);

  return isScheduledDay;
}

async function checkPlayTime() {
  const now = new Date();
  const schedulerData = await readJsonFromFile('schedulers');
  const { start_time, play_time } = schedulerData[0];

  const [startHour, startMinute, startSecond] = start_time.split(':').map(Number);
  const [playHour, playMinute, playSecond] = play_time.split(':').map(Number);

  let endHour = startHour + playHour;
  let endMinute = startMinute + playMinute;
  let endSecond = startSecond + playSecond;

  const nowHour = now.getHours();
  const nowMinute = now.getMinutes();
  const nowSecond = now.getSeconds();

  let startTotalSeconds = startHour * 3600 + startMinute * 60 + startSecond;
  let nowTotalSeconds = nowHour * 3600 + nowMinute * 60 + nowSecond;
  let endTotalSeconds = endHour * 3600 + endMinute * 60 + endSecond;

  return startTotalSeconds <= nowTotalSeconds && nowTotalSeconds <= endTotalSeconds;
}

module.exports = {
  checkPlayTime,
  checkWeekday
};