/* ============================================
   SCHOOLS.JS — Admin: create & manage schools
   ============================================ */
let _schools = [];

async function renderSchools() {
  setTopbarTitle('Schools');
  const c = document.getElementById('content');
  c.innerHTML = `
    <div class="page-header ani">
      <div>
        <h2>🏫 Schools</h2>
        <p>Register and manage all schools in the system</p>
      </div>
      <button class="btn btn-primary" onclick="openCreateSchoolModal()">➕ Add School</button>
    </div>
    <div class="filter-bar">
      <input type="text" id="schoolSearch" placeholder="🔍  Search schools…" oninput="filterSchools()" style="padding-left:13px">
      <select id="schoolTypeFilter" onchange="filterSchools()">
        <option value="">All Types</option>
        <option value="PRIMARY">Primary</option>
        <option value="SECONDARY">Secondary</option>
      </select>
    </div>
    <div id="schoolsGrid" class="ani"></div>
  `;
  await loadSchools();
}

async function loadSchools() {
  showLoading('schoolsGrid');
  try {
    const res = await api.get('/schools');
    _schools = res.schools || [];
    renderSchoolCards(_schools);
  } catch (err) {
    toast(err.message, 'error');
    document.getElementById('schoolsGrid').innerHTML = `<p style="color:var(--text-dim)">${err.message}</p>`;
  }
}

function filterSchools() {
  const q    = (document.getElementById('schoolSearch')?.value || '').toLowerCase();
  const type = document.getElementById('schoolTypeFilter')?.value || '';
  const filtered = _schools.filter(s =>
    (!q || s.name.toLowerCase().includes(q) || s.schoolNumber.includes(q)) &&
    (!type || s.type === type)
  );
  renderSchoolCards(filtered);
}

function renderSchoolCards(schools) {
  const el = document.getElementById('schoolsGrid');
  if (!schools.length) {
    el.innerHTML = '<div class="empty-state"><div class="es-icon">🏫</div><p>No schools found</p></div>';
    return;
  }
  el.innerHTML = `
    <div class="grid-2" style="gap:16px">
      ${schools.map((s, i) => `
        <div class="card card-gold ani" style="animation-delay:${i * 0.05}s">
          <div class="card-header">
            <div>
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
                <span style="font-size:1.4rem">${s.type === 'PRIMARY' ? '🏫' : '🏛️'}</span>
                <span class="card-title">${s.name}</span>
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                ${typeBadge(s.type)}
                ${schNum(s.schoolNumber)}
              </div>
            </div>
            <div class="btn-group">
              <button class="btn btn-secondary btn-sm" onclick="openEditSchoolModal('${s._id}')">✏️ Edit</button>
              <button class="btn btn-danger btn-sm" onclick="confirmDelete('${s.name}', () => deleteSchool('${s._id}'))">🗑️</button>
            </div>
          </div>
          <div style="display:flex;gap:20px;flex-wrap:wrap;margin-top:8px">
            ${s.location ? `<span style="font-size:0.82rem;color:var(--text-dim)">📍 ${s.location}</span>` : ''}
            <span style="font-size:0.82rem;color:var(--text-dim)">📅 ${new Date(s.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function openCreateSchoolModal() {
  openModal('🏫 Add New School', `
    <div class="form-grid">
      <div class="form-group">
        <label>School Name *</label>
        <input type="text" id="mSchoolName" class="input-plain" placeholder="e.g. St. Mary's Academy">
      </div>
      <div class="form-group">
        <label>School Type *</label>
        <select id="mSchoolType" class="input-plain">
          <option value="">Select type…</option>
          <option value="PRIMARY">Primary School</option>
          <option value="SECONDARY">Secondary School</option>
        </select>
      </div>
      <div class="form-group">
        <label>Location (optional)</label>
        <input type="text" id="mSchoolLocation" class="input-plain" placeholder="e.g. Nairobi, Kenya">
      </div>
      <div style="background:var(--gold-dim);border:1px solid var(--border-gold);border-radius:var(--radius-sm);padding:12px;font-size:0.82rem;color:var(--text-dim)">
        <strong style="color:var(--gold)">ℹ️ Note:</strong><br>
        • Primary schools get 4 subjects: SST, Science, English, Mathematics<br>
        • Secondary schools get all 17 CBC subjects
      </div>
    </div>
  `, createSchool, '🏫 Create School');
}

async function createSchool() {
  const name     = document.getElementById('mSchoolName').value.trim();
  const type     = document.getElementById('mSchoolType').value;
  const location = document.getElementById('mSchoolLocation').value.trim();

  if (!name || !type) { toast('Name and type are required', 'warning'); return; }

  try {
    await api.post('/schools', { name, type, location });
    toast(`School "${name}" created!`, 'success');
    closeModal();
    await loadSchools();
  } catch (err) {
    toast(err.message, 'error');
  }
}

function openEditSchoolModal(id) {
  const school = _schools.find(s => s._id === id);
  if (!school) return;
  openModal('✏️ Edit School', `
    <div class="form-grid">
      <div class="form-group">
        <label>School Name</label>
        <input type="text" id="mEditName" class="input-plain" value="${school.name}">
      </div>
      <div class="form-group">
        <label>Location</label>
        <input type="text" id="mEditLocation" class="input-plain" value="${school.location || ''}">
      </div>
      <div class="form-group">
        <label>Status</label>
        <select id="mEditActive" class="input-plain">
          <option value="true" ${school.isActive ? 'selected' : ''}>Active</option>
          <option value="false" ${!school.isActive ? 'selected' : ''}>Inactive</option>
        </select>
      </div>
    </div>
  `, () => updateSchool(id), '💾 Save Changes');
}

async function updateSchool(id) {
  const name     = document.getElementById('mEditName').value.trim();
  const location = document.getElementById('mEditLocation').value.trim();
  const isActive = document.getElementById('mEditActive').value === 'true';
  try {
    await api.put(`/schools/${id}`, { name, location, isActive });
    toast('School updated!', 'success');
    closeModal();
    await loadSchools();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function deleteSchool(id) {
  try {
    await api.delete(`/schools/${id}`);
    toast('School deleted', 'info');
    closeModal();
    await loadSchools();
  } catch (err) {
    toast(err.message, 'error');
  }
}
