// Navbar scroll effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
});

// Hamburger menu
const hamburger = document.getElementById('hamburger');
const navLinks = document.querySelector('.nav-links');
hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  hamburger.innerHTML = navLinks.classList.contains('open') ? '✕' : '&#9776;';
});
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.innerHTML = '&#9776;';
  });
});

// Particle canvas
(function () {
  const container = document.getElementById('particles');
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let particles = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function Particle() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 1.5 + 0.3;
    this.speedY = -(Math.random() * 0.4 + 0.1);
    this.speedX = (Math.random() - 0.5) * 0.2;
    this.opacity = Math.random() * 0.6 + 0.1;
  }

  Particle.prototype.update = function () {
    this.y += this.speedY;
    this.x += this.speedX;
    this.opacity -= 0.0015;
    if (this.y < 0 || this.opacity <= 0) {
      this.y = canvas.height + 10;
      this.x = Math.random() * canvas.width;
      this.opacity = Math.random() * 0.5 + 0.1;
    }
  };

  Particle.prototype.draw = function () {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(212, 175, 55, ${this.opacity})`;
    ctx.fill();
  };

  for (let i = 0; i < 90; i++) particles.push(new Particle());

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
  }
  animate();
})();

// Counter animation
function animateCounter(el) {
  const target = parseInt(el.dataset.target);
  const duration = 1800;
  const start = performance.now();

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const value = Math.floor(ease * target);
    el.textContent = value >= 1000 ? value.toLocaleString('pt-BR') : value;
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target >= 1000 ? target.toLocaleString('pt-BR') : target;
  }
  requestAnimationFrame(step);
}

// Scroll reveal
const revealEls = document.querySelectorAll(
  'section > .container, .evento-card, .servico-card, .depo-card, .numero-card'
);
revealEls.forEach(el => el.classList.add('reveal'));

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 }
);
revealEls.forEach(el => observer.observe(el));

// Counter trigger
const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.counter').forEach(animateCounter);
        counterObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.5 }
);
const numerosSection = document.getElementById('numeros');
if (numerosSection) counterObserver.observe(numerosSection);

// Form submit
document.getElementById('form').addEventListener('submit', function (e) {
  e.preventDefault();
  const btn = this.querySelector('.btn-primary');
  btn.textContent = 'Mensagem Enviada! ✓';
  btn.style.background = '#2a6b3a';
  btn.style.color = '#fff';
  setTimeout(() => {
    btn.textContent = 'Enviar Mensagem';
    btn.style.background = '';
    btn.style.color = '';
    this.reset();
  }, 3500);
});
