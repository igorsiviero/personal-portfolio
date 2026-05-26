function toggleMenu() {
  const menu = document.getElementById('mobileMenu');
  const btn = document.getElementById('hamburger');
  if (!menu || !btn) return;
  const isOpen = menu.classList.toggle('open');
  btn.setAttribute('aria-expanded', isOpen);
}

function closeMenu() {
  const menu = document.getElementById('mobileMenu');
  const btn = document.getElementById('hamburger');
  if (!menu || !btn) return;
  menu.classList.remove('open');
  btn.setAttribute('aria-expanded', 'false');
}

document.addEventListener('click', function(e) {
  const menu = document.getElementById('mobileMenu');
  const btn = document.getElementById('hamburger');
  if (!menu || !btn) return;
  if (!menu.contains(e.target) && !btn.contains(e.target)) closeMenu();
});

(function initMarquee() {
  const root = document.querySelector('.hrzn-client-marquee');
  if (!root) return;
  const track = root.querySelector('.hrzn-marquee__track');
  const group = root.querySelector('.hrzn-marquee__group');
  if (!track || !group || track.dataset.cloned === '1') return;
  track.dataset.cloned = '1';

  const clone = group.cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');
  track.appendChild(clone);

  const imgs = Array.from(root.querySelectorAll('img'));
  const waitImages = () => Promise.all(
    imgs.map((img) => img.complete ? Promise.resolve() : new Promise((resolve) => {
      img.addEventListener('load', resolve, { once: true });
      img.addEventListener('error', resolve, { once: true });
    }))
  );

  let resizeTimer = null;
  function recalc() {
    const shift = Math.ceil(group.getBoundingClientRect().width);
    const speed = Math.max(10, parseFloat(track.dataset.speed || '90'));
    const direction = (track.dataset.direction || 'left').toLowerCase();
    const duration = Math.max(10, shift / speed);
    track.style.setProperty('--shift', `${shift}px`);
    track.style.setProperty('--duration', `${duration}s`);
    track.style.setProperty('--direction', direction === 'right' ? 'reverse' : 'normal');
  }

  waitImages().then(() => {
    recalc();
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(recalc, 120);
    }, { passive: true });
  });
})();
