// ===== Настройки =====
// SHA-256 от пароля (сам пароль в коде не хранится).
const PASSWORD_HASH = 'b94b85e44422d3e4a2b76bd65f3dec70b49b491a373f75698d83b7757bea435d';
const CLICKS_TO_OPEN = 5;
const CLICK_WINDOW_MS = 1500;

const COLORS = ['orange', 'blue', 'purple', 'yellow', 'lime', 'pink', 'mint', 'white'];
const TILTS = [-1.1, 0.9, -0.6, 1.1, -0.9, 0.6, -1.2, 0.8];

const SPIN_IDEAS = [
  'Сегодня на тебя упадёт рояль. Расстроенный.',
  'Через час тебе насрут под дверь. Вежливо, с запиской.',
  'Голубь запомнил твоё лицо. Он вернётся.',
  'Завтра ты найдёшь 5 рублей и потеряешь носок. Обмен честный.',
  'Твой холодильник что-то знает. Не открывай его после полуночи.',
  'Скоро ты наступишь на лего. Звук услышат соседи.',
  'Наггетс уже выехал. Не спрашивай куда.',
  'В ближайшую среду ты чихнёшь так, что поменяется погода.',
  'Кот соседа считает тебя своим.',
  'Сегодня ты скажешь «ну всё, последнее видео» и посмотришь ещё 40.',
  'Твой Wi-Fi отключится ровно в самый важный момент. Это судьба.',
  'Через 3 дня ты получишь сообщение «ты спишь?». Не отвечай.',
  'Чайник закипит, пока ты будешь смотреть. Это знак.',
  'Гусь. Просто гусь. Будь готов.',
  'Твоя бабушка опять скажет, что ты похудел.',
  'Сегодня ты споткнёшься на ровном месте. Место ни при чём.',
  'В твоём следующем бургере будет на одну котлету больше. Или меньше.',
  'Скоро ты проснёшься за 1 минуту до будильника и будешь зол.',
  'Ты станешь мемом. Не спрашивай каким.',
  'Луна сегодня смотрит на тебя с осуждением.',
  'В следующей катке в Roblox ты будешь нубом. Обидно, но так надо.',
  'Таракан из подъезда метит на твою комнату.',
  'Скоро кто-то назовёт тебя «братишка». Это начало дружбы.',
  'Сегодня ты откроешь шкаф, а оттуда выпадет всё.',
  'Твоя кнопка «Крутануть» уже устала. Крутани ещё.',
];

// Запасные данные, если links.json не загрузился (например, при открытии файла без сервера).
const DEFAULT_DATA = {
  updated: '2026-10-27T00:00:00.000Z',
  links: [
    { id: 'tiktok', title: 'TikTok', desc: 'Roblox-мемы и геймдев · 113K', url: 'https://www.tiktok.com/@zenixor', icon: 'tiktok', color: 'orange', badge: '' },
    { id: 'telegram', title: 'Telegram-канал', desc: 'Девлоги, новости и закулисье', url: 'https://t.me/zenixor', icon: 'telegram', color: 'blue', badge: '' },
    { id: 'chat', title: 'Убежище подписчиков', desc: 'Наш чат. Правила есть, скуки нет', url: 'https://t.me/zenixor_chat', icon: 'chat', color: 'purple', badge: '' },
    { id: 'youtube', title: 'YouTube', desc: 'Видео подлиннее и разборы', url: 'https://www.youtube.com/@zenixor', icon: 'youtube', color: 'yellow', badge: '' },
    { id: 'game', title: 'Riftbound', desc: 'RPG + Tower Defense. Да, с наггетсом', url: 'https://www.roblox.com/', icon: 'gamepad', color: 'lime', badge: 'игра' },
    { id: 'order', title: 'Заказать сайт или бота', desc: 'Фриланс: сайты, Telegram-боты, Roblox', url: 'https://t.me/zenixor', icon: 'code', color: 'pink', badge: '' },
  ],
};

