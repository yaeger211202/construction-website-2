document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('primary-nav');
  const overlay = document.querySelector('.nav-overlay');
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

    overlay?.addEventListener('click', () => {
      header?.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  }

  // Scroll reveal animations
  const revealElements = Array.from(document.querySelectorAll('[data-reveal]'));
  if ('IntersectionObserver' in window && revealElements.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

    revealElements.forEach((el, index) => {
      el.style.transitionDelay = `${Math.min(index * 60, 240)}ms`;
      observer.observe(el);
    });
  } else {
    // Fallback if IntersectionObserver not supported
    revealElements.forEach((el) => el.classList.add('revealed'));
  }
});

