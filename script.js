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

  // Chat widget behavior
  const chatFab = document.getElementById('chat-fab');
  const chatPanel = document.getElementById('chat-panel');
  const chatClose = document.getElementById('chat-close');
  const chatSend = document.getElementById('chat-send');
  const chatMessage = document.getElementById('chat-message');
  const chatName = document.getElementById('chat-name');
  const chatPhone = document.getElementById('chat-phone');
  const chatStatus = document.getElementById('chat-status');

  const setChatOpen = (open) => {
    if (!chatPanel || !chatFab) return;
    chatPanel.classList.toggle('open', open);
    chatFab.setAttribute('aria-expanded', open ? 'true' : 'false');
  };

  chatFab?.addEventListener('click', () => {
    const open = !chatPanel?.classList.contains('open');
    setChatOpen(open);
  });
  chatClose?.addEventListener('click', () => setChatOpen(false));

  chatSend?.addEventListener('click', async () => {
    if (!chatMessage?.value.trim()) {
      chatStatus.textContent = 'Please enter a message.';
      return;
    }
    chatStatus.textContent = 'Sending...';
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: chatMessage.value,
          name: chatName?.value || '',
          phone: chatPhone?.value || ''
        })
      });
      if (!res.ok) throw new Error('Failed');
      chatStatus.textContent = 'Sent! We will contact you soon.';
      chatMessage.value = '';
    } catch (e) {
      chatStatus.textContent = 'Could not send. Please try again later.';
    }
  });
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