const LS_DATA = 'zenixor_links';
const LS_GH = 'zenixor_github';
const SS_ADMIN = 'zenixor_admin';

// ===== Утилиты =====
const $ = (sel) => document.querySelector(sel);

const storage = {
  get(store, key) { try { return JSON.parse(store.getItem(key)); } catch { return null; } },
  set(store, key, val) { try { store.setItem(key, JSON.stringify(val)); } catch {} },
  del(store, key) { try { store.removeItem(key); } catch {} },
};

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function safeUrl(raw) {
  const url = String(raw || '').trim();
  if (!url) return '#';
  if (/^(https?:|mailto:|tel:|tg:)/i.test(url)) return url;
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return '#'; // javascript: и прочее — нельзя
  return 'https://' + url.replace(/^\/+/, '');
}

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-on'), 2600);
}

const ARROW = '<svg class="card__arrow" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';

// ===== Состояние =====
let data = { updated: null, links: [] };
let isAdmin = storage.get(sessionStorage, SS_ADMIN) === true;
let remoteUpdated = null;

async function loadData() {
  let remote = null;
  try {
    const res = await fetch('links.json?v=' + Date.now(), { cache: 'no-store' });
    if (res.ok) remote = await res.json();
  } catch {}
  if (!remote || !Array.isArray(remote.links)) remote = DEFAULT_DATA;
  remoteUpdated = remote.updated || null;

  // Локальные правки (есть только в браузере владельца) показываем, если они новее опубликованных.
  const local = storage.get(localStorage, LS_DATA);
  if (local && Array.isArray(local.links) && (!remote.updated || local.updated > remote.updated)) {
    data = local;
  } else {
    data = remote;
    storage.del(localStorage, LS_DATA);
  }
}

function saveLocal() {
  data.updated = new Date().toISOString();
  storage.set(localStorage, LS_DATA, data);
  updateUnsaved();
}

function updateUnsaved() {
  $('#unsaved').hidden = !(isAdmin && storage.get(localStorage, LS_DATA));
}

// ===== Рендер =====
function cardHtml(link, i, tag = 'a') {
  const tilt = TILTS[i % TILTS.length];
  const attrs = tag === 'a'
    ? `href="${esc(safeUrl(link.url))}" target="_blank" rel="noopener noreferrer"`
    : 'role="button" tabindex="0"';
  const color = COLORS.includes(link.color) ? link.color : 'lime';
  return `
    <${tag} class="card" ${attrs} data-id="${esc(link.id)}" style="--r:${tilt}deg; --i:${i}">
      <span class="card__icon color-${color}">${iconSvg(link.icon)}</span>
      <span class="card__body">
        <span class="card__title">${esc(link.title)}${link.badge ? `<span class="card__badge">${esc(link.badge)}</span>` : ''}</span>
        ${link.desc ? `<span class="card__desc">${esc(link.desc)}</span>` : ''}
      </span>
      ${ARROW}
    </${tag}>`;
}

function render() {
  const box = $('#links');
  document.body.classList.toggle('is-admin', isAdmin);
  $('#adminBar').hidden = !isAdmin;
  updateUnsaved();

  if (!isAdmin) {
    box.innerHTML = data.links.length
      ? data.links.map((l, i) => cardHtml(l, i)).join('')
      : '<div class="empty">Скоро тут будут ссылки</div>';
    return;
  }

  const last = data.links.length - 1;
  box.innerHTML = data.links.map((l, i) => `
    <div class="card-wrap" style="position:relative">
      ${cardHtml(l, i, 'div')}
      <div class="card__tools">
        <button class="tool" type="button" data-act="up" data-id="${esc(l.id)}" title="Выше" ${i === 0 ? 'disabled' : ''}>↑</button>
        <button class="tool" type="button" data-act="down" data-id="${esc(l.id)}" title="Ниже" ${i === last ? 'disabled' : ''}>↓</button>
        <button class="tool" type="button" data-act="edit" data-id="${esc(l.id)}" title="Изменить">✎</button>
        <button class="tool tool--del" type="button" data-act="del" data-id="${esc(l.id)}" title="Удалить">✕</button>
      </div>
    </div>`).join('') + `<button class="add-card" type="button" data-act="add">+ Добавить кнопку</button>`;
}

