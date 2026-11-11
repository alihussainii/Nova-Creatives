const source = JSON.parse(document.getElementById('admin-content').textContent);
let draft = structuredClone(source);
let activeView = 'business';
const editor = document.getElementById('admin-editor');
const status = document.getElementById('admin-status');
const publishButton = document.getElementById('admin-publish');
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const valueAt = (object, key, fallback = '') => object?.[key] ?? fallback;
const setStatus = (message, kind = '') => {
  status.textContent = message;
  status.dataset.kind = kind;
};
const input = (label, attrs, value, type = 'text') => `<label>${label}<input type="${type}" ${attrs} value="${escapeHtml(value)}"></label>`;
const textarea = (label, attrs, value, rtl = false) => `<label>${label}<textarea ${attrs}${rtl ? ' dir="rtl"' : ''}>${escapeHtml(value)}</textarea></label>`;
const pairFields = (label, collection, index, key, values, multiline = true) => [0, 1].map((language) => {
  const control = multiline
    ? textarea(`${label} / ${language ? 'Dari' : 'English'}`, `data-edit="${collection}" data-index="${index}" data-key="${key}" data-locale="${language}"`, values?.[language] || '', language === 1)
    : input(`${label} / ${language ? 'Dari' : 'English'}`, `data-edit="${collection}" data-index="${index}" data-key="${key}" data-locale="${language}"`, values?.[language] || '');
  return control;
}).join('');
const linesField = (label, collection, index, key, language, values) => textarea(`${label} / ${language ? 'Dari' : 'English'} (one per line)`, `data-edit="${collection}" data-index="${index}" data-key="${key}" data-array-locale="${language}"`, (values?.[language] || []).join('\n'), language === 1);
const cardHead = (collection, index, title) => `<header class="cms-card-head"><div><span class="cms-kicker">${collection.slice(0, -1).toUpperCase()} ${String(index + 1).padStart(2, '0')}</span><h2>${escapeHtml(title || 'Untitled')}</h2></div><button class="cms-remove" type="button" data-remove="${collection}" data-index="${index}" aria-label="Remove ${escapeHtml(title || 'item')}">Remove</button></header>`;
const availabilityOptions = (value) => ['primary', 'creative', 'confirm'].map((option) => `<option value="${option}" ${value === option ? 'selected' : ''}>${option[0].toUpperCase()}${option.slice(1)}</option>`).join('');

function renderBusiness() {
  const business = draft.business;
  const fields = [
    input('Studio name', 'data-business="name"', business.name),
    input('Email', 'data-business="email"', business.email, 'email'),
    input('Phone / WhatsApp', 'data-business="phone"', business.phone),
    input('Location', 'data-business="location"', business.location),
    input('Business hours', 'data-business="hours"', business.hours),
    input('Website origin URL', 'data-business="origin"', business.origin, 'url'),
    input('Inquiry form endpoint', 'data-business="formEndpoint"', business.formEndpoint, 'url'),
  ].join('');
  const socials = (business.socials || []).map((social, index) => `<div class="cms-social-row">${input('Platform label', `data-social="${index}" data-key="label"`, social.label)}${input('Profile URL', `data-social="${index}" data-key="url"`, social.url, 'url')}<button class="cms-remove" type="button" data-remove-social="${index}">Remove</button></div>`).join('');
  return `<section class="cms-section"><div class="cms-section-heading"><div><p class="eyebrow">BUSINESS PROFILE</p><h2>Contact and studio details</h2></div></div><div class="cms-grid">${fields}</div><div class="cms-subheading"><h3>Social profiles</h3><button class="button secondary" type="button" data-add-social>Add profile</button></div><div class="cms-list">${socials || '<p class="cms-empty">No social profiles added.</p>'}</div></section>`;
}

