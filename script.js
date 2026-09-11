// Nav scrolled state
const header = document.getElementById('header');
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 30);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Mobile header menu (hamburger)
const menuToggle = document.getElementById('menuToggle');
const headerActions = document.getElementById('headerActions');
if (menuToggle && headerActions) {
  const closeMenu = () => {
    headerActions.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  };
  menuToggle.addEventListener('click', () => {
    const isOpen = headerActions.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });
  headerActions.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  window.addEventListener('resize', () => { if (window.innerWidth > 640) closeMenu(); });
}

// Hero image sphere: Fibonacci-distributed images on a draggable, auto-rotating 3D sphere
const heroSphere = document.getElementById('heroSphere');
if (heroSphere) {
  const SITE_IMAGES = [
    'assets/sphere-person-1.jpg',
    'assets/sphere-person-2.jpg',
    'assets/sphere-person-3.jpg',
    'assets/sphere-person-4.jpg',
    'assets/sphere-person-5.jpg',
    'assets/sphere-person-6.jpg',
    'assets/sphere-person-7.jpg',
  ];
  const COUNT = 60;
  const RADIUS = 90;
  const BASE_SIZE = 260 * 0.12;
  const DRAG_SENSITIVITY = 0.5;
  const MAX_ROTATION_SPEED = 6;
  const MOMENTUM_DECAY = 0.96;
  const AUTO_ROTATE_SPEED = 0.2;

  const normalizeAngle = a => { while (a > 180) a -= 360; while (a < -180) a += 360; return a; };
  const clampSpeed = v => Math.max(-MAX_ROTATION_SPEED, Math.min(MAX_ROTATION_SPEED, v));

  // Fibonacci sphere distribution, biased toward the poles for fuller coverage
  const positions = Array.from({ length: COUNT }, (_, i) => {
    const t = i / COUNT;
    const inclination = Math.acos(1 - 2 * t);
    const azimuth = (2 * Math.PI / ((1 + Math.sqrt(5)) / 2)) * i;
    let phi = inclination * (180 / Math.PI);
    let theta = (azimuth * (180 / Math.PI)) % 360;
    const poleBonus = Math.pow(Math.abs(phi - 90) / 90, 0.6) * 35;
    phi = phi < 90 ? Math.max(5, phi - poleBonus) : Math.min(175, phi + poleBonus);
    phi = 15 + (phi / 180) * 150;
    theta = (theta + (Math.random() - 0.5) * 20) % 360;
    phi = Math.max(0, Math.min(180, phi + (Math.random() - 0.5) * 10));
    return { theta, phi, src: SITE_IMAGES[i % SITE_IMAGES.length] };
  });

  const items = positions.map(pos => {
    const el = document.createElement('div');
    el.className = 'hero-sphere__item';
    el.innerHTML = `<img src="${pos.src}" alt="">`;
    heroSphere.appendChild(el);
    return el;
  });

  let hoveredIndex = null;
  items.forEach((el, i) => {
    el.addEventListener('mouseenter', () => {
      hoveredIndex = i;
      render();
    });
    el.addEventListener('mouseleave', () => {
      hoveredIndex = null;
      render();
    });
  });

  const rotation = { x: 15, y: 15 };
  const velocity = { x: 0, y: 0 };
  let dragging = false;
  let dragMoved = false;
  let last = { x: 0, y: 0 };

  const render = () => {
    const size = heroSphere.offsetWidth || 260;
    const center = size / 2;
    const rotXRad = rotation.x * Math.PI / 180;
    const rotYRad = rotation.y * Math.PI / 180;

    positions.forEach((pos, i) => {
      const thetaRad = pos.theta * Math.PI / 180;
      const phiRad = pos.phi * Math.PI / 180;
      let x = RADIUS * Math.sin(phiRad) * Math.cos(thetaRad);
      let y = RADIUS * Math.cos(phiRad);
      let z = RADIUS * Math.sin(phiRad) * Math.sin(thetaRad);

      const x1 = x * Math.cos(rotYRad) + z * Math.sin(rotYRad);
      const z1 = -x * Math.sin(rotYRad) + z * Math.cos(rotYRad);
      x = x1; z = z1;
      const y2 = y * Math.cos(rotXRad) - z * Math.sin(rotXRad);
      const z2 = y * Math.sin(rotXRad) + z * Math.cos(rotXRad);
      y = y2; z = z2;

      const fadeStart = -10, fadeEnd = -30;
      const isVisible = z > fadeEnd;
      const fadeOpacity = z <= fadeStart ? Math.max(0, (z - fadeEnd) / (fadeStart - fadeEnd)) : 1;
      const distRatio = Math.min(Math.sqrt(x * x + y * y) / RADIUS, 1);
      const centerScale = Math.max(0.3, 1 - distRatio * 0.7);
      const depthScale = (z + RADIUS) / (2 * RADIUS);
      const scale = centerScale * Math.max(0.5, 0.8 + depthScale * 0.3);

      const el = items[i];
      if (!isVisible) { el.style.opacity = '0'; el.style.pointerEvents = 'none'; return; }
      const isHovered = i === hoveredIndex;
      const itemSize = BASE_SIZE * scale * (isHovered ? 1.5 : 1);
      el.style.width = `${itemSize}px`;
      el.style.height = `${itemSize}px`;
      el.style.opacity = fadeOpacity;
      el.style.zIndex = isHovered ? 3000 : Math.round(1000 + z);
      el.style.pointerEvents = 'auto';
      el.style.transform = `translate(${center + x - itemSize / 2}px, ${center + y - itemSize / 2}px)`;
    });
  };

  const tick = () => {
    if (!dragging) {
      velocity.x *= MOMENTUM_DECAY;
      velocity.y *= MOMENTUM_DECAY;
      if (Math.abs(velocity.x) < 0.01) velocity.x = 0;
      if (Math.abs(velocity.y) < 0.01) velocity.y = 0;
      rotation.x = normalizeAngle(rotation.x + velocity.x);
      rotation.y = normalizeAngle(rotation.y + AUTO_ROTATE_SPEED + velocity.y);
      render();
    }
    requestAnimationFrame(tick);
  };

  heroSphere.addEventListener('pointerdown', e => {
    dragging = true;
    dragMoved = false;
    velocity.x = 0; velocity.y = 0;
    last = { x: e.clientX, y: e.clientY };
    heroSphere.setPointerCapture(e.pointerId);
  });
  heroSphere.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - last.x;
    const dy = e.clientY - last.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) dragMoved = true;
    const rx = clampSpeed(-dy * DRAG_SENSITIVITY);
    const ry = clampSpeed(dx * DRAG_SENSITIVITY);
    rotation.x = normalizeAngle(rotation.x + rx);
    rotation.y = normalizeAngle(rotation.y + ry);
    velocity.x = rx; velocity.y = ry;
    last = { x: e.clientX, y: e.clientY };
    render();
  });
  heroSphere.addEventListener('pointerup', () => { dragging = false; });
  heroSphere.addEventListener('pointercancel', () => { dragging = false; });
  window.addEventListener('resize', render);

  // Modal viewer
  const modal = document.getElementById('heroSphereModal');
  const modalImg = document.getElementById('heroSphereModalImg');
  items.forEach((el, i) => {
    el.addEventListener('click', () => {
      if (dragMoved) return;
      modalImg.src = positions[i].src;
      modal.hidden = false;
    });
  });
  const closeModal = () => { modal.hidden = true; };
  document.getElementById('heroSphereModalClose').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  render();
  requestAnimationFrame(tick);
}

