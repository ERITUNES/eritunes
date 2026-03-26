/* ============================================
   USERS.JS — Admin: create DOS, HM, Teacher accounts
   ============================================ */
let _users   = [];
let _allSchools = [];

async function renderUsers() {
  setTopbarTitle('User Management');
  const c = document.getElementById('content');
  c.innerHTML = `
    <div class="page-header ani">
      <div>
        <h2>👥 User Management</h2>
        <p>Create and manage DOS, Headmaster & Teacher accounts</p>
      </div>
      <button class="btn btn-primary" onclick="openCreateUserModal()">➕ Create User</button>
    </div>
    <div class="filter-bar">
      <input type="text" id="userSearch" placeholder="🔍  Search by name or email…" oninput="filterUsers()" style="padding-left:13px">
      <select id="userRoleFilter" onchange="filterUsers()">
        <option value="">All Roles</option>
        <option value="DOS">DOS</option>
        <option value="HM">Headmaster</option>
        <option value="TEACHER">Teacher</option>
      </select>
      <select id="userSchoolFilter" onchange="filterUsers()">
        <option value="">All Schools</option>
      </select>
    </div>
    <div class="card ani">
      <div id="usersTable"><div class="loading-wrap"><div class="spinner"></div></div></div>
    </div>
  `;
  await Promise.all([loadUsers(), loadSchoolsForUsers()]);
}

