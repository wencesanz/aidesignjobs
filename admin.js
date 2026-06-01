// ── AIDJ ADMIN ─────────────────────────────────────────────────────────
// Manages JOBS + COMPANIES locally. Import from index.html, export ready-to-paste JSON.

const LS_JOBS = 'aidj-admin-jobs';
const LS_COS  = 'aidj-admin-cos';

const CATS = [
  {v:'product',  l:'Product Design'},
  {v:'brand',    l:'Brand'},
  {v:'ux',       l:'UX / UI'},
  {v:'designeng',l:'Design Eng.'},
  {v:'eng',      l:'Design Eng.'},
  {v:'motion',   l:'Motion'},
  {v:'content',  l:'Content Design'},
];
const REGIONS = [
  {v:'us', l:'US'},
  {v:'eu', l:'Europe'},
  {v:'uk', l:'UK'},
  {v:'asia', l:'Asia'},
  {v:'remote', l:'Remote'},
];
const MODES = [
  {v:'remote', l:'Remote'},
  {v:'hybrid', l:'Hybrid'},
  {v:'onsite', l:'On-site'},
];
const LVLS = [
  {v:'mid', l:'Mid'},
  {v:'senior', l:'Senior'},
  {v:'lead', l:'Lead / Staff'},
];
const STAGES = [
  {v:'foundation', l:'Foundation lab'},
  {v:'public', l:'Public AI'},
  {v:'unicorn', l:'Unicorn'},
  {v:'startup', l:'Startup'},
];

// ── STATE ──────────────────────────────────────────────────────────────
let jobs = [];
let cos  = [];
let editing = null;        // { kind: 'job'|'co', data, isNew }
let currentTab = 'jobs';
let searchQ = { jobs: '', cos: '' };

// ── PERSIST ────────────────────────────────────────────────────────────
function saveLS() {
  try {
    localStorage.setItem(LS_JOBS, JSON.stringify(jobs));
    localStorage.setItem(LS_COS, JSON.stringify(cos));
  } catch (e) { console.warn('LS save fail', e); }
}
function loadLS() {
  try {
    const j = localStorage.getItem(LS_JOBS);
    const c = localStorage.getItem(LS_COS);
    if (j) jobs = JSON.parse(j);
    if (c) cos  = JSON.parse(c);
  } catch (e) { console.warn('LS load fail', e); }
}

// ── LOAD FROM index.html ───────────────────────────────────────────────
async function loadFromSite() {
  try {
    const res = await fetch('index.html');
    const txt = await res.text();
    // extract JOBS array
    const jStart = txt.indexOf('const JOBS = [');
    const cStart = txt.indexOf('const COMPANIES = [');
    if (jStart < 0 || cStart < 0) throw new Error('Could not locate arrays in index.html');

    // Use Function constructor to safely eval the arrays
    const jSlice = extractArray(txt, jStart);
    const cSlice = extractArray(txt, cStart);
    jobs = (new Function('return ' + jSlice))();
    cos  = (new Function('return ' + cSlice))();
    saveLS();
    render();
    toast(`Loaded ${jobs.length} jobs · ${cos.length} companies from site`, 'success');
  } catch (err) {
    console.error(err);
    toast('Failed to load: ' + err.message, 'danger');
  }
}
function extractArray(txt, startIdx) {
  // find first '[' after startIdx, then balance brackets
  const open = txt.indexOf('[', startIdx);
  let depth = 0, i = open;
  while (i < txt.length) {
    const ch = txt[i];
    if (ch === '[') depth++;
    else if (ch === ']') { depth--; if (depth === 0) return txt.slice(open, i+1); }
    i++;
  }
  throw new Error('Unbalanced brackets');
}

// ── RENDER ─────────────────────────────────────────────────────────────
function render() {
  renderJobs();
  renderCos();
  document.getElementById('meta-info').textContent =
    `${jobs.length} jobs · ${cos.length} companies · last edit ${new Date().toLocaleTimeString()}`;
}

