/* ============================================
   RESULTS.JS — DOS/HM: Results & performance
   ============================================ */
async function renderResults() {
  setTopbarTitle('Results & Analytics');
  const c = document.getElementById('content');
  c.innerHTML = `
    <div class="page-header ani">
      <div>
        <h2>📈 Results & Analytics</h2>
        <p>Performance overview for ${currentUser.school?.name || 'all schools'}</p>
      </div>
      <button class="btn btn-emerald" onclick="exportResultsPDF()">📄 Export PDF</button>
    </div>

    <!-- Filters -->
    <div class="card ani" style="margin-bottom:20px">
      <div class="card-title" style="margin-bottom:14px">🔍 Filter Results</div>
      <div class="filter-bar" style="gap:12px">
        <select id="rfTerm" onchange="loadResults()">
          <option value="">All Terms</option>
          <option>Term 1</option><option>Term 2</option><option>Term 3</option>
        </select>
        <select id="rfYear" onchange="loadResults()">
          <option value="">All Years</option>
          ${[2024,2025,2026].map(y=>`<option value="${y}">${y}</option>`).join('')}
        </select>
        <select id="rfClass" onchange="loadResults()">
          <option value="">All Classes</option>
        </select>
        <select id="rfSubject" onchange="loadResults()">
          <option value="">All Subjects</option>
        </select>
      </div>
    </div>

    <!-- Analytics grid -->
    <div class="stats-grid" id="resultsStats" style="margin-bottom:20px">
      <div class="loading-wrap"><div class="spinner"></div></div>
    </div>

    <div class="grid-2" style="gap:20px;margin-bottom:20px">
      <div class="card ani">
        <div class="card-title" style="margin-bottom:16px">📊 Grade Distribution</div>
        <div id="resultsGradeDist"></div>
      </div>
      <div class="card ani">
        <div class="card-title" style="margin-bottom:16px">📚 Subject Performance</div>
        <div id="resultsSubjectPerf" style="max-height:320px;overflow-y:auto"></div>
      </div>
    </div>

    <div class="card ani">
      <div class="card-header">
        <span class="card-title">📋 Detailed Results</span>
        <div class="btn-group">
          <input type="text" id="rfStudent" placeholder="🔍 Search student…" oninput="filterResultsTable()" style="padding:8px 12px;font-size:.82rem;max-width:200px">
        </div>
      </div>
      <div id="resultsTable"><div class="loading-wrap"><div class="spinner"></div></div></div>
    </div>
  `;
  await loadResults();
}

let _allMarks = [];
let _allStudents = [];

async function loadResults() {
  const term    = document.getElementById('rfTerm')?.value || '';
  const year    = document.getElementById('rfYear')?.value || '';
  const cls     = document.getElementById('rfClass')?.value || '';
  const subject = document.getElementById('rfSubject')?.value || '';

  const qs = new URLSearchParams();
  if (currentUser.school) qs.set('schoolId', currentUser.school._id);
  if (term)    qs.set('term', term);
  if (year)    qs.set('year', year);
  if (subject) qs.set('subject', subject);

  const analyticsQs = new URLSearchParams();
  if (currentUser.school) analyticsQs.set('schoolId', currentUser.school._id);
  if (term) analyticsQs.set('term', term);
  if (year) analyticsQs.set('year', year);

  try {
    const [marksRes, analyticsRes, stuRes] = await Promise.all([
      api.get(`/marks?${qs}`),
      api.get(`/marks/analytics?${analyticsQs}`),
      api.get(`/students${currentUser.school ? '?schoolId='+currentUser.school._id : ''}`),
    ]);

    _allMarks    = marksRes.marks || [];
    _allStudents = stuRes.students || [];
    const analytics = analyticsRes.analytics || {};

    // Populate class filter
    const classes = [...new Set(_allStudents.map(s => s.class))].sort();
    const cf = document.getElementById('rfClass');
    if (cf && cf.options.length <= 1) classes.forEach(c => cf.innerHTML += `<option value="${c}">${c}</option>`);

    // Populate subject filter
    const subjects = [...new Set(_allMarks.map(m => m.subject))].sort();
    const sf = document.getElementById('rfSubject');
    if (sf && sf.options.length <= 1) subjects.forEach(s => sf.innerHTML += `<option value="${s}">${s}</option>`);

    renderResultsStats(analytics, _allMarks, _allStudents);
    renderResultsGradeDist(analytics.gradeDistribution || {});
    renderSubjectPerformance(analytics.subjectBreakdown || {});
    renderResultsTable(cls ? _allMarks.filter(m => m.student?.class === cls) : _allMarks);

  } catch (err) {
    toast(err.message, 'error');
  }
}

