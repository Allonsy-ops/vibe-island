const path = require('node:path');

function defaultStatusFileFor(sourceName, cwd = process.cwd()) {
  return path.join(cwd, 'data', `${sourceName}-status.json`);
}

function buildIntegrationLaunchPlan({
  source,
  cwd = process.cwd(),
  withUi = true
}) {
  if (!source) {
    throw new Error('source is required');
  }

  const statusFile = defaultStatusFileFor(source, cwd);
  const commands = [
    {
      name: `watch:${source}`,
      cmd: process.platform === 'win32' ? 'npm.cmd' : 'npm',
      args: ['run', `watch:${source}`, '--', '--file', statusFile]
    }
  ];

  if (withUi) {
    commands.push({
      name: 'ui',
      cmd: process.platform === 'win32' ? 'npm.cmd' : 'npm',
      args: ['run', 'ui']
    });
  }

  return {
    source,
    statusFile,
    commands
  };
}

module.exports = {
  defaultStatusFileFor,
  buildIntegrationLaunchPlan
};
