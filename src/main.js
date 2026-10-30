import './style.css';
import { exhibits, makeConcept } from './exhibits.js';
import { $, $$, esc, icon, refreshIcons, toast, modal, closeModal, scrollBehavior } from './lib/dom.js';
import { request, normalizeJob, isDone, isFailed, isActive, STATUS_LABEL, formatElapsed } from './lib/api.js';
import { thumbSvg } from './lib/thumbs.js';
import { readJSON, writeJSON } from './lib/storage.js';

const CATEGORIES = ['全部藏品', '生活小事', '时间与空间', '情绪与日常', '观众提案'];
const VOTE_LABELS = ['有点多余', '毫无用处', '无用之巅'];
const MAX_NEED = 300;

const state = {
  current: exhibits[0],
  filter: '全部藏品',
  query: '',
  mode: 'single',
  jobs: [],
  votes: readJSON('museum-votes', {}),
  thumbs: new Map(),
  pollTimer: 0,
  tickTimer: 0,
  scene: null,
};

/* ---------------------------------------------------------------- helpers */
const hashId = () => (location.hash.startsWith('#exhibit=') ? decodeURIComponent(location.hash.slice(9)) : null);
const findExhibit = id => exhibits.find(e => e.id === id || e.taskId === id);
const haystack = e => [e.name, e.en, e.question, e.desc, e.spec, e.category].join(' ').toLowerCase();
const visibleList = () => {
  const q = state.query.trim().toLowerCase();
  return exhibits.filter(e => (state.filter === '全部藏品' || e.category === state.filter) && (!q || haystack(e).includes(q)));
};

function saveVotes() {
  if (!writeJSON('museum-votes', state.votes)) toast('当前浏览器未允许保存，本次投票仅在本页保留。');
}

function setPressed(el, on) {
  el.classList.toggle('selected', on);
  el.setAttribute('aria-pressed', String(on));
}

/* ------------------------------------------------------------ exhibit info */
function votingMarkup(e, fresh = false) {
  const v = state.votes[e.id];
  return `<span id="vote-label">你觉得它有多没用？</span>
    <div role="group" aria-labelledby="vote-label">${VOTE_LABELS.map((t, i) => `<button type="button" data-vote="${i}" class="${v === i ? 'voted' : ''}${v === i && fresh ? ' just' : ''}" aria-pressed="${v === i}"><span>${t}</span> ${v === i ? icon('Check') : ''}</button>`).join('')}</div>
    <small>${v !== undefined ? '你的判断已记在本机访客簿中。' : '投一票，给无用一点肯定。'}</small>`;
}

function bindVoting(e) {
  $$('[data-vote]').forEach(b => {
    b.onclick = () => {
      state.votes[e.id] = Number(b.dataset.vote);
      saveVotes();
      $('#voting').innerHTML = votingMarkup(e, true);
      bindVoting(e);
      refreshIcons();
      $(`[data-vote="${b.dataset.vote}"]`).focus();
      toast('感谢你，为无用事业投出郑重的一票。');
    };
  });
}

function renderInfo() {
  const e = state.current;
  const real = Boolean(e.modelUrl);
  $('#exhibit-info').innerHTML = `
    <div class="info-top"><span class="tag ${real ? 'tag-live' : ''}">${esc(e.category)}</span><span>馆藏编号 ${esc(e.no)}</span></div>
    <p class="exhibit-en">${esc(e.en)}</p>
    <h2>${esc(e.name)}</h2>
    <blockquote>“${esc(e.question)}”</blockquote>
    <p class="exhibit-desc">${esc(e.desc)}</p>
    <dl class="specs">
      <div><dt>构成材料</dt><dd>${esc(e.spec)}</dd></div>
      <div><dt>资产来源</dt><dd>${real ? 'Aholo Lux3D 真实生成' : '程序化概念模型'}</dd></div>
      <div><dt>实用指数</dt><dd><span class="zero">0</span> / 100 <span class="tiny">经过非常不严谨的测定</span></dd></div>
    </dl>
    <button type="button" class="btn btn-fill trial" id="try">试用一下 ${icon('ArrowUpRight')}</button>
    <div class="voting" id="voting">${votingMarkup(e)}</div>
    <div class="info-actions"><button type="button" id="share">分享这件无用之物 ${icon('ArrowUpRight')}</button><button type="button" id="source">藏品档案 ${icon('Plus')}</button></div>`;
  $('#try').onclick = () => trial(e);
  $('#share').onclick = () => share(e);
  $('#source').onclick = () => showSource(e);
  bindVoting(e);
  refreshIcons();
}

