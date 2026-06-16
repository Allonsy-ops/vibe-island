const root = document.getElementById('app');
const { buildViewModel } = window.VibeIslandViewModel;
const { renderShell } = window.VibeIslandRender;

let latestSnapshot = {
  items: [],
  waitingCount: 0,
  topItem: null
};

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
  const button = event.target.closest('button[data-action]');
  if (!button) {
    return;
  }

  await window.vibeIsland.runAction({
    id: button.dataset.action,
    connector_id: button.dataset.connector,
    task_id: button.dataset.task
  });

  await refresh();
});

refresh().catch(() => {});
