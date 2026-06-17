const connectorDefinitions = require('../../config/connectors');
const { assertConnectorDefinitions } = require('./definition-schema');
const { createCliJsonConnector } = require('./cli-json-connector');
const { createEventInboxConnector } = require('./event-inbox-connector');
const { createDesktopAppConnector } = require('./desktop-app-connector');

function createConnector(definition, onEvent) {
  if (definition.kind === 'cli_json') {
    return createCliJsonConnector({
      id: definition.id,
      sourceName: definition.sourceName,
      filePath: definition.filePath,
      onEvent
    });
  }

  if (definition.kind === 'event_inbox') {
    return createEventInboxConnector({
      id: definition.id,
      sourceName: definition.sourceName,
      filePath: definition.filePath,
      onEvent
    });
  }

  if (definition.kind === 'desktop_app') {
    return createDesktopAppConnector({
      id: definition.id,
      appName: definition.appName,
      onEvent
    });
  }

  throw new Error(`Unsupported connector kind: ${definition.kind}`);
}

function createConnectors(onEvent, definitions = connectorDefinitions) {
  assertConnectorDefinitions(definitions);
  return definitions.reduce((result, definition) => {
    result[definition.id] = createConnector(definition, onEvent);
    return result;
  }, {});
}

module.exports = {
  createConnectors,
  createConnector
};