function renderJobs() {
  const q = searchQ.jobs.toLowerCase();
  const filtered = jobs.filter(j => !q ||
    (j.title || '').toLowerCase().includes(q) ||
    (j.co || '').toLowerCase().includes(q) ||
    (j.city || '').toLowerCase().includes(q)
  );
  document.getElementById('count-jobs').textContent = `${filtered.length} / ${jobs.length}`;

  const el = document.getElementById('list-jobs');
  if (!filtered.length) {
    el.innerHTML = `<div class="list-row" style="padding:40px;justify-content:center;color:var(--ink-3)">${jobs.length === 0 ? 'No jobs yet. Click "Load from site" or "+ New job".' : 'No matches.'}</div>`;
    return;
  }
  el.innerHTML = `
    <div class="list-row header">
      <div>ID</div>
      <div>Role</div>
      <div class="col-cat">Category</div>
      <div class="col-region">Location</div>
      <div class="col-mode">Mode</div>
      <div class="col-lvl">Level</div>
      <div></div>
    </div>` +
    filtered.map(j => `
      <div class="list-row" data-id="${j.id}">
        <div class="row-id">#${j.id}</div>
        <div>
          <div class="row-title">${escapeHtml(j.title)}</div>
          <div class="row-meta">${escapeHtml(j.co)} ${j.nw ? ' · <span style="color:var(--accent)">new</span>' : ''}</div>
        </div>
        <div class="col-cat"><span class="pill">${escapeHtml(j.catL || j.cat)}</span></div>
        <div class="col-region row-co">${escapeHtml(j.city || '')}</div>
        <div class="col-mode"><span class="pill ${j.mode === 'remote' ? 'green' : ''}">${escapeHtml(j.mode || '')}</span></div>
        <div class="col-lvl row-co">${escapeHtml(j.lvl || '')}</div>
        <div class="row-actions">
          <button class="btn btn-sm" type="button" onclick="editJob(${j.id})">Edit</button>
        </div>
      </div>`).join('');
}

function renderCos() {
  const q = searchQ.cos.toLowerCase();
  const filtered = cos.filter(c => !q || (c.name || '').toLowerCase().includes(q));
  document.getElementById('count-cos').textContent = `${filtered.length} / ${cos.length}`;

  const el = document.getElementById('list-cos');
  if (!filtered.length) {
    el.innerHTML = `<div class="list-row" style="padding:40px;justify-content:center;color:var(--ink-3)">${cos.length === 0 ? 'No companies yet.' : 'No matches.'}</div>`;
    return;
  }
  el.innerHTML = `
    <div class="list-row header" style="grid-template-columns:1fr 140px 100px 100px 100px 100px">
      <div>Name</div>
      <div>Stage</div>
      <div>Forbes 50</div>
      <div>TIME100</div>
      <div>Prosumer</div>
      <div></div>
    </div>` +
    filtered.map(c => `
      <div class="list-row" style="grid-template-columns:1fr 140px 100px 100px 100px 100px" data-name="${escapeAttr(c.name)}">
        <div class="row-title">${escapeHtml(c.name)}</div>
        <div><span class="pill">${escapeHtml(c.stage || '')}</span></div>
        <div>${c.f50 ? '<span class="pill blue">✓</span>' : ''}</div>
        <div>${c.t100 ? '<span class="pill blue">✓</span>' : ''}</div>
        <div>${c.prosumer ? '<span class="pill blue">✓</span>' : ''}</div>
        <div class="row-actions">
          <button class="btn btn-sm" type="button" onclick="editCo('${escapeAttr(c.name)}')">Edit</button>
        </div>
      </div>`).join('');
}

// ── EDITOR ─────────────────────────────────────────────────────────────
window.editJob = function(id) {
  const j = jobs.find(x => x.id === id);
  if (!j) return;
  openJobEditor({ ...j }, false);
};

