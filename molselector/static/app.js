const state = {
  folder: null,
  files: [],
  index: 0,
  viewer: null,
};

const defaultFolder = window.MOLSELECTOR_DEFAULT_FOLDER;

const folderForm = document.getElementById('folder-form');
const folderInput = document.getElementById('folder-input');
const folderStatus = document.getElementById('folder-status');
const viewerSection = document.getElementById('viewer-section');
const viewerCanvas = document.getElementById('viewer');
const fileNameEl = document.getElementById('file-name');
const progressEl = document.getElementById('progress-bar');
const decisionStatus = document.getElementById('decision-status');
const acceptBtn = document.getElementById('accept-btn');
const declineBtn = document.getElementById('decline-btn');
const browseBtn = document.getElementById('browse-button');
const backBtn = document.getElementById('back-btn');

function initViewer() {
  state.viewer = $3Dmol.createViewer(viewerCanvas, { backgroundColor: 'white' });
}

async function handleSetFolder(event) {
  event.preventDefault();
  const folderPath = folderInput.value.trim();
  if (!folderPath) {
    return;
  }
  await loadFolder(folderPath);
}

async function loadFolder(folderPath) {
  folderStatus.textContent = 'Loading folder…';
  try {
    const response = await fetch('/api/folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder: folderPath }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || 'Failed to load folder');
    }
    const data = await response.json();
    state.folder = data.folder;
    state.files = data.files;
    state.index = findNextIndex(0);
    folderStatus.textContent = `Loaded ${state.files.length} molecules from ${data.folder}`;
    viewerSection.classList.remove('hidden');
    updateViewer();
  } catch (error) {
    folderStatus.textContent = error.message;
    viewerSection.classList.add('hidden');
    setControlsEnabled(false);
    setBackEnabled(false);
  }
}

async function handleBrowse() {
  folderStatus.textContent = 'Opening folder picker…';
  try {
    const response = await fetch('/api/folder/picker');
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || 'Failed to open folder picker');
    }
    const data = await response.json();
    folderInput.value = data.folder;
    await loadFolder(data.folder);
  } catch (error) {
    folderStatus.textContent = error.message;
    setControlsEnabled(false);
    setBackEnabled(false);
  }
}

function findNextIndex(start) {
  if (!state.files.length) {
    return 0;
  }
  for (let i = start; i < state.files.length; i += 1) {
    if (!state.files[i].decision) {
      return i;
    }
  }
  return state.files.length - 1;
}

async function updateViewer() {
  if (!state.files.length) {
    setControlsEnabled(false);
    setBackEnabled(false);
    return;
  }

  const file = state.files[state.index];
  setProgress();
  decisionStatus.textContent = file.decision ? `Already marked as ${file.decision}` : '';
  fileNameEl.textContent = file.name;
  setControlsEnabled(true);
  setBackEnabled(state.index > 0);

  try {
    const response = await fetch(`/api/molecule?path=${encodeURIComponent(file.path)}`);
    if (!response.ok) {
      throw new Error('Unable to load molecule');
    }
    const data = await response.json();
    renderMolecule(data);
  } catch (error) {
    decisionStatus.textContent = error.message;
  }
}

function renderMolecule({ content, format }) {
  state.viewer.clear();
  state.viewer.resize();
  try {
    state.viewer.addModel(content, format);
    state.viewer.setStyle({}, { stick: { radius: 0.15 }, sphere: { scale: 0.18 } });
    state.viewer.zoomTo();
    state.viewer.render();
  } catch (error) {
    decisionStatus.textContent = 'Failed to visualize molecule';
  }
}

async function submitDecision(decision) {
  const file = state.files[state.index];
  decisionStatus.textContent = `${decision === 'accept' ? 'Accepting' : 'Declining'} ${file.name}…`;

  try {
    const response = await fetch('/api/decision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: file.path, decision }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || 'Failed to save decision');
    }

    state.files[state.index].decision = decision;
    decisionStatus.textContent = `Marked ${file.name} as ${decision}.`;
    advance();
  } catch (error) {
    decisionStatus.textContent = error.message;
  }
}

function advance() {
  const nextIndex = findNextUnmarked(state.index + 1);
  if (nextIndex === null) {
    setProgress();
    decisionStatus.textContent += ' All molecules reviewed.';
    setControlsEnabled(true);
    setBackEnabled(state.files.length > 1);
    return;
  }
  state.index = nextIndex;
  updateViewer();
}

function goToPrevious() {
  if (!state.files.length) {
    return;
  }
  if (state.index === 0) {
    decisionStatus.textContent = 'Already at the first molecule.';
    return;
  }
  state.index -= 1;
  updateViewer();
}

function findNextUnmarked(start) {
  for (let i = start; i < state.files.length; i += 1) {
    if (!state.files[i].decision) {
      return i;
    }
  }
  const firstPending = state.files.findIndex((file) => !file.decision);
  return firstPending === -1 ? null : firstPending;
}

function setProgress() {
  const reviewed = state.files.filter((file) => file.decision).length;
  progressEl.textContent = `${reviewed} / ${state.files.length}`;
}

function setControlsEnabled(enabled) {
  acceptBtn.disabled = !enabled;
  declineBtn.disabled = !enabled;
  acceptBtn.classList.toggle('disabled', !enabled);
  declineBtn.classList.toggle('disabled', !enabled);
}

function setBackEnabled(enabled) {
  backBtn.disabled = !enabled;
  backBtn.classList.toggle('disabled', !enabled);
}

folderForm.addEventListener('submit', handleSetFolder);
acceptBtn.addEventListener('click', () => submitDecision('accept'));
declineBtn.addEventListener('click', () => submitDecision('decline'));
browseBtn.addEventListener('click', handleBrowse);
backBtn.addEventListener('click', goToPrevious);
document.addEventListener('keydown', handleKeydown);
window.addEventListener('resize', () => {
  if (state.viewer) {
    state.viewer.resize();
    state.viewer.render();
  }
});

initViewer();

if (typeof defaultFolder === 'string' && defaultFolder.trim()) {
  folderInput.value = defaultFolder;
  void loadFolder(defaultFolder);
}

function handleKeydown(event) {
  if (!state.files.length) {
    return;
  }

  const activeTag = (event.target && event.target.tagName) || '';
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag) || (event.target && event.target.isContentEditable)) {
    return;
  }

  switch (event.key) {
    case 'ArrowRight':
    case 'Enter':
    case 'a':
    case 'A': {
      if (!acceptBtn.disabled) {
        event.preventDefault();
        submitDecision('accept');
      }
      break;
    }
    case 'ArrowLeft':
    case 'd':
    case 'D': {
      if (!declineBtn.disabled) {
        event.preventDefault();
        submitDecision('decline');
      }
      break;
    }
    case 'ArrowUp':
    case 'Backspace':
    case 'b':
    case 'B': {
      if (!backBtn.disabled) {
        event.preventDefault();
        goToPrevious();
      }
      break;
    }
    default:
      break;
  }
}
