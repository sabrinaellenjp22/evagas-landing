// Nav scrolled state
const header = document.getElementById('header');
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 30);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

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