// Hero sphere scroll parallax: starts expanded behind the text, shrinks to a compact globe above the title as the user scrolls
const heroSphereLayer = document.getElementById('heroSphereLayer');
const heroSection = document.getElementById('inicio');
if (heroSphereLayer && heroSection) {
  const EXPANDED_SCALE = 2.6;
  const EXPANDED_TRANSLATE_Y = 174;
  const onHeroScroll = () => {
    const rect = heroSection.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, -rect.top / (window.innerHeight * 0.6)));
    const scale = EXPANDED_SCALE - progress * (EXPANDED_SCALE - 1);
    const ty = EXPANDED_TRANSLATE_Y * (1 - progress);
    heroSphereLayer.style.transform = `translateY(${ty}px) scale(${scale})`;
  };
  window.addEventListener('scroll', onHeroScroll, { passive: true });
  onHeroScroll();
}

// Reveal on scroll
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// Steps video switcher
const stepsIframe = document.getElementById('stepsIframe');
const stepButtons = document.querySelectorAll('.steps__list .step');
stepButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const videoId = btn.dataset.video;
    if (videoId && stepsIframe) {
      stepsIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    stepButtons.forEach(b => b.classList.remove('step--active'));
    btn.classList.add('step--active');
  });
});

// Tools video placeholder: force a 1:1 square matching the menu column's height.
// (grid align-items:stretch + aspect-ratio on a percentage height is circular and makes
// the browser reflow to a different size each time the menu re-renders, so size it in JS instead.)
const toolsCardsCol = document.querySelector('.tools__cards');
const toolsArtBox = document.getElementById('toolsArt');
if (toolsCardsCol && toolsArtBox) {
  const syncToolsArtSize = () => {
    if (window.innerWidth <= 960) {
      toolsCardsCol.style.height = '';
      toolsArtBox.style.width = '';
      toolsArtBox.style.height = '';
      return;
    }
    toolsCardsCol.style.height = 'auto';
    const side = `${toolsCardsCol.offsetHeight}px`;
    toolsArtBox.style.width = side;
    toolsArtBox.style.height = side;
    toolsCardsCol.style.height = side;
  };
  syncToolsArtSize();
  window.addEventListener('resize', syncToolsArtSize);
}

