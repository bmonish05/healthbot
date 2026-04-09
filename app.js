/* ── app.js – CareBot Hospital Assistant ── */

const WEBHOOK_URL = "https://bin.codeveritus.tech/webhook/210b9846-c24b-42a5-b4bf-1a11dfa2abea/chat"; // Replace with your n8n webhook URL

// ─── THEME TOGGLE ───
const html = document.documentElement;
const themeToggle = document.getElementById("themeToggle");

function getCurrentTheme() {
  return html.getAttribute("data-theme");
}

function setTheme(theme) {
  html.setAttribute("data-theme", theme);
  localStorage.setItem("carebot-theme", theme);
  // Keep browser chrome color in sync
  document.querySelectorAll('meta[name="theme-color"]').forEach((el) => {
    const isDarkMedia = el.getAttribute("media")?.includes("dark");
    if (theme === "dark" && isDarkMedia) el.setAttribute("content", "#0d1117");
    else if (theme === "light" && !isDarkMedia) el.setAttribute("content", "#f8faff");
  });
}

function toggleTheme() {
  const current = getCurrentTheme();
  setTheme(current === "dark" ? "light" : "dark");
}

// Load saved theme on page load
(function () {
  const saved = localStorage.getItem("carebot-theme");
  if (saved) setTheme(saved);
})();

themeToggle.addEventListener("click", toggleTheme);

// ─── MOBILE NAV ───
const menuToggle = document.getElementById("menuToggle");
const mobileNav = document.getElementById("mobileNav");

menuToggle.addEventListener("click", () => {
  mobileNav.classList.toggle("open");
});

function closeMobileNav() {
  mobileNav.classList.remove("open");
}

// ─── TOAST ───
let toastTimer = null;

function showToast(message, duration = 3500) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), duration);
}

// ─── MODAL ───
function showModal(message) {
  document.getElementById("modalMsg").textContent = message;
  document.getElementById("modalOverlay").classList.add("show");
}

function closeModal() {
  document.getElementById("modalOverlay").classList.remove("show");
}

// ─── FAQ ACCORDION ───
function toggleFaq(btn) {
  const item = btn.closest(".faq-item");
  const isOpen = item.classList.contains("open");

  // Close all open FAQs
  document.querySelectorAll(".faq-item.open").forEach((el) => {
    el.classList.remove("open");
  });

  // Open clicked if it was closed
  if (!isOpen) item.classList.add("open");
}

// ─── CHAT ───
const messagesEl = document.getElementById("messages");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const clearChatBtn = document.getElementById("clearChat");
const quickRepliesEl = document.getElementById("quickReplies");

let isSending = false;

// Smart local responses when webhook isn't set up
const localResponses = {
  headache: "Headaches can have many causes including tension, dehydration, or migraines. For mild headaches: rest in a quiet room, stay hydrated, and consider OTC pain relief. If your headache is severe, sudden, or accompanied by vision changes or neck stiffness — please visit our Neurology department immediately.",
  fever: "A fever above 38°C (100.4°F) indicates your body is fighting an infection. Rest and stay hydrated. For adults, OTC fever reducers can help. If the fever exceeds 39.5°C or persists more than 3 days, please book an appointment with our General Medicine department.",
  chest: "Chest pain should never be ignored. If you're experiencing severe chest pain, shortness of breath, or pain radiating to the arm or jaw — call emergency services (112) immediately. For mild, non-emergency chest discomfort, our Cardiology department can help. Should I help you book an appointment?",
  appointment: "I can help you book an appointment! Please scroll down to the Appointment section, select your preferred department and date. Our team is available Monday–Saturday 9AM–8PM. Would you like to know more about any specific department?",
  timing: "🕐 Our hospital timings are:\n• OPD (Mon–Sat): 9:00 AM – 8:00 PM\n• OPD (Sunday): 10:00 AM – 4:00 PM\n• Emergency: 24/7, 365 days\nYou can book appointments online anytime!",
  emergency: "🚨 For emergencies, call 112 immediately or visit our Emergency Ward which is open 24/7. Our emergency team is always ready. If you need to reach us: +91 123 456 7890.",
  cardiology: "Our Cardiology department handles all heart-related conditions including chest pain, arrhythmia, high blood pressure, and heart failure. Our team of experienced cardiologists is available Mon–Sat. Would you like to book an appointment?",
  neurology: "Our Neurology department treats conditions related to the brain and nervous system — including migraines, epilepsy, stroke, and Parkinson's disease. We have expert neurologists available throughout the week.",
  blood: "High blood pressure (hypertension) is a serious condition that can lead to heart disease and stroke. Symptoms are often silent. Regular monitoring and lifestyle changes are key. Our Cardiology and General Medicine departments can help with diagnosis and treatment.",
  default: "Thank you for your question! I'm here to help. For accurate medical advice, please consult one of our qualified doctors. You can:\n• Book an appointment using the form below\n• Call our helpline: +91 123 456 7890\n• Visit our Emergency ward for urgent care (24/7)"
};

function getLocalResponse(message) {
  const lc = message.toLowerCase();
  if (lc.includes("headache") || lc.includes("head ache")) return localResponses.headache;
  if (lc.includes("fever") || lc.includes("temperature")) return localResponses.fever;
  if (lc.includes("chest") || lc.includes("heart")) return localResponses.chest;
  if (lc.includes("appointment") || lc.includes("book")) return localResponses.appointment;
  if (lc.includes("timing") || lc.includes("hours") || lc.includes("open")) return localResponses.timing;
  if (lc.includes("emergency") || lc.includes("urgent")) return localResponses.emergency;
  if (lc.includes("cardiology") || lc.includes("cardiac")) return localResponses.cardiology;
  if (lc.includes("neurology") || lc.includes("brain")) return localResponses.neurology;
  if (lc.includes("blood pressure") || lc.includes("hypertension")) return localResponses.blood;
  return localResponses.default;
}