function openJobEditor(data, isNew) {
  editing = { kind:'job', data, isNew };
  document.getElementById('ed-title').textContent = isNew ? 'New job' : `Edit #${data.id} · ${data.title || ''}`;
  document.getElementById('ed-delete').style.display = isNew ? 'none' : '';
  document.getElementById('ed-body').innerHTML = `
    <div class="field"><label>Title *</label><input id="f-title" value="${escapeAttr(data.title)}"></div>
    <div class="field"><label>Company *</label><input id="f-co" list="co-list" value="${escapeAttr(data.co)}"></div>
    <datalist id="co-list">${cos.map(c => `<option value="${escapeAttr(c.name)}">`).join('')}</datalist>
    <div class="field-row">
      <div class="field"><label>Category</label>${selectHtml('f-cat', CATS, data.cat || 'product')}</div>
      <div class="field"><label>Category label</label><input id="f-catL" value="${escapeAttr(data.catL || 'Product Design')}"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>City</label><input id="f-city" value="${escapeAttr(data.city)}"></div>
      <div class="field"><label>Region</label>${selectHtml('f-region', REGIONS, data.region || 'us')}</div>
    </div>
    <div class="field-row">
      <div class="field"><label>Mode</label>${selectHtml('f-mode', MODES, data.mode || 'hybrid')}</div>
      <div class="field"><label>Level</label>${selectHtml('f-lvl', LVLS, data.lvl || 'mid')}</div>
    </div>
    <div class="field-row">
      <div class="field"><label>Salary min (number, 0 = undisclosed)</label><input id="f-salary" type="number" value="${data.salary || 0}"></div>
      <div class="field"><label>Salary label</label><input id="f-salL" value="${escapeAttr(data.salL || 'Undisclosed')}"></div>
    </div>
    <div class="field"><label>Application URL *</label><input id="f-url" type="url" value="${escapeAttr(data.url)}"></div>
    <div class="field"><label>Posted date label</label><input id="f-date" value="${escapeAttr(data.date || 'Active')}"></div>
    <div class="field">
      <label>Flags</label>
      <div class="checks">
        <label><input type="checkbox" id="f-nw"  ${data.nw  ? 'checked' : ''}> New this week</label>
        <label><input type="checkbox" id="f-f50" ${data.f50 ? 'checked' : ''}> Forbes AI 50</label>
        <label><input type="checkbox" id="f-t100"${data.t100? 'checked' : ''}> TIME100 AI</label>
      </div>
    </div>
  `;
  document.getElementById('ed-bg').classList.add('on');
  document.getElementById('ed').classList.add('on');
}

window.editCo = function(nameAttr) {
  const c = cos.find(x => x.name === nameAttr);
  if (!c) return;
  openCoEditor({ ...c }, false);
};

function openCoEditor(data, isNew) {
  editing = { kind:'co', data, isNew, originalName: data.name };
  document.getElementById('ed-title').textContent = isNew ? 'New company' : `Edit · ${data.name}`;
  document.getElementById('ed-delete').style.display = isNew ? 'none' : '';
  document.getElementById('ed-body').innerHTML = `
    <div class="field"><label>Name *</label><input id="f-name" value="${escapeAttr(data.name)}"></div>
    <div class="field"><label>Stage</label>${selectHtml('f-stage', STAGES, data.stage || 'startup')}</div>
    <div class="field">
      <label>Lists</label>
      <div class="checks">
        <label><input type="checkbox" id="f-f50"  ${data.f50  ? 'checked' : ''}> Forbes AI 50</label>
        <label><input type="checkbox" id="f-t100" ${data.t100 ? 'checked' : ''}> TIME100 AI</label>
        <label><input type="checkbox" id="f-pros" ${data.prosumer ? 'checked' : ''}> Prosumer AI 40</label>
        <label><input type="checkbox" id="f-se"   ${data.se50 ? 'checked' : ''}> Scaling Europe 50</label>
      </div>
    </div>
  `;
  document.getElementById('ed-bg').classList.add('on');
  document.getElementById('ed').classList.add('on');
}