// ===== Действия в режиме редактора =====
function moveLink(id, dir) {
  const i = data.links.findIndex((l) => l.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= data.links.length) return;
  [data.links[i], data.links[j]] = [data.links[j], data.links[i]];
  saveLocal();
  render();
}

function deleteLink(id) {
  const link = data.links.find((l) => l.id === id);
  if (!link || !confirm(`Удалить кнопку «${link.title}»?`)) return false;
  data.links = data.links.filter((l) => l.id !== id);
  saveLocal();
  render();
  toast('Кнопка удалена');
  return true;
}

$('#links').addEventListener('click', (e) => {
  if (!isAdmin) return;
  const tool = e.target.closest('[data-act]');
  if (tool) {
    const { act, id } = tool.dataset;
    if (act === 'up') moveLink(id, -1);
    if (act === 'down') moveLink(id, 1);
    if (act === 'edit') openEditor(id);
    if (act === 'del') deleteLink(id);
    if (act === 'add') openEditor();
    return;
  }
  const card = e.target.closest('.card');
  if (card) openEditor(card.dataset.id);
});

$('#links').addEventListener('keydown', (e) => {
  if (isAdmin && e.key === 'Enter' && e.target.classList.contains('card')) openEditor(e.target.dataset.id);
});

// ===== Вход: 5 нажатий на Z =====
let clicks = 0;
let clickTimer;
$('#avatar').addEventListener('click', (e) => {
  const av = e.currentTarget;
  av.classList.remove('is-pop');
  void av.offsetWidth;
  av.classList.add('is-pop');

  clicks++;
  clearTimeout(clickTimer);
  clickTimer = setTimeout(() => { clicks = 0; }, CLICK_WINDOW_MS);
  if (clicks >= CLICKS_TO_OPEN) {
    clicks = 0;
    if (isAdmin) toast('Ты уже в режиме редактора');
    else openOverlay('#loginOverlay', '#loginInput');
  }
});

$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = $('#loginInput');
  if (!window.crypto?.subtle) {
    toast('Вход работает только по https:// или с localhost');
    return;
  }
  if (await sha256(input.value) === PASSWORD_HASH) {
    isAdmin = true;
    storage.set(sessionStorage, SS_ADMIN, true);
    closeOverlay('#loginOverlay');
    render();
    toast('Привет, Зениксор! Режим редактора включён');
  } else {
    const form = e.currentTarget;
    form.classList.remove('is-wrong');
    void form.offsetWidth;
    form.classList.add('is-wrong');
    input.select();
  }
});

$('#logoutBtn').addEventListener('click', () => {
  isAdmin = false;
  storage.del(sessionStorage, SS_ADMIN);
  render();
  toast('Вышел из редактора');
});

// ===== Оверлеи =====
function openOverlay(sel, focusSel) {
  const ov = $(sel);
  ov.hidden = false;
  document.body.style.overflow = 'hidden';
  if (focusSel) setTimeout(() => $(focusSel).focus(), 30);
}
function closeOverlay(sel) {
  $(sel).hidden = true;
  if (sel === '#loginOverlay') { $('#loginInput').value = ''; $('#loginForm').classList.remove('is-wrong'); }
  if (![...document.querySelectorAll('.overlay')].some((o) => !o.hidden)) document.body.style.overflow = '';
}
document.querySelectorAll('.overlay').forEach((ov) => {
  ov.addEventListener('mousedown', (e) => { if (e.target === ov) closeOverlay('#' + ov.id); });
  ov.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => closeOverlay('#' + ov.id)));
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const open = [...document.querySelectorAll('.overlay')].filter((o) => !o.hidden).pop();
  if (open) closeOverlay('#' + open.id);
});

