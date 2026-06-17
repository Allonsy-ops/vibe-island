(function initRenderer(globalScope) {
  function actionTone(actionId) {
    return {
      approve_once: 'approve',
      deny: 'deny',
      open_session: 'session',
      dismiss: 'ghost'
    }[actionId] || 'ghost';
  }

  function actionButtons(item, actions) {
    return actions.map((action) => {
      const emphasis = action.id === 'approve_once' ? 'primary' : 'secondary';

      return `
      <button
        class="action-button tone-${actionTone(action.id)} emphasis-${emphasis}"
        data-action="${action.id}"
        data-connector="${item.connector_id || ''}"
        data-task="${item.task_id || ''}"
      >
        ${action.label || action.id}
      </button>
    `;
    }).join('');
  }

  function renderInbox(items) {
    return `
      <div class="list">
        ${items.map((item) => `
          <div class="list-item">
            <div class="list-source">${item.sourceLabel || item.source_id}</div>
            <div class="list-title">${item.title}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderMetaActions(viewModel) {
    if (viewModel.mode === 'quick-action') {
      return '';
    }

    return `
      <div class="meta-actions">
        <button class="meta-button" data-open-feedback="true">问题反馈</button>
      </div>
    `;
  }

  function renderShell(root, viewModel) {
    const item = viewModel.item;
    const shellClass = `island mode-${viewModel.mode}`;
    const sourceName = item
      ? (item.source_id === 'claude-code' ? 'CLAUDE CODE' : String(item.source_id).toUpperCase())
      : 'VIBE HUB';
    const closeButton = '<button class="close-button" data-close-window="true" aria-label="关闭浮窗">×</button>';
    const footer = item && viewModel.actions.length
      ? `<div class="actions">${actionButtons(item, viewModel.actions)}</div>`
      : '';
    const body = viewModel.mode === 'inbox'
      ? renderInbox(viewModel.items || [])
      : `<p class="message">${viewModel.message}</p>`;

    root.innerHTML = `
      <section class="${shellClass}">
        <div class="notch-bridge" aria-hidden="true"></div>
        <div class="notch-core" aria-hidden="true"></div>
        <div class="glass-haze" aria-hidden="true"></div>
        <div class="glass-sheen" aria-hidden="true"></div>
        <div class="glow"></div>
        <header class="header">
          <div class="eyebrow">
            <div class="source-mark">${sourceName}</div>
          </div>
          <div class="header-right">
            <div class="status-pill">${viewModel.modeLabel}</div>
            ${closeButton}
          </div>
        </header>
        <h1 class="title">${viewModel.title}</h1>
        ${body}
        ${footer}
        ${renderMetaActions(viewModel)}
      </section>
    `;
  }

  const api = {
    renderShell
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.VibeIslandRender = api;
})(typeof window !== 'undefined' ? window : globalThis);