function createMsgEl(type, content) {
  const msg = document.createElement("div");
  msg.className = `msg msg-${type}`;

  const avatar = document.createElement("div");
  avatar.className = "msg-avatar";
  avatar.textContent = type === "user" ? "👤" : "🤖";

  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";

  // Handle newlines in content
  bubble.innerHTML = content.replace(/\n/g, "<br />");

  msg.appendChild(avatar);
  msg.appendChild(bubble);
  return msg;
}

function createLoadingEl() {
  const msg = document.createElement("div");
  msg.className = "msg msg-bot msg-loading";
  msg.id = "loadingMsg";

  const avatar = document.createElement("div");
  avatar.className = "msg-avatar";
  avatar.textContent = "🤖";

  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  bubble.innerHTML = '<div class="dots"><span></span><span></span><span></span></div>';

  msg.appendChild(avatar);
  msg.appendChild(bubble);
  return msg;
}

function scrollToBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function appendMessage(type, content) {
  const el = createMsgEl(type, content);
  messagesEl.appendChild(el);
  scrollToBottom();
  return el;
}

function removeLoading() {
  const el = document.getElementById("loadingMsg");
  if (el) el.remove();
}

async function sendMessage() {
  if (isSending) return;

  const text = chatInput.value.trim();
  if (!text) {
    chatInput.focus();
    return;
  }

  chatInput.value = "";
  isSending = true;
  sendBtn.disabled = true;

  // Hide quick replies after first send
  quickRepliesEl.style.display = "none";

  appendMessage("user", text);

  const loadingEl = createLoadingEl();
  messagesEl.appendChild(loadingEl);
  scrollToBottom();

  // Simulate small delay for UX
  await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 600));

  // Try webhook first; fall back to local responses
  let reply = null;

  if (WEBHOOK_URL && !WEBHOOK_URL.includes("YOUR-N8N")) {
    try {
      // Get or create unique session ID for this user
      let sessionId = localStorage.getItem("carebot-session");
      if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2, 15);
        localStorage.setItem("carebot-session", sessionId);
      }

      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId: sessionId }),
      });
      const data = await res.json();
      reply = data.reply || data.message || data.text || null;
    } catch (e) {
      console.warn("Webhook failed, using local response.", e);
    }
  }

  if (!reply) {
    reply = getLocalResponse(text);
  }

  removeLoading();
  appendMessage("bot", reply);

  isSending = false;
  sendBtn.disabled = false;
  chatInput.focus();
}

function quickSend(text) {
  chatInput.value = text;
  sendMessage();
}

// Clear chat
clearChatBtn.addEventListener("click", () => {
  messagesEl.innerHTML = "";
  quickRepliesEl.style.display = "flex";
  const welcomeMsg = createMsgEl(
    "bot",
    "Chat cleared! 👋 How can I help you today?"
  );
  messagesEl.appendChild(welcomeMsg);
});

// ─── APPOINTMENT BOOKING ───
const appointmentForm = document.getElementById("appointmentForm");

// Set minimum date to today
document.getElementById("patDate").min = new Date().toISOString().split("T")[0];

function bookAppointment(e) {
  e.preventDefault();

  const name = document.getElementById("patName").value.trim();
  const age = document.getElementById("patAge").value;
  const dept = document.getElementById("patDept").value;
  const date = document.getElementById("patDate").value;
  const time = document.getElementById("patTime").value;

  if (!name || !age || !dept || !date) {
    showToast("⚠️ Please fill in all required fields");
    return;
  }

  const bookBtn = document.getElementById("bookBtn");
  const bookBtnText = document.getElementById("bookBtnText");
  const bookBtnLoading = document.getElementById("bookBtnLoading");

  bookBtn.disabled = true;
  bookBtnText.style.display = "none";
  bookBtnLoading.style.display = "inline";

  // Simulate async booking
  setTimeout(() => {
    const deptLabel = document.getElementById("patDept").selectedOptions[0].text;
    const dateFormatted = new Date(date).toLocaleDateString("en-IN", {
      weekday: "long", year: "numeric", month: "long", day: "numeric"
    });
    const timeLabel = time ? ` at ${formatTime(time)}` : "";

    showModal(
      `Your appointment has been confirmed!\n\nPatient: ${name} (Age: ${age})\nDepartment: ${deptLabel}\nDate: ${dateFormatted}${timeLabel}\n\nWe'll send a confirmation to your contact details.`
    );

    appointmentForm.reset();
    document.getElementById("patDate").min = new Date().toISOString().split("T")[0];

    bookBtn.disabled = false;
    bookBtnText.style.display = "inline";
    bookBtnLoading.style.display = "none";
  }, 1800);
}

function formatTime(t) {
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${h12}:${m} ${ampm}`;
}

// ─── HEADER SCROLL EFFECT ───
const header = document.querySelector(".header");

window.addEventListener("scroll", () => {
  if (window.scrollY > 20) {
    header.style.boxShadow = "0 4px 30px rgba(0,0,0,0.2)";
  } else {
    header.style.boxShadow = "none";
  }
}, { passive: true });

// ─── INTERSECTION OBSERVER (card animations) ───
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const delay = entry.target.getAttribute("data-delay") || 0;
        setTimeout(() => {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
        }, parseInt(delay));
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 }
);

document.querySelectorAll(".service-card").forEach((card) => {
  card.style.opacity = "0";
  card.style.transform = "translateY(24px)";
  card.style.transition = "opacity 0.5s ease, transform 0.5s ease, background var(--transition), border-color var(--transition), box-shadow var(--transition)";
  observer.observe(card);
});