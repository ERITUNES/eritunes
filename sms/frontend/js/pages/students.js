/* ============================================
   STUDENTS.JS — Add, list, delete students
   ============================================ */
let _students   = [];
let _studentSchools = [];

const PRIMARY_SUBS   = ['SST','Science','English','Mathematics'];
const SECONDARY_SUBS = ['Mathematics','English','Biology','Chemistry','Physics','History','Geography','CRE','IRE','Computer','Agriculture','Business','Fine Art','Music','Literature','French','German'];

async function renderStudents() {
  setTopbarTitle('Students');
  const c = document.getElementById('content');
  c.innerHTML = `
    <div class="page-header ani">
      <div>
        <h2>🧑‍🎓 Students</h2>
        <p>Manage enrolled students across schools</p>
      </div>
      ${hasRole('ADMIN','DOS','HM') ? `<button class="btn btn-primary" onclick="openAddStudentModal()">➕ Enroll Student</button>` : ''}
    </div>
    <div class="filter-bar">
      <input type="text" id="stuSearch" placeholder="🔍  Search by name or ID…" oninput="filterStudents()" style="padding-left:13px">
      <select id="stuClassFilter" onchange="filterStudents()">
        <option value="">All Classes</option>
      </select>
      ${hasRole('ADMIN') ? `
        <select id="stuSchoolFilter" onchange="filterStudents()">
          <option value="">All Schools</option>
        </select>` : ''}
    </div>
    <div class="card ani">
      <div class="card-header">
        <span class="card-title">📋 Student Records</span>
        <span class="badge badge-dim" id="stuCount">Loading…</span>
      </div>
      <div id="studentsTable"><div class="loading-wrap"><div class="spinner"></div></div></div>
    </div>
  `;
  await loadStudents();
}

async function loadStudents() {
  try {
    const qs = currentUser.school ? `?schoolId=${currentUser.school._id}` : '';
    const [stuRes, schRes] = await Promise.all([
      api.get(`/students${qs}`),
      hasRole('ADMIN') ? api.get('/schools') : Promise.resolve({ schools: [] }),
    ]);
    _students = stuRes.students || [];
    _studentSchools = schRes.schools || [];

    // Populate school filter
    const sf = document.getElementById('stuSchoolFilter');
    if (sf) _studentSchools.forEach(s => sf.innerHTML += `<option value="${s._id}">${s.name}</option>`);

    // Populate class filter
    const classes = [...new Set(_students.map(s => s.class))].sort();
    const cf = document.getElementById('stuClassFilter');
    if (cf) classes.forEach(cls => cf.innerHTML += `<option value="${cls}">${cls}</option>`);

    renderStudentsTable(_students);
  } catch (err) {
    toast(err.message, 'error');
  }
}

function filterStudents() {
  const q      = (document.getElementById('stuSearch')?.value || '').toLowerCase();
  const cls    = document.getElementById('stuClassFilter')?.value || '';
  const school = document.getElementById('stuSchoolFilter')?.value || '';
  const filtered = _students.filter(s =>
    (!q || s.name.toLowerCase().includes(q) || s.studentId?.includes(q)) &&
    (!cls || s.class === cls) &&
    (!school || s.school?._id === school)
  );
  renderStudentsTable(filtered);
}

