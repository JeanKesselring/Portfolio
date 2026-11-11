const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ============================================================
   SMALL DYNAMIC BITS
   ============================================================ */
const projectSections = document.querySelectorAll('.project');
document.getElementById('countNum').textContent = String(projectSections.length).padStart(2, '0');
document.getElementById('year').textContent = new Date().getFullYear();

/* ============================================================
   CUSTOM CURSOR (mouse / trackpad only)
   ============================================================ */
const cursor = document.getElementById('cursor');
const cursorDot = document.getElementById('cursorDot');

if (finePointer && !reduceMotion) {
  root.classList.add('has-cursor');

  let mouseX = -100, mouseY = -100;
  let ringX = mouseX, ringY = mouseY;
  let running = false;

  const tick = () => {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    cursor.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
    if (Math.abs(mouseX - ringX) > 0.1 || Math.abs(mouseY - ringY) > 0.1) {
      requestAnimationFrame(tick);
    } else {
      running = false;
    }
  };

  document.addEventListener('mousemove', (e) => {
    if (!root.classList.contains('cursor-visible')) {
      ringX = e.clientX; ringY = e.clientY; // don't fly in from the corner
      root.classList.add('cursor-visible');
    }
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorDot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
    if (!running) { running = true; requestAnimationFrame(tick); }
  }, { passive: true });

  document.documentElement.addEventListener('mouseleave', () => root.classList.remove('cursor-visible'));

  const hoverSel = 'a, button, .media-item, .full-video, .drag-scroll';
  document.addEventListener('mouseover', (e) => {
    cursor.classList.toggle('hovering', !!e.target.closest(hoverSel));
  });
  document.addEventListener('mousedown', () => cursor.classList.add('clicking'));
  document.addEventListener('mouseup',   () => cursor.classList.remove('clicking'));
}

/* ============================================================
   SCROLL PROGRESS BAR + SCROLL-TO-TOP BUTTON
   ============================================================ */
const progressBar = document.getElementById('progress');

const scrollTopBtn = document.createElement('button');
scrollTopBtn.className = 'scroll-top';
scrollTopBtn.setAttribute('aria-label', 'Scroll to top');
scrollTopBtn.textContent = '↑';
document.body.appendChild(scrollTopBtn);
scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
});

let scrollQueued = false;
function onScroll() {
  const max = root.scrollHeight - window.innerHeight;
  progressBar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
  scrollTopBtn.classList.toggle('visible', window.scrollY > window.innerHeight * 0.8);
  scrollQueued = false;
}
window.addEventListener('scroll', () => {
  if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(onScroll); }
}, { passive: true });
onScroll();

/* ============================================================
   ACTIVE SECTION: accent colour + nav state
   A section counts as active while it crosses the middle of the
   viewport — works no matter how tall the section is.
   ============================================================ */
const navLinks = document.querySelectorAll('.nav-links a');
const defaultAccent = getComputedStyle(root).getPropertyValue('--accent').trim();

function setActive(section) {
  const accent = section?.style.getPropertyValue('--accent').trim() || defaultAccent;
  root.style.setProperty('--accent', accent);
  navLinks.forEach(link => {
    const on = !!section && link.getAttribute('href') === '#' + section.id;
    link.classList.toggle('active', on);
    if (on) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });
}

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      setActive(entry.target.classList.contains('project') ? entry.target : null);
    }
  });
}, { rootMargin: '-50% 0px -50% 0px' });

document.querySelectorAll('#hero, .project, #footer').forEach(s => sectionObserver.observe(s));

/* ============================================================
   HERO PARALLAX — blobs drift with the mouse
   (uses `translate`, which composes with the CSS float animation)
   ============================================================ */
if (finePointer && !reduceMotion) {
  const hero = document.getElementById('hero');
  const blobs = hero.querySelectorAll('.blob');
  hero.addEventListener('mousemove', (e) => {
    const rx = (e.clientX / window.innerWidth  - 0.5) * 2;
    const ry = (e.clientY / window.innerHeight - 0.5) * 2;
    blobs.forEach((blob, i) => {
      const depth = (i + 1) * 18;
      blob.style.translate = `${rx * depth}px ${ry * depth}px`;
    });
  }, { passive: true });
}

/* ============================================================
   REVEAL ON SCROLL (staggered per grid / gallery)
   ============================================================ */
document.querySelectorAll('.media-grid, .horizontal-scroll').forEach(group => {
  group.querySelectorAll('.reveal').forEach((item, i) => {
    item.style.transitionDelay = `${Math.min(i, 6) * 0.07}s`;
  });
});