// Tools menu: hover reveals the subtitle + swaps the looping video; click locks it (mobile can't hover)
// Video only plays while the section is on screen, to avoid burning GPU/battery in the background.
const toolsMenu = document.getElementById('toolsMenu');
if (toolsMenu) {
  const toolCards = [...toolsMenu.querySelectorAll('.tool-card')];
  const toolPanels = toolCards.map(card => card.nextElementSibling);
  const toolsArtHome = document.querySelector('.tools__art');
  const toolsVideo = document.getElementById('toolsVideo');
  const toolsCaption = document.getElementById('toolsArtCaption');
  const defaultCard = toolCards.find(c => c.classList.contains('tool-card--active')) || toolCards[0];
  const isMobileLayout = () => window.innerWidth <= 960;
  let sectionVisible = false;

  const setActive = card => {
    toolCards.forEach(c => c.classList.toggle('tool-card--active', c === card));
    const src = card.dataset.video;
    if (!src) {
      toolsVideo.hidden = true;
      toolsCaption.hidden = false;
      toolsCaption.textContent = `Vídeo — ${card.dataset.title}`;
      return;
    }
    toolsCaption.hidden = true;
    toolsVideo.hidden = false;
    if (!toolsVideo.src.endsWith(src)) toolsVideo.src = src;
    if (sectionVisible) toolsVideo.play().catch(() => {});
  };

  // Mobile: accordion — each button's preview opens in a panel right below it.
  const toolsArtBox = document.getElementById('toolsArt');
  let mobileOpenIndex = toolCards.indexOf(defaultCard);
  const syncAccordion = () => {
    if (isMobileLayout()) {
      toolPanels.forEach((panel, i) => {
        const isOpen = i === mobileOpenIndex;
        panel.classList.toggle('tool-item__panel--open', isOpen);
        if (isOpen) panel.appendChild(toolsArtBox);
      });
    } else {
      toolPanels.forEach(panel => panel.classList.remove('tool-item__panel--open'));
      toolsArtHome.appendChild(toolsArtBox);
    }
  };

  toolCards.forEach((card, i) => {
    card.addEventListener('mouseenter', () => { if (!isMobileLayout()) setActive(card); });
    card.addEventListener('click', () => {
      setActive(card);
      mobileOpenIndex = i;
      syncAccordion();
    });
  });

  window.addEventListener('resize', syncAccordion);

  new IntersectionObserver(([entry]) => {
    sectionVisible = entry.isIntersecting;
    if (sectionVisible) toolsVideo.play().catch(() => {});
    else toolsVideo.pause();
  }, { threshold: 0.1 }).observe(document.getElementById('ferramentas'));

  setActive(defaultCard);
  syncAccordion();
}

