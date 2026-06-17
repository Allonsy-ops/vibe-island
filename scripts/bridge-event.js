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

function loadInputPayload(args) {
  if (args.file) {
    return JSON.parse(fs.readFileSync(path.resolve(args.file), 'utf8'));
  }

  if (args.json) {
    return JSON.parse(args.json);
  }

  throw new Error('bridge-event requires --file or --json');
}

const args = parseArgs(process.argv.slice(2));
const payload = loadInputPayload(args);
const event = bridgePayloadToEvent(payload);
const outputFile = args.out ? path.resolve(args.out) : DEFAULT_OUTPUT;

appendEvent(outputFile, event);
process.stdout.write(`${JSON.stringify(event, null, 2)}\n`);
