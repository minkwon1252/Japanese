'use strict';

const Audio = (() => {
  let ctx = null;
  let enabled = true;

  function getCtx() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch { return null; }
    }
    return ctx;
  }

  function resume() {
    const c = getCtx();
    if (c && c.state === 'suspended') c.resume();
  }

  function setEnabled(val) { enabled = val; }

  function tone(freq, type = 'sine', duration = 0.12, gain = 0.18, delay = 0) {
    if (!enabled) return;
    const c = getCtx();
    if (!c) return;
    resume();

    const osc = c.createOscillator();
    const gainNode = c.createGain();
    osc.connect(gainNode);
    gainNode.connect(c.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime + delay);
    gainNode.gain.setValueAtTime(0, c.currentTime + delay);
    gainNode.gain.linearRampToValueAtTime(gain, c.currentTime + delay + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration);

    osc.start(c.currentTime + delay);
    osc.stop(c.currentTime + delay + duration + 0.05);
  }

  const sounds = {
    correct() {
      tone(523.25, 'sine', 0.1, 0.2);       // C5
      tone(659.25, 'sine', 0.1, 0.2, 0.06); // E5
      tone(783.99, 'sine', 0.15, 0.2, 0.12);// G5
    },
    wrong() {
      tone(200, 'sawtooth', 0.15, 0.12);
      tone(150, 'sawtooth', 0.15, 0.1, 0.1);
    },
    combo() {
      const base = 440 * Math.pow(2, Math.random() * 0.5);
      tone(base, 'triangle', 0.08, 0.15);
    },
    levelUp() {
      [261.63, 329.63, 392, 523.25, 659.25, 783.99].forEach((f, i) => {
        tone(f, 'sine', 0.12, 0.18, i * 0.1);
      });
    },
    achievement() {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        tone(f, 'sine', 0.2, 0.2, i * 0.08);
      });
    },
    click() {
      tone(1200, 'square', 0.04, 0.06);
    },
    flip() {
      tone(440, 'triangle', 0.08, 0.1);
    },
    tick() {
      tone(880, 'square', 0.05, 0.05);
    },
    warning() {
      tone(300, 'square', 0.2, 0.1);
      tone(250, 'square', 0.2, 0.1, 0.25);
    },
  };

  return { setEnabled, resume, ...sounds };
})();

/* ─── Speech Synthesis (Japanese TTS) ─────────────────────────────────────── */
function speakJapanese(text) {
  if (!window.speechSynthesis) return;
  speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'ja-JP';
  utt.rate = 0.85;
  utt.pitch = 1.0;
  speechSynthesis.speak(utt);
}

/* ─── Confetti ─────────────────────────────────────────────────────────────── */
const Confetti = (() => {
  const canvas = document.getElementById('confetti-canvas');
  const ctx2d   = canvas ? canvas.getContext('2d') : null;
  let particles = [];
  let animId    = null;

  const COLORS = ['#FF4B4B','#FFC800','#58CC02','#1CB0F6','#FF6B6B','#A855F7','#F97316'];

  function resize() {
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function burst(n = 120) {
    if (!canvas || !ctx2d) return;
    resize();
    particles = [];
    for (let i = 0; i < n; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -10,
        w: Math.random() * 10 + 5,
        h: Math.random() * 6 + 3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 4 + 2,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.2,
        life: 1,
      });
    }
    if (animId) cancelAnimationFrame(animId);
    loop();
  }

  function loop() {
    ctx2d.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.angle += p.spin;
      p.life -= 0.012;
      ctx2d.save();
      ctx2d.translate(p.x, p.y);
      ctx2d.rotate(p.angle);
      ctx2d.globalAlpha = Math.max(0, p.life);
      ctx2d.fillStyle = p.color;
      ctx2d.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx2d.restore();
    });
    if (particles.length > 0) {
      animId = requestAnimationFrame(loop);
    } else {
      ctx2d.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  return { burst };
})();