function trial(e) {
  state.scene?.trial();
  modal(`<p class="eyebrow">PRODUCT TEST / 一本正经地试用</p><h2 id="dialog-title">${esc(e.name)}</h2>
    <div class="test-graphic">${icon('SlidersHorizontal')}<span>运行正常，解决率 0%</span></div>
    <p class="result">${esc(e.failure)}</p><blockquote>“${esc(e.review)}”</blockquote>
    <p class="muted">这段互动为艺术化模拟，不是对模型物理功能的测量。</p>
    <button type="button" class="btn btn-fill" id="close-test">问题还在，但我满意了 ${icon('Check')}</button>`);
  $('#close-test').onclick = closeModal;
}

function showSource(e) {
  modal(`<p class="eyebrow">COLLECTION ARCHIVE / 藏品档案</p><h2 id="dialog-title">${esc(e.name)}</h2>
    <p>${e.modelUrl ? '此展品展示 Aholo Lux3D 真实生成的三维资产。' : '此展品当前为 Three.js 构建的交互概念装置，不计作 Lux3D 生成成果。'}</p>
    <dl class="archive-details"><dt>创作需求</dt><dd>${esc(e.question)}</dd><dt>资产来源</dt><dd>${e.modelUrl ? 'Aholo Lux3D / ' + esc(e.taskId || e.id) : '程序化概念原型'}</dd><dt>生成提示词</dt><dd>${esc(e.prompt || e.question)}</dd></dl>
    ${e.modelUrl ? `<a class="btn btn-fill" href="${esc(e.modelUrl)}" download>下载生成模型 ${icon('ArrowUpRight')}</a>` : '<p class="muted">在下方输入需求可提交真实生成，生成成功后进入共创档案。</p>'}`);
}

async function share(e) {
  const url = new URL(location.href);
  url.hash = 'exhibit=' + encodeURIComponent(e.id);
  const text = `无用需求博物馆 · ${e.name}\n${e.question}\n实用指数：0/100。认真程度：100/100。`;
  if (navigator.share) {
    try { await navigator.share({ title: e.name, text, url: url.href }); return; } catch (err) { if (err.name === 'AbortError') return; }
  }
  try {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    toast('展签和链接已复制，可以分享给同样无聊的朋友。');
  } catch {
    modal(`<h2 id="dialog-title">分享这件无用之物</h2><textarea readonly rows="6" aria-label="分享文案">${esc(text + '\n' + url)}</textarea>`);
    $('#dialog textarea').select();
  }
}

/* ------------------------------------------------------------------ shelf */
function renderFilters() {
  const present = new Set(exhibits.map(e => e.category));
  $('#filters').innerHTML = CATEGORIES.filter(c => c === '全部藏品' || present.has(c))
    .map(c => `<button type="button" data-filter="${c}" class="${state.filter === c ? 'selected' : ''}" aria-pressed="${state.filter === c}">${c}</button>`).join('');
  $$('[data-filter]').forEach(b => {
    b.onclick = () => { state.filter = b.dataset.filter; renderFilters(); renderShelf(); updatePeek(); };
  });
}

function cardImage(e) {
  const snap = state.thumbs.get(e.id);
  return snap ? `<img src="${snap}" alt="" loading="lazy" decoding="async">` : thumbSvg(e.kind);
}

