function buildYtdlpOptions(options) {
  const optionsArray = [];
  if (options.format) optionsArray.push(`--format ${options.format}`);
  if (options.geoBypass) optionsArray.push('--geo-bypass');
  if (options.noCheckCertificate) optionsArray.push('--no-check-certificate');
  if (options.audioFormat) optionsArray.push(`--audio-format ${options.audioFormat}`);
  if (options.audioQuality !== undefined) optionsArray.push(`--audio-quality ${options.audioQuality}`);
  return optionsArray.join(' ');
}

function buildMpvOptions(options, url) {
  const optionsArray = [];
  if (options.noVideo) optionsArray.push('--no-video');
  if (options.audioDevice) optionsArray.push(`--audio-device=${options.audioDevice}`);
  if (options.volume) optionsArray.push(`--volume=${options.volume}`);
  if (options.termOsdBar) optionsArray.push('--term-osd-bar');
  optionsArray.push(url);
  return optionsArray;
}

module.exports = { buildYtdlpOptions, buildMpvOptions };