// ===== Редактор кнопки =====
let editingId = null;
let draft = null;

function openEditor(id) {
  const existing = data.links.find((l) => l.id === id);
  editingId = existing ? existing.id : null;
  draft = existing
    ? { ...existing }
    : { id: '', title: '', desc: '', url: '', icon: 'link', color: COLORS[data.links.length % COLORS.length], badge: '' };

  $('#editorTitle').textContent = existing ? 'Изменить кнопку' : 'Новая кнопка';
  $('#deleteBtn').hidden = !existing;
  $('#fTitle').value = draft.title;
  $('#fDesc').value = draft.desc;
  $('#fUrl').value = draft.url;
  $('#fBadge').value = draft.badge;
  $('#iconSearch').value = '';
  renderSwatches();
  renderIconGrid();
  renderPreview();
  openOverlay('#editorOverlay', '#fTitle');
}

function renderPreview() {
  $('#preview').innerHTML = cardHtml({ ...draft, title: draft.title || 'Название кнопки', desc: draft.desc || 'Описание' }, 0, 'div');
}

function renderSwatches() {
  $('#swatches').innerHTML = COLORS.map((c) =>
    `<button type="button" class="swatch color-${c}" data-color="${c}" aria-label="${c}" aria-pressed="${c === draft.color}"></button>`
  ).join('');
}

function renderIconGrid() {
  const q = $('#iconSearch').value.trim().toLowerCase();
  const keys = Object.keys(ICONS).filter((k) => !q || k.includes(q) || ICONS[k].name.toLowerCase().includes(q));
  $('#iconGrid').innerHTML = keys.length
    ? keys.map((k) => `<button type="button" class="icon-opt" data-icon="${k}" title="${esc(ICONS[k].name)}" aria-label="${esc(ICONS[k].name)}" aria-pressed="${k === draft.icon}">${iconSvg(k)}</button>`).join('')
    : '<span class="hint">Ничего не нашлось</span>';
}

['fTitle', 'fDesc', 'fUrl', 'fBadge'].forEach((fid) => {
  const field = { fTitle: 'title', fDesc: 'desc', fUrl: 'url', fBadge: 'badge' }[fid];
  $('#' + fid).addEventListener('input', (e) => { draft[field] = e.target.value; renderPreview(); });
});
$('#iconSearch').addEventListener('input', renderIconGrid);
$('#swatches').addEventListener('click', (e) => {
  const b = e.target.closest('[data-color]');
  if (!b) return;
  draft.color = b.dataset.color;
  renderSwatches();
  renderPreview();
});
$('#iconGrid').addEventListener('click', (e) => {
  const b = e.target.closest('[data-icon]');
  if (!b) return;
  draft.icon = b.dataset.icon;
  $('#iconGrid').querySelectorAll('[aria-pressed="true"]').forEach((x) => x.setAttribute('aria-pressed', 'false'));
  b.setAttribute('aria-pressed', 'true');
  renderPreview();
});

$('#editorForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const link = {
    ...draft,
    title: draft.title.trim(),
    desc: draft.desc.trim(),
    url: safeUrl(draft.url),
    badge: draft.badge.trim(),
  };
  if (!link.title || link.url === '#') { toast('Нужны название и нормальная ссылка'); return; }

  if (editingId) {
    data.links = data.links.map((l) => (l.id === editingId ? link : l));
  } else {
    link.id = 'l' + Date.now().toString(36);
    data.links.push(link);
  }
  saveLocal();
  closeOverlay('#editorOverlay');
  render();
  toast(editingId ? 'Сохранено' : 'Кнопка добавлена');
});

$('#deleteBtn').addEventListener('click', () => {
  if (deleteLink(editingId)) closeOverlay('#editorOverlay');
});
$('#addBtn').addEventListener('click', () => openEditor());

