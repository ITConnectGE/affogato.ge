(() => {
  // Stories by Affogato — ორშ–კვი 09:00–22:00 (თბილისის დროით)
  const STORIES_OPEN = 9 * 60;
  const STORIES_CLOSE = 22 * 60;

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
  const statusEl = document.getElementById('status-stories');
  function renderStatus() {
    if (!statusEl) return;
    const [h, m] = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Tbilisi', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).format(new Date()).split(':').map(Number);
    const now = h * 60 + m;
    const open = now >= STORIES_OPEN && now < STORIES_CLOSE;
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

  /* ---------- "new" carousel ---------- */
  const track = document.getElementById('news-track');
  document.querySelectorAll('[data-scroll]').forEach((b) => {
    b.addEventListener('click', () => {
      const card = track.querySelector('.news-card');
      const step = card ? card.getBoundingClientRect().width + 20 : 320;
      track.scrollBy({ left: step * Number(b.dataset.scroll), behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  /* ---------- affogato pour ---------- */
  const glass = document.querySelector('.affogato');
  function pour() {
    glass.classList.remove('is-playing');
    void glass.getBoundingClientRect();
    glass.classList.add('is-playing');
  }
  glass.addEventListener('click', pour);

  /* ---------- scroll-driven: reveal, pour, videos ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  const videos = document.querySelectorAll('.auto-video');

  /* ---------- video sound: hover to listen (desktop), buttons on reels ---------- */
  // Browsers allow sound only after the visitor has clicked/tapped the page once;
  // until then hovering shows a hint instead.
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const soundUnlocked = () => !navigator.userActivation || navigator.userActivation.hasBeenActive;
  let hovered = null;

  function syncButton(v) {
    const b = v.parentElement.querySelector('.reel-sound');
    if (!b) return;
    b.setAttribute('aria-pressed', String(!v.muted));
    b.textContent = v.muted ? '🔇' : '🔊';
  }
  function mute(v) {
    v.muted = true;
    syncButton(v);
  }
  function unmute(v) {
    videos.forEach((o) => { if (o !== v && !o.muted) mute(o); });
    v.muted = false;
    v.parentElement.classList.remove('need-click');
    v.play().catch(() => mute(v)); // blocked by the browser → stay muted
    syncButton(v);
  }

  videos.forEach((v) => {
    const box = v.parentElement;
    if (!canHover) return;
    box.addEventListener('mouseenter', () => {
      hovered = v;
      if (soundUnlocked()) unmute(v);
      else box.classList.add('need-click');
    });
    box.addEventListener('mouseleave', () => {
      if (hovered === v) hovered = null;
      box.classList.remove('need-click');
      mute(v);
    });
  });

  // the first click unlocks sound — start the video under the cursor right away
  document.addEventListener('pointerdown', (e) => {
    if (!hovered || !hovered.muted || e.target.closest('.reel-sound')) return;
    const v = hovered;
    setTimeout(() => unmute(v), 0);
  }, true);

  document.querySelectorAll('.reel-sound').forEach((b) => {
    b.addEventListener('click', () => {
      const v = b.parentElement.querySelector('video');
      if (v.muted) unmute(v);
      else mute(v);
    });
  });

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));

    const glassIO = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) { pour(); glassIO.disconnect(); }
    }, { threshold: 0.5 });
    glassIO.observe(glass);

    if (!reduceMotion) {
      const vio = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          const v = en.target;
          if (en.isIntersecting) v.play().catch(() => {});
          else v.pause();
        });
      }, { threshold: 0.25 });
      videos.forEach((v) => vio.observe(v));
    }
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
    glass.classList.add('is-playing');
  }

  document.getElementById('year').textContent = new Date().getFullYear();
  setLang(store.get('affogato-lang') === 'en' ? 'en' : 'ka');
})();
