/* ============================================
   青年发展中心实践部纳新 H5 — Swiper 丝滑版
   ============================================ */

// ── DOM ──────────────────────────────────────
const shareBtn = document.getElementById('shareBtn');
const qrImage = document.getElementById('qrImage');
const musicBtn = document.getElementById('musicToggle');
const musicIcon = musicBtn ? musicBtn.querySelector('.music-icon') : null;
const dots = Array.from(document.querySelectorAll('#pageDots .dot'));

let swiper;
let currentIndex = 0;

/* ============================================
   1. Swiper 初始化 — 丝滑滑动核心
   ============================================ */
function initSwiper() {
  swiper = new Swiper('.main-swiper', {
    direction: 'vertical',
    loop: false,
    speed: 600,
    // 鼠标滚轮
    mousewheel: {
      forceToAxis: true,
      sensitivity: 0.8,
      thresholdDelta: 8,
      thresholdTime: 300,
    },
    // 键盘
    keyboard: {
      enabled: true,
      onlyInViewport: true,
    },
    // 触摸
    touchRatio: 1,
    touchAngle: 45,
    resistance: true,
    resistanceRatio: 0.6,
    // CSS 过渡（GPU 加速）
    cssMode: false,
    // 观察器
    observer: true,
    observeParents: true,
    // 事件
    on: {
      slideChange: onSlideChange,
      slideChangeTransitionEnd: onSlideTransitionEnd,
    },
  });
}

function onSlideChange() {
  currentIndex = swiper.activeIndex;
  updateDots();
}

function onSlideTransitionEnd() {
  // 当前页入场动画
  triggerAnimations(swiper.activeIndex);
}

/* ============================================
   2. 入场动画
   ============================================ */
function triggerAnimations(slideIndex) {
  const slide = swiper.slides[slideIndex];
  if (!slide) return;
  const items = slide.querySelectorAll('.anim-item');
  items.forEach((item, i) => {
    // 重置
    item.classList.remove('visible');
    // 错开触发
    setTimeout(() => {
      item.classList.add('visible');
    }, i * 60);
  });
}

/* ============================================
   3. 页码指示器
   ============================================ */
function updateDots() {
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === currentIndex);
  });
}

function initDots() {
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      if (swiper && i !== currentIndex) {
        swiper.slideTo(i);
      }
    });
  });
}

/* ============================================
   4. Web Audio API — 背景音乐
   ============================================ */
let audioCtx = null;
let musicPlaying = false;
let musicNodes = [];

function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

async function startMusic() {
  if (!audioCtx) initAudio();
  if (audioCtx.state === 'suspended') await audioCtx.resume();
  if (musicPlaying) return;

  const ctx = audioCtx;
  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0;
  masterGain.gain.rampToValueAtTime(0.10, now + 1.5);
  masterGain.connect(ctx.destination);
  musicNodes.push(masterGain);

  const chords = [
    { base: 261.63, notes: [0, 4, 7, 12] },
    { base: 196.00, notes: [0, 4, 7, 11] },
    { base: 220.00, notes: [0, 3, 7, 12] },
    { base: 174.61, notes: [0, 4, 7, 12] },
  ];
  const chordDur = 4.0;
  const cycleLen = chordDur * chords.length;

  function playChord(chord, start, dur) {
    for (const st of chord.notes) {
      const f = chord.base * Math.pow(2, st / 12);
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = 0;
      g.gain.linearRampToValueAtTime(0.06, start + 0.5);
      g.gain.setValueAtTime(0.06, start + dur - 0.5);
      g.gain.linearRampToValueAtTime(0, start + dur);
      osc.connect(g); g.connect(masterGain);
      osc.start(start); osc.stop(start + dur);
      musicNodes.push(osc, g);
    }
    // pad 低音
    const pad = ctx.createOscillator();
    pad.type = 'triangle';
    pad.frequency.value = chord.base * 0.5;
    const pg = ctx.createGain();
    pg.gain.value = 0;
    pg.gain.linearRampToValueAtTime(0.04, start + 0.8);
    pg.gain.setValueAtTime(0.04, start + dur - 0.5);
    pg.gain.linearRampToValueAtTime(0, start + dur);
    pad.connect(pg); pg.connect(masterGain);
    pad.start(start); pad.stop(start + dur);
    musicNodes.push(pad, pg);
  }

  for (let c = 0; c < 30; c++) {
    const cs = now + c * cycleLen;
    for (let i = 0; i < chords.length; i++) {
      playChord(chords[i], cs + i * chordDur, chordDur);
    }
  }

  musicPlaying = true;
  musicBtn.classList.add('playing');
  musicIcon.textContent = '🎵';
}

function stopMusic() {
  if (!audioCtx || !musicPlaying) return;
  if (musicNodes.length > 0) {
    musicNodes[0].gain.rampToValueAtTime(0, audioCtx.currentTime + 0.8);
  }
  setTimeout(() => {
    for (const n of musicNodes) {
      try { n.stop() } catch (_) {}
      try { n.disconnect() } catch (_) {}
    }
    musicNodes.length = 0;
  }, 900);
  musicPlaying = false;
  musicBtn.classList.remove('playing');
  if (musicIcon) musicIcon.textContent = '🔇';
}

function toggleMusic() {
  initAudio();
  musicPlaying ? stopMusic() : startMusic();
}

/* ============================================
   5. 二维码 & 分享
   ============================================ */
function updateQr() {
  if (!qrImage) return;
  const url = window.location.href;
  if (!url.startsWith('http')) {
    qrImage.src = 'https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=https%3A%2F%2Fexample.com';
    return;
  }
  qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(url)}`;
}

function handleShare() {
  if (navigator.share) {
    navigator.share({
      title: '青年发展中心实践部纳新',
      text: '实践部纳新啦！扫码加入我们，一起把青春打磨成光芒四射的瞬间 ✨',
      url: window.location.href,
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(window.location.href).then(() => {
      showToast('链接已复制，快去分享给好友吧！');
    });
  }
}

function showToast(msg) {
  const old = document.querySelector('.custom-toast');
  if (old) old.remove();
  const t = document.createElement('div');
  t.className = 'custom-toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

/* ============================================
   6. 视口缩放（适配不同屏幕）
   ============================================ */
function setViewportScale() {
  const vp = document.getElementById('viewport');
  if (!vp) return;
  const screenW = window.screen.width;
  const screenH = window.screen.height;
  const clientH = document.documentElement.clientHeight || screenH;
  let scale = 1;
  if (screenW / clientH >= 320 / 568) {
    scale = clientH / 568;
  } else {
    scale = screenW / 320;
  }
  vp.setAttribute('content',
    `width=320,initial-scale=${scale},maximum-scale=${scale},user-scalable=no,viewport-fit=cover`
  );
}

/* ============================================
   7. 初始化
   ============================================ */
function init() {
  setViewportScale();
  initSwiper();
  initDots();
  updateQr();

  // 首页立即触发动画
  setTimeout(() => triggerAnimations(0), 300);

  if (musicBtn) musicBtn.addEventListener('click', toggleMusic);
  if (shareBtn) shareBtn.addEventListener('click', handleShare);

  window.addEventListener('resize', setViewportScale);
}

document.addEventListener('DOMContentLoaded', init);
