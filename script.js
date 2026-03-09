/* ============================================================
   CUSTOM CURSOR
   ============================================================ */
const cursor = document.getElementById('cursor');
const cursorDot = document.getElementById('cursorDot');

let mouseX = 0, mouseY = 0;
let cursorX = 0, cursorY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  cursorDot.style.left = mouseX + 'px';
  cursorDot.style.top = mouseY + 'px';
});

(function animateCursor() {
  cursorX += (mouseX - cursorX) * 0.11;
  cursorY += (mouseY - cursorY) * 0.11;
  cursor.style.left = cursorX + 'px';
  cursor.style.top = cursorY + 'px';
  requestAnimationFrame(animateCursor);
})();

document.querySelectorAll('a, button, .media-item, .project-link, .nav-logo').forEach(el => {
  el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
  el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
});

document.addEventListener('mousedown', () => cursor.classList.add('clicking'));
document.addEventListener('mouseup',   () => cursor.classList.remove('clicking'));

/* ============================================================
   SCROLL PROGRESS BAR
   ============================================================ */
const progressBar = document.getElementById('progress');

window.addEventListener('scroll', () => {
  const pct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight) * 100;
  progressBar.style.width = pct + '%';
}, { passive: true });

/* ============================================================
   SECTION ACCENT COLOR (updates --accent on :root per section)
   ============================================================ */
const projectSections = document.querySelectorAll('.project');

const accentObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const accent = entry.target.style.getPropertyValue('--accent');
      if (accent) {
        document.documentElement.style.setProperty('--accent', accent.trim());
        progressBar.style.background = accent.trim();
      }
    }
  });
}, { threshold: 0.35 });

projectSections.forEach(s => accentObserver.observe(s));

/* ============================================================
   NAV ACTIVE STATE
   ============================================================ */
const navLinks = document.querySelectorAll('.nav-links a');

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + id);
      });
    }
  });
}, { threshold: 0.45 });

document.querySelectorAll('[id]').forEach(s => navObserver.observe(s));

/* ============================================================
   HERO PARALLAX — blobs follow mouse slightly
   ============================================================ */
const blobs = document.querySelectorAll('.blob');

document.addEventListener('mousemove', (e) => {
  const rx = (e.clientX / window.innerWidth  - 0.5) * 2;
  const ry = (e.clientY / window.innerHeight - 0.5) * 2;
  blobs.forEach((blob, i) => {
    const depth = (i + 1) * 10;
    blob.style.transform = `translate(calc(-50% + ${rx * depth}px), calc(-50% + ${ry * depth}px))`;
  });
}, { passive: true });

/* ============================================================
   REVEAL ON SCROLL (staggered per grid)
   ============================================================ */
const revealEls = document.querySelectorAll('.reveal');

// Assign stagger delays within each grid
document.querySelectorAll('.media-grid, .horizontal-scroll').forEach(grid => {
  grid.querySelectorAll('.reveal').forEach((item, i) => {
    item.style.transitionDelay = (i * 0.065) + 's';
  });
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

revealEls.forEach(el => revealObserver.observe(el));

/* ============================================================
   TILT EFFECT on media items
   ============================================================ */
document.querySelectorAll('.media-item').forEach(item => {
  item.addEventListener('mousemove', (e) => {
    const rect = item.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
    const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
    item.style.transform = `scale(1.025) perspective(600px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg)`;
  });

  item.addEventListener('mouseleave', () => {
    item.style.transform = '';
  });
});

/* ============================================================
   VIDEO AUTO-PLAY on intersection
   ============================================================ */
const autoVideos = document.querySelectorAll('video.video-auto');

const videoObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.play().catch(() => {});
    } else {
      entry.target.pause();
    }
  });
}, { threshold: 0.3 });

autoVideos.forEach(v => videoObserver.observe(v));

/* ============================================================
   LIGHTBOX
   ============================================================ */
const lightbox    = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');

document.querySelectorAll('img.media-item').forEach(img => {
  img.addEventListener('click', () => {
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  });
});

function closeLightbox() {
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
  setTimeout(() => { lightboxImg.src = ''; }, 320);
}

lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

/* ============================================================
   HORIZONTAL DRAG SCROLL — all .drag-scroll containers
   ============================================================ */
document.querySelectorAll('.drag-scroll').forEach(wrap => {
  let isDragging = false;
  let startX, startScrollLeft;

  wrap.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.pageX - wrap.offsetLeft;
    startScrollLeft = wrap.scrollLeft;
    wrap.style.userSelect = 'none';
  });

  const endDrag = () => {
    isDragging = false;
    wrap.style.userSelect = '';
  };

  wrap.addEventListener('mouseleave', endDrag);
  wrap.addEventListener('mouseup',    endDrag);

  wrap.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x    = e.pageX - wrap.offsetLeft;
    const walk = (x - startX) * 1.8;
    wrap.scrollLeft = startScrollLeft - walk;
  });
});

/* ============================================================
   SCROLL-TO-TOP BUTTON
   ============================================================ */
const scrollTopBtn = document.createElement('button');
scrollTopBtn.className = 'scroll-top';
scrollTopBtn.setAttribute('aria-label', 'Scroll to top');
scrollTopBtn.textContent = '↑';
document.body.appendChild(scrollTopBtn);

window.addEventListener('scroll', () => {
  scrollTopBtn.classList.toggle('visible', window.scrollY > window.innerHeight * 0.8);
}, { passive: true });

scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ============================================================
   SCRAMBLE TITLE TEXT on first scroll into view
   ============================================================ */
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$';

function scramble(el) {
  const final = el.textContent;
  let frame = 0;
  const totalFrames = final.length * 3;

  const id = setInterval(() => {
    el.textContent = final.split('').map((char, i) => {
      if (char === '\n' || char === ' ') return char;
      if (i < frame / 3) return final[i];
      return CHARS[Math.floor(Math.random() * CHARS.length)];
    }).join('');

    frame++;
    if (frame > totalFrames) {
      el.textContent = final;
      clearInterval(id);
    }
  }, 28);
}

const titleObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      scramble(entry.target);
      titleObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.6 });

document.querySelectorAll('.project-title').forEach(t => titleObserver.observe(t));
