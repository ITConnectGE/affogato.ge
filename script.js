(() => {
  // TODO: რეალური სამუშაო საათები (თბილისის დროით)
  const OPEN = 9 * 60;
  const CLOSE = 22 * 60;

  const root = document.documentElement;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
  };

  /* ---------- language ---------- */
  const translatable = document.querySelectorAll('[data-en]');
  const langButtons = document.querySelectorAll('[data-lang]');
  let lang = 'ka';

  function setLang(next) {
    lang = next;
    translatable.forEach((el) => {
      if (el.dataset.ka === undefined) el.dataset.ka = el.innerHTML;
      el.innerHTML = next === 'en' ? el.dataset.en : el.dataset.ka;
    });
    root.lang = next;
    langButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === next)));
    store.set('affogato-lang', next);
    renderStatus();
  }
  langButtons.forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));

  /* ---------- open / closed ---------- */
  const statusEl = document.getElementById('status');
  function renderStatus() {
    if (!statusEl) return;
    const [h, m] = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Tbilisi', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).format(new Date()).split(':').map(Number);
    const now = h * 60 + m;
    const open = now >= OPEN && now < CLOSE;
    statusEl.className = 'status ' + (open ? 'open' : 'closed');
    statusEl.textContent = open
      ? (lang === 'en' ? 'Open now' : 'ახლა ღიაა')
      : (lang === 'en' ? 'Closed now' : 'ახლა დაკეტილია');
  }
  setInterval(renderStatus, 60000);

  /* ---------- mobile nav ---------- */
  const burger = document.querySelector('.burger');
  const links = document.getElementById('nav-links');
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') !== 'true';
    burger.setAttribute('aria-expanded', String(open));
    links.classList.toggle('open', open);
  });
  links.addEventListener('click', (e) => {
    if (e.target.closest('a')) {
      burger.setAttribute('aria-expanded', 'false');
      links.classList.remove('open');
    }
  });

  /* ---------- menu tabs ---------- */
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  function selectTab(tab) {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(t));
    t.addEventListener('keydown', (e) => {
      const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!dir) return;
      const next = tabs[(i + dir + tabs.length) % tabs.length];
      selectTab(next);
      next.focus();
    });
  });

  /* ---------- replay the pour ---------- */
  const glass = document.querySelector('.affogato');
  glass.addEventListener('click', () => {
    glass.classList.remove('is-playing');
    void glass.getBoundingClientRect();
    glass.classList.add('is-playing');
  });

  /* ---------- scroll reveal ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
  }

  document.getElementById('year').textContent = new Date().getFullYear();
  setLang(store.get('affogato-lang') === 'en' ? 'en' : 'ka');
})();