function renderShelf() {
  const list = visibleList();
  $('#shelf-count').textContent = list.length + ' 件无用之物';
  $('#shelf-empty').hidden = list.length > 0;
  $('#nav-count').textContent = String(exhibits.length).padStart(2, '0');
  $('#shelf').innerHTML = list.map(e => {
    const on = state.current.id === e.id;
    return `<button type="button" class="exhibit-card ${on ? 'selected' : ''}" style="--i:${list.indexOf(e)}" data-id="${esc(e.id)}" aria-pressed="${on}" aria-label="${esc(e.name)}，${e.modelUrl ? 'Lux3D 生成' : '概念装置'}">
      <div class="card-image" style="--wash:${e.color}33"><span class="card-no">${esc(e.no)}</span>${cardImage(e)}<span class="card-arrow">${icon('ArrowUpRight')}</span></div>
      <div class="card-bottom"><span>${esc(e.name)}</span><small class="${e.modelUrl ? 'live' : ''}">${e.modelUrl ? 'LUX3D 生成' : '概念装置'}</small></div></button>`;
  }).join('');
  $$('[data-id]').forEach(b => { b.onclick = () => choose(findExhibit(b.dataset.id)); });
  refreshIcons();
}

function updatePeek() {
  const list = visibleList(), i = list.findIndex(e => e.id === state.current.id);
  const set = (id, e, dir) => {
    const el = $(id);
    el.hidden = !e;
    if (!e) return;
    el.innerHTML = `<span class="peek-thumb">${cardImage(e)}</span><span class="peek-text"><small>${dir} · ${esc(e.no)}</small><b>${esc(e.name)}</b></span>`;
  };
  const many = list.length > 1 && i >= 0;
  set('#peek-prev', many ? list[(i - 1 + list.length) % list.length] : null, 'PREV');
  set('#peek-next', many ? list[(i + 1) % list.length] : null, 'NEXT');
}

function step(delta) {
  if (state.mode === 'gallery') {
    const row = state.scene?.walk(delta);
    if (row !== undefined) $('#stage-number').textContent = 'GALLERY / ' + String(row + 1).padStart(2, '0');
    return;
  }
  const list = visibleList();
  if (!list.length) return;
  const i = list.findIndex(e => e.id === state.current.id);
  choose(list[(i + delta + list.length) % list.length]);
}

/* -------------------------------------------------------------- navigation */
function choose(e, { updateHash = true } = {}) {
  if (!e) return;
  state.current = e;
  state.mode = 'single';
  $('#stage-number').textContent = 'NO. ' + e.no;
  setPressed($('#single-view'), true);
  setPressed($('#gallery-view'), false);
  $('.stage').dataset.mode = 'single';
  const swap = () => { state.scene?.show(e); renderInfo(); renderShelf(); updatePeek(); };
  if (!state.booted || matchMedia('(prefers-reduced-motion: reduce)').matches) swap();
  else {
    const c = $('#stage-curtain');
    c.classList.remove('wipe'); void c.offsetWidth; c.classList.add('wipe');
    setTimeout(swap, 380);
  }
  if (updateHash) history.replaceState(null, '', '#exhibit=' + encodeURIComponent(e.id));
}

function enterGallery() {
  state.mode = 'gallery';
  state.scene?.gallery(exhibits.slice(0, 6));
  $('#stage-number').textContent = 'GALLERY / 01';
  $('.stage').dataset.mode = 'gallery';
  setPressed($('#single-view'), false);
  setPressed($('#gallery-view'), true);
}

/* ------------------------------------------------------------ loading bar */
function setProgress(p) {
  const loader = $('#stage-loader');
  $('.stage').classList.toggle('loading', !(p === 1 || p === undefined));
  if (p === 1 || p === undefined) { loader.hidden = true; return; }
  loader.hidden = false;
  loader.classList.toggle('indeterminate', p === null);
  $('#stage-loader-fill').style.width = p === null ? '' : Math.round(p * 100) + '%';
}