function renderResultsStats(analytics, marks, students) {
  const { totalMarks, gradeDistribution: dist = {}, averageScore } = analytics;
  const aRate = totalMarks ? Math.round(((dist.A || 0) / totalMarks) * 100) : 0;
  const gradeAvgLabel = averageScore >= 4.5 ? 'Excellent 🏆' : averageScore >= 3.5 ? 'Good ✅' : averageScore >= 2.5 ? 'Average ⚠️' : 'Needs Work 📉';

  const statsEl = document.getElementById('resultsStats');
  statsEl.innerHTML = [
    { icon: '📝', num: totalMarks || 0, label: 'Total Assessments', cls: 'blue' },
    { icon: '🧑‍🎓', num: students.length, label: 'Enrolled Students', cls: 'emerald' },
    { icon: '⭐', num: `${aRate}%`, label: 'Grade A Rate', cls: 'gold', noAnim: true },
    { icon: '📊', num: gradeAvgLabel, label: 'Overall Performance', cls: 'violet', noAnim: true },
  ].map((s, i) => `
    <div class="stat-card ${s.cls} ani" style="animation-delay:${i * 0.07}s">
      <div class="stat-icon">${s.icon}</div>
      <div class="stat-num" ${s.noAnim ? '' : `data-num="${s.num}"`}>${s.noAnim ? s.num : 0}</div>
      <div class="stat-label">${s.label}</div>
    </div>
  `).join('');

  document.querySelectorAll('[data-num]').forEach(el => animNum(el, parseInt(el.dataset.num)));
}

function renderResultsGradeDist(dist) {
  const el = document.getElementById('resultsGradeDist');
  const total = Object.values(dist).reduce((a, b) => a + b, 0);
  const colors = { A: '#2dd4a0', B: '#4a9eff', C: '#e8a020', D: '#fb923c', E: '#f87171' };
  const labels = { A: 'Exceeds', B: 'Meets', C: 'Approaching', D: 'Below', E: 'Well Below' };

  if (!total) { el.innerHTML = '<div class="empty-state"><div class="es-icon">📊</div><p>No data</p></div>'; return; }

  el.innerHTML = ['A','B','C','D','E'].map(g => {
    const cnt = dist[g] || 0;
    const pct = Math.round((cnt / total) * 100);
    return `
      <div class="grade-bar-row" style="margin-bottom:14px">
        <span class="grade-bar-label" style="color:${colors[g]};width:20px">${g}</span>
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;font-size:.72rem;color:var(--text-dim);margin-bottom:4px">
            <span>${labels[g]}</span><span>${pct}%</span>
          </div>
          <div class="grade-bar-track" style="height:12px">
            <div class="grade-bar-fill" style="width:0%;background:${colors[g]};height:12px" data-pct="${pct}"></div>
          </div>
        </div>
        <span class="grade-bar-count" style="width:36px;text-align:right">${cnt}</span>
      </div>
    `;
  }).join('');

  setTimeout(() => {
    document.querySelectorAll('.grade-bar-fill').forEach(b => b.style.width = b.dataset.pct + '%');
  }, 100);
}

