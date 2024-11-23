const { readJsonFromFile } = require('./dataSave');

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

module.exports = {
  exportSongs
};