function renderServices() {
  const cards = draft.services.map((service, index) => `<article class="cms-card">${cardHead('services', index, service.en)}<div class="cms-grid">
    ${input('URL name (slug)', `data-edit="services" data-index="${index}" data-key="slug"`, service.slug)}
    ${input('English service name', `data-edit="services" data-index="${index}" data-key="en"`, service.en)}
    ${input('Dari service name', `data-edit="services" data-index="${index}" data-key="fa"`, service.fa)}
    <label>Service type<select data-edit="services" data-index="${index}" data-key="availability">${availabilityOptions(service.availability)}</select></label>
    ${pairFields('Introduction', 'services', index, 'intro', service.intro)}
    ${pairFields('Customer need', 'services', index, 'problem', service.problem)}
    ${linesField('Deliverables', 'services', index, 'deliverables', 0, service.deliverables)}
    ${linesField('Deliverables', 'services', index, 'deliverables', 1, service.deliverables)}
    ${input('Related project slugs (comma separated)', `data-edit="services" data-index="${index}" data-key="relatedProjects" data-csv="true"`, (service.relatedProjects || []).join(', '))}
  </div></article>`).join('');
  return `<section class="cms-section"><div class="cms-section-heading"><div><p class="eyebrow">OFFERINGS</p><h2>Services</h2></div><button class="button secondary" type="button" data-add="services">Add service</button></div><div class="cms-list">${cards || '<p class="cms-empty">No services yet.</p>'}</div></section>`;
}

function renderProjects() {
  const cards = draft.projects.map((project, index) => {
    const preview = project.image || `/assets/${encodeURIComponent(project.slug || 'project')}.svg`;
    return `<article class="cms-card">${cardHead('projects', index, project.title)}<div class="cms-grid">
      ${input('URL name (slug)', `data-edit="projects" data-index="${index}" data-key="slug"`, project.slug)}
      ${input('English project name', `data-edit="projects" data-index="${index}" data-key="title"`, project.title)}
      ${input('Dari project name', `data-edit="projects" data-index="${index}" data-key="faTitle"`, project.faTitle)}
      ${input('English category', `data-edit="projects" data-index="${index}" data-key="category"`, project.category)}
      ${input('Dari category', `data-edit="projects" data-index="${index}" data-key="faCategory"`, project.faCategory)}
      ${pairFields('Short introduction', 'projects', index, 'tag', project.tag)}
      ${pairFields('Project brief', 'projects', index, 'brief', project.brief)}
      ${pairFields('Design approach', 'projects', index, 'approach', project.approach)}
      ${pairFields('Deliverables', 'projects', index, 'deliverables', project.deliverables)}
      ${input('Project color', `data-edit="projects" data-index="${index}" data-key="color"`, project.color || '#273D8E', 'color')}
      ${input('Text color', `data-edit="projects" data-index="${index}" data-key="ink"`, project.ink || '#17233F', 'color')}
    </div><div class="cms-image-row"><div><label class="cms-upload">Upload cover image<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" data-upload="projects" data-index="${index}"></label><button class="cms-remove" type="button" data-clear-image="${index}">Use generated artwork</button><p class="cms-help">PNG, JPG, WebP or GIF; maximum 8 MB.</p></div><img class="cms-preview" src="${escapeHtml(preview)}" alt="${escapeHtml(project.title || 'Project')} preview"></div></article>`;
  }).join('');
  return `<section class="cms-section"><div class="cms-section-heading"><div><p class="eyebrow">PORTFOLIO</p><h2>Projects</h2></div><button class="button secondary" type="button" data-add="projects">Add project</button></div><div class="cms-list">${cards || '<p class="cms-empty">No projects yet.</p>'}</div></section>`;
}