/* -------------------------------------------------------------- generation */
function applyJobs() {
  let refreshCurrent = false;
  for (const j of state.jobs) {
    if (!j.modelUrl || !isDone(j)) continue;
    let e = exhibits.find(x => x.taskId === j.id);
    if (e) { e.modelUrl = j.modelUrl; continue; }
    const text = j.prompt || '';
    const preset = exhibits.find(x => x.question === j.question) || (/shadow length regulator|影子限长/.test(text) ? exhibits[0] : null);
    if (preset && !preset.taskId) {
      Object.assign(preset, { taskId: j.id, modelUrl: j.modelUrl, prompt: j.prompt });
      if (state.current.id === preset.id) refreshCurrent = true;
    } else {
      e = makeConcept(j.question || j.prompt);
      Object.assign(e, { id: j.id, no: String(exhibits.length + 1).padStart(3, '0'), name: j.title || '观众的无用发明', taskId: j.id, modelUrl: j.modelUrl, prompt: j.prompt });
      exhibits.push(e);
    }
  }
  renderFilters();
  renderShelf();
  if (refreshCurrent) choose(state.current, { updateHash: false });
  const linked = hashId();
  if (linked && state.current.id !== linked && findExhibit(linked)) choose(findExhibit(linked), { updateHash: false });
  renderJobs();
}

function jobMarkup(j) {
  const status = STATUS_LABEL[j.status] || j.status;
  const active = isActive(j);
  const action = j.modelUrl
    ? `<button type="button" class="btn btn-outline" data-job="${esc(j.id)}">查看生成展品 ${icon('ArrowUpRight')}</button>`
    : active ? `<span class="job-wait"><i class="spinner" aria-hidden="true"></i><span data-elapsed="${esc(j.createdAt || '')}">${j.createdAt ? formatElapsed(j.createdAt) : ''}</span></span>`
      : `<span class="job-wait">${isFailed(j) ? '生成未完成' : '处理中'}</span>`;
  return `<div class="job"><div><span class="pill ${esc(j.status)}">${esc(status)}</span><small> · LUX3D</small><p>${esc(j.title ? j.title + ' · ' : '')}${esc(j.question || j.prompt)}</p><code>${esc(j.id)}</code>${j.error ? `<p class="error">${esc(j.error?.message || j.error)}</p>` : ''}</div>${action}</div>`;
}

function renderJobs() {
  $('#archive').hidden = state.jobs.length === 0;
  $('#jobs').innerHTML = state.jobs.map(jobMarkup).join('');
  $$('[data-job]').forEach(b => {
    b.onclick = () => { choose(findExhibit(b.dataset.job)); $('#collection').scrollIntoView({ behavior: scrollBehavior() }); };
  });
  clearInterval(state.tickTimer);
  if (state.jobs.some(isActive)) {
    state.tickTimer = setInterval(() => {
      $$('[data-elapsed]').forEach(el => { if (el.dataset.elapsed) el.textContent = formatElapsed(el.dataset.elapsed); });
    }, 1000);
  }
  refreshIcons();
}

function schedulePoll() {
  clearTimeout(state.pollTimer);
  if (state.jobs.some(isActive)) state.pollTimer = setTimeout(pollJobs, 7000);
}

async function pollJobs() {
  if (document.hidden) { schedulePoll(); return; }
  for (const job of state.jobs.filter(isActive)) {
    try {
      Object.assign(job, normalizeJob(await request('/api/generations/' + encodeURIComponent(job.id))));
    } catch (e) {
      $('#generation-status').textContent = '查询任务暂时失败：' + e.message + '。稍后自动重试。';
    }
  }
  applyJobs();
  schedulePoll();
}

async function loadJobs() {
  try {
    const body = await request('/api/generations');
    state.jobs = (Array.isArray(body) ? body : body.generations || body.jobs || []).map(normalizeJob);
    applyJobs();
  } catch { /* archive stays hidden when service is offline */ }
  schedulePoll();
}

