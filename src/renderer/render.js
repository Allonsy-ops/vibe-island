(function initRenderer(globalScope) {
  function actionButtons(item, actions) {
    return actions.map((action) => `
      <button
        class="action-button ${action.id === 'deny' ? 'danger' : ''}"
        data-action="${action.id}"
        data-connector="${item.connector_id || ''}"
        data-task="${item.task_id || ''}"
      >
        ${action.id}
      </button>
    `).join('');
  }

  function renderInbox(items) {
    return `
      <div class="list">
        ${items.map((item) => `
          <div class="list-item">
            <div class="list-source">${item.source_id}</div>
            <div class="list-title">${item.title}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderShell(root, viewModel) {
    const item = viewModel.item;
    const shellClass = `island mode-${viewModel.mode}`;
    const badge = item ? `<div class="badge">${item.source_id}</div>` : '<div class="badge">hub</div>';
    const footer = item && viewModel.actions.length
      ? `<div class="actions">${actionButtons(item, viewModel.actions)}</div>`
      : '';
    const body = viewModel.mode === 'inbox'
      ? renderInbox(viewModel.items || [])
      : `<p class="message">${viewModel.message}</p>`;

    root.innerHTML = `
      <section class="${shellClass}">
        <div class="glow"></div>
        <header class="header">
          ${badge}
          <div class="status">${viewModel.mode.replace('-', ' ')}</div>
        </header>
        <h1 class="title">${viewModel.title}</h1>
        ${body}
        ${footer}
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