function renderArticles() {
  const cards = draft.articles.map((article, index) => {
    const sectionCount = Math.max(article.sections?.[0]?.length || 0, article.sections?.[1]?.length || 0);
    const sections = Array.from({ length: sectionCount }, (_, sectionIndex) => `<div class="cms-article-section"><div class="cms-subheading"><h3>Section ${sectionIndex + 1}</h3><button class="cms-remove" type="button" data-remove-article-section="${index}" data-section-index="${sectionIndex}">Remove section</button></div><div class="cms-grid">${[0, 1].map((language) => {
      const value = article.sections?.[language]?.[sectionIndex] || ['', ''];
      return `<label>Heading / ${language ? 'Dari' : 'English'}<input data-article-section="${index}" data-section-index="${sectionIndex}" data-language="${language}" data-part="0" value="${escapeHtml(value[0])}" ${language ? 'dir="rtl"' : ''}></label><label>Text / ${language ? 'Dari' : 'English'}<textarea data-article-section="${index}" data-section-index="${sectionIndex}" data-language="${language}" data-part="1" ${language ? 'dir="rtl"' : ''}>${escapeHtml(value[1])}</textarea></label>`;
    }).join('')}</div></div>`).join('');
    return `<article class="cms-card">${cardHead('articles', index, article.title?.[0])}<div class="cms-grid">
      ${input('URL name (slug)', `data-edit="articles" data-index="${index}" data-key="slug"`, article.slug)}
      ${pairFields('Category', 'articles', index, 'category', article.category, false)}
      ${pairFields('Article title', 'articles', index, 'title', article.title, false)}
      ${pairFields('Summary', 'articles', index, 'summary', article.summary, false)}
    </div><div class="cms-subheading"><h3>Article sections</h3><button class="button secondary" type="button" data-add-article-section="${index}">Add section</button></div>${sections || '<p class="cms-empty">Add a section to start the article.</p>'}</article>`;
  }).join('');
  return `<section class="cms-section"><div class="cms-section-heading"><div><p class="eyebrow">EDITORIAL</p><h2>Articles</h2></div><button class="button secondary" type="button" data-add="articles">Add article</button></div><div class="cms-list">${cards || '<p class="cms-empty">No articles yet.</p>'}</div></section>`;
}

function renderTeam() {
  const cards = draft.team.map((person, index) => `<article class="cms-card">${cardHead('team', index, person.name?.[0])}<div class="cms-grid">
    ${pairFields('Name', 'team', index, 'name', person.name, false)}
    ${pairFields('Role', 'team', index, 'role', person.role, false)}
    ${pairFields('Biography', 'team', index, 'bio', person.bio)}
  </div><div class="cms-image-row"><div><label class="cms-upload">Upload portrait<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" data-upload="team" data-index="${index}"></label><p class="cms-help">PNG, JPG, WebP or GIF; maximum 8 MB.</p></div><img class="cms-preview" src="${escapeHtml(person.portrait || '')}" alt="${escapeHtml(person.name?.[0] || 'Team member')} portrait" ${person.portrait ? '' : 'hidden'}></div></article>`).join('');
  return `<section class="cms-section"><div class="cms-section-heading"><div><p class="eyebrow">PEOPLE</p><h2>Team</h2></div><button class="button secondary" type="button" data-add="team">Add team member</button></div><div class="cms-list">${cards || '<p class="cms-empty">No team profiles added.</p>'}</div></section>`;
}

function renderTestimonials() {
  const cards = draft.testimonials.map((item, index) => `<article class="cms-card">${cardHead('testimonials', index, item.name?.[0])}<div class="cms-grid">
    ${pairFields('Client name', 'testimonials', index, 'name', item.name, false)}
    ${pairFields('Role or organisation', 'testimonials', index, 'role', item.role, false)}
    ${pairFields('Quote', 'testimonials', index, 'quote', item.quote)}
    <label class="cms-check"><input type="checkbox" data-edit="testimonials" data-index="${index}" data-key="verified" ${item.verified ? 'checked' : ''}> Verified</label>
    <label class="cms-check"><input type="checkbox" data-edit="testimonials" data-index="${index}" data-key="permission" ${item.permission ? 'checked' : ''}> Client permission received</label>
  </div><p class="cms-help">Only testimonials marked verified and approved with permission appear on the website.</p></article>`).join('');
  return `<section class="cms-section"><div class="cms-section-heading"><div><p class="eyebrow">CLIENT FEEDBACK</p><h2>Testimonials</h2></div><button class="button secondary" type="button" data-add="testimonials">Add testimonial</button></div><div class="cms-list">${cards || '<p class="cms-empty">No testimonials added.</p>'}</div></section>`;
}