// Sectors expanding cards: hover reveals a card, mirrors the .tool-card pattern above.
const sectorsList = document.getElementById('sectorsList');
if (sectorsList) {
  const sectorCards = [...sectorsList.querySelectorAll('.sectors__item')];
  const defaultSectorCard = sectorCards.find(c => c.classList.contains('sectors__item--active')) || sectorCards[0];

  const setActiveSector = card => {
    sectorCards.forEach(c => c.classList.toggle('sectors__item--active', c === card));
  };

  let sectorsHovering = false;
  sectorCards.forEach(card => {
    card.addEventListener('mouseenter', () => setActiveSector(card));
    card.addEventListener('click', () => setActiveSector(card));
  });
  sectorsList.addEventListener('mouseenter', () => { sectorsHovering = true; });
  sectorsList.addEventListener('mouseleave', () => {
    sectorsHovering = false;
    setActiveSector(defaultSectorCard);
  });

  setActiveSector(defaultSectorCard);

  let sectorsAutoIndex = sectorCards.indexOf(defaultSectorCard);
  setInterval(() => {
    if (sectorsHovering) return;
    sectorsAutoIndex = (sectorsAutoIndex + 1) % sectorCards.length;
    setActiveSector(sectorCards[sectorsAutoIndex]);
  }, 5000);

  // Sectors carousel (mobile only: 1 card at a time, auto-advances every 5s)
  const sectorsNav = document.getElementById('sectorsNav');
  if (sectorsNav) {
    let sectorsCarouselIndex = 0;
    let sectorsCarouselTimer;

    const goToSectorCard = i => {
      sectorsCarouselIndex = (i + sectorCards.length) % sectorCards.length;
      sectorsList.scrollTo({ left: sectorCards[sectorsCarouselIndex].offsetLeft, behavior: 'smooth' });
    };

    const restartSectorsCarouselTimer = () => {
      clearInterval(sectorsCarouselTimer);
      sectorsCarouselTimer = setInterval(() => goToSectorCard(sectorsCarouselIndex + 1), 4000);
    };

    sectorsNav.addEventListener('click', e => {
      const btn = e.target.closest('.sectors__nav-btn');
      if (!btn) return;
      goToSectorCard(sectorsCarouselIndex + Number(btn.dataset.dir));
      restartSectorsCarouselTimer();
    });

    restartSectorsCarouselTimer();
  }
}

// Platform features carousel (mobile only: 1 card at a time, auto-advances every 2s)
const platformFeatures = document.getElementById('platformFeatures');
const platformNav = document.getElementById('platformNav');
if (platformFeatures && platformNav) {
  const platformCards = [...platformFeatures.children];
  let platformIndex = 0;
  let platformTimer;

  const goToPlatformCard = i => {
    platformIndex = (i + platformCards.length) % platformCards.length;
    platformFeatures.scrollTo({ left: platformCards[platformIndex].offsetLeft, behavior: 'smooth' });
  };

  const restartPlatformTimer = () => {
    clearInterval(platformTimer);
    platformTimer = setInterval(() => goToPlatformCard(platformIndex + 1), 5000);
  };

  platformNav.addEventListener('click', e => {
    const btn = e.target.closest('.platform__nav-btn');
    if (!btn) return;
    goToPlatformCard(platformIndex + Number(btn.dataset.dir));
    restartPlatformTimer();
  });

  restartPlatformTimer();
}

// FAQ accordion (single open at a time)
const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach(item => {
  const header = item.querySelector('.faq-item__header');
  header.addEventListener('click', () => {
    const wasOpen = item.classList.contains('is-open');
    faqItems.forEach(i => {
      i.classList.remove('is-open');
      i.querySelector('.faq-item__header').setAttribute('aria-expanded', 'false');
    });
    if (!wasOpen) {
      item.classList.add('is-open');
      header.setAttribute('aria-expanded', 'true');
    }
  });
});