function renderSubjectPerformance(breakdown) {
  const el = document.getElementById('resultsSubjectPerf');
  const subjects = Object.keys(breakdown);
  if (!subjects.length) { el.innerHTML = '<div class="empty-state"><div class="es-icon">📚</div><p>No data</p></div>'; return; }

  const gradeScore = { A: 5, B: 4, C: 3, D: 2, E: 1 };

  const withScore = subjects.map(sub => {
    const d = breakdown[sub];
    const total = d.total || 1;
    const score = (Object.entries(d).filter(([k]) => k !== 'total').reduce((acc, [g, cnt]) => acc + (gradeScore[g] || 0) * cnt, 0) / total).toFixed(1);
    return { sub, score: parseFloat(score), total: d.total, d };
  }).sort((a, b) => b.score - a.score);

  el.innerHTML = withScore.map(({ sub, score, total, d }) => {
    const color = score >= 4.5 ? '#2dd4a0' : score >= 3.5 ? '#4a9eff' : score >= 2.5 ? '#e8a020' : '#f87171';
    const grades = ['A','B','C','D','E'].map(g => `<span style="font-size:.68rem;color:var(--text-dim)">${g}:${d[g]||0}</span>`).join(' ');
    return `
      <div style="padding:10px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px">
        <div style="width:36px;height:36px;border-radius:8px;background:rgba(232,160,32,.1);border:1px solid rgba(232,160,32,.2);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.9rem;color:${color};flex-shrink:0">${score}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:.86rem;font-weight:600;color:var(--cream)">${sub}</div>
          <div style="display:flex;gap:8px;margin-top:2px">${grades}</div>
        </div>
        <span style="font-size:.72rem;color:var(--text-dim)">${total} assessed</span>
      </div>
    `;
  }).join('');
}

function renderResultsTable(marks) {
  const el = document.getElementById('resultsTable');
  if (!marks.length) {
    el.innerHTML = '<div class="empty-state"><div class="es-icon">📋</div><p>No results match filters</p></div>';
    return;
  }
  el.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Student</th><th>Class</th><th>Subject</th>
            <th>Grade</th><th>Term</th><th>Teacher</th><th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${marks.map((m, i) => `
            <tr class="ani" style="animation-delay:${i * 0.015}s">
              <td class="td-name">${m.student?.name || '—'}</td>
              <td><span class="badge badge-dim">${m.student?.class || '—'}</span></td>
              <td>${m.subject}</td>
              <td>${gradeBadge(m.score)}</td>
              <td style="color:var(--text-dim);font-size:.78rem">${m.term} ${m.year}</td>
              <td style="color:var(--text-dim);font-size:.78rem">${m.teacher?.name || '—'}</td>
              <td style="color:var(--text-dim);font-size:.74rem">${new Date(m.createdAt).toLocaleDateString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function filterResultsTable() {
  const q = (document.getElementById('rfStudent')?.value || '').toLowerCase();
  const filtered = q ? _allMarks.filter(m => m.student?.name?.toLowerCase().includes(q)) : _allMarks;
  renderResultsTable(filtered);
}

function exportResultsPDF() {
  // Build print-friendly content
  const school = currentUser.school?.name || 'All Schools';
  const date   = new Date().toLocaleDateString();
  const rows   = _allMarks.map(m =>
    `<tr><td>${m.student?.name||'—'}</td><td>${m.student?.class||'—'}</td><td>${m.subject}</td><td><strong>${m.score}</strong></td><td>${m.term} ${m.year}</td><td>${m.teacher?.name||'—'}</td></tr>`
  ).join('');

  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html><html><head>
    <title>Results — ${school}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:30px;color:#111}
      h1{font-size:1.4rem;margin-bottom:4px} .sub{color:#666;font-size:.85rem;margin-bottom:20px}
      table{width:100%;border-collapse:collapse;font-size:.85rem}
      th{background:#0a1628;color:#fff;padding:8px 10px;text-align:left}
      td{padding:7px 10px;border-bottom:1px solid #eee}
      tr:nth-child(even) td{background:#f9f9f9}
    </style>
    </head><body>
    <h1>📊 ${school} — Results Report</h1>
    <div class="sub">Generated: ${date} | Total records: ${_allMarks.length}</div>
    <table>
      <thead><tr><th>Student</th><th>Class</th><th>Subject</th><th>Grade</th><th>Term</th><th>Teacher</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    </body></html>
  `);
  win.document.close();
  setTimeout(() => win.print(), 400);
  toast('PDF export opened in new tab', 'info');
}
