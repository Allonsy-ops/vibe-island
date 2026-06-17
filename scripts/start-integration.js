const { spawn } = require('node:child_process');
const { buildIntegrationLaunchPlan } = require('../src/shared/integration-runtime');

function parseArgs(argv) {
  const result = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith('--')) {
      continue;
    }

    const key = token.slice(2);
    const next = argv[index + 1];

    if (!next || next.startsWith('--')) {
      result[key] = 'true';
      continue;
    }

    result[key] = next;
    index += 1;
  }

  return result;
}

function startIntegration({
  source,
  cwd = process.cwd(),
  withUi = true,
  spawnImpl = spawn
}) {
  const plan = buildIntegrationLaunchPlan({
    source,
    cwd,
    withUi
  });

  const children = plan.commands.map((command) => spawnImpl(command.cmd, command.args, {
    cwd,
    stdio: 'inherit'
  }));

  return {
    plan,
    children
  };
}

function main() {
  const source = process.argv[2];
  const args = parseArgs(process.argv.slice(3));

  if (!source) {
    throw new Error('start-integration requires a source name like codex or claude-code');
  }

  const withUi = args['with-ui'] !== 'false';
  const result = startIntegration({
    source,
    withUi
  });

  process.stdout.write(`${JSON.stringify(result.plan, null, 2)}\n`);
}

if (require.main === module) {
  main();
}

module.exports = {
  parseArgs,
  startIntegration
};