// ===== Экспорт и публикация =====
function dataJson() {
  return JSON.stringify({ updated: data.updated || new Date().toISOString(), links: data.links }, null, 2) + '\n';
}

$('#exportBtn').addEventListener('click', () => {
  const blob = new Blob([dataJson()], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'links.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('links.json скачан — замени им файл на хостинге');
});

$('#publishBtn').addEventListener('click', () => {
  const gh = storage.get(localStorage, LS_GH);
  if (gh?.owner && gh?.repo && gh?.token) publishToGithub(gh);
  else openGhSettings(gh);
});

function openGhSettings(gh = {}) {
  $('#ghOwner').value = gh?.owner || '';
  $('#ghRepo').value = gh?.repo || '';
  $('#ghBranch').value = gh?.branch || 'main';
  $('#ghToken').value = gh?.token || '';
  openOverlay('#ghOverlay', '#ghOwner');
}

$('#ghForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const gh = {
    owner: $('#ghOwner').value.trim(),
    repo: $('#ghRepo').value.trim(),
    branch: $('#ghBranch').value.trim() || 'main',
    token: $('#ghToken').value.trim(),
  };
  storage.set(localStorage, LS_GH, gh);
  closeOverlay('#ghOverlay');
  publishToGithub(gh);
});

async function publishToGithub(gh) {
  const api = `https://api.github.com/repos/${encodeURIComponent(gh.owner)}/${encodeURIComponent(gh.repo)}/contents/links.json`;
  const headers = { Authorization: `Bearer ${gh.token}`, Accept: 'application/vnd.github+json' };
  const btn = $('#publishBtn');
  btn.disabled = true;
  btn.textContent = 'Публикую…';
  try {
    let sha;
    const cur = await fetch(`${api}?ref=${encodeURIComponent(gh.branch)}`, { headers, cache: 'no-store' });
    if (cur.ok) sha = (await cur.json()).sha;
    else if (cur.status !== 404) throw new Error(cur.status);

    const content = btoa(unescape(encodeURIComponent(dataJson())));
    const res = await fetch(api, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ message: 'Обновил ссылки', content, sha, branch: gh.branch }),
    });
    if (!res.ok) throw new Error(res.status);

    storage.del(localStorage, LS_DATA);
    remoteUpdated = data.updated;
    updateUnsaved();
    toast('Опубликовано! Сайт обновится через ~1 минуту');
  } catch (err) {
    const code = String(err.message);
    toast(code === '401' || code === '403' || code === '404'
      ? 'GitHub не пустил: проверь логин, репозиторий и токен'
      : 'Не получилось опубликовать (' + code + ')');
    openGhSettings(gh);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Опубликовать';
  }
}

// ===== «Что выкину следующим?» =====
let spinCount = 1;
let lastIdea = 0;
$('#spinBtn').addEventListener('click', () => {
  const btn = $('#spinBtn');
  const idea = $('#spinIdea');
  if (btn.classList.contains('is-rolling')) return;
  btn.classList.add('is-rolling');
  idea.classList.add('is-rolling');

  let ticks = 0;
  const timer = setInterval(() => {
    let next;
    do { next = Math.floor(Math.random() * SPIN_IDEAS.length); } while (next === lastIdea);
    lastIdea = next;
    idea.textContent = SPIN_IDEAS[next];
    if (++ticks >= 9) {
      clearInterval(timer);
      btn.classList.remove('is-rolling');
      idea.classList.remove('is-rolling');
      $('#spinTry').textContent = 'попытка #' + ++spinCount;
    }
  }, 80);
});

// ===== Старт =====
$('#spinDice').innerHTML = iconSvg('dice', 22);
$('#secretIcon').innerHTML = iconSvg('question', 26);
$('#searchIcon').innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>';
$('#year').textContent = new Date().getFullYear();

loadData().then(render);
