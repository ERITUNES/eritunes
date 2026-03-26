/* ============================================
   AUTH.JS — Login, logout, session management
   ============================================ */
let currentUser = null;

async function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass  = document.getElementById('loginPass').value;
  const btn   = document.getElementById('loginBtn');
  const txt   = document.getElementById('loginBtnText');

  if (!email || !pass) { toast('Enter email and password', 'warning'); return; }

  btn.disabled = true;
  txt.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;margin:0 auto"></div>';

  try {
    const data = await api.post('/auth/login', { email, password: pass });
    localStorage.setItem('sms_token', data.token);
    localStorage.setItem('sms_user', JSON.stringify(data.user));
    currentUser = data.user;
    toast(`Welcome back, ${currentUser.name.split(' ')[0]}! 👋`, 'success');
    initApp();
  } catch (err) {
    toast(err.message || 'Login failed', 'error');
    btn.disabled = false;
    txt.textContent = 'Sign In';
  }
}

function doLogout() {
  localStorage.removeItem('sms_token');
  localStorage.removeItem('sms_user');
  currentUser = null;
  document.getElementById('appShell').classList.remove('active');
  document.getElementById('loginPage').classList.add('active');
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPass').value = '';
  document.getElementById('loginBtnText').textContent = 'Sign In';
  document.getElementById('loginBtn').disabled = false;
  toast('Signed out successfully', 'info');
}

function checkSession() {
  const token = localStorage.getItem('sms_token');
  const user  = localStorage.getItem('sms_user');
  if (token && user) {
    currentUser = JSON.parse(user);
    return true;
  }
  return false;
}

function hasRole(...roles) {
  return roles.includes(currentUser?.role);
}

// Allow Enter key on login
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('loginPage').classList.contains('active')) {
    doLogin();
  }
});