function selectHtml(id, options, selected) {
  return `<select id="${id}">${options.map(o => `<option value="${o.v}" ${o.v === selected ? 'selected' : ''}>${o.l}</option>`).join('')}</select>`;
}

function closeEditor() {
  document.getElementById('ed-bg').classList.remove('on');
  document.getElementById('ed').classList.remove('on');
  editing = null;
}

function saveEditor() {
  if (!editing) return;
  if (editing.kind === 'job') {
    const d = editing.data;
    const updated = {
      id: d.id || nextJobId(),
      title: val('f-title'),
      co:    val('f-co'),
      cat:   val('f-cat'),
      catL:  val('f-catL'),
      region:val('f-region'),
      city:  val('f-city'),
      mode:  val('f-mode'),
      lvl:   val('f-lvl'),
      salary:Number(val('f-salary')) || 0,
      salL:  val('f-salL'),
      f50:   chk('f-f50'),
      t100:  chk('f-t100'),
      nw:    chk('f-nw'),
      date:  val('f-date') || 'Active',
      url:   val('f-url'),
    };
    if (!updated.title || !updated.co || !updated.url) {
      toast('Title, company and URL are required', 'danger'); return;
    }
    if (editing.isNew) jobs.push(updated);
    else {
      const idx = jobs.findIndex(j => j.id === d.id);
      if (idx >= 0) jobs[idx] = updated;
    }
  } else {
    const d = editing.data;
    const updated = {
      name:  val('f-name'),
      stage: val('f-stage'),
      f50:   chk('f-f50'),
      t100:  chk('f-t100'),
      prosumer: chk('f-pros'),
      se50:  chk('f-se'),
    };
    if (!updated.name) { toast('Name is required', 'danger'); return; }
    if (editing.isNew) cos.push(updated);
    else {
      const idx = cos.findIndex(c => c.name === editing.originalName);
      if (idx >= 0) cos[idx] = updated;
    }
  }
  saveLS();
  render();
  closeEditor();
  toast('Saved', 'success');
}

function deleteEditor() {
  if (!editing || editing.isNew) return;
  if (!confirm('Delete this entry?')) return;
  if (editing.kind === 'job') {
    jobs = jobs.filter(j => j.id !== editing.data.id);
  } else {
    cos = cos.filter(c => c.name !== editing.originalName);
  }
  saveLS();
  render();
  closeEditor();
  toast('Deleted', 'success');
}

function nextJobId() {
  return jobs.reduce((m, j) => Math.max(m, j.id || 0), 0) + 1;
}

// ── EXPORT ─────────────────────────────────────────────────────────────
function exportJobs() {
  const out = jobs.map(j => formatJob(j)).join(',\n');
  showExport('Export jobs', `const JOBS = [\n${out}\n];`, 'jobs.json');
}
function exportCos() {
  const out = cos.map(c => formatCo(c)).join(',\n');
  showExport('Export companies', `const COMPANIES = [\n${out}\n];`, 'companies.json');
}
function formatJob(j) {
  const obj = {
    id: j.id, title: j.title, co: j.co,
    cat: j.cat, catL: j.catL,
    region: j.region, city: j.city,
    mode: j.mode, lvl: j.lvl,
    salary: j.salary, salL: j.salL,
    f50: j.f50, t100: j.t100, nw: j.nw,
    date: j.date, url: j.url,
  };
  return '  ' + JSON.stringify(obj);
}
function formatCo(c) {
  const obj = {
    name: c.name, stage: c.stage,
    f50: !!c.f50, t100: !!c.t100,
    prosumer: !!c.prosumer, se50: !!c.se50,
  };
  return '  ' + JSON.stringify(obj);
}
function showExport(title, content, filename) {
  document.getElementById('export-title').textContent = title;
  document.getElementById('export-area').value = content;
  document.getElementById('export-area').dataset.filename = filename;
  document.getElementById('export-bg').classList.add('on');
}

