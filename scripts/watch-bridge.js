const fs = require('node:fs');
const path = require('node:path');
const { bridgePayloadToEvent } = require('../src/shared/bridge-schema');

const DEFAULT_OUTPUT = path.join(__dirname, '../data/events.jsonl');

function parseArgs(argv) {
  const result = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith('--')) {
      continue;
    }

    const key = token.slice(2);
    const value = argv[index + 1];
    result[key] = value;
    index += 1;
  }

  return result;
}

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function appendEvent(filePath, event) {
  ensureParentDir(filePath);
  fs.appendFileSync(filePath, `${JSON.stringify(event)}\n`);
}

function createWatchBridge({
  inputFile,
  outputFile = DEFAULT_OUTPUT,
  toEvent = bridgePayloadToEvent,
  watchImpl = fs.watch,
  watchFileImpl = fs.watchFile,
  unwatchFileImpl = fs.unwatchFile
}) {
  let lastFingerprint = null;
  const directory = path.dirname(inputFile);
  const fileName = path.basename(inputFile);

  function bridgeOnce() {
    if (!fs.existsSync(inputFile)) {
      return null;
    }

    const raw = fs.readFileSync(inputFile, 'utf8');
    const fingerprint = `${raw.length}:${raw}`;

    if (fingerprint === lastFingerprint) {
      return null;
    }

    lastFingerprint = fingerprint;
    const payload = JSON.parse(raw);
    const event = toEvent(payload);
    appendEvent(outputFile, event);
    return event;
  }

  function start() {
    bridgeOnce();
    const onChange = (_eventType, changedFile) => {
      if (changedFile && changedFile !== fileName) {
        return;
      }

      try {
        bridgeOnce();
      } catch (error) {
        process.stderr.write(`${error.message}\n`);
      }
    };

    try {
      const watcher = watchImpl(directory, { persistent: true }, onChange);
      watcher.on('error', (error) => {
        if (error && error.code === 'EMFILE') {
          process.stderr.write('fs.watch limit reached, falling back to polling\n');
          watcher.close();
          watchFileImpl(inputFile, { interval: 800 }, () => onChange('change', fileName));
        }
      });

      return {
        watcher,
        bridgeOnce,
        close() {
          watcher.close();
          unwatchFileImpl(inputFile);
        }
      };
    } catch (error) {
      if (error && error.code !== 'EMFILE') {
        throw error;
      }

      watchFileImpl(inputFile, { interval: 800 }, () => onChange('change', fileName));
      return {
        watcher: null,
        bridgeOnce,
        close() {
          unwatchFileImpl(inputFile);
        }
      };
    }
  }

  return {
    bridgeOnce,
    start
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.file) {
    throw new Error('watch-bridge requires --file');
  }

  const bridge = createWatchBridge({
    inputFile: path.resolve(args.file),
    outputFile: args.out ? path.resolve(args.out) : DEFAULT_OUTPUT
  });

  bridge.start();
  process.stdout.write(`Watching ${path.resolve(args.file)}\n`);
}

if (require.main === module) {
  main();
}

module.exports = {
  createWatchBridge
};
