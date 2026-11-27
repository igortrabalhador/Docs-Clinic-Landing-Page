// DOCS Clinic: the page's own behaviour (the kit's system.js, motion.js and layout.js do the rest).
// 1. film dialog: Instagram reels open on demand, never autoplay with sound
// 2. Google reviews carousel on phones and tablets: drag 1:1, flick with momentum, spring to rest,
//    auto-advance every 5.5 s with a pause button, paused while touched or focused
// 3. CTA clicks go to the GTM dataLayer for the traffic manager
// 4. before/after range for the (compliance-gated) real cases section, when it is switched on

const reduce = matchMedia('(prefers-reduced-motion: reduce)');

/* ---------------------------------------------------------------- 1. film dialog */
const dialog = document.querySelector('dialog.film');
if (dialog) {
  const frame = dialog.querySelector('.film__frame');
  const title = dialog.querySelector('.film__title');
  const out = dialog.querySelector('.film__out');
  let opener = null;

  const open = (btn) => {
    const id = btn.dataset.reel;
    opener = btn;
    title.textContent = btn.dataset.reelTitle || 'Vídeo';
    out.href = `https://www.instagram.com/reel/${id}/`;
    frame.innerHTML = '<p class="film__state">Carregando o vídeo…</p>';
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.instagram.com/reel/${id}/embed/`;
    iframe.title = btn.dataset.reelTitle || 'Vídeo do Instagram';
    iframe.allow = 'encrypted-media; picture-in-picture';
    iframe.loading = 'eager';
    const fail = setTimeout(() => { frame.querySelector('.film__state')?.replaceChildren('O vídeo não carregou aqui. Use o link abaixo para assistir no Instagram.'); }, 12000);
    iframe.addEventListener('load', () => clearTimeout(fail), { once: true });
    frame.append(iframe);
    // the dialog grows out of the control that opened it (spatial consistency)
    const r = btn.getBoundingClientRect();
    dialog.style.setProperty('--from-x', `${Math.round(r.left + r.width / 2 - innerWidth / 2)}px`);
    dialog.style.setProperty('--from-y', `${Math.round(r.top + r.height / 2 - innerHeight / 2)}px`);
    dialog.showModal();
    push('video_open', { video_id: id });
  };

  const close = () => {
    if (!dialog.open || dialog.classList.contains('is-closing')) return;
    const done = () => { dialog.classList.remove('is-closing'); dialog.close(); frame.innerHTML = ''; opener?.focus(); };
    if (reduce.matches) return done();
    dialog.classList.add('is-closing');
    dialog.addEventListener('animationend', done, { once: true });
    setTimeout(() => dialog.open && done(), 400);
  };

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-reel]');
    if (btn) { e.preventDefault(); open(btn); }
  });
  dialog.querySelector('.film__close').addEventListener('click', close);
  dialog.addEventListener('cancel', (e) => { e.preventDefault(); close(); });          // Escape goes back the same way
  dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); });      // a tap on the backdrop
}

/* ---------------------------------------------------------------- 2. reviews carousel */
document.querySelectorAll('[data-carousel]').forEach((root) => {
  const viewport = root.querySelector('.reviews__viewport');
  const track = root.querySelector('.reviews__track');
  const slides = [...track.children];
  const dotsBox = root.querySelector('.reviews__dots');
  const pauseBtn = root.querySelector('.reviews__pause');
  const narrow = matchMedia('(max-width: 1023px)');
  const DWELL = 5500;
  let index = 0, x = 0, v = 0, target = 0, raf = 0, timer = 0;
  let userPaused = false, holding = false;

  const width = () => viewport.clientWidth;
  const dots = slides.map((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', `Avaliação ${i + 1} de ${slides.length}`);
    b.addEventListener('click', () => { go(i); restart(); });
    dotsBox.append(b);
    return b;
  });

  const paint = () => { track.style.transform = `translate3d(${x}px,0,0)`; };
  const mark = () => {
    dots.forEach((d, i) => d.setAttribute('aria-current', String(i === index)));
    slides.forEach((s, i) => { s.inert = narrow.matches && i !== index; s.setAttribute('aria-hidden', String(narrow.matches && i !== index)); });
  };

  // critically damped spring (Apple: damping 1.0, response ~0.4 s), started from the live value and velocity
  const spring = () => {
    cancelAnimationFrame(raf);
    if (reduce.matches) { x = target; v = 0; paint(); return; }
    const response = 0.42, k = Math.pow((2 * Math.PI) / response, 2), c = 2 * Math.sqrt(k);
    let last = performance.now();
    const step = (now) => {
      const dt = Math.min(0.032, (now - last) / 1000); last = now;
      const a = -k * (x - target) - c * v;
      v += a * dt; x += v * dt;
      if (Math.abs(x - target) < 0.4 && Math.abs(v) < 4) { x = target; v = 0; paint(); return; }
      paint(); raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  };

  const go = (i) => {
    index = (i + slides.length) % slides.length;
    target = -index * width();
    mark(); spring();
  };

  const stop = () => { clearTimeout(timer); timer = 0; };
  const restart = () => {
    stop();
    if (!narrow.matches || userPaused || holding || reduce.matches || document.hidden) return;
    timer = setTimeout(() => { go(index + 1); restart(); }, DWELL);
  };

  // drag: 1:1 tracking from where it was grabbed, momentum projected to choose the slide
  let startX = 0, startPos = 0, hist = [], dragging = false, decided = false, startY = 0;
  viewport.addEventListener('pointerdown', (e) => {
    if (!narrow.matches || e.button > 0) return;
    cancelAnimationFrame(raf);
    holding = true; stop();
    dragging = true; decided = false;
    startX = e.clientX; startY = e.clientY; startPos = x; hist = [[e.timeStamp, e.clientX]];
  });
  viewport.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX, dy = e.clientY - startY;
    if (!decided) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;           // hysteresis before committing
      decided = true;
      if (Math.abs(dy) > Math.abs(dx)) { dragging = false; holding = false; restart(); return; }   // a vertical scroll wins
      viewport.setPointerCapture(e.pointerId);
    }
    const min = -(slides.length - 1) * width();
    let next = startPos + dx;
    if (next > 0) next = rubber(next, width());                        // soft edges, never a hard stop
    else if (next < min) next = min - rubber(min - next, width());
    x = next; paint();
    hist.push([e.timeStamp, e.clientX]); if (hist.length > 6) hist.shift();
  });
  const release = (e) => {
    if (!dragging) { holding = false; return; }
    dragging = false; holding = false;
    const [t0, x0] = hist[0], [t1, x1] = hist[hist.length - 1];
    v = t1 > t0 ? ((x1 - x0) / (t1 - t0)) * 1000 : 0;                // px/s, handed to the spring
    const projected = x + project(v);
    const i = Math.round(-projected / width());
    index = Math.max(0, Math.min(slides.length - 1, i));
    target = -index * width();
    mark(); spring(); restart();
  };
  viewport.addEventListener('pointerup', release);
  viewport.addEventListener('pointercancel', release);

  // pause while touched, hovered or focused; the button pauses for good
  root.addEventListener('mouseenter', () => { holding = true; stop(); });
  root.addEventListener('mouseleave', () => { holding = false; restart(); });
  root.addEventListener('focusin', () => { holding = true; stop(); });
  root.addEventListener('focusout', (e) => { if (!root.contains(e.relatedTarget)) { holding = false; restart(); } });
  pauseBtn.addEventListener('click', () => {
    userPaused = !userPaused;
    pauseBtn.setAttribute('aria-pressed', String(userPaused));
    pauseBtn.setAttribute('aria-label', userPaused ? 'Retomar a troca automática' : 'Pausar a troca automática');
    restart();
  });
  root.addEventListener('keydown', (e) => {
    if (!narrow.matches) return;
    if (e.key === 'ArrowRight') { go(index + 1); restart(); }
    if (e.key === 'ArrowLeft') { go(index - 1); restart(); }
  });
  document.addEventListener('visibilitychange', restart);

  const layout = () => {
    cancelAnimationFrame(raf);
    if (narrow.matches) { x = target = -index * width(); paint(); }
    else { x = target = 0; track.style.transform = ''; }
    mark(); restart();
  };
  narrow.addEventListener('change', layout);
  addEventListener('resize', () => { if (narrow.matches) { x = target = -index * width(); paint(); } });
  layout();
});

// Apple's projection (Designing Fluid Interfaces): where a flick would come to rest
function project(velocity, rate = 0.998) { return ((velocity / 1000) * rate) / (1 - rate); }
function rubber(over, dim, c = 0.55) { return (over * dim * c) / (dim + c * Math.abs(over)); }

/* ---------------------------------------------------------------- 3. CTA events for GTM */
function push(event, data = {}) { (window.dataLayer = window.dataLayer || []).push({ event, ...data }); }
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-cta]');
  if (a) push('cta_agendar_avaliacao', { cta_location: a.dataset.cta, cta_url: a.href });
});

/* ---------------------------------------------------------------- 5. map facade: the Google map loads on a tap */
document.querySelectorAll('.loc__load').forEach((btn) => {
  btn.addEventListener('click', () => {
    const box = btn.closest('.loc__map');
    const iframe = document.createElement('iframe');
    iframe.src = btn.dataset.mapSrc;
    iframe.title = btn.dataset.mapTitle;
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.width = 760; iframe.height = 520;
    box.prepend(iframe);
    box.classList.add('is-live');
    iframe.focus?.();
    push('map_open');
  });
});

/* ---------------------------------------------------------------- 6. ticker pause (moves longer than 5 s) */
document.querySelectorAll('.ticker').forEach((t) => {
  const b = t.querySelector('.ticker__pause');
  b?.addEventListener('click', () => {
    const paused = t.classList.toggle('is-paused');
    b.setAttribute('aria-pressed', String(paused));
    b.setAttribute('aria-label', paused ? 'Retomar a faixa de tratamentos' : 'Pausar a faixa de tratamentos');
  });
});

/* ---------------------------------------------------------------- 4. before/after (casos reais) */
document.querySelectorAll('.ba').forEach((ba) => {
  const range = ba.querySelector('.ba__range');
  range?.addEventListener('input', () => ba.style.setProperty('--pos', `${range.value}%`));
});
