/* ============================================
   UI.JS — UI helpers: toast, modal, sidebar
   ============================================ */

/* ── TOAST ── */
function toast(message, type = 'info', duration = 3500) {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-msg">${message}</span>`;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => {
    el.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => el.remove(), 300);
  }, duration);
}

/* ── MODAL ── */
function openModal(title, bodyHTML, onConfirm = null, confirmLabel = 'Save') {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = bodyHTML +
    (onConfirm ? `<div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="(${onConfirm.toString()})()">${confirmLabel}</button>
    </div>` : '');
  document.getElementById('modal').classList.add('open');
}

function closeModal() {
  document.getElementById('modal').classList.remove('open');
}

function closeModalOverlay(e) {
  if (e.target.id === 'modal') closeModal();
}

/* ── SIDEBAR ── */
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sidebarOverlay');
  sb.classList.toggle('open');
  ov.classList.toggle('open');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
}

/* ── LOADING ── */
function showLoading(containerId) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = '<div class="loading-wrap"><div class="spinner"></div></div>';
}

function setContent(containerId, html) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = html;
}

/* ── ANIMATE NUMBERS ── */
function animNum(el, target) {
  if (typeof target !== 'number') { el.textContent = target; return; }
  let c = 0;
  const step = Math.max(1, Math.ceil(target / 30));
  const iv = setInterval(() => {
    c = Math.min(c + step, target);
    el.textContent = c;
    if (c >= target) clearInterval(iv);
  }, 28);
}

/* ── BADGE HELPERS ── */
function roleBadge(role) {
  const labels = { ADMIN: '🛡️ Admin', DOS: '📋 DOS', HM: '🏫 H.M', TEACHER: '👨‍🏫 Teacher' };
  return `<span class="badge role-${role}">${labels[role] || role}</span>`;
}

function typeBadge(type) {
  const cls = type === 'PRIMARY' ? 'type-primary' : 'type-secondary';
  return `<span class="badge ${cls}">${type}</span>`;
}

function gradeBadge(grade) {
  return `<span class="badge grade-${grade}" style="font-weight:700;font-size:0.82rem">${grade}</span>`;
}

/* ── CONFIRM ── */
function confirmDelete(label, onConfirm) {
  openModal(`Delete ${label}?`,
    `<p style="color:var(--text);line-height:1.6">Are you sure you want to delete <strong style="color:var(--cream)">${label}</strong>? This action cannot be undone.</p>`,
    onConfirm, '🗑️ Delete'
  );
}

/* ── TRUNCATE ── */
function trunc(str, n = 30) {
  return str && str.length > n ? str.slice(0, n) + '…' : str;
}

/* ── SCHOOL NUMBER TAG ── */
function schNum(num) {
  return `<span class="mono badge badge-dim">${num}</span>`;
}
