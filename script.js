// Ocean Infra — basic interactions

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// Mobile navigation toggle
const navToggle = $('.nav-toggle');
const navMenu = $('#nav-menu');
if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const open = navMenu.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
  });
  // Close on link click (mobile)
  $$('#nav-menu a').forEach((a) => a.addEventListener('click', () => {
    navMenu.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }));
}

// Smooth scroll with offset for sticky header
const header = $('.site-header');
const headerOffset = () => (header ? header.getBoundingClientRect().height : 0);
$$('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const id = link.getAttribute('href');
    if (!id || id === '#' || id.startsWith('#!')) return;
    const target = $(id);
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - (headerOffset() + 8);
    window.scrollTo({ top, behavior: 'smooth' });
    history.pushState(null, '', id);
  });
});

// Year in footer
const yearEl = $('#year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

// Contact form fake submit
const form = $('#contact-form');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = /** @type {HTMLInputElement|null} */($('#name'))?.value?.trim() || 'there';
    toast(`Thanks, ${name}! We received your message.`);
    form.reset();
  });
}

function toast(message) {
  let t = document.createElement('div');
  t.textContent = message;
  t.setAttribute('role', 'status');
  t.style.position = 'fixed';
  t.style.zIndex = '9999';
  t.style.right = '12px';
  t.style.bottom = '12px';
  t.style.background = 'linear-gradient(135deg, #0a4d68, #0ea5a4)';
  t.style.color = '#fff';
  t.style.padding = '10px 14px';
  t.style.borderRadius = '10px';
  t.style.boxShadow = '0 8px 24px rgba(5,35,56,.2)';
  t.style.font = '600 14px/1.2 Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial';
  document.body.appendChild(t);
  setTimeout(() => {
    t.style.transition = 'opacity .4s ease, transform .4s ease';
    t.style.opacity = '0';
    t.style.transform = 'translateY(6px)';
    setTimeout(() => t.remove(), 450);
  }, 2200);
}

