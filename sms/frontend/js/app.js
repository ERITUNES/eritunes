/* ============================================
   APP.JS — Main router & initialization
   ============================================ */

// ── NAVIGATION CONFIG PER ROLE ──
const NAV_CONFIG = {
  ADMIN: [
    { section: 'Overview' },
    { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
    { section: 'Administration' },
    { id: 'schools',   icon: '🏫', label: 'Schools' },
    { id: 'users',     icon: '👥', label: 'Users' },
    { section: 'Academic' },
    { id: 'students',  icon: '🧑‍🎓', label: 'Students' },
    { id: 'results',   icon: '📈', label: 'Results & Analytics' },
  ],
  DOS: [
    { section: 'Overview' },
    { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
    { section: 'Academic Management' },
    { id: 'students',  icon: '🧑‍🎓', label: 'Students' },
    { id: 'marks',     icon: '📝', label: 'Marks' },
    { id: 'results',   icon: '📈', label: 'Results & Analytics' },
  ],
  HM: [
    { section: 'Overview' },
    { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
    { section: 'Academic Management' },
    { id: 'students',  icon: '🧑‍🎓', label: 'Students' },
    { id: 'marks',     icon: '📝', label: 'Marks' },
    { id: 'results',   icon: '📈', label: 'Results & Analytics' },
  ],
  TEACHER: [
    { section: 'Overview' },
    { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
    { section: 'My Work' },
    { id: 'students',  icon: '🧑‍🎓', label: 'My Students' },
    { id: 'marks',     icon: '📝', label: 'Upload Marks' },
  ],
};

let _currentPage = 'dashboard';

// ── NAVIGATION ──
function buildNav() {
  const nav    = document.getElementById('sidebarNav');
  const config = NAV_CONFIG[currentUser.role] || NAV_CONFIG.TEACHER;
  nav.innerHTML = config.map(item => {
    if (item.section) {
      return `<div class="nav-section-label">${item.section}</div>`;
    }
    return `
      <div class="nav-item" id="nav-${item.id}" onclick="navigate('${item.id}')">
        <span class="nav-icon">${item.icon}</span>
        <span>${item.label}</span>
      </div>
    `;
  }).join('');
}

function navigate(page) {
  _currentPage = page;
  // Update active nav item
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const active = document.getElementById(`nav-${page}`);
  if (active) active.classList.add('active');

  // Close sidebar on mobile
  if (Device.current === 'mobile') closeSidebar();

  // Render page
  const pages = {
    dashboard: renderDashboard,
    schools:   renderSchools,
    users:     renderUsers,
    students:  renderStudents,
    marks:     renderMarks,
    results:   renderResults,
  };

  if (pages[page]) pages[page]();
  else {
    document.getElementById('content').innerHTML = `
      <div class="empty-state" style="padding:80px 20px">
        <div class="es-icon">🚧</div>
        <p>Page not found</p>
      </div>
    `;
  }
}

function setTopbarTitle(title) {
  const el = document.getElementById('topbarTitle');
  if (el) el.textContent = title;
}

// ── SIDEBAR USER INFO ──
function populateSidebarUser() {
  if (!currentUser) return;
  document.getElementById('userNameSidebar').textContent = currentUser.name;
  document.getElementById('userRoleSidebar').textContent = {
    ADMIN: '🛡️ System Admin',
    DOS:   '📋 Director of Studies',
    HM:    '🏫 Headmaster',
    TEACHER: '👨‍🏫 Teacher',
  }[currentUser.role] || currentUser.role;
  document.getElementById('userAvatarSidebar').textContent = currentUser.name.charAt(0).toUpperCase();
  document.getElementById('topbarAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
}

// ── FLOATERS ON LOGIN ──
function spawnFloaters() {
  const symbols = ['📚','✏️','🎓','🔬','📐','🌍','🧮','📖','🏫','🔭','📏','📊'];
  const container = document.getElementById('floaters');
  if (!container) return;
  for (let i = 0; i < 10; i++) {
    const el = document.createElement('div');
    el.className = 'floater';
    el.textContent = symbols[i % symbols.length];
    el.style.cssText = `
      left: ${Math.random() * 95}%;
      top: ${80 + Math.random() * 20}%;
      font-size: ${1.5 + Math.random() * 1.5}rem;
      animation-duration: ${14 + Math.random() * 12}s;
      animation-delay: -${Math.random() * 14}s;
    `;
    container.appendChild(el);
  }
}

// ── APP INIT ──
function initApp() {
  // Show app shell
  document.getElementById('loginPage').classList.remove('active');
  document.getElementById('appShell').classList.add('active');

  populateSidebarUser();
  buildNav();
  Device.apply();
  navigate('dashboard');
}

// ── BOOT ──
document.addEventListener('DOMContentLoaded', () => {
  spawnFloaters();

  // Re-attach enter key on login
  document.getElementById('loginEmail')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('loginPass').focus();
  });

  if (checkSession()) {
    initApp();
  } else {
    document.getElementById('loginPage').classList.add('active');
  }
});