function settle(el) {
  el.style.transitionDelay = '';
  el.classList.add('settled');
}

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    el.classList.add('visible');
    revealObserver.unobserve(el);
    // Drop the stagger delay once revealed so hover effects respond immediately
    const onEnd = (e) => {
      if (e.target !== el || e.propertyName !== 'opacity') return;
      el.removeEventListener('transitionend', onEnd);
      settle(el);
    };
    el.addEventListener('transitionend', onEnd);
    setTimeout(() => settle(el), 1600); // fallback
  });
}, { threshold: 0.05, rootMargin: '0px 200px -40px 200px' });

document.querySelectorAll('.reveal').forEach(el => {
  if (reduceMotion) { el.classList.add('visible'); settle(el); }
  else revealObserver.observe(el);
});

/* ============================================================
   TILT EFFECT on grid media (mouse only)
   ============================================================ */
if (finePointer && !reduceMotion) {
  document.querySelectorAll('.media-grid .media-item').forEach(item => {
    item.addEventListener('mousemove', (e) => {
      if (!item.classList.contains('settled')) return;
      const rect = item.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
      const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
      item.style.transform = `perspective(900px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg) scale(1.015)`;
    });
    item.addEventListener('mouseleave', () => { item.style.transform = ''; });
  });
}

/* ============================================================
   VIDEO AUTO-PLAY while on screen (skipped for reduced motion)
   ============================================================ */
const autoVideos = document.querySelectorAll('video.video-auto');

if (!reduceMotion) {
  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const v = entry.target;
      if (entry.isIntersecting && !lightbox.classList.contains('active')) {
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, { threshold: 0.25 });
  autoVideos.forEach(v => videoObserver.observe(v));
}

/* ============================================================
   LIGHTBOX — images and videos, with prev/next per project
   ============================================================ */
const lightbox        = document.getElementById('lightbox');
const lightboxContent = document.getElementById('lightboxContent');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxClose   = document.getElementById('lightboxClose');
const lightboxPrev    = document.getElementById('lightboxPrev');
const lightboxNext    = document.getElementById('lightboxNext');

let lbItems = [];
let lbIndex = 0;
let lbReturnFocus = null;

function mediaOf(item) {
  return item.matches('img, video') ? item : item.querySelector('img, video');
}

function captionOf(item) {
  const media = mediaOf(item);
  const fig = item.querySelector('figcaption');
  return (media.getAttribute('alt') || media.getAttribute('aria-label') || (fig && fig.textContent) || '').trim();
}

function renderLightbox() {
  const item = lbItems[lbIndex];
  const media = mediaOf(item);
  lightboxContent.textContent = '';

  let el;
  if (media.tagName === 'VIDEO') {
    el = document.createElement('video');
    el.src = media.currentSrc || media.src;
    el.poster = media.poster;
    el.controls = true;
    el.autoplay = true;
    el.loop = true;
    el.playsInline = true;
  } else {
    el = document.createElement('img');
    el.src = media.currentSrc || media.src;
    el.alt = media.alt;
  }
  lightboxContent.appendChild(el);

  const counter = lbItems.length > 1 ? `${lbIndex + 1} / ${lbItems.length}` : '';
  lightboxCaption.textContent = [captionOf(item), counter].filter(Boolean).join('  ·  ');
  lightboxPrev.hidden = lightboxNext.hidden = lbItems.length < 2;
}

function openLightbox(item) {
  const scope = item.closest('.project') || document;
  lbItems = [...scope.querySelectorAll('.media-item')];
  lbIndex = Math.max(0, lbItems.indexOf(item));
  lbReturnFocus = document.activeElement;

  renderLightbox();
  lightbox.hidden = false;
  requestAnimationFrame(() => lightbox.classList.add('active'));
  document.body.style.overflow = 'hidden';
  autoVideos.forEach(v => v.pause());
  lightboxClose.focus({ preventScroll: true });
}

function closeLightbox() {
  if (lightbox.hidden) return;
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
  const v = lightboxContent.querySelector('video');
  if (v) v.pause();
  setTimeout(() => {
    lightbox.hidden = true;
    lightboxContent.textContent = '';
  }, 300);
  if (lbReturnFocus) lbReturnFocus.focus({ preventScroll: true });
}

function stepLightbox(dir) {
  if (lbItems.length < 2) return;
  lbIndex = (lbIndex + dir + lbItems.length) % lbItems.length;
  renderLightbox();
}

document.querySelectorAll('.media-item').forEach(item => {
  item.setAttribute('tabindex', '0');
  item.setAttribute('role', 'button');
  if (!item.hasAttribute('aria-label')) {
    item.setAttribute('aria-label', `Open: ${captionOf(item)}`);
  }
  item.addEventListener('click', () => openLightbox(item));
  item.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(item); }
  });
});

