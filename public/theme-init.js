/**
 * Theme Initialization Script
 * Chạy trước khi React hydration để tránh flash
 */
(function() {
  try {
    var stored = localStorage.getItem('theme');
    var theme = stored;
    if (!theme || theme === 'system') {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  } catch(e) {}
})();
