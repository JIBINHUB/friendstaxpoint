// Service detail pages — header, menu, reveal animations and the WhatsApp form
const WHATSAPP_NUMBER = '917012969190'; // Friends Tax Point (+91 70129 69190)

document.getElementById('year').textContent = new Date().getFullYear();

const header = document.querySelector('.header');
addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 8), { passive: true });

const nav = document.getElementById('nav');
const burger = document.getElementById('burger');
burger.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  burger.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', open);
});
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('open'); burger.classList.remove('open');
}));

const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const sibs = [...e.target.parentElement.children].filter(c => c.classList.contains('reveal'));
    e.target.style.transitionDelay = `${Math.min(sibs.indexOf(e.target), 5) * 90}ms`;
    e.target.classList.add('in');
    io.unobserve(e.target);
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// Enquiry form -> opens WhatsApp with the details filled in
const form = document.getElementById('contactForm');
form.addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(e.target);
  const lines = [
    `Hello Friends Tax Point, I would like to enquire about ${form.dataset.service}.`,
    '',
    `*Name:* ${f.get('name')}`,
    `*Phone:* ${f.get('phone')}`,
    `*Service:* ${form.dataset.service}`,
    `*Nearest branch:* ${f.get('branch')}`,
  ];
  const msg = (f.get('message') || '').trim();
  if (msg) lines.push(`*Message:* ${msg}`);
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
  const win = window.open(url, '_blank', 'noopener');
  if (!win) location.href = url;
});
