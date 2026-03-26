/* ============================================
   DEVICE.JS — Device detection & responsive UI
   ============================================ */
const Device = (() => {
  let current = 'desktop';

  function detect() {
    const w = window.innerWidth;
    if (w <= 640)  current = 'mobile';
    else if (w <= 900) current = 'tablet';
    else           current = 'desktop';
    return current;
  }

  function badge() {
    const icons = { mobile: '📱', tablet: '📟', desktop: '💻' };
    const labels = { mobile: 'Mobile', tablet: 'Tablet', desktop: 'Desktop' };
    return { icon: icons[current], label: labels[current] };
  }

  function apply() {
    detect();
    const el = document.getElementById('deviceBadge');
    if (el) {
      const b = badge();
      el.textContent = b.icon;
      el.title = `Device: ${b.label}`;
    }
    // Mobile: collapse sidebar
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      if (current === 'mobile') sidebar.classList.remove('open');
    }
  }

  window.addEventListener('resize', () => {
    clearTimeout(Device._resizeTimer);
    Device._resizeTimer = setTimeout(apply, 120);
  });

  return { detect, apply, badge, get current() { return current; } };
})();
