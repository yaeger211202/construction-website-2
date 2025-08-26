document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('primary-nav');
  const year = document.getElementById('year');

  if (year) {
    year.textContent = new Date().getFullYear().toString();
  }

  const setHeaderScrolled = () => {
    if (window.scrollY > 10) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  };
  setHeaderScrolled();
  window.addEventListener('scroll', setHeaderScrolled, { passive: true });

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const isOpen = header?.classList.toggle('open');
      const expanded = Boolean(isOpen);
      toggle.setAttribute('aria-expanded', expanded.toString());
    });

    nav.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', () => {
        header?.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
});

