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
        '--volume=50',
        `--script-opts=ytdl_path=${config.ytdlp.path}`,
        '--ytdl-format=bestaudio[ext=m4a]/bestaudio',
        
        '--force-seekable=yes',
        '--cache=yes',
        '--cache-secs=120',
        '--demuxer-max-bytes=1024M',
        '--demuxer-readahead-secs=60',
        '--network-timeout=120',
        
        '--hr-seek=yes',
        '--reset-on-next-file=all',
        '--stream-buffer-size=4M',
        '--demuxer-lavf-buffersize=32768',
        '--demuxer-thread=yes',
        '--audio-buffer=0.5',
        '--audio-pitch-correction=no',
        '--gapless-audio=yes',
        '--audio-samplerate=48000',
        '--audio-format=float',
        '--pulse-latency-hacks=yes',
        '--quiet',
        
        '--no-terminal',
        '--ao=pulse'
      ];

      if (config.mpv.options.audioDevice) {
        mpvArgs.push(`--audio-device=${config.mpv.options.audioDevice}`);
      }

      const mpv = spawn('mpv', mpvArgs, {
        env: {
          ...process.env,
          PULSE_LATENCY_MSEC: '30',
          PULSE_STREAM_NAME: 'Music Player'
        }
      });

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