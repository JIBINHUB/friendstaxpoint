// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Header shadow + sticky "Start Filing" dock
const header = document.querySelector('.header');
const dock = document.getElementById('dock');
const heroEnd = () => document.querySelector('.hero').offsetHeight;
const contact = document.getElementById('contact');
const onScroll = () => {
  header.classList.toggle('scrolled', scrollY > 8);
  const nearContact = contact.getBoundingClientRect().top < innerHeight * 0.8;
  dock.classList.toggle('show', scrollY > heroEnd() - 100 && !nearContact);
};
addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Mobile menu
const nav = document.getElementById('nav');
const burger = document.getElementById('burger');
burger.addEventListener('click', () => { const o = nav.classList.toggle('open'); burger.classList.toggle('open', o); burger.setAttribute('aria-expanded', o); });
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); burger.classList.remove('open'); }));

// Scroll reveal with stagger (ClearTax-style slide up)
const revealIO = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const sibs = [...e.target.parentElement.children].filter(c => c.classList.contains('reveal'));
    e.target.style.transitionDelay = `${Math.min(sibs.indexOf(e.target), 5) * 100}ms`;
    e.target.classList.add('in');
    revealIO.unobserve(e.target);
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => revealIO.observe(el));

// Count-up numbers
const countIO = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, end = +el.dataset.count, indian = el.dataset.format === 'in';
    const start = performance.now(), dur = 1800;
    const tick = now => {
      const p = Math.min((now - start) / dur, 1);
      const v = Math.round(end * (1 - Math.pow(1 - p, 4)));
      el.textContent = indian ? v.toLocaleString('en-IN') : v;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    countIO.unobserve(el);
  });
}, { threshold: 0.5 });
document.querySelectorAll('[data-count]').forEach(el => countIO.observe(el));

// Peek carousel (centered slide with neighbours peeking)
(() => {
  const root = document.getElementById('peek');
  const track = root.querySelector('.peek__track');
  const slides = [...track.children];
  const dots = document.getElementById('peekDots');
  let i = 0, timer;
  slides.forEach((s, n) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', `Slide ${n + 1}`);
    b.onclick = () => { go(n); restart(); };
    dots.appendChild(b);
    s.addEventListener('click', () => { if (n !== i) { go(n); restart(); } });
  });
  const go = n => {
    i = (n + slides.length) % slides.length;
    const s = slides[i];
    const offset = s.offsetLeft - (root.clientWidth - s.offsetWidth) / 2;
    track.style.transform = `translateX(${-offset}px)`;
    slides.forEach((x, k) => x.classList.toggle('active', k === i));
    [...dots.children].forEach((d, k) => d.classList.toggle('active', k === i));
  };
  const restart = () => { clearInterval(timer); timer = setInterval(() => go(i + 1), 4000); };
  root.addEventListener('mouseenter', () => clearInterval(timer));
  root.addEventListener('mouseleave', restart);
  // swipe
  let x0 = null;
  root.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  root.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) { go(i + (dx < 0 ? 1 : -1)); restart(); }
    x0 = null;
  });
  addEventListener('resize', () => go(i));
  go(0); restart();
})();

// GST calculator
(() => {
  const amount = document.getElementById('gstAmount');
  let rate = 18, mode = 'add';
  const fmt = n => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  const calc = () => {
    const a = parseFloat(amount.value) || 0;
    const net = mode === 'add' ? a : a / (1 + rate / 100);
    const tax = mode === 'add' ? a * rate / 100 : a - net;
    document.getElementById('gstNet').textContent = fmt(net);
    document.getElementById('gstTax').textContent = fmt(tax);
    document.getElementById('gstTotal').textContent = fmt(net + tax);
  };
  const group = (id, key, set) => document.querySelectorAll(`#${id} button`).forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll(`#${id} button`).forEach(x => x.classList.remove('active'));
    b.classList.add('active'); set(b.dataset[key]); calc();
  }));
  group('gstRates', 'rate', v => rate = +v);
  group('gstMode', 'mode', v => mode = v);
  amount.addEventListener('input', calc);
  calc();
})();

// Contact form -> opens WhatsApp chat with the enquiry pre-filled
const WHATSAPP_NUMBER = '917012969190'; // Friends Tax Point (+91 70129 69190)
document.getElementById('contactForm').addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(e.target);
  const lines = [
    'Hello Friends Tax Point, I would like to enquire about your services.',
    '',
    `*Name:* ${f.get('name')}`,
    `*Phone:* ${f.get('phone')}`,
    `*Service:* ${f.get('service')}`,
  ];
  const msg = (f.get('message') || '').trim();
  if (msg) lines.push(`*Message:* ${msg}`);
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
  const win = window.open(url, '_blank', 'noopener');
  if (!win) location.href = url; // popup blocked -> open in same tab
});

// Branch network: pins + tabs drive the card and live map
(() => {
  const dataEl = document.getElementById('branchData');
  if (!dataEl) return;
  const branches = JSON.parse(dataEl.textContent);
  const pins = [...document.querySelectorAll('.mpin')];
  const tabs = [...document.querySelectorAll('.btab')];
  const swap = document.getElementById('bSwap');
  const map = document.getElementById('branchMap');
  const loader = document.getElementById('mapLoader');
  const dir = document.getElementById('branchDir');
  let current = 0;
  map.addEventListener('load', () => loader.classList.remove('on'));
  const select = (i, fromTab) => {
    if (i === current) return;
    current = i;
    const b = branches[i], q = encodeURIComponent(b.q);
    pins.forEach(p => p.classList.toggle('active', +p.dataset.i === i));
    tabs.forEach(t => t.classList.toggle('active', +t.dataset.i === i));
    swap.classList.add('out');
    setTimeout(() => {
      document.getElementById('bName').textContent = b.name;
      document.getElementById('bAddr').textContent = b.q;
      document.getElementById('bDistrict').textContent = `${b.district} District`;
      document.getElementById('bIndex').textContent = String(i + 1).padStart(2, '0');
      swap.classList.remove('out');
    }, 250);
    loader.classList.add('on');
    const dest = (b.lat && b.lon) ? `${b.lat},${b.lon}` : q;
    map.src = `https://maps.google.com/maps?q=${encodeURIComponent(dest)}&z=16&output=embed`;
    dir.href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`;
    if (fromTab && innerWidth < 1024) document.getElementById('branchCard').scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  pins.forEach(p => {
    p.addEventListener('click', () => select(+p.dataset.i));
    p.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(+p.dataset.i); } });
  });
  tabs.forEach(t => t.addEventListener('click', () => select(+t.dataset.i, true)));
})();

// Premium cards: soft spotlight follows the cursor
document.querySelectorAll('.pcard').forEach(card => {
  card.addEventListener('pointermove', e => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
});
