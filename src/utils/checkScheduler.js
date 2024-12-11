const { readJsonFromFile } = require('./dataSave');

const WEEKDAY_MAP = {
  '일': '0',
  '월': '1',
  '화': '2',
  '수': '3',
  '목': '4',
  '금': '5',
  '토': '6'
};

async function checkWeekday() {
  const now = new Date();
  const schedulerData = await readJsonFromFile('schedulers');
  const { day_of_week } = schedulerData[0];
  
  const currentDay = now.getDay().toString();
  const scheduledDays = day_of_week.map(day => WEEKDAY_MAP[day]);
  const isScheduledDay = scheduledDays.includes(currentDay);

  return isScheduledDay;
}

async function checkPlayTime() {
  const now = new Date();
  const schedulerData = await readJsonFromFile('schedulers');
  const { start_time, play_time } = schedulerData[0];

  const [startHour, startMinute, startSecond] = start_time.split(':').map(Number);
  
  const startTotalSeconds = startHour * 3600 + startMinute * 60 + startSecond;
  const endTotalSeconds = startTotalSeconds + Number(play_time);
  
  const nowHour = now.getHours();
  const nowMinute = now.getMinutes();
  const nowSecond = now.getSeconds();
  const nowTotalSeconds = nowHour * 3600 + nowMinute * 60 + nowSecond;

  return startTotalSeconds <= nowTotalSeconds && nowTotalSeconds <= endTotalSeconds;
}

module.exports = {
  checkPlayTime,
  checkWeekday
};