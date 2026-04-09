// ─── THEME TOGGLE ───
const html = document.documentElement;
const themeToggle = document.getElementById("themeToggle");

function getCurrentTheme() {
  return html.getAttribute("data-theme");
}

function setTheme(theme) {
  html.setAttribute("data-theme", theme);
  localStorage.setItem("carebot-theme", theme);
}

function toggleTheme() {
  const current = getCurrentTheme();
  setTheme(current === "dark" ? "light" : "dark");
}

(function () {
  const saved = localStorage.getItem("carebot-theme");
  if (saved) setTheme(saved);
})();

themeToggle.addEventListener("click", toggleTheme);

// ─── PARTICLE ANIMATION ───
const canvas = document.getElementById("particleCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const particles = [];

class Particle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 2 + 1;
    this.speedX = Math.random() * 0.5 - 0.25;
    this.speedY = Math.random() * 0.5 - 0.25;
    this.opacity = Math.random() * 0.5 + 0.2;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;

    if (this.x > canvas.width) this.x = 0;
    if (this.x < 0) this.x = canvas.width;
    if (this.y > canvas.height) this.y = 0;
    if (this.y < 0) this.y = canvas.height;
  }

  draw() {
    ctx.fillStyle = `rgba(99, 102, 241, ${this.opacity})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Initialize particles
for (let i = 0; i < 30; i++) {
  particles.push(new Particle());
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach((particle) => {
    particle.update();
    particle.draw();
  });

  requestAnimationFrame(animateParticles);
}

animateParticles();

// Resize canvas on window resize
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// ─── SMOOTH SCROLL ───
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

// ─── INTERSECTION OBSERVER FOR ANIMATIONS ───
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = "running";
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 }
);

document.querySelectorAll(".feature-card").forEach((card) => {
  observer.observe(card);
});