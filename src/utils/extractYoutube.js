const { readJsonFromFile } = require('./dataSave');

function extractYoutubeId(youtubeLink) { // API 변경으로 사용하지 않음
  const regex = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|v\/|embed\/))([^?&]+)/;
  const match = youtubeLink.match(regex);
  return match ? match[1] : null;
}

async function exportSongs() {
  const songs = await readJsonFromFile('songs');
  return songs.map(song => ({
    ...song,
    id: song.youtube_id
  }));
}

module.exports = {
  exportSongs
};