function assertConnectorDefinition(definition) {
  if (!definition || typeof definition !== 'object') {
    throw new Error('Connector definition must be an object');
  }

  if (!definition.id) {
    throw new Error('Connector definition is missing id');
  }

  if (!definition.kind) {
    throw new Error(`Connector definition ${definition.id} is missing kind`);
  }

  if (definition.kind === 'cli_json' && !definition.filePath) {
    throw new Error(`Connector definition ${definition.id} is missing filePath`);
  }

  if (definition.kind === 'event_inbox' && !definition.filePath) {
    throw new Error(`Connector definition ${definition.id} is missing filePath`);
  }

  if (definition.kind === 'desktop_app' && !definition.appName) {
    throw new Error(`Connector definition ${definition.id} is missing appName`);
  }
}

function assertConnectorDefinitions(definitions) {
  if (!Array.isArray(definitions)) {
    throw new Error('Connector definitions must be an array');
  }

  const seen = new Set();

  for (const definition of definitions) {
    assertConnectorDefinition(definition);

    if (seen.has(definition.id)) {
      throw new Error(`Duplicate connector definition id: ${definition.id}`);
    }

    seen.add(definition.id);
  }
}

module.exports = {
  assertConnectorDefinition,
  assertConnectorDefinitions
};
