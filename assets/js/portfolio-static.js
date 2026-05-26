const pageType = document.body.dataset.portfolioType || 'design';
const grid = document.getElementById('portfolioGrid');
const emptyState = document.getElementById('emptyState');
const countEl = document.getElementById('portfolioCount');
const filters = document.querySelectorAll('.filter-pill');
const lightbox = document.getElementById('lightbox');
const lightboxMedia = document.getElementById('lightboxMedia');
const lightboxCaption = document.getElementById('lightboxCaption');
let allItems = [];
let currentFilter = 'all';

const formatLabels = {
  instagram: 'Instagram · 3:4',
  banner: 'Banner · 1920x500–700',
  logo: 'Logo · 1:1',
  vertical: 'Vertical · 1080x1920',
  horizontal: 'Horizontal · 1920x1080'
};

const toolClasses = {
  'Adobe Photoshop': 'tool-photoshop',
  'Adobe Illustrator': 'tool-illustrator',
  'Canva': 'tool-canva',
  'Adobe Premiere': 'tool-premiere',
  'CapCut': 'tool-capcut',
  'Adobe AfterEffects': 'tool-aftereffects'
};

function escapeHtml(str = '') {
  return String(str).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;'
  }[char]));
}

function normalizeUrl(item) {
  let url = item.url || '';
  if (!url && item.filename) url = `assets/uploads/${item.type || pageType}/${item.filename}`;

  // No projeto com backend, o item era salvo como /assets/uploads/...
  // Em GitHub Pages/site estático, caminhos precisam ser relativos.
  url = String(url).replace(/^\/+assets\//, 'assets/');
  url = url.replace(/^\.\//, '');
  return url;
}

function normalizeDbPayload(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (payload.ok && Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload[pageType])) return payload[pageType];
  if (Array.isArray(payload.items)) return payload.items.filter((item) => item.type === pageType);
  return [];
}

async function fetchJson(url) {
  const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Arquivo não encontrado: ${url}`);
  return response.json();
}

async function loadPortfolioData() {
  const sources = [
    'assets/data/portfolio.json',
    'data/portfolio.json',
    `/api/items?type=${pageType}`
  ];

  let lastError = null;
  for (const source of sources) {
    try {
      const payload = await fetchJson(source);
      const items = normalizeDbPayload(payload)
        .filter((item) => (item.type || pageType) === pageType)
        .map((item) => ({ ...item, url: normalizeUrl(item), tools: Array.isArray(item.tools) ? item.tools : [] }))
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      return { items, source };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Não foi possível carregar os dados do portfólio.');
}

function filteredItems() {
  if (currentFilter === 'all') return allItems;
  return allItems.filter((item) => item.format === currentFilter);
}

function render() {
  const items = filteredItems();
  countEl.textContent = `${items.length} ${items.length === 1 ? 'item publicado' : 'itens publicados'}`;

  if (!items.length) {
    grid.innerHTML = '';
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;
  grid.innerHTML = items.map((item) => {
    const title = escapeHtml(item.title || 'Projeto sem título');
    const description = escapeHtml(item.description || '');
    const url = escapeHtml(item.url);
    const media = pageType === 'design'
      ? `<img src="${url}" alt="${title}" loading="lazy">`
      : `<video src="${url}" muted playsinline preload="metadata"></video><div class="play-badge"><span><i class='bx bx-play'></i></span></div>`;

    const tools = item.tools.map((tool) => `<span class="tool-chip ${toolClasses[tool] || ''}">${escapeHtml(tool)}</span>`).join('');

    return `
      <article class="portfolio-card">
        <button class="media-frame ${escapeHtml(item.format || '')}" data-id="${escapeHtml(item.id || item.url)}" aria-label="Abrir ${title}">
          <span class="format-badge">${formatLabels[item.format] || escapeHtml(item.format || 'Projeto')}</span>
          ${media}
        </button>
        <div class="card-body">
          <h2 class="card-title">${title}</h2>
          <p class="card-description">${description}</p>
          <div class="tool-list">${tools}</div>
        </div>
      </article>
    `;
  }).join('');

  grid.querySelectorAll('.media-frame').forEach((button) => {
    button.addEventListener('click', () => openLightbox(button.dataset.id));
  });
}

function openLightbox(id) {
  const item = allItems.find((entry) => String(entry.id || entry.url) === String(id));
  if (!item) return;
  const title = escapeHtml(item.title || 'Projeto');
  const url = escapeHtml(item.url);

  if (pageType === 'design') {
    lightboxMedia.innerHTML = `<img src="${url}" alt="${title}">`;
  } else {
    lightboxMedia.innerHTML = `<video src="${url}" controls autoplay playsinline preload="metadata"></video>`;
  }

  lightboxCaption.textContent = `${item.title || 'Projeto'} · ${formatLabels[item.format] || item.format || ''}`;
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('open');
  lightboxMedia.innerHTML = '';
  lightboxCaption.textContent = '';
  document.body.style.overflow = '';
}

async function loadItems() {
  try {
    const result = await loadPortfolioData();
    allItems = result.items || [];
    render();
  } catch (error) {
    countEl.textContent = '0 itens publicados';
    emptyState.hidden = false;
    emptyState.innerHTML = `
      <h3>Não foi possível carregar os itens</h3>
      <p>Copie o arquivo <code>data/portfolio.json</code> do projeto original para <code>assets/data/portfolio.json</code> e mantenha os arquivos em <code>assets/uploads/</code>.</p>
    `;
  }
}

filters.forEach((filter) => {
  filter.addEventListener('click', () => {
    currentFilter = filter.dataset.filter;
    filters.forEach((item) => item.classList.toggle('active', item === filter));
    render();
  });
});

document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox) closeLightbox();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeLightbox();
});

loadItems();