function bindForm() {
  const need = $('#need');
  const update = () => { $('#chars').textContent = need.value.length + ' / ' + MAX_NEED; need.removeAttribute('aria-invalid'); };
  need.oninput = update;
  $('#inspire').onclick = () => {
    const pool = exhibits.slice(0, 6).filter(e => e.question !== need.value);
    need.value = pool[Math.floor(Math.random() * pool.length)].question;
    update();
  };
  need.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') $('#generate-form').requestSubmit(); });

  $('#generate-form').onsubmit = async ev => {
    ev.preventDefault();
    const prompt = need.value.trim();
    const status = $('#generation-status');
    if (prompt.length < 6) {
      need.setAttribute('aria-invalid', 'true');
      status.textContent = '请至少写 6 个字，让我们认真理解你的问题。';
      need.focus();
      return;
    }
    const btn = $('#generate-button');
    btn.disabled = true;
    btn.innerHTML = '正在提交真实生成任务… <i class="spinner" aria-hidden="true"></i>';
    status.textContent = '正在把问题交给 Lux3D，生成通常需要数分钟。';
    try {
      const job = normalizeJob(await request('/api/generations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) }));
      state.jobs.unshift(job);
      applyJobs();
      schedulePoll();
      status.textContent = '任务已提交，编号：' + job.id + '。可继续逛展，刷新后可恢复任务。';
      toast('无用发明已立项。请允许精密的荒唐花一点时间。');
    } catch (e) {
      status.textContent = '生成未提交：' + e.message;
    } finally {
      btn.disabled = false;
      btn.innerHTML = '为它造一件发明 ' + icon('ArrowUpRight');
      refreshIcons();
    }
  };
}

async function checkHealth() {
  const label = $('#api-state'), dot = $('#api-dot');
  try {
    const h = await request('/api/health');
    const ok = h.configured || h.lux3dConfigured || h.hasApiKey;
    label.textContent = ok ? 'Lux3D 已连接配置 · 提交会消耗账号生成额度' : 'Lux3D 未配置 · 请在服务端设置 API 凭据';
    dot.className = 'api-dot ' + (ok ? 'ok' : 'warn');
  } catch {
    label.textContent = '生成服务尚未启动 · 展厅与概念互动仍可浏览';
    dot.className = 'api-dot off';
  }
}

/* ------------------------------------------------------------------- about */
const about = () => modal(`<p class="eyebrow">ABOUT THE MUSEUM</p><h2 id="dialog-title">无用，是一种认真的创作。</h2>
  <p>这里收藏那些为微不足道的困扰而诞生的郑重发明。我们邀请每个人贡献需求，用 Aholo Lux3D 将它变成可浏览的三维作品。</p>
  <p>点击展品，旋转欣赏，试用它的荒唐功能，再投票决定它有多没用。所有试用均为叙事互动。</p>
  <p>预设六件装置使用程序化概念模型；只有带「Lux3D 生成」标记的模型才来自真实 API 任务。投票只存于本机，不展示虚构的全网热度。</p>
  <a href="https://www.aholo3d.cn/hackathon" target="_blank" rel="noopener noreferrer">查看 Aholo 黑客松官网 ↗</a>`);

/* -------------------------------------------------------------------- init */
function bindSearch() {
  let t = 0;
  $('#search').addEventListener('input', ev => {
    clearTimeout(t);
    t = setTimeout(() => { state.query = ev.target.value; renderShelf(); updatePeek(); }, 120);
  });
}

function bindRail() {
  const links = $$('[data-rail]');
  const targets = { top: $('.intro'), collection: $('#collection'), donation: $('#donation') };
  const io = new IntersectionObserver(entries => {
    for (const en of entries) if (en.isIntersecting) {
      const key = Object.keys(targets).find(k => targets[k] === en.target);
      links.forEach(a => a.classList.toggle('on', a.dataset.rail === key));
    }
  }, { rootMargin: '-40% 0px -50% 0px' });
  Object.values(targets).forEach(el => el && io.observe(el));
}

function showKeyHint() {
  const el = $('#key-hint');
  if (!el || readJSON('museum-hint-seen', false)) { el?.remove(); return; }
  const io = new IntersectionObserver(([en]) => {
    if (!en.isIntersecting) return;
    io.disconnect();
    setTimeout(() => el.classList.add('show'), 700);
    setTimeout(() => { el.classList.remove('show'); writeJSON('museum-hint-seen', true); }, 6200);
  }, { threshold: .6 });
  io.observe($('.stage'));
}

function bindChrome() {
  $('#single-view').onclick = () => choose(state.current);
  $('#gallery-view').onclick = enterGallery;
  $('#rotate-left').onclick = () => state.scene?.rotate(-1);
  $('#rotate-right').onclick = () => state.scene?.rotate(1);
  $('#zoom-in').onclick = () => state.scene?.zoom(.85);
  $('#zoom-out').onclick = () => state.scene?.zoom(1.15);
  $('#auto-rotate').onclick = () => {
    if (!state.scene) return;
    state.scene.auto = !state.scene.auto;
    $('#auto-rotate').setAttribute('aria-pressed', String(state.scene.auto));
  };
  $('#peek-prev').onclick = () => step(-1);
  $('#peek-next').onclick = () => step(1);
  $('#prev-exhibit').onclick = () => step(-1);
  $('#next-exhibit').onclick = () => step(1);
  $('#submit-top').onclick = () => {
    $('#donation').scrollIntoView({ behavior: scrollBehavior() });
    $('#need').focus({ preventScroll: true });
  };
  $('#about').onclick = about;
  $('#provenance').onclick = about;

  const dialog = $('#dialog');
  $('#dialog .dialog-close').onclick = closeModal;
  dialog.addEventListener('click', ev => {
    if (ev.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom) dialog.close();
  });

  // Left/right arrows browse the shelf unless the user is typing or driving the 3D canvas.
  document.addEventListener('keydown', ev => {
    if (ev.altKey || ev.ctrlKey || ev.metaKey || $('#dialog').open) return;
    const t = ev.target;
    if (t.closest?.('input,textarea,select,canvas,[contenteditable]')) return;
    if (ev.key === '[' ) step(-1);
    if (ev.key === ']') step(1);
  });
  window.addEventListener('hashchange', () => { const id = hashId(); if (id && findExhibit(id) && id !== state.current.id) choose(findExhibit(id), { updateHash: false }); });
}

function revealOnScroll() {
  const items = $$('[data-reveal]');
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(entries => {
    for (const en of entries) if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }, { threshold: .12 });
  items.forEach(el => { el.classList.add('reveal'); io.observe(el); });
}

function scrollEffects() {
  const bar = $('#scroll-progress'), header = $('.header');
  let ticking = false;
  const update = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(scrollY / max, 1) : 0})`;
    header.classList.toggle('scrolled', scrollY > 40);
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
}

function parallax() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  const hero = $('.intro-content'), stamp = $('.stamp'), ring = $('.donation');
  let ticking = false;
  const update = () => {
    ticking = false;
    const y = scrollY;
    if (hero && y < innerHeight) hero.style.transform = `translateY(${y * .12}px)`;
    if (stamp && y < innerHeight) stamp.style.translate = `0 ${y * -.08}px`;
    if (ring) {
      const r = ring.getBoundingClientRect();
      ring.style.setProperty('--ring', `${(innerHeight - r.top) * .06}deg`);
    }
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
}

function init() {
  scrollEffects();
  parallax();
  bindChrome();
  bindSearch();
  bindRail();
  showKeyHint();
  bindForm();
  renderFilters();
  // Three.js is ~470KB: load it after first paint so text, fonts and motion appear immediately.
  setProgress(null);
  import('./scene.js').then(({ MuseumScene }) => {
    state.scene = new MuseumScene($('#scene'), {
      onStatus: text => { $('#asset-status').textContent = text; },
      onProgress: setProgress,
      onPick: i => choose(exhibits[i]),
      onSnapshot: (exhibit, url) => { state.thumbs.set(exhibit.id, url); renderShelf(); updatePeek(); },
    });
    if (state.mode === 'gallery') enterGallery(); else state.scene.show(state.current);
  }).catch(() => {
    setProgress(1);
    $('#asset-status').textContent = '3D 模块加载失败，请刷新重试';
  });
  const start = findExhibit(hashId()) || state.current;
  choose(start, { updateHash: false });
  state.booted = true;
  setTimeout(() => $('#preloader')?.classList.add('done'), 700);
  setTimeout(() => $('#preloader')?.remove(), 1700);
  revealOnScroll();
  refreshIcons();
  checkHealth();
  loadJobs();
  document.addEventListener('visibilitychange', () => { if (!document.hidden && state.jobs.some(isActive)) pollJobs(); });
  window.addEventListener('pagehide', () => { clearTimeout(state.pollTimer); clearInterval(state.tickTimer); state.scene?.dispose(); });
}

init();