// ── IMPORT ─────────────────────────────────────────────────────────────
function showImport() {
  document.getElementById('import-area').value = '';
  document.getElementById('import-bg').classList.add('on');
}
function doImport() {
  const txt = document.getElementById('import-area').value.trim();
  if (!txt) return;
  try {
    const parsed = (new Function('return ' + txt))();
    if (!Array.isArray(parsed)) throw new Error('Not an array');
    if (currentTab === 'jobs') jobs = parsed;
    else cos = parsed;
    saveLS();
    render();
    document.getElementById('import-bg').classList.remove('on');
    toast(`Imported ${parsed.length} entries`, 'success');
  } catch (e) {
    toast('Parse error: ' + e.message, 'danger');
  }
}

// ── HELPERS ────────────────────────────────────────────────────────────
function val(id) { return document.getElementById(id).value.trim(); }
function chk(id) { return document.getElementById(id).checked; }
function escapeHtml(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function escapeAttr(s) { return escapeHtml(s).replace(/"/g, '&quot;'); }

let toastTimer;
function toast(msg, kind) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast on' + (kind ? ' ' + kind : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('on'), 2400);
}

// ── WIRING ─────────────────────────────────────────────────────────────
document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  currentTab = btn.dataset.tab;
  document.getElementById('pane-jobs').style.display = currentTab === 'jobs' ? '' : 'none';
  document.getElementById('pane-companies').style.display = currentTab === 'companies' ? '' : 'none';
}));

document.getElementById('search-jobs').addEventListener('input', e => { searchQ.jobs = e.target.value; renderJobs(); });
document.getElementById('search-cos').addEventListener('input', e => { searchQ.cos = e.target.value; renderCos(); });

document.getElementById('btn-new-job').addEventListener('click', () => openJobEditor({
  id: nextJobId(), title:'', co:'', cat:'product', catL:'Product Design',
  region:'us', city:'', mode:'hybrid', lvl:'mid', salary:0, salL:'Undisclosed',
  f50:false, t100:false, nw:true, date:'Active', url:'',
}, true));
document.getElementById('btn-new-co').addEventListener('click', () => openCoEditor({
  name:'', stage:'startup', f50:false, t100:false, prosumer:false, se50:false,
}, true));

document.getElementById('btn-load-current').addEventListener('click', () => {
  if (jobs.length && !confirm('This will overwrite your current data. Continue?')) return;
  loadFromSite();
});

document.getElementById('btn-import').addEventListener('click', showImport);
document.getElementById('btn-export-jobs').addEventListener('click', exportJobs);
document.getElementById('btn-export-cos').addEventListener('click', exportCos);

document.getElementById('ed-close').addEventListener('click', closeEditor);
document.getElementById('ed-cancel').addEventListener('click', closeEditor);
document.getElementById('ed-bg').addEventListener('click', closeEditor);
document.getElementById('ed-save').addEventListener('click', saveEditor);
document.getElementById('ed-delete').addEventListener('click', deleteEditor);

document.getElementById('export-close').addEventListener('click', () => document.getElementById('export-bg').classList.remove('on'));
document.getElementById('export-copy').addEventListener('click', () => {
  const txt = document.getElementById('export-area').value;
  navigator.clipboard.writeText(txt).then(() => toast('Copied to clipboard', 'success'));
});
document.getElementById('export-download').addEventListener('click', () => {
  const area = document.getElementById('export-area');
  const blob = new Blob([area.value], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = area.dataset.filename || 'export.json';
  a.click();
});

document.getElementById('import-close').addEventListener('click', () => document.getElementById('import-bg').classList.remove('on'));
document.getElementById('import-cancel').addEventListener('click', () => document.getElementById('import-bg').classList.remove('on'));
document.getElementById('import-confirm').addEventListener('click', doImport);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeEditor();
    document.getElementById('export-bg').classList.remove('on');
    document.getElementById('import-bg').classList.remove('on');
  }
});

// ── INIT ───────────────────────────────────────────────────────────────
loadLS();
if (!jobs.length && !cos.length) {
  loadFromSite();
} else {
  render();
}
