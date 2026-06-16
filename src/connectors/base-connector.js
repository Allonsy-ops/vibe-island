class BaseConnector {
  constructor({ id, sourceType, sourceName, onEvent }) {
    this.id = id;
    this.sourceType = sourceType;
    this.sourceName = sourceName;
    this.onEvent = onEvent;
  }

  emit(event) {
    const emittedEvent = {
      ...event,
      connector_id: this.id,
      source_type: event.source_type || this.sourceType,
      source_id: event.source_id || this.sourceName
    };

    this.onEvent(emittedEvent);
    return emittedEvent;
  }
}

module.exports = {
  BaseConnector
};
