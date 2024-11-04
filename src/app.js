const { loadConfig } = require('./utils/configLoader');
const CLI = require('./cli/interface');

async function main() {
  const config = await loadConfig();
  const cli = new CLI();
  await cli.start(config);
}

main();