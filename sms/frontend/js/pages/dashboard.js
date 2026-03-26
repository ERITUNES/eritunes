/* ============================================
   DASHBOARD.JS — Home dashboard for all roles
   ============================================ */
async function renderDashboard() {
  setTopbarTitle('Dashboard');
  const c = document.getElementById('content');

  const roleGreet = {
    ADMIN:   { icon: '🛡️', label: 'System Administrator' },
    DOS:     { icon: '📋', label: 'Director of Studies' },
    HM:      { icon: '🏫', label: 'Headmaster' },
    TEACHER: { icon: '👨‍🏫', label: 'Teacher Portal' },
  };
  const rg = roleGreet[currentUser.role] || { icon: '🎓', label: 'Dashboard' };
  const schoolName = currentUser.school?.name || 'All Schools';

  c.innerHTML = `
    <div class="page-header" style="animation:fadeUp .4s ease both">
      <div>
        <h2>${rg.icon} ${rg.label}</h2>
        <p>${currentUser.name} · ${schoolName}</p>
      </div>
    </div>
    <div class="stats-grid" id="dashStats">
      <div class="loading-wrap"><div class="spinner"></div></div>
    </div>
    <div class="grid-2" style="gap:20px;margin-top:20px">
      <div class="card ani" id="recentMarksCard">
        <div class="card-header">
          <span class="card-title">📝 Recent Assessments</span>
        </div>
        <div id="recentMarksList"><div class="loading-wrap"><div class="spinner"></div></div></div>
      </div>
      <div class="card ani" id="gradeDistCard">
        <div class="card-header">
          <span class="card-title">📊 Grade Distribution</span>
        </div>
        <div id="gradeDistChart"><div class="loading-wrap"><div class="spinner"></div></div></div>
      </div>
    </div>
    ${hasRole('ADMIN','DOS','HM') ? `
    <div class="card ani" style="margin-top:20px">
      <div class="card-header"><span class="card-title">🏆 Quick Actions</span></div>
      <div class="btn-group">
        ${hasRole('ADMIN') ? `<button class="btn btn-primary" onclick="navigate('schools')">🏫 Manage Schools</button>` : ''}
        ${hasRole('ADMIN') ? `<button class="btn btn-secondary" onclick="navigate('users')">👥 Manage Users</button>` : ''}
        <button class="btn btn-emerald" onclick="navigate('students')">🧑‍🎓 Students</button>
        <button class="btn btn-blue" onclick="navigate('results')">📈 Results</button>
      </div>
    </div>` : ''}
  `;

  await loadDashboardData();
}

async function loadDashboardData() {
  try {
    const schoolQs = currentUser.school ? `?schoolId=${currentUser.school._id}` : '';

    // Fetch in parallel
    const [schoolsRes, studentsRes, marksRes, analyticsRes] = await Promise.all([
      hasRole('ADMIN') ? api.get('/schools') : Promise.resolve({ schools: [currentUser.school].filter(Boolean) }),
      api.get(`/students${schoolQs}`),
      api.get(`/marks${schoolQs}`),
      api.get(`/marks/analytics${schoolQs}`),
    ]);

    const schools  = schoolsRes.schools || [];
    const students = studentsRes.students || [];
    const marks    = marksRes.marks || [];
    const analytics= analyticsRes.analytics || {};

    // Stats
    const statsHTML = buildDashboardStats(schools, students, marks, analytics);
    document.getElementById('dashStats').innerHTML = statsHTML;

    // Animate numbers
    document.querySelectorAll('[data-num]').forEach(el => {
      animNum(el, parseInt(el.dataset.num));
    });

    // Recent marks
    renderRecentMarks(marks.slice(0, 8));

    // Grade distribution
    renderGradeDistribution(analytics.gradeDistribution || {});

  } catch (err) {
    document.getElementById('dashStats').innerHTML = `<div class="card"><p style="color:var(--text-dim)">${err.message}</p></div>`;
  }
}

function buildDashboardStats(schools, students, marks, analytics) {
  const cards = [];

  if (hasRole('ADMIN')) {
    cards.push({ icon: '🏫', num: schools.length, label: 'Total Schools', cls: 'gold' });
  }
  cards.push({ icon: '🧑‍🎓', num: students.length, label: 'Students', cls: 'emerald' });
  cards.push({ icon: '📝', num: marks.length, label: 'Assessments', cls: 'blue' });

  const aCount = marks.filter(m => m.score === 'A').length;
  const pct = marks.length ? Math.round((aCount / marks.length) * 100) : 0;
  cards.push({ icon: '⭐', num: `${pct}%`, label: 'Grade A Rate', cls: 'gold', noAnim: true });

  if (hasRole('TEACHER')) {
    const myMarks = marks.filter(m => m.teacher?._id === currentUser._id || m.teacher === currentUser._id);
    cards.push({ icon: '✏️', num: myMarks.length, label: 'My Uploaded Marks', cls: 'violet' });
  }

  return cards.map((c, i) => `
    <div class="stat-card ${c.cls} ani" style="animation-delay:${i * 0.07}s">
      <div class="stat-icon">${c.icon}</div>
      <div class="stat-num" ${c.noAnim ? '' : `data-num="${c.num}"`}>${c.noAnim ? c.num : 0}</div>
      <div class="stat-label">${c.label}</div>
    </div>
  `).join('');
}

function renderRecentMarks(marks) {
  const el = document.getElementById('recentMarksList');
  if (!marks.length) {
    el.innerHTML = '<div class="empty-state"><div class="es-icon">📭</div><p>No assessments yet</p></div>';
    return;
  }
  el.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Student</th><th>Subject</th><th>Grade</th><th>Teacher</th></tr></thead>
        <tbody>
          ${marks.map(m => `
            <tr>
              <td class="td-name">${m.student?.name || '—'}</td>
              <td>${m.subject}</td>
              <td>${gradeBadge(m.score)}</td>
              <td style="color:var(--text-dim);font-size:0.8rem">${m.teacher?.name || '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderGradeDistribution(dist) {
  const el = document.getElementById('gradeDistChart');
  const total = Object.values(dist).reduce((a, b) => a + b, 0);
  const colors = { A: '#2dd4a0', B: '#4a9eff', C: '#e8a020', D: '#fb923c', E: '#f87171' };

  if (!total) {
    el.innerHTML = '<div class="empty-state"><div class="es-icon">📊</div><p>No data yet</p></div>';
    return;
  }

  el.innerHTML = ['A','B','C','D','E'].map(g => {
    const count = dist[g] || 0;
    const pct   = total ? Math.round((count / total) * 100) : 0;
    return `
      <div class="grade-bar-row">
        <span class="grade-bar-label" style="color:${colors[g]}">${g}</span>
        <div class="grade-bar-track">
          <div class="grade-bar-fill" style="width:0%;background:${colors[g]}" data-pct="${pct}"></div>
        </div>
        <span class="grade-bar-count">${count}</span>
      </div>
    `;
  }).join('');

  // Animate bars
  setTimeout(() => {
    document.querySelectorAll('.grade-bar-fill').forEach(bar => {
      bar.style.width = bar.dataset.pct + '%';
    });
  }, 100);
}
