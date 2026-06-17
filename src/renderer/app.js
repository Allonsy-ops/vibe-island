const root = document.getElementById('app');
const { buildViewModel } = window.VibeIslandViewModel;
const { renderShell } = window.VibeIslandRender;
const { createSystemItem, createSystemSnapshot } = window.VibeIslandSystemEvents;

let latestSnapshot = {
  items: [],
  waitingCount: 0,
  topItem: null
};
let actionInFlight = false;

function paint(snapshot) {
  latestSnapshot = snapshot;
  renderShell(root, buildViewModel(snapshot));
}

async function refresh() {
  const snapshot = await window.vibeIsland.getSnapshot();
  paint(snapshot);
}

window.vibeIsland.onSnapshot((snapshot) => {
  paint(snapshot);
});

root.addEventListener('click', async (event) => {
  if (actionInFlight) {
    return;
  }

  const closeButton = event.target.closest('button[data-close-window]');
  if (closeButton) {
    await window.vibeIsland.closeWindow();
    return;
  }

  const feedbackButton = event.target.closest('button[data-open-feedback]');
  if (feedbackButton) {
    await window.vibeIsland.openFeedback();
    return;
  }

  const button = event.target.closest('button[data-action]');
  if (!button) {
    return;
  }

  actionInFlight = true;
  try {
    await window.vibeIsland.runAction({
      id: button.dataset.action,
      connector_id: button.dataset.connector,
      task_id: button.dataset.task
    });

    await refresh();
  } catch (error) {
    const systemItem = createSystemItem({
      taskId: 'action-error',
      title: '操作失败',
      summary: error && error.message ? error.message : '请稍后再试'
    });
    paint(createSystemSnapshot(systemItem));
  } finally {
    actionInFlight = false;
  }
});

window.addEventListener('keydown', async (event) => {
  if (event.key === 'Escape') {
    await window.vibeIsland.closeWindow();
  }
});

window.addEventListener('wheel', (event) => {
  event.preventDefault();
}, { passive: false });

refresh().catch(() => {});