lightboxClose.addEventListener('click', closeLightbox);
lightboxPrev.addEventListener('click', () => stepLightbox(-1));
lightboxNext.addEventListener('click', () => stepLightbox(1));
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox || e.target === lightboxContent) closeLightbox();
});

document.addEventListener('keydown', (e) => {
  if (lightbox.hidden) return;
  if (e.key === 'Escape') closeLightbox();
  else if (e.key === 'ArrowLeft') stepLightbox(-1);
  else if (e.key === 'ArrowRight') stepLightbox(1);
  else if (e.key === 'Tab') {
    // keep focus inside the dialog
    const focusables = [...lightbox.querySelectorAll('button:not([hidden]), video')];
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

// Swipe between items on touch screens
let touchX = null;
lightbox.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
lightbox.addEventListener('touchend', (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) stepLightbox(dx < 0 ? 1 : -1);
  touchX = null;
}, { passive: true });

/* ============================================================
   HORIZONTAL GALLERIES — mouse drag, buttons, no click-after-drag
   ============================================================ */
document.querySelectorAll('.gallery').forEach(gallery => {
  const wrap = gallery.querySelector('.drag-scroll');
  const [prevBtn, nextBtn] = gallery.querySelectorAll('.gallery-btn');

  const updateButtons = () => {
    const max = wrap.scrollWidth - wrap.clientWidth - 2;
    prevBtn.disabled = wrap.scrollLeft <= 2;
    nextBtn.disabled = wrap.scrollLeft >= max;
  };

  [prevBtn, nextBtn].forEach(btn => btn.addEventListener('click', () => {
    wrap.scrollBy({ left: Number(btn.dataset.dir) * wrap.clientWidth * 0.8, behavior: reduceMotion ? 'auto' : 'smooth' });
  }));

  wrap.addEventListener('scroll', updateButtons, { passive: true });
  window.addEventListener('resize', updateButtons);
  updateButtons();
  // images load lazily and change scrollWidth
  wrap.querySelectorAll('img').forEach(img => img.addEventListener('load', updateButtons, { once: true }));

  // Mouse drag (touch already scrolls natively)
  let startX = 0, startScroll = 0, pressed = false, moved = false;

  wrap.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    pressed = true;
    moved = false;
    startX = e.clientX;
    startScroll = wrap.scrollLeft;
  });

  wrap.addEventListener('pointermove', (e) => {
    if (!pressed) return;
    const dx = e.clientX - startX;
    if (!moved && Math.abs(dx) > 5) {
      moved = true;
      wrap.classList.add('dragging');
      wrap.setPointerCapture(e.pointerId);
    }
    if (moved) wrap.scrollLeft = startScroll - dx;
  });

  const endDrag = (e) => {
    if (!pressed) return;
    pressed = false;
    wrap.classList.remove('dragging');
    if (wrap.hasPointerCapture?.(e.pointerId)) wrap.releasePointerCapture(e.pointerId);
  };
  wrap.addEventListener('pointerup', endDrag);
  wrap.addEventListener('pointercancel', endDrag);

  // Swallow the click that follows a drag so it doesn't open the lightbox
  wrap.addEventListener('click', (e) => {
    if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; }
  }, true);

  wrap.addEventListener('dragstart', (e) => e.preventDefault());
});

/* ============================================================
   SCRAMBLE TITLE TEXT on first scroll into view
   Works on text nodes only, so <br> line breaks survive.
   ============================================================ */
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function scramble(el) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push({ node: walker.currentNode, text: walker.currentNode.nodeValue });

  const total = nodes.reduce((n, t) => n + t.text.length, 0);
  const totalFrames = Math.min(total * 3, 60);
  let frame = 0;

  const id = setInterval(() => {
    const progress = frame / totalFrames;
    let offset = 0;
    nodes.forEach(({ node, text }) => {
      node.nodeValue = text.split('').map((ch, i) => {
        const pos = (offset + i) / total;
        if (/\s/.test(ch) || pos < progress) return ch;
        return CHARS[Math.floor(Math.random() * CHARS.length)];
      }).join('');
      offset += text.length;
    });

    if (++frame > totalFrames) {
      nodes.forEach(({ node, text }) => { node.nodeValue = text; });
      clearInterval(id);
    }
  }, 28);
}

if (!reduceMotion) {
  const titleObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        scramble(entry.target);
        titleObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });

  document.querySelectorAll('.project-title').forEach(t => titleObserver.observe(t));
}