async function loadUsers() {
  try {
    const res = await api.get('/auth/users');
    _users = res.users || [];
    renderUsersTable(_users);
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function loadSchoolsForUsers() {
  try {
    const res = await api.get('/schools');
    _allSchools = res.schools || [];
    const sf = document.getElementById('userSchoolFilter');
    if (sf) _allSchools.forEach(s => sf.innerHTML += `<option value="${s._id}">${s.name}</option>`);
  } catch (err) {}
}

function filterUsers() {
  const q      = (document.getElementById('userSearch')?.value || '').toLowerCase();
  const role   = document.getElementById('userRoleFilter')?.value || '';
  const school = document.getElementById('userSchoolFilter')?.value || '';
  const filtered = _users.filter(u =>
    (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
    (!role || u.role === role) &&
    (!school || u.school?._id === school)
  );
  renderUsersTable(filtered);
}

function renderUsersTable(users) {
  const el = document.getElementById('usersTable');
  if (!users.length) {
    el.innerHTML = '<div class="empty-state"><div class="es-icon">👥</div><p>No users found</p></div>';
    return;
  }
  el.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Name</th><th>Email</th><th>Role</th>
            <th>School</th><th>Subjects</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${users.map((u, i) => `
            <tr class="ani" style="animation-delay:${i * 0.03}s">
              <td>
                <div style="display:flex;align-items:center;gap:10px">
                  <div class="user-avatar sm">${u.name.charAt(0).toUpperCase()}</div>
                  <span class="td-name">${u.name}</span>
                </div>
              </td>
              <td style="color:var(--text-dim);font-size:0.82rem">${u.email}</td>
              <td>${roleBadge(u.role)}</td>
              <td>${u.school ? `<span style="font-size:0.82rem">${u.school.name}<br><span class="mono" style="color:var(--text-dim)">${u.school.schoolNumber}</span></span>` : '<span class="badge badge-dim">Unassigned</span>'}</td>
              <td style="font-size:0.78rem;color:var(--text-dim)">${u.subjects?.length ? u.subjects.slice(0,3).join(', ') + (u.subjects.length > 3 ? ` +${u.subjects.length-3}` : '') : '—'}</td>
              <td>
                <button class="btn btn-danger btn-sm" onclick="confirmDelete('${u.name}', () => deleteUser('${u._id}'))">🗑️</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

async function openCreateUserModal() {
  if (!_allSchools.length) await loadSchoolsForUsers();

  const schoolOptions = _allSchools.map(s =>
    `<option value="${s._id}" data-type="${s.type}">${s.name} (${s.type})</option>`
  ).join('');

  const primarySubs  = ['SST','Science','English','Mathematics'];
  const secondarySubs = ['Mathematics','English','Biology','Chemistry','Physics','History','Geography','CRE','IRE','Computer','Agriculture','Business','Fine Art','Music','Literature','French','German'];

  openModal('👤 Create New User', `
    <div class="form-grid">
      <div class="form-group">
        <label>Full Name *</label>
        <input type="text" id="mUName" class="input-plain" placeholder="e.g. Jane Ochieng">
      </div>
      <div class="form-group">
        <label>Email Address *</label>
        <input type="email" id="mUEmail" class="input-plain" placeholder="jane@school.com">
      </div>
      <div class="form-group">
        <label>Password *</label>
        <input type="password" id="mUPass" class="input-plain" placeholder="Min 6 characters">
      </div>
      <div class="form-group">
        <label>Role *</label>
        <select id="mURole" class="input-plain" onchange="handleUserRoleChange()">
          <option value="">Select role…</option>
          <option value="DOS">📋 DOS (Secondary)</option>
          <option value="HM">🏫 H.M (Primary)</option>
          <option value="TEACHER">👨‍🏫 Teacher</option>
        </select>
      </div>
      <div class="form-group">
        <label>Assign to School *</label>
        <select id="mUSchool" class="input-plain" onchange="handleUserSchoolChange()">
          <option value="">Select school…</option>
          ${schoolOptions}
        </select>
      </div>
      <div id="subjectsSection" style="display:none">
        <label style="display:block;font-size:.74rem;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:var(--text-dim);margin-bottom:8px">Assigned Subjects</label>
        <div class="subjects-grid" id="mUSubjectsGrid"></div>
      </div>
    </div>
  `, createUser, '✅ Create Account');
}

function handleUserRoleChange() {
  const role = document.getElementById('mURole')?.value;
  const schoolSel = document.getElementById('mUSchool');
  if (!schoolSel) return;

  // Filter school options by type
  Array.from(schoolSel.options).forEach(opt => {
    if (!opt.value) return;
    const type = opt.dataset.type;
    if (role === 'DOS') opt.hidden = type !== 'SECONDARY';
    else if (role === 'HM') opt.hidden = type !== 'PRIMARY';
    else opt.hidden = false;
  });
  handleUserSchoolChange();
}

function handleUserSchoolChange() {
  const role     = document.getElementById('mURole')?.value;
  const schoolEl = document.getElementById('mUSchool');
  const selected = schoolEl?.options[schoolEl.selectedIndex];
  const type     = selected?.dataset.type;
  const sec = document.getElementById('subjectsSection');

  if (role === 'TEACHER' && type) {
    sec.style.display = 'block';
    const subs = type === 'PRIMARY'
      ? ['SST','Science','English','Mathematics']
      : ['Mathematics','English','Biology','Chemistry','Physics','History','Geography','CRE','IRE','Computer','Agriculture','Business','Fine Art','Music','Literature','French','German'];
    const grid = document.getElementById('mUSubjectsGrid');
    grid.innerHTML = subs.map(s => `
      <label class="sub-chip" onclick="this.classList.toggle('checked')">
        <input type="checkbox" value="${s}"> ${s}
      </label>
    `).join('');
    grid.querySelectorAll('input').forEach(cb => cb.addEventListener('change', e => {
      e.target.closest('label').classList.toggle('checked', e.target.checked);
    }));
  } else {
    sec.style.display = 'none';
  }
}

async function createUser() {
  const name   = document.getElementById('mUName').value.trim();
  const email  = document.getElementById('mUEmail').value.trim();
  const pass   = document.getElementById('mUPass').value;
  const role   = document.getElementById('mURole').value;
  const school = document.getElementById('mUSchool').value;

  if (!name || !email || !pass || !role || !school)
    return toast('All fields except subjects are required', 'warning');

  const subjects = [];
  document.querySelectorAll('#mUSubjectsGrid input:checked').forEach(cb => subjects.push(cb.value));

  if (role === 'TEACHER' && !subjects.length)
    return toast('Please assign at least one subject to the teacher', 'warning');

  try {
    await api.post('/auth/register', { name, email, password: pass, role, school, subjects });
    toast(`Account for ${name} created!`, 'success');
    closeModal();
    await loadUsers();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function deleteUser(id) {
  try {
    await api.delete(`/auth/users/${id}`);
    toast('User deleted', 'info');
    closeModal();
    await loadUsers();
  } catch (err) {
    toast(err.message, 'error');
  }
}
