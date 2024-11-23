const readline = require('readline');
const { exec } = require('child_process');
const util = require('util');
const { playAudio, stopPlayback } = require('../services/playerService');

const execPromise = util.promisify(exec);

class CLI {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    this.shouldStop = false;
    this.start = this.start.bind(this);
    this.checkDependencies = this.checkDependencies.bind(this);
  }

  async setShouldStop() {
    await stopPlayback();
    this.shouldStop = true;
  }

  async start(config, songs) {
    console.log('[CliInterface] 서비스가 시작되었습니다.');
    await this.checkDependencies(config);

    try {
      let isPlaying = true;
      
      while (isPlaying) {
        for (const song of songs) {
          if (this.shouldStop) {
            console.log('[CliInterface] 재생이 중단되었습니다.');
            this.shouldStop = false;
            isPlaying = false;
            return;
          }

          try {
            await playAudio(song.id, song.title, config, this.rl);
            if (this.shouldStop) {
              console.log('[CliInterface] 재생이 중단되었습니다.');
              this.shouldStop = false;
              isPlaying = false;
              return;
            }
            console.log(`[CliInterface] 재생 완료 : ${song.title}`);
          } catch (error) {
            if (error.message.includes('mpv process exited with code null')) {
              continue;
            }
            console.error(`[CliInterface] 재생 실패 : ${song.title}`, error);
            if (this.shouldStop) {
              isPlaying = false;
              return;
            }
            continue;
          }
        }
      }
    } finally {
      this.shouldStop = false;
    }
  }

  async checkDependencies(config) {
    try {
      const findExecutable = async (command) => {
        try {
          const { stdout } = await execPromise(`which ${command}`);
          return stdout.trim();
        } catch (error) {
          return null;
        }
      };

      // yt-dlp 체크
      let ytdlpPath = config.ytdlp.path;
      if (!ytdlpPath.startsWith('/')) {
        ytdlpPath = await findExecutable('yt-dlp');
        if (!ytdlpPath) {
          throw new Error('[CliInterface] PATH에서 yt-dlp를 찾을 수 없습니다.');
        }
      }

      // mpv 체크
      let mpvPath = config.mpv.path;
      if (!mpvPath) {
        mpvPath = await findExecutable('mpv');
        if (!mpvPath) {
          throw new Error('[CliInterface] PATH에서 mpv를 찾을 수 없습니다.');
        }
      }

      // 버전 체크 실행
      const execOptions = {
        env: {
          ...process.env,
          PATH: `${process.env.PATH}:/usr/local/bin:/usr/bin:/bin`
        }
      };

      const { stdout: ytdlpVersion } = await execPromise(`"${ytdlpPath}" --version`, execOptions);
      const { stdout: mpvVersion } = await execPromise(`"${mpvPath}" --version`, execOptions);

      console.log('[CliInterface] yt-dlp 버전 : ', ytdlpVersion.trim());
      console.log('[CliInterface] yt-dlp 경로 : ', ytdlpPath);
      console.log('[CliInterface] mpv 버전 : ', mpvVersion.split('\n')[0]);
      console.log('[CliInterface] mpv 경로 : ', mpvPath);

      config.ytdlp.path = ytdlpPath;
      config.mpv.path = mpvPath;
      
    } catch (error) {
      console.error('[CliInterface] 의존성 점검 에러 : ', error.message);
      process.exit(1);
    }
  }
}

module.exports = CLI;