function renderBrand() {
  const brand = draft.brand;
  const colors = [['Primary color', 'primary', 'primaryBlue'], ['Accent color', 'accent', 'accentTurquoise'], ['Text color', 'ink', 'deepInk'], ['Background color', 'background', 'white']];
  return `<section class="cms-section"><div class="cms-section-heading"><div><p class="eyebrow">VISUAL IDENTITY</p><h2>Brand colors</h2></div></div><div class="cms-grid cms-brand-grid">${colors.map(([label, key, legacy]) => { const storedKey = brand[key] !== undefined ? key : legacy; return input(label, `data-brand="${storedKey}"`, brand[storedKey] || '#ffffff', 'color'); }).join('')}</div></section>`;
}

const views = { business: renderBusiness, services: renderServices, projects: renderProjects, articles: renderArticles, team: renderTeam, testimonials: renderTestimonials, brand: renderBrand };
function render() {
  editor.innerHTML = views[activeView]();
  document.querySelectorAll('[data-view]').forEach((button) => {
    const selected = button.dataset.view === activeView;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-current', selected ? 'page' : 'false');
  });
  const addButton = document.getElementById('admin-add-item');
  addButton.hidden = !['services', 'projects', 'articles', 'team', 'testimonials'].includes(activeView);
  addButton.textContent = `＋ Add ${activeView === 'team' ? 'team member' : activeView === 'testimonials' ? 'testimonial' : activeView.slice(0, -1)}`;
}

function addItem(collection) {
  const defaults = {
    services: { slug: 'new-service', en: 'New service', fa: 'خدمت جدید', intro: ['', ''], problem: ['', ''], deliverables: [[], []], availability: 'confirm', relatedProjects: [] },
    projects: { slug: 'new-project', title: 'New project', faTitle: 'پروژهٔ جدید', category: 'Web', faCategory: 'وب', color: '#273D8E', ink: '#17233F', tag: ['', ''], brief: ['', ''], approach: ['', ''], deliverables: ['', ''] },
    articles: { slug: 'new-article', category: ['', ''], title: ['', ''], summary: ['', ''], sections: [[], []] },
    team: { name: ['', ''], role: ['', ''], bio: ['', ''], portrait: '' },
    testimonials: { quote: ['', ''], name: ['', ''], role: ['', ''], verified: false, permission: false },
  };
  draft[collection].push(structuredClone(defaults[collection]));
  render();
  setStatus(`${collection.slice(0, -1)} added. Complete its fields before publishing.`);
}

function applyEdit(target) {
  if (target.dataset.business) {
    draft.business[target.dataset.business] = target.value;
  } else if (target.dataset.brand) {
    draft.brand[target.dataset.brand] = target.value;
  } else if (target.dataset.social !== undefined) {
    draft.business.socials[Number(target.dataset.social)][target.dataset.key] = target.value;
  } else if (target.dataset.articleSection !== undefined) {
    const article = draft.articles[Number(target.dataset.articleSection)];
    const language = Number(target.dataset.language);
    const sectionIndex = Number(target.dataset.sectionIndex);
    article.sections[language][sectionIndex] = article.sections[language][sectionIndex] || ['', ''];
    article.sections[language][sectionIndex][Number(target.dataset.part)] = target.value;
  } else if (target.dataset.edit) {
    const item = draft[target.dataset.edit][Number(target.dataset.index)];
    const key = target.dataset.key;
    if (target.dataset.locale !== undefined) {
      item[key] = item[key] || ['', ''];
      item[key][Number(target.dataset.locale)] = target.value;
    } else if (target.dataset.arrayLocale !== undefined) {
      item[key] = item[key] || [[], []];
      item[key][Number(target.dataset.arrayLocale)] = target.value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    } else if (target.dataset.csv) {
      item[key] = target.value.split(',').map((part) => part.trim()).filter(Boolean);
    } else if (target.type === 'checkbox') {
      item[key] = target.checked;
    } else {
      item[key] = target.value;
    }
  }
  setStatus('Unsaved changes. Publish changes when ready.', 'pending');
}

async function publish() {
  publishButton.disabled = true;
  publishButton.textContent = 'Publishing…';
  setStatus('Validating content and rebuilding the website…');
  try {
    const response = await fetch('/__admin/publish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Publishing failed.');
    setStatus(`${result.message} ${result.build || ''}`.trim(), 'success');
  } catch (error) {
    setStatus(error.message.includes('Failed to fetch') ? 'Publishing server is not running. Start it from the project folder with: python admin_server.py' : error.message, 'error');
  } finally {
    publishButton.disabled = false;
    publishButton.textContent = 'Publish changes';
  }
}