function renderStudentsTable(students) {
  const cnt = document.getElementById('stuCount');
  if (cnt) cnt.textContent = `${students.length} student${students.length !== 1 ? 's' : ''}`;

  const el = document.getElementById('studentsTable');
  if (!students.length) {
    el.innerHTML = '<div class="empty-state"><div class="es-icon">🧑‍🎓</div><p>No students found</p></div>';
    return;
  }

  const avs = ['👦','👧','🧒','👨‍🎓','👩‍🎓'];
  el.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Student</th><th>ID</th><th>Class</th>
            ${hasRole('ADMIN') ? '<th>School</th>' : ''}
            <th>Subjects</th>
            ${hasRole('ADMIN','DOS','HM') ? '<th>Actions</th>' : ''}
          </tr>
        </thead>
        <tbody>
          ${students.map((s, i) => `
            <tr class="ani" style="animation-delay:${i * 0.025}s">
              <td>
                <div style="display:flex;align-items:center;gap:10px">
                  <span style="font-size:1.3rem">${avs[i % avs.length]}</span>
                  <span class="td-name">${s.name}</span>
                </div>
              </td>
              <td>${schNum(s.studentId || '—')}</td>
              <td><span class="badge badge-dim">${s.class}</span></td>
              ${hasRole('ADMIN') ? `<td style="font-size:0.8rem;color:var(--text-dim)">${s.school?.name || '—'}</td>` : ''}
              <td>
                <div style="display:flex;flex-wrap:wrap;gap:4px;max-width:280px">
                  ${(s.subjects || []).slice(0, 4).map(sub => `<span class="badge badge-emerald" style="font-size:0.66rem">${sub}</span>`).join('')}
                  ${s.subjects?.length > 4 ? `<span class="badge badge-dim" style="font-size:0.66rem">+${s.subjects.length - 4}</span>` : ''}
                </div>
              </td>
              ${hasRole('ADMIN','DOS','HM') ? `
              <td>
                <div class="btn-group">
                  <button class="btn btn-blue btn-sm" onclick="viewStudentMarks('${s._id}','${s.name}')">📊 Marks</button>
                  <button class="btn btn-danger btn-sm" onclick="confirmDelete('${s.name}',()=>deleteStudent('${s._id}'))">🗑️</button>
                </div>
              </td>` : ''}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

async function openAddStudentModal() {
  const schools = hasRole('ADMIN') ? (_studentSchools.length ? _studentSchools : (await api.get('/schools')).schools) : [currentUser.school];

  const schoolType = currentUser.school?.type || null;
  const subs = schoolType === 'PRIMARY' ? PRIMARY_SUBS : (schoolType === 'SECONDARY' ? SECONDARY_SUBS : null);

  openModal('🧑‍🎓 Enroll New Student', `
    <div class="form-grid">
      <div class="form-group">
        <label>Student Name *</label>
        <input type="text" id="mSName" class="input-plain" placeholder="e.g. Amina Hassan">
      </div>
      <div class="form-grid form-grid-2">
        <div class="form-group">
          <label>Class *</label>
          <input type="text" id="mSClass" class="input-plain" placeholder="e.g. Grade 4 / Form 2">
        </div>
        <div class="form-group">
          <label>Gender</label>
          <select id="mSGender" class="input-plain">
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>
      ${hasRole('ADMIN') ? `
      <div class="form-group">
        <label>School *</label>
        <select id="mSSchool" class="input-plain" onchange="handleStudentSchoolChange()">
          <option value="">Select school…</option>
          ${schools.map(s => `<option value="${s._id}" data-type="${s.type}">${s.name} (${s.type})</option>`).join('')}
        </select>
      </div>` : ''}
      <div id="mSSubsSection">
        <label style="display:block;font-size:.74rem;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:var(--text-dim);margin-bottom:8px">
          Subjects ${subs ? `(${subs.length} available)` : '— select school first'}
        </label>
        <div class="subjects-grid" id="mSSubsGrid">
          ${subs ? buildSubjectChips(subs) : '<p style="color:var(--text-dim);font-size:.82rem">Select a school first</p>'}
        </div>
      </div>
    </div>
  `, addStudent, '✅ Enroll Student');
}

function buildSubjectChips(subs) {
  return subs.map(s => `
    <label class="sub-chip" onclick="this.classList.toggle('checked')">
      <input type="checkbox" value="${s}"> ${s}
    </label>
  `).join('');
}

function handleStudentSchoolChange() {
  const sel = document.getElementById('mSSchool');
  const opt = sel?.options[sel.selectedIndex];
  const type = opt?.dataset.type;
  if (!type) return;
  const subs = type === 'PRIMARY' ? PRIMARY_SUBS : SECONDARY_SUBS;
  const grid = document.getElementById('mSSubsGrid');
  if (grid) {
    grid.innerHTML = buildSubjectChips(subs);
    grid.querySelectorAll('input').forEach(cb => cb.addEventListener('change', e => {
      e.target.closest('label').classList.toggle('checked', e.target.checked);
    }));
  }
}

async function addStudent() {
  const name   = document.getElementById('mSName').value.trim();
  const cls    = document.getElementById('mSClass').value.trim();
  const gender = document.getElementById('mSGender').value;
  const school = hasRole('ADMIN') ? document.getElementById('mSSchool').value : currentUser.school?._id;
  const subjects = [];
  document.querySelectorAll('#mSSubsGrid input:checked').forEach(cb => subjects.push(cb.value));

  if (!name || !cls || !school) return toast('Name, class, and school are required', 'warning');

  try {
    await api.post('/students', { name, class: cls, school, subjects, gender });
    toast(`${name} enrolled successfully!`, 'success');
    closeModal();
    await loadStudents();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function deleteStudent(id) {
  try {
    await api.delete(`/students/${id}`);
    toast('Student removed', 'info');
    closeModal();
    await loadStudents();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function viewStudentMarks(studentId, studentName) {
  openModal(`📊 ${studentName} — Marks`, '<div class="loading-wrap"><div class="spinner"></div></div>');
  try {
    const res = await api.get(`/marks/student/${studentId}`);
    const marks = res.marks || [];
    if (!marks.length) {
      document.getElementById('modalBody').innerHTML = '<div class="empty-state"><div class="es-icon">📭</div><p>No marks recorded yet</p></div>';
      return;
    }
    const gradeScore = { A: 5, B: 4, C: 3, D: 2, E: 1 };
    const avg = (marks.reduce((a, m) => a + (gradeScore[m.score] || 0), 0) / marks.length).toFixed(1);
    const avgLabel = avg >= 4.5 ? 'Excellent' : avg >= 3.5 ? 'Good' : avg >= 2.5 ? 'Average' : 'Needs Improvement';

    document.getElementById('modalBody').innerHTML = `
      <div style="background:var(--card-2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;margin-bottom:16px;display:flex;gap:20px">
        <div><div style="font-size:1.8rem;font-family:'Fraunces',serif;color:var(--cream)">${avg}/5</div><div style="font-size:0.76rem;color:var(--text-dim)">Avg Score</div></div>
        <div><div style="font-size:1.1rem;color:var(--emerald);font-weight:600">${avgLabel}</div><div style="font-size:0.76rem;color:var(--text-dim)">${marks.length} subjects assessed</div></div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Subject</th><th>Grade</th><th>Term</th><th>Teacher</th></tr></thead>
          <tbody>
            ${marks.map(m => `
              <tr>
                <td class="td-name">${m.subject}</td>
                <td>${gradeBadge(m.score)}</td>
                <td style="color:var(--text-dim);font-size:0.8rem">${m.term} ${m.year}</td>
                <td style="color:var(--text-dim);font-size:0.8rem">${m.teacher?.name || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    toast(err.message, 'error');
  }
}
