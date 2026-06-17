function validateAction(action) {
  if (!action || typeof action !== 'object') {
    throw new Error('Action payload must be an object');
  }

  if (!action.connector_id) {
    throw new Error('Action is missing connector_id');
  }

  if (!action.id) {
    throw new Error('Action is missing id');
  }
}

function createActionRunner(connectors) {
  return {
    async run(action) {
      validateAction(action);
      const connector = connectors[action.connector_id];
      if (!connector) {
        throw new Error(`Missing connector: ${action.connector_id}`);
      }
      return connector.runAction(action);
    }
  };
}

module.exports = {
  createActionRunner,
  validateAction
};
