const { spawn } = require('child_process');
const { resolve } = require('path');

async function playAudio(videoId, title, config) {
  return new Promise((resolve, reject) => {
    try {
      console.log(`\nPlaying: ${title}`);
      
      const mpvArgs = [
        `ytdl://${videoId}`,
        '--no-video', 
        // '--term-osd-bar',
        '--volume=100',
        `--script-opts=ytdl_path=${config.ytdlp.path}`,
        '--ytdl-format=bestaudio[ext=m4a]/bestaudio',
        '--force-seekable=yes',
        '--cache=yes',
        '--cache-secs=60',
        '--demuxer-max-bytes=500M',
        '--demuxer-readahead-secs=20',
        '--network-timeout=60',
        '--no-terminal',
      ];

      if (config.mpv.options.audioDevice) {
        mpvArgs.push(`--audio-device=${config.mpv.options.audioDevice}`);
      }

      const mpv = spawn('mpv', mpvArgs);
      let duration = null;
      let currentTime = 0;

      mpv.stdout.on('data', (data) => {
        const output = data.toString().trim();
        
        if (output.includes('Duration:')) {
          const durationMatch = output.match(/Duration: (\d+:\d+:\d+)/);
          if (durationMatch) {
            duration = durationMatch[1];
          }
        }
        
        if (output.includes('AV:')) {
          const timeMatch = output.match(/AV:\s*(\d+:\d+:\d+)/);
          if (timeMatch) {
            currentTime = timeMatch[1];
            process.stdout.write(`\rProgress: ${currentTime}/${duration}`);
          }
        }
      });

      mpv.stderr.on('data', (data) => {
        console.error(`[MPV]${data}`);
      });

      mpv.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`mpv process exited with code ${code}`));
        } else {
          process.stdout.write('\n');
          resolve();
        }
      });

      return mpv;

    } catch (error) {
      console.error('Error playing audio:', error);
      reject(error);
    }
  });
}

module.exports = { playAudio };