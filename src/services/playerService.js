const { spawn } = require('child_process');
const { formatTime } = require('../utils/timeFormatter');

async function playAudio(videoId, title, config, rl) {
  try {
    console.log(`\nPlaying: ${title}`);
    
    const mpvArgs = [
      `ytdl://${videoId}`,
      '--no-video',
      '--term-osd-bar',
      '--volume=100',
      `--script-opts=ytdl_path=${config.ytdlp.path}`,
      '--ytdl-format=bestaudio[ext=m4a]/bestaudio',
      '--force-seekable=yes'
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
        const durationMatch = output.match(/Duration: (\d+):(\d+):(\d+)/);
        if (durationMatch) {
          const [_, hours, minutes, seconds] = durationMatch;
          duration = (parseInt(hours) * 3600) + (parseInt(minutes) * 60) + parseInt(seconds);
        }
      }
      
      if (output.includes('A:')) {
        const timeMatch = output.match(/A:\s*(\d+):(\d+):(\d+)/);
        if (timeMatch) {
          const [_, hours, minutes, seconds] = timeMatch;
          currentTime = (parseInt(hours) * 3600) + (parseInt(minutes) * 60) + parseInt(seconds);
          
          const progress = duration ? Math.floor((currentTime / duration) * 100) : 0;
          const barLength = 30;
          const completedLength = Math.floor((progress * barLength) / 100);
          const progressBar = '█'.repeat(completedLength) + '▒'.repeat(barLength - completedLength);
          
          process.stdout.write('\r\x1B[K');
          process.stdout.write(`${progressBar} ${formatTime(currentTime)} / ${formatTime(duration)} (${progress}%)`);
        }
      }
    });

    mpv.stderr.on('data', (data) => {
      const error = data.toString().trim();
      if (error.includes('ERROR') || error.includes('Failed')) {
        console.error(`\nmpv error: ${error}`);
      }
    });

    let playbackEnded = false;
    await new Promise((resolve) => {
      const cleanup = () => {
        if (!playbackEnded) {
          playbackEnded = true;
          mpv.kill();
          resolve();
        }
      };

      mpv.on('close', (code) => {
        if (code !== 0) {
          console.error(`\nPlayback ended with error (exit code: ${code})`);
        } else {
          console.log(`\nPlayback ended`);
        }
        cleanup();
      });

      mpv.on('error', (error) => {
        console.error('\nmpv error:', error);
        cleanup();
      });
      
      rl.question('\nPress Enter to stop playback...', cleanup);
    });
  } catch (error) {
    console.error('Error playing audio:', error.message);
  }
}

module.exports = { playAudio };