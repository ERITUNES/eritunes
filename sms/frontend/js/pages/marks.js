/* ============================================
   MARKS.JS — Teacher: upload marks
   ============================================ */
let _markStudents = [];
let _marksList    = [];

async function renderMarks() {
  setTopbarTitle('Upload Marks');
  const c = document.getElementById('content');

  const isTeacher = hasRole('TEACHER');
  const subjectsAvail = isTeacher ? (currentUser.subjects || []) :
    (currentUser.school?.type === 'PRIMARY' ? PRIMARY_SUBS : SECONDARY_SUBS);

  c.innerHTML = `
    <div class="page-header ani">
      <div>
        <h2>📝 ${isTeacher ? 'Upload Marks' : 'Manage Marks'}</h2>
        <p>${isTeacher ? `Your assigned subjects: ${(currentUser.subjects||[]).join(', ') || 'None'}` : 'View and manage all uploaded marks'}</p>
      </div>
      <button class="btn btn-primary" onclick="openUploadMarkModal()">➕ Upload Mark</button>
    </div>

    <div class="grid-2" style="gap:20px">
      <!-- Upload form quick panel -->
      <div class="card ani card-gold">
        <div class="card-title" style="margin-bottom:16px">✏️ Quick Upload</div>
        <div class="form-group" style="margin-bottom:12px">
          <label>Student</label>
          <select id="quickStudent" class="input-plain">
            <option value="">Loading students…</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom:12px">
          <label>Subject</label>
          <select id="quickSubject" class="input-plain">
            ${subjectsAvail.map(s => `<option value="${s}">${s}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="margin-bottom:12px">
          <label>Grade</label>
          <div style="display:flex;gap:8px;margin-top:6px" id="quickGradePicker">
            ${['A','B','C','D','E'].map(g => `
              <button class="btn ${g==='A'?'btn-emerald':g==='B'?'btn-blue':g==='C'?'btn-secondary':g==='D'?'btn-secondary':'btn-danger'} btn-sm quick-grade-btn"
                data-g="${g}" onclick="selectQuickGrade(this)" style="${g==='A'?'border-color:var(--emerald)':''}">${g}</button>
            `).join('')}
          </div>
        </div>
        <div class="form-grid form-grid-2" style="margin-bottom:12px">
          <div class="form-group">
            <label>Term</label>
            <select id="quickTerm" class="input-plain">
              <option>Term 1</option><option>Term 2</option><option>Term 3</option>
            </select>
          </div>
          <div class="form-group">
            <label>Year</label>
            <input type="number" id="quickYear" class="input-plain" value="${new Date().getFullYear()}" min="2000" max="2099">
          </div>
        </div>
        <button class="btn btn-primary btn-block" onclick="quickUpload()">💾 Save Mark</button>
      </div>

      <!-- Recent marks list -->
      <div class="card ani">
        <div class="card-header">
          <span class="card-title">📋 Uploaded Marks</span>
          <span class="badge badge-dim" id="marksCount">…</span>
        </div>
        <div class="filter-bar" style="margin-bottom:12px">
          <select id="mfSubject" onchange="filterMarks()">
            <option value="">All Subjects</option>
            ${subjectsAvail.map(s => `<option value="${s}">${s}</option>`).join('')}
          </select>
          <select id="mfTerm" onchange="filterMarks()">
            <option value="">All Terms</option>
            <option>Term 1</option><option>Term 2</option><option>Term 3</option>
          </select>
        </div>
        <div id="marksList"><div class="loading-wrap"><div class="spinner"></div></div></div>
      </div>
    </div>
  `;

  // Pre-select A
  setTimeout(() => {
    const firstGrade = document.querySelector('.quick-grade-btn[data-g="A"]');
    if (firstGrade) firstGrade.style.opacity = '1';
  }, 50);

  await loadMarksPageData();
}

let _selectedQuickGrade = 'A';

function selectQuickGrade(btn) {
  document.querySelectorAll('.quick-grade-btn').forEach(b => b.style.outline = 'none');
  btn.style.outline = '2px solid var(--gold)';
  btn.style.outlineOffset = '2px';
  _selectedQuickGrade = btn.dataset.g;
}

async function loadMarksPageData() {
  try {
    const qs = currentUser.school ? `?schoolId=${currentUser.school._id}` : '';
    const [stuRes, marksRes] = await Promise.all([
      api.get(`/students${qs}`),
      api.get(`/marks${qs}`),
    ]);
    _markStudents = stuRes.students || [];
    _marksList    = marksRes.marks || [];

    // Populate student selector
    const sel = document.getElementById('quickStudent');
    if (sel) {
      sel.innerHTML = _markStudents.length
        ? `<option value="">Select student…</option>` + _markStudents.map(s => `<option value="${s._id}">${s.name} (${s.class})</option>`).join('')
        : `<option value="">No students enrolled</option>`;
    }

    renderMarksList(_marksList);
  } catch (err) {
    toast(err.message, 'error');
  }
}

function filterMarks() {
  const sub  = document.getElementById('mfSubject')?.value || '';
  const term = document.getElementById('mfTerm')?.value || '';
  const filtered = _marksList.filter(m =>
    (!sub || m.subject === sub) &&
    (!term || m.term === term)
  );
  renderMarksList(filtered);
}

function renderMarksList(marks) {
  const cnt = document.getElementById('marksCount');
  if (cnt) cnt.textContent = `${marks.length} record${marks.length !== 1 ? 's' : ''}`;

  const el = document.getElementById('marksList');
  if (!marks.length) {
    el.innerHTML = '<div class="empty-state"><div class="es-icon">📭</div><p>No marks found</p></div>';
    return;
  }
  el.innerHTML = `
    <div class="table-wrap" style="max-height:400px;overflow-y:auto">
      <table>
        <thead><tr><th>Student</th><th>Subject</th><th>Grade</th><th>Term</th>${hasRole('DOS','HM','ADMIN')?'<th>Teacher</th><th></th>':''}</tr></thead>
        <tbody>
          ${marks.map((m, i) => `
            <tr class="ani" style="animation-delay:${i * 0.02}s">
              <td class="td-name">${m.student?.name || '—'}<br><span style="font-size:0.72rem;color:var(--text-dim)">${m.student?.class || ''}</span></td>
              <td style="font-size:0.82rem">${m.subject}</td>
              <td>${gradeBadge(m.score)}</td>
              <td style="font-size:0.76rem;color:var(--text-dim)">${m.term} ${m.year}</td>
              ${hasRole('DOS','HM','ADMIN') ? `
                <td style="font-size:0.76rem;color:var(--text-dim)">${m.teacher?.name || '—'}</td>
                <td><button class="btn btn-danger btn-sm btn-icon" onclick="confirmDelete('this mark',()=>deleteMark('${m._id}'))">🗑️</button></td>
              ` : ''}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

async function quickUpload() {
  const student = document.getElementById('quickStudent').value;
  const subject = document.getElementById('quickSubject').value;
  const term    = document.getElementById('quickTerm').value;
  const year    = parseInt(document.getElementById('quickYear').value);

  if (!student || !subject) return toast('Select a student and subject', 'warning');

  try {
    await api.post('/marks', { student, subject, score: _selectedQuickGrade, term, year });
    toast(`Mark uploaded: ${subject} → ${_selectedQuickGrade}`, 'success');
    await loadMarksPageData();
  } catch (err) {
    toast(err.message, 'error');
  }
}

function openUploadMarkModal() {
  // Reuse quick upload logic in a modal for accessibility
  openModal('📝 Upload Mark', `
    <div class="form-grid">
      <div class="form-group">
        <label>Student *</label>
        <select id="mMStudent" class="input-plain">
          <option value="">Select student…</option>
          ${_markStudents.map(s => `<option value="${s._id}">${s.name} (${s.class})</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Subject *</label>
        <select id="mMSubject" class="input-plain">
          ${(currentUser.subjects?.length ? currentUser.subjects : SECONDARY_SUBS).map(s => `<option value="${s}">${s}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Grade *</label>
        <select id="mMGrade" class="input-plain">
          <option value="A">A — Exceeds Expectations</option>
          <option value="B">B — Meets Expectations</option>
          <option value="C">C — Approaching Expected</option>
          <option value="D">D — Below Expected</option>
          <option value="E">E — Well Below Expected</option>
        </select>
      </div>
      <div class="form-grid form-grid-2">
        <div class="form-group">
          <label>Term</label>
          <select id="mMTerm" class="input-plain">
            <option>Term 1</option><option>Term 2</option><option>Term 3</option>
          </select>
        </div>
        <div class="form-group">
          <label>Year</label>
          <input type="number" id="mMYear" class="input-plain" value="${new Date().getFullYear()}">
        </div>
      </div>
      <div class="form-group">
        <label>Remarks (optional)</label>
        <textarea id="mMRemarks" placeholder="Any additional remarks…" style="height:70px"></textarea>
      </div>
    </div>
  `, uploadMarkModal, '💾 Upload Mark');
}

async function uploadMarkModal() {
  const student  = document.getElementById('mMStudent').value;
  const subject  = document.getElementById('mMSubject').value;
  const score    = document.getElementById('mMGrade').value;
  const term     = document.getElementById('mMTerm').value;
  const year     = parseInt(document.getElementById('mMYear').value);
  const remarks  = document.getElementById('mMRemarks').value;

  if (!student || !subject) return toast('Select student and subject', 'warning');
  try {
    await api.post('/marks', { student, subject, score, term, year, remarks });
    toast('Mark uploaded!', 'success');
    closeModal();
    await loadMarksPageData();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function deleteMark(id) {
  try {
    await api.delete(`/marks/${id}`);
    toast('Mark deleted', 'info');
    closeModal();
    await loadMarksPageData();
  } catch (err) {
    toast(err.message, 'error');
  }
}
