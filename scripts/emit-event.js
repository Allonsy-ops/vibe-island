const fs = require('node:fs');
const path = require('node:path');
const { bridgePayloadToEvent } = require('../src/shared/bridge-schema');

const DEFAULT_FILE = path.join(__dirname, '../data/events.jsonl');

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

function createEvent(args) {
  return bridgePayloadToEvent({
    source: args.source,
    source_type: args.type,
    session: args.session,
    task: args.task,
    title: args.title,
    summary: args.summary,
    status: args.status,
    approve_cmd: args['approve-cmd'],
    deny_cmd: args['deny-cmd'],
    open_app: args['open-app'],
    open_url: args['open-url'],
    open_cmd: args['open-cmd'],
    jump: args.jump
  });
}

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function appendEvent(filePath, event) {
  ensureParentDir(filePath);
  fs.appendFileSync(filePath, `${JSON.stringify(event)}\n`);
}

const args = parseArgs(process.argv.slice(2));
const outputFile = args.file ? path.resolve(args.file) : DEFAULT_FILE;
const event = createEvent(args);
appendEvent(outputFile, event);

process.stdout.write(`${JSON.stringify(event, null, 2)}\n`);
