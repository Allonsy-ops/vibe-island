function createActionRunner(connectors) {
  return {
    async run(action) {
      const connector = connectors[action.connector_id];
      if (!connector) {
        throw new Error(`Missing connector: ${action.connector_id}`);
      }
      return connector.runAction(action);
    }
  };
}

module.exports = {
  createActionRunner
};