function saveDraft() {
  try {
    localStorage.setItem('nova-content-draft', JSON.stringify(draft));
    setStatus('Draft saved in this browser. Publish changes to update the website.');
  } catch {
    setStatus('Browser storage is full. Use Publish changes to save directly to the website.', 'error');
  }
}

function loadDraft() {
  try {
    const saved = localStorage.getItem('nova-content-draft');
    if (!saved) return setStatus('No saved draft found in this browser.');
    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.projects)) throw new Error('Invalid draft');
    draft = parsed;
    render();
    setStatus('Saved draft loaded.');
  } catch {
    setStatus('The saved draft could not be loaded.', 'error');
  }
}

function exportJson() {
  const blob = new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'content.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => {
  activeView = button.dataset.view;
  render();
}));
document.getElementById('admin-publish').addEventListener('click', publish);
document.getElementById('admin-save').addEventListener('click', saveDraft);
document.getElementById('admin-load').addEventListener('click', loadDraft);
document.getElementById('admin-export').addEventListener('click', exportJson);
document.getElementById('admin-reset').addEventListener('click', () => {
  if (!confirm('Discard current edits and reload the published content?')) return;
  draft = structuredClone(source);
  render();
  setStatus('Published content reloaded.');
});
document.getElementById('admin-add-item').addEventListener('click', () => addItem(activeView));
editor.addEventListener('input', (event) => {
  const target = event.target;
  if (target.matches('[data-business],[data-brand],[data-social],[data-edit],[data-article-section]')) applyEdit(target);
});
editor.addEventListener('change', (event) => {
  const target = event.target;
  if (target.matches('[data-business],[data-brand],[data-social],[data-edit],[data-article-section]')) applyEdit(target);
  if (!target.matches('[data-upload]')) return;
  const file = target.files?.[0];
  if (!file) return;
  if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) return setStatus('Choose a PNG, JPG, WebP or GIF image.', 'error');
  if (file.size > 8 * 1024 * 1024) return setStatus('Images must be 8 MB or smaller.', 'error');
  const reader = new FileReader();
  reader.onload = () => {
    const collection = target.dataset.upload;
    const item = draft[collection][Number(target.dataset.index)];
    item[collection === 'projects' ? 'image' : 'portrait'] = reader.result;
    const preview = target.closest('.cms-image-row').querySelector('.cms-preview');
    preview.src = reader.result;
    preview.hidden = false;
    setStatus('Image ready. Publish changes to apply it to the site.', 'pending');
  };
  reader.onerror = () => setStatus('The image could not be read.', 'error');
  reader.readAsDataURL(file);
});
editor.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.add) return addItem(button.dataset.add);
  if (button.dataset.addSocial !== undefined) {
    draft.business.socials.push({ label: '', url: '' });
    render();
    return setStatus('Social profile added.');
  }
  if (button.dataset.removeSocial !== undefined) {
    draft.business.socials.splice(Number(button.dataset.removeSocial), 1);
    render();
    return setStatus('Social profile removed.');
  }
  if (button.dataset.remove) {
    draft[button.dataset.remove].splice(Number(button.dataset.index), 1);
    render();
    return setStatus('Item removed. Publish changes to apply it to the site.');
  }
  if (button.dataset.clearImage !== undefined) {
    delete draft.projects[Number(button.dataset.clearImage)].image;
    render();
    return setStatus('Generated artwork will be used. Publish changes to apply it.');
  }
  if (button.dataset.addArticleSection !== undefined) {
    const article = draft.articles[Number(button.dataset.addArticleSection)];
    article.sections[0].push(['', '']);
    article.sections[1].push(['', '']);
    render();
    return setStatus('Article section added.');
  }
  if (button.dataset.removeArticleSection !== undefined) {
    const article = draft.articles[Number(button.dataset.removeArticleSection)];
    const index = Number(button.dataset.sectionIndex);
    article.sections.forEach((sections) => sections.splice(index, 1));
    render();
    return setStatus('Article section removed.');
  }
});

render();