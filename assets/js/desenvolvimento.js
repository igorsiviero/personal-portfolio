(() => {
  const devGrid = document.getElementById('developmentGrid');
  const devEmpty = document.getElementById('devEmptyState');
  const devSearch = document.getElementById('devSearch');
  const devTechFilter = document.getElementById('devTechFilter');
  const devCountHero = document.getElementById('devCountHero');
  const devModal = document.getElementById('devModal');
  const devModalClose = document.getElementById('devModalClose');
  const devModalMedia = document.getElementById('devModalMedia');
  const devModalTitle = document.getElementById('devModalTitle');
  const devModalDescription = document.getElementById('devModalDescription');
  const devModalTechs = document.getElementById('devModalTechs');
  const devModalActions = document.getElementById('devModalActions');

  let devProjects = [];

  const techClasses = {
    'HTML': 'dev-tech-html',
    'CSS': 'dev-tech-css',
    'JavaScript': 'dev-tech-js',
    'JS': 'dev-tech-js',
    'TypeScript': 'dev-tech-ts',
    'React': 'dev-tech-react',
    'Next.js': 'dev-tech-next',
    'Node.js': 'dev-tech-node',
    'Node.JS': 'dev-tech-node',
    'Express': 'dev-tech-express',
    'PHP': 'dev-tech-php',
    'WordPress': 'dev-tech-wordpress',
    'Angular': 'dev-tech-angular',
    'Vue': 'dev-tech-vue',
    'Tailwind CSS': 'dev-tech-tailwind',
    'Bootstrap': 'dev-tech-bootstrap',
    'APIs': 'dev-tech-api',
    'API': 'dev-tech-api',
    'SQL': 'dev-tech-sql',
    'MongoDB': 'dev-tech-mongo',
    'Firebase': 'dev-tech-firebase',
    'Supabase': 'dev-tech-supabase',
    'Git/GitHub': 'dev-tech-git',
    'GitHub': 'dev-tech-git',
    'Vercel': 'dev-tech-vercel',
    'Netlify': 'dev-tech-netlify'
  };

  function escapeHtml(str = '') {
    return String(str).replace(/[&<>'"]/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;'
    }[char]));
  }

  function briefText(text, max = 142) {
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    return clean.length > max ? `${clean.slice(0, max).trim()}...` : clean;
  }

  function assetUrl(project = {}) {
    const raw = String(project.imageUrl || project.url || '').trim();
    if (raw) {
      if (/^https?:\/\//i.test(raw)) return raw;
      return raw.replace(/^\//, '');
    }
    if (project.filename) return `assets/uploads/desenvolvimento/${project.filename}`;
    return '';
  }

  function techChip(tech) {
    return `<span class="dev-tech-chip ${techClasses[tech] || ''}">${escapeHtml(tech)}</span>`;
  }

  function getFilteredProjects() {
    const query = (devSearch?.value || '').trim().toLowerCase();
    const tech = devTechFilter?.value || 'all';
    return devProjects.filter((project) => {
      const technologies = Array.isArray(project.technologies) ? project.technologies : [];
      const haystack = `${project.title || ''} ${project.description || ''} ${technologies.join(' ')}`.toLowerCase();
      return (!query || haystack.includes(query)) && (tech === 'all' || technologies.includes(tech));
    });
  }

  function renderTechFilter() {
    if (!devTechFilter) return;
    const allTechs = Array.from(new Set(devProjects.flatMap((project) => Array.isArray(project.technologies) ? project.technologies : []))).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    devTechFilter.innerHTML = `<option value="all">Todas as tecnologias</option>` + allTechs.map((tech) => `<option value="${escapeHtml(tech)}">${escapeHtml(tech)}</option>`).join('');
  }

  function renderProjects() {
    if (!devGrid) return;
    const items = getFilteredProjects();
    if (devCountHero) devCountHero.textContent = String(devProjects.length).padStart(2, '0');
    if (!items.length) {
      devGrid.innerHTML = '';
      if (devEmpty) devEmpty.hidden = false;
      return;
    }
    if (devEmpty) devEmpty.hidden = true;
    devGrid.innerHTML = items.map((project) => {
      const technologies = Array.isArray(project.technologies) ? project.technologies : [];
      const img = assetUrl(project);
      return `
        <article class="dev-project-card">
          <button class="dev-project-media" data-id="${escapeHtml(project.id)}" aria-label="Expandir ${escapeHtml(project.title)}">
            <img src="${escapeHtml(img)}" alt="${escapeHtml(project.title)}" loading="lazy">
            <span class="dev-expand-hint">Toque para expandir</span>
          </button>
          <div class="dev-project-body">
            <h2>${escapeHtml(project.title)}</h2>
            <p>${escapeHtml(briefText(project.description))}</p>
            <div class="dev-tech-list">${technologies.slice(0, 7).map(techChip).join('')}</div>
          </div>
        </article>`;
    }).join('');
    devGrid.querySelectorAll('.dev-project-media').forEach((button) => {
      button.addEventListener('click', () => openDevModal(button.dataset.id));
    });
  }

  function openDevModal(id) {
    const project = devProjects.find((item) => String(item.id) === String(id));
    if (!project || !devModal) return;
    const technologies = Array.isArray(project.technologies) ? project.technologies : [];
    const img = assetUrl(project);
    devModalMedia.innerHTML = `<img src="${escapeHtml(img)}" alt="${escapeHtml(project.title)}">`;
    devModalTitle.textContent = project.title || '';
    devModalDescription.textContent = project.description || '';
    devModalTechs.innerHTML = technologies.map(techChip).join('');
    const actions = [];
    if (project.siteUrl) actions.push(`<a class="btn btn--primary" href="${escapeHtml(project.siteUrl)}" target="_blank" rel="noopener">Acessar site</a>`);
    if (project.githubUrl) actions.push(`<a class="btn btn--ghost" href="${escapeHtml(project.githubUrl)}" target="_blank" rel="noopener">Ver GitHub</a>`);
    devModalActions.innerHTML = actions.length ? actions.join('') : '<span class="dev-no-links">Links externos não informados para este projeto.</span>';
    devModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeDevModal() {
    if (!devModal) return;
    devModal.classList.remove('open');
    if (devModalMedia) devModalMedia.innerHTML = '';
    document.body.style.overflow = '';
  }

  function loadDevelopmentProjects() {
    try {
      const staticProjects = Array.isArray(window.HRZN_DEVELOPMENT_PROJECTS) ? window.HRZN_DEVELOPMENT_PROJECTS : [];
      devProjects = staticProjects.slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      renderTechFilter();
      renderProjects();
    } catch (error) {
      if (devEmpty) {
        devEmpty.hidden = false;
        devEmpty.innerHTML = `<h3>Não foi possível carregar os projetos</h3><p>${escapeHtml(error.message)}</p>`;
      }
    }
  }

  devSearch?.addEventListener('input', renderProjects);
  devTechFilter?.addEventListener('change', renderProjects);
  devModalClose?.addEventListener('click', closeDevModal);
  devModal?.addEventListener('click', (event) => { if (event.target === devModal) closeDevModal(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && devModal?.classList.contains('open')) closeDevModal(); });

  loadDevelopmentProjects();
})();
