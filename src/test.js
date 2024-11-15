const { getSongs } = require('./services/dormiTalkService');

const testGetSongs = async () => {
  try {
    const songs = await getSongs();
    console.log('Fetched songs:', songs);
  } catch (error) {
    console.error('Test failed:', error);
  }
};

testGetSongs();