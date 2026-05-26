const state = {
  type: 'design',
  file: null
};

const config = {
  design: {
    accept: 'image/*',
    formatLabel: 'Formato da arte',
    formats: [
      ['instagram', 'Instagram · 3:4 · 1080x1440'],
      ['banner', 'Banner · 1920x500 a 700'],
      ['logo', 'Logo · 500x500 ou 1000x1000']
    ],
    tools: [
      ['Adobe Photoshop', 'Photoshop'],
      ['Adobe Illustrator', 'Illustrator'],
      ['Canva', 'Canva']
    ],
    dropHint: 'PNG, JPG, JPEG, WEBP ou SVG'
  },
  video: {
    accept: 'video/*',
    formatLabel: 'Formato do vídeo',
    formats: [
      ['vertical', 'Vertical · 1080x1920'],
      ['horizontal', 'Horizontal · 1920x1080']
    ],
    tools: [
      ['Adobe Premiere', 'Premiere'],
      ['CapCut', 'CapCut'],
      ['Adobe AfterEffects', 'After Effects']
    ],
    dropHint: 'MP4, WEBM, MOV ou outros formatos de vídeo'
  }
};

const form = document.getElementById('uploadForm');
const tabs = document.querySelectorAll('.form-tab');
const fileInput = document.getElementById('fileInput');
const formatSelect = document.getElementById('format');
const toolsBox = document.getElementById('toolsBox');
const dropHint = document.getElementById('dropHint');
const dropzone = document.getElementById('dropzone');
const previewWindow = document.getElementById('previewWindow');
const previewType = document.getElementById('previewType');
const previewName = document.getElementById('previewName');
const previewFormat = document.getElementById('previewFormat');
const statusEl = document.getElementById('formStatus');

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? '#ff7a7a' : 'rgba(255,255,255,0.62)';
}

function setType(type) {
  state.type = type;
  state.file = null;
  fileInput.value = '';
  document.getElementById('type').value = type;

  tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.type === type));
  const current = config[type];

  fileInput.accept = current.accept;
  dropHint.textContent = current.dropHint;
  formatSelect.innerHTML = current.formats.map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
  toolsBox.innerHTML = current.tools.map(([value, label]) => `
    <label class="tool-check">
      <input type="checkbox" name="tools" value="${value}">
      <span>${label}</span>
    </label>
  `).join('');

  previewType.textContent = type === 'design' ? 'Design' : 'Vídeo';
  previewName.textContent = 'Nenhum arquivo';
  previewFormat.textContent = formatSelect.options[0]?.textContent || '-';
  renderPreview();
  setStatus('Pronto para enviar.');
}

function renderPreview() {
  if (!state.file) {
    previewWindow.innerHTML = '<div class="preview-empty"><strong>Prévia do upload</strong><br>Selecione um arquivo para visualizar aqui.</div>';
    return;
  }

  const url = URL.createObjectURL(state.file);
  if (state.type === 'design') {
    previewWindow.innerHTML = `<img src="${url}" alt="Prévia do upload de design">`;
  } else {
    previewWindow.innerHTML = `<video src="${url}" controls muted playsinline></video>`;
  }
}

function handleFile(file) {
  if (!file) return;
  const valid = state.type === 'design' ? file.type.startsWith('image/') : file.type.startsWith('video/');
  if (!valid) {
    setStatus('O arquivo selecionado não corresponde à categoria escolhida.', true);
    fileInput.value = '';
    return;
  }
  state.file = file;
  previewName.textContent = file.name;
  previewFormat.textContent = formatSelect.options[formatSelect.selectedIndex]?.textContent || '-';
  renderPreview();
  setStatus('Arquivo carregado para prévia.');
}

tabs.forEach((tab) => tab.addEventListener('click', () => setType(tab.dataset.type)));
fileInput.addEventListener('change', (event) => handleFile(event.target.files[0]));
formatSelect.addEventListener('change', () => {
  previewFormat.textContent = formatSelect.options[formatSelect.selectedIndex]?.textContent || '-';
});

dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropzone.classList.add('dragover');
});
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
dropzone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropzone.classList.remove('dragover');
  const file = event.dataTransfer.files[0];
  if (file) {
    fileInput.files = event.dataTransfer.files;
    handleFile(file);
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!state.file) {
    setStatus('Selecione um arquivo antes de enviar.', true);
    return;
  }

  const checkedTools = Array.from(form.querySelectorAll('input[name="tools"]:checked'));
  if (checkedTools.length === 0) {
    setStatus('Selecione pelo menos um software utilizado.', true);
    return;
  }

  const formData = new FormData(form);
  formData.set('type', state.type);
  formData.set('file', state.file);

  setStatus('Enviando e salvando arquivo...');

  try {
    const response = await fetch('/api/upload', { method: 'POST', body: formData });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || 'Erro ao enviar arquivo.');

    form.reset();
    setType(state.type);
    setStatus('Upload salvo com sucesso. O item já está disponível no portfólio.');
  } catch (error) {
    setStatus(error.message, true);
  }
});

setType('design');
