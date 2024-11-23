const { spawn } = require('child_process');

let currentMpvProcess = null;
let currentReject = null;

async function playAudio(videoId, title, config) {
  return new Promise((resolve, reject) => {
    try {
      console.log(`[PlayerService] Playing: ${title}`);
      currentReject = reject;
      
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
        '--ao=pulse'
      ];

      if (config.mpv.options.audioDevice) {
        mpvArgs.push(`--audio-device=${config.mpv.options.audioDevice}`);
      }

      const mpv = spawn('mpv', mpvArgs);
      currentMpvProcess = mpv;
      let duration = null;
      let currentTime = 0;

      process.on('SIGINT', () => {
        if (currentMpvProcess) {
          stopPlayback();
          process.exit(0);
        }
      });

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
        console.error(`[PlayerService] ${data}`);
      });

      mpv.on('close', (code) => {
        currentMpvProcess = null;
        currentReject = null;
        if (code !== 0) {
          reject(new Error(`mpv process exited with code ${code}`));
        } else {
          process.stdout.write('\n');
          resolve();
        }
      });

      return mpv;

    } catch (error) {
      console.error('[PlayerService] Error playing audio:', error);
      reject(error);
    }
  });
}

function stopPlayback() {
  if (currentMpvProcess) {
    currentMpvProcess.kill('SIGTERM');
    currentMpvProcess = null;
    console.log('[PlayerService] 재생이 중단되었습니다.');

    if (currentReject) {
      currentReject(new Error('Playback stopped manually'));
      currentReject = null;
    }
  }
}

module.exports = {
  playAudio,
  stopPlayback
};