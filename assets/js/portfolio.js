(() => {
  const state = {
    view: getInitialView(),
    filter: 'all',
    data: { design: [], video: [] }
  };

  const views = {
    design: {
      hash: '#design',
      kicker: 'Portfólio de Design',
      title: 'Artes, banners e logos.',
      description: 'Projetos visuais organizados por formato, título, descrição e softwares utilizados.',
      filters: [
        ['all', 'Todos'],
        ['instagram', 'Instagram'],
        ['banner', 'Banner'],
        ['logo', 'Logo']
      ]
    },
    video: {
      hash: '#video',
      kicker: 'Portfólio de Vídeo',
      title: 'Edições, campanhas e conteúdos audiovisuais.',
      description: 'Vídeos organizados por formato, título, descrição e softwares utilizados.',
      filters: [
        ['all', 'Todos'],
        ['vertical', 'Vertical'],
        ['horizontal', 'Horizontal']
      ]
    }
  };

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

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const els = {
    navTabs: $$('.nav-tab'),
    mobileMenu: $('#mobileMenu'),
    hamburger: $('#hamburger'),
    grid: $('#portfolioGrid'),
    empty: $('#emptyState'),
    count: $('#portfolioCount'),
    filters: $('#filterPills'),
    viewKicker: $('#viewKicker'),
    viewTitle: $('#viewTitle'),
    viewDescription: $('#viewDescription'),
    totalDesign: $('#totalDesign'),
    totalVideo: $('#totalVideo'),
    lightbox: $('#lightbox'),
    lightboxMedia: $('#lightboxMedia'),
    lightboxCaption: $('#lightboxCaption'),
    lightboxClose: $('#lightboxClose')
  };

  function getInitialView() {
    const hash = String(location.hash || '').replace('#', '').toLowerCase();
    if (hash === 'video' || hash === 'design') return hash;

    const configured = String(document.body?.dataset?.defaultView || '').toLowerCase();
    if (configured === 'video' || configured === 'design') return configured;

    if (location.pathname.toLowerCase().includes('portfolio-video')) return 'video';
    return 'design';
  }

  function escapeHtml(value = '') {
    return String(value).replace(/[&<>'"]/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;'
    }[char]));
  }

  function normalizeUrl(item) {
    let url = item.url || '';
    if (!url && item.filename) {
      url = `assets/uploads/${item.type || state.view}/${item.filename}`;
    }

    url = String(url || '').trim();

    // O backend antigo salvava caminhos como "/assets/uploads/...".
    // Em GitHub Pages e em subpastas, o caminho precisa ser relativo.
    url = url.replace(/^https?:\/\/[^/]+\/assets\//i, 'assets/');
    url = url.replace(/^\/+assets\//, 'assets/');
    url = url.replace(/^\.\//, '');

    return url;
  }


  function getVideoPreviewUrl(url) {
    const value = String(url || '').trim();
    if (!value || value.includes('#t=')) return value;
    if (value.includes('#')) return value;
    return `${value}#t=0.1`;
  }

  function prepareVideoPreviews() {
    $$('.media-frame video', els.grid).forEach((video) => {
      video.muted = true;
      video.playsInline = true;

      const markReady = () => video.classList.add('video-preview-ready');
      const seekToPreviewFrame = () => {
        const duration = Number(video.duration || 0);
        if (!Number.isFinite(duration) || duration <= 0) return;

        const target = Math.min(0.25, Math.max(0.08, duration * 0.015));
        if (Math.abs(video.currentTime - target) < 0.02) return;

        try {
          video.currentTime = target;
        } catch (error) {
          markReady();
        }
      };

      video.addEventListener('loadedmetadata', seekToPreviewFrame, { once: true });
      video.addEventListener('loadeddata', markReady, { once: true });
      video.addEventListener('seeked', markReady, { once: true });
    });
  }

  function normalizeData(payload) {
    if (!payload || typeof payload !== 'object') return { design: [], video: [] };

    const design = Array.isArray(payload.design)
      ? payload.design
      : Array.isArray(payload.items)
        ? payload.items.filter((item) => item.type === 'design')
        : [];

    const video = Array.isArray(payload.video)
      ? payload.video
      : Array.isArray(payload.items)
        ? payload.items.filter((item) => item.type === 'video')
        : [];

    return {
      design: design.map((item) => ({
        ...item,
        type: 'design',
        url: normalizeUrl({ ...item, type: 'design' }),
        tools: Array.isArray(item.tools) ? item.tools : []
      })).sort(sortNewest),
      video: video.map((item) => ({
        ...item,
        type: 'video',
        url: normalizeUrl({ ...item, type: 'video' }),
        tools: Array.isArray(item.tools) ? item.tools : []
      })).sort(sortNewest)
    };
  }

  function sortNewest(a, b) {
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  }

  async function loadData() {
    const embedded = normalizeData(window.HRZN_PORTFOLIO_DATA);

    // Abrindo por duplo clique/file://, fetch de JSON pode falhar por CORS.
    // Por isso o projeto usa portfolio-data.js como fonte principal local.
    if (location.protocol === 'file:') return embedded;

    try {
      const response = await fetch(`assets/data/portfolio.json?v=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('JSON estático não encontrado.');
      const payload = await response.json();
      return normalizeData(payload);
    } catch (error) {
      return embedded;
    }
  }

  function getCurrentItems() {
    const items = state.data[state.view] || [];
    if (state.filter === 'all') return items;
    return items.filter((item) => item.format === state.filter);
  }

  function setView(view, pushHash = true) {
    state.view = view === 'video' ? 'video' : 'design';
    state.filter = 'all';

    if (pushHash && location.hash !== views[state.view].hash) {
      history.replaceState(null, '', views[state.view].hash);
    }

    render();
    closeMobileMenu();
  }

  function render() {
    renderHeader();
    renderFilters();
    renderGrid();
  }

  function renderHeader() {
    const meta = views[state.view];

    els.navTabs.forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.view === state.view);
    });

    els.viewKicker.textContent = meta.kicker;
    els.viewTitle.textContent = meta.title;
    els.viewDescription.textContent = meta.description;
    els.totalDesign.textContent = String((state.data.design || []).length);
    els.totalVideo.textContent = String((state.data.video || []).length);
  }

  function renderFilters() {
    const meta = views[state.view];
    els.filters.innerHTML = meta.filters.map(([value, label]) => `
      <button class="filter-pill ${state.filter === value ? 'active' : ''}" data-filter="${escapeHtml(value)}">
        ${escapeHtml(label)}
      </button>
    `).join('');

    $$('.filter-pill', els.filters).forEach((button) => {
      button.addEventListener('click', () => {
        state.filter = button.dataset.filter || 'all';
        renderGrid();
        $$('.filter-pill', els.filters).forEach((item) => item.classList.toggle('active', item === button));
      });
    });
  }

  function renderGrid() {
    const items = getCurrentItems();
    const label = state.view === 'design' ? 'arte' : 'vídeo';

    els.grid.classList.toggle('is-design', state.view === 'design');
    els.grid.classList.toggle('is-video', state.view === 'video');

    els.count.textContent = `${items.length} ${items.length === 1 ? label + ' publicado' : label + 's publicados'}`;

    if (!items.length) {
      els.grid.innerHTML = '';
      els.empty.hidden = false;
      return;
    }

    els.empty.hidden = true;
    els.grid.innerHTML = items.map(renderCard).join('');

    $$('.media-frame', els.grid).forEach((button) => {
      button.addEventListener('click', () => openLightbox(button.dataset.id));
    });

    $$('.media-frame img, .media-frame video', els.grid).forEach((media) => {
      media.addEventListener('error', () => markMissing(media), { once: true });
    });

    if (state.view === 'video') prepareVideoPreviews();
  }

  function getCardClass(item) {
    if (item.format === 'banner') return 'banner-card';
    if (item.format === 'horizontal') return 'horizontal-card';
    if (item.format === 'logo') return 'logo-card';
    return '';
  }

  function renderCard(item) {
    const title = escapeHtml(item.title || 'Projeto sem título');
    const description = escapeHtml(item.description || '');
    const url = escapeHtml(item.url);
    const previewUrl = escapeHtml(getVideoPreviewUrl(item.url));
    const id = escapeHtml(item.id || item.filename || item.url);
    const format = escapeHtml(item.format || '');
    const cardClass = getCardClass(item);
    const tools = item.tools.map((tool) => `<span class="tool-chip ${toolClasses[tool] || ''}">${escapeHtml(tool)}</span>`).join('');

    const media = state.view === 'design'
      ? `<img src="${url}" alt="${title}" loading="lazy">`
      : `<video src="${previewUrl}" muted playsinline preload="metadata"></video><div class="play-badge"><span>▶</span></div>`;

    return `
      <article class="portfolio-card ${cardClass}">
        <button class="media-frame ${format}" data-id="${id}" aria-label="Abrir ${title}" type="button">
          <span class="format-badge">${formatLabels[item.format] || escapeHtml(item.format || 'Projeto')}</span>
          ${media}
        </button>
        <div class="card-body">
          <h3 class="card-title">${title}</h3>
          <p class="card-description">${description}</p>
          <div class="tool-list">${tools || '<span class="tool-chip">Software não informado</span>'}</div>
        </div>
      </article>
    `;
  }

  function markMissing(media) {
    const frame = media.closest('.media-frame');
    if (!frame || frame.querySelector('.media-missing')) return;
    const path = media.getAttribute('src') || '';
    const warning = document.createElement('div');
    warning.className = 'media-missing';
    warning.innerHTML = `Arquivo não encontrado.<br><small>${escapeHtml(path)}</small>`;
    frame.appendChild(warning);
  }

  function openLightbox(id) {
    const items = state.data[state.view] || [];
    const item = items.find((entry) => String(entry.id || entry.filename || entry.url) === String(id));
    if (!item) return;

    const title = escapeHtml(item.title || 'Projeto');
    const url = escapeHtml(item.url);

    if (state.view === 'design') {
      els.lightboxMedia.innerHTML = `<img src="${url}" alt="${title}">`;
    } else {
      els.lightboxMedia.innerHTML = `<video src="${url}" controls autoplay playsinline preload="metadata"></video>`;
    }

    const media = els.lightboxMedia.querySelector('img, video');
    if (media) media.addEventListener('error', () => {
      els.lightboxMedia.innerHTML = `<div class="empty-state"><h3>Arquivo não encontrado</h3><p>${url}</p></div>`;
    }, { once: true });

    els.lightboxCaption.textContent = `${item.title || 'Projeto'} · ${formatLabels[item.format] || item.format || ''}`;
    els.lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    els.lightbox.classList.remove('open');
    els.lightboxMedia.innerHTML = '';
    els.lightboxCaption.textContent = '';
    document.body.style.overflow = '';
  }

  function openMobileMenu() {
    els.mobileMenu.classList.add('open');
    els.hamburger.setAttribute('aria-expanded', 'true');
  }

  function closeMobileMenu() {
    els.mobileMenu.classList.remove('open');
    els.hamburger.setAttribute('aria-expanded', 'false');
  }

  function toggleMobileMenu() {
    if (els.mobileMenu.classList.contains('open')) closeMobileMenu();
    else openMobileMenu();
  }

  function bindEvents() {
    els.navTabs.forEach((tab) => {
      tab.addEventListener('click', (event) => {
        event.preventDefault();
        setView(tab.dataset.view, true);
      });
    });

    els.hamburger.addEventListener('click', toggleMobileMenu);

    document.addEventListener('click', (event) => {
      if (!els.mobileMenu.contains(event.target) && !els.hamburger.contains(event.target)) {
        closeMobileMenu();
      }
    });

    els.lightboxClose.addEventListener('click', closeLightbox);
    els.lightbox.addEventListener('click', (event) => {
      if (event.target === els.lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeLightbox();
    });

    window.addEventListener('hashchange', () => {
      setView(getInitialView(), false);
    });
  }

  async function init() {
    bindEvents();
    state.data = await loadData();
    setView(getInitialView(), false);
  }

  init();
})();