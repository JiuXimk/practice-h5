/* ============================================
   青年发展中心实践部纳新 H5 — 交互脚本
   ============================================ */

// ── DOM ──────────────────────────────────────
const pageContainer = document.getElementById('pageContainer');
const pages = Array.from(document.querySelectorAll('.page'));
const dots = Array.from(document.querySelectorAll('.dot'));
const shareBtn = document.getElementById('shareBtn');
const qrImage = document.getElementById('qrImage');
const musicBtn = document.getElementById('musicToggle');
const musicIcon = musicBtn ? musicBtn.querySelector('.music-icon') : null;
const bgGlows = document.querySelectorAll('.bg-glow-1, .bg-glow-2');
const bgDecors = document.querySelectorAll('.bg-decor-1, .bg-decor-2, .bg-decor-3');

let isScrolling = false;
let currentPageIndex = 0;

/* ============================================
   1. Web Audio API — 温柔阳光背景音乐
   ============================================ */
let audioCtx = null;
let musicPlaying = false;
let musicNodes = [];

function initAudio() {
  if (audioCtx) return;
  // 在用户首次交互时创建 AudioContext
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

async function startMusic() {
  if (!audioCtx) initAudio();
  if (audioCtx.state === 'suspended') await audioCtx.resume();
  if (musicPlaying) return;

  const ctx = audioCtx;
  const now = ctx.currentTime;

  // 主音量
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0;
  masterGain.gain.rampToValueAtTime(0.12, now + 1.5);
  masterGain.connect(ctx.destination);
  musicNodes.push(masterGain);

  // ── 和弦进行：C → G → Am → F (温暖、阳光的I-V-vi-IV) ──
  const chordProgression = [
    { base: 261.63, notes: [0, 4, 7, 12] },     // C major
    { base: 196.00, notes: [0, 4, 7, 11] },     // G major
    { base: 220.00, notes: [0, 3, 7, 12] },     // Am
    { base: 174.61, notes: [0, 4, 7, 12] },     // F major
  ];

  const chordDuration = 4.0;  // 每个和弦4秒
  const totalCycle = chordDuration * chordProgression.length; // 16秒循环

  function scheduleChord(chord, startTime, duration) {
    const baseFreq = chord.base;
    for (const semitone of chord.notes) {
      const freq = baseFreq * Math.pow(2, semitone / 12);

      // 柔和正弦波
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      // 每个音色的独立增益，做淡入淡出
      const noteGain = ctx.createGain();
      noteGain.gain.value = 0;
      const noteVol = 0.08;
      noteGain.gain.setValueAtTime(0, startTime);
      noteGain.gain.linearRampToValueAtTime(noteVol, startTime + 0.5);
      noteGain.gain.setValueAtTime(noteVol, startTime + duration - 0.5);
      noteGain.gain.linearRampToValueAtTime(0, startTime + duration);

      osc.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start(startTime);
      osc.stop(startTime + duration);
      musicNodes.push(osc, noteGain);
    }
  }

  // ── 低音铺垫 (pad) ──
  function schedulePad(baseFreq, startTime, duration) {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = baseFreq * 0.5;

    const padGain = ctx.createGain();
    padGain.gain.value = 0;
    padGain.gain.setValueAtTime(0, startTime);
    padGain.gain.linearRampToValueAtTime(0.06, startTime + 0.8);
    padGain.gain.setValueAtTime(0.06, startTime + duration - 0.5);
    padGain.gain.linearRampToValueAtTime(0, startTime + duration);

    // 加入轻微颤音
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 4.5;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 1.5;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start(startTime);
    lfo.stop(startTime + duration);

    osc.connect(padGain);
    padGain.connect(masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration);
    musicNodes.push(osc, padGain, lfo, lfoGain);
  }

  // ── 高音点缀 (bell-like) ──
  function scheduleBell(freq, startTime) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq * 2;

    const bellGain = ctx.createGain();
    bellGain.gain.value = 0;
    bellGain.gain.setValueAtTime(0.04, startTime);
    bellGain.gain.exponentialRampToValueAtTime(0.001, startTime + 2.0);

    osc.connect(bellGain);
    bellGain.connect(masterGain);

    osc.start(startTime);
    osc.stop(startTime + 2.0);
    musicNodes.push(osc, bellGain);
  }

  // ── 安排多个循环 ──
  function scheduleCycle(startOffset) {
    for (let cycle = 0; cycle < 20; cycle++) {
      const cycleStart = now + startOffset + cycle * totalCycle;
      for (let i = 0; i < chordProgression.length; i++) {
        const chordStart = cycleStart + i * chordDuration;
        scheduleChord(chordProgression[i], chordStart, chordDuration);
        schedulePad(chordProgression[i].base, chordStart, chordDuration);

        // 每个和弦开始时加一个小点缀音
        scheduleBell(chordProgression[i].base, chordStart + 0.5);
      }
    }
  }

  scheduleCycle(0);

  // ── 第二个八度叠加层 (偏移2秒) ──
  setTimeout(() => {
    const ctx2 = audioCtx;
    const now2 = ctx2.currentTime;
    for (let cycle = 0; cycle < 20; cycle++) {
      const cycleStart = now2 + cycle * totalCycle;
      for (let i = 0; i < chordProgression.length; i++) {
        const chordStart = cycleStart + i * chordDuration;
        // 高一个八度的简约点缀
        const highFreq = chordProgression[i].base * 2;
        const osc = ctx2.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = highFreq;
        const g = ctx2.createGain();
        g.gain.value = 0;
        g.gain.linearRampToValueAtTime(0.025, chordStart + 0.6);
        g.gain.linearRampToValueAtTime(0, chordStart + chordDuration);
        osc.connect(g);
        g.connect(musicNodes[0]); // masterGain
        osc.start(chordStart + 0.5);
        osc.stop(chordStart + chordDuration);
        musicNodes.push(osc, g);
      }
    }
  }, 2000);

  musicPlaying = true;
  musicBtn.classList.add('playing');
  musicIcon.textContent = '🎵';
}

function stopMusic() {
  if (!audioCtx || !musicPlaying) return;

  // 渐变淡出
  if (musicNodes.length > 0) {
    const masterGain = musicNodes[0];
    const now = audioCtx.currentTime;
    masterGain.gain.rampToValueAtTime(0, now + 0.8);
  }

  // 清理节点
  setTimeout(() => {
    for (const node of musicNodes) {
      try { node.stop(); } catch (_) { /* 已停止 */ }
      try { node.disconnect(); } catch (_) {}
    }
    musicNodes.length = 0;
  }, 900);

  musicPlaying = false;
  musicBtn.classList.remove('playing');
  if (musicIcon) musicIcon.textContent = '🔇';
}

function toggleMusic() {
  initAudio();
  if (musicPlaying) {
    stopMusic();
  } else {
    startMusic();
  }
}

/* ============================================
   2. 入场动画 — Intersection Observer
   ============================================ */
function initScrollAnimations() {
  const animItems = document.querySelectorAll('.anim-item');
  if (animItems.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    }
  }, {
    root: pageContainer,
    rootMargin: '0px 0px -40px 0px',
    threshold: 0.10,
  });

  animItems.forEach(el => observer.observe(el));

  // 第1页元素立即显示
  setTimeout(() => {
    const page1 = document.getElementById('page1');
    if (page1) {
      page1.querySelectorAll('.anim-item').forEach(el => el.classList.add('visible'));
    }
  }, 150);
}

/* ============================================
   3. 背景视差
   ============================================ */
function initParallax() {
  if (!pageContainer) return;

  pageContainer.addEventListener('scroll', () => {
    const scrollTop = pageContainer.scrollTop;
    const viewH = window.innerHeight;
    const totalH = pages.length * viewH;
    const fraction = totalH > 0 ? scrollTop / (totalH - viewH) : 0;

    // 光效偏移
    if (bgGlows.length >= 2) {
      bgGlows[0].style.transform = `translate(${-15 + fraction * 40}px, ${5 + fraction * 20}px)`;
      bgGlows[1].style.transform = `translate(${20 - fraction * 30}px, ${-10 - fraction * 15}px)`;
    }

    // 装饰图偏移
    if (bgDecors.length >= 3) {
      bgDecors[0].style.transform = `translate(${-fraction * 20}px, ${fraction * 15}px) rotate(${fraction * 5}deg)`;
      bgDecors[1].style.transform = `translate(${fraction * 18}px, ${-fraction * 22}px) rotate(${-fraction * 4}deg)`;
      bgDecors[2].style.transform = `translate(${-fraction * 25}px, ${-fraction * 10}px) rotate(${fraction * 6}deg)`;
    }
  }, { passive: true });
}

/* ============================================
   4. 页码
   ============================================ */
function findCurrentPageIndex() {
  const buffer = window.innerHeight / 4;
  return pages.findIndex(page => {
    const rect = page.getBoundingClientRect();
    return rect.top >= -buffer && rect.top < window.innerHeight - buffer;
  });
}

function updateDots() {
  const idx = findCurrentPageIndex();
  if (idx === -1 || idx === currentPageIndex) return;
  currentPageIndex = idx;
  dots.forEach((dot, i) => dot.classList.toggle('active', i === idx));
}

/* ============================================
   5. 滚轮翻页
   ============================================ */
function scrollToPage(index) {
  if (index < 0 || index >= pages.length) return;
  isScrolling = true;
  currentPageIndex = index;

  pages[index].scrollIntoView({ behavior: 'smooth' });
  dots.forEach((dot, i) => dot.classList.toggle('active', i === index));

  setTimeout(() => { isScrolling = false; }, 700);
}

function handleWheel(e) {
  if (isScrolling) return;
  if (Math.abs(e.deltaY) < 15) return;
  e.preventDefault();

  const dir = e.deltaY > 0 ? 1 : -1;
  const cur = findCurrentPageIndex();
  const next = Math.max(0, Math.min(pages.length - 1, cur + dir));
  if (next !== cur) scrollToPage(next);
}

/* ============================================
   6. 触摸
   ============================================ */
function initTouch() {
  let touchStartY = 0;

  pageContainer.addEventListener('touchstart', (e) => {
    if (isScrolling) return;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  pageContainer.addEventListener('touchend', (e) => {
    if (isScrolling) return;
    const deltaY = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(deltaY) < 30) return;
    const dir = deltaY > 0 ? 1 : -1;
    const cur = findCurrentPageIndex();
    const next = Math.max(0, Math.min(pages.length - 1, cur + dir));
    if (next !== cur) scrollToPage(next);
  });
}

/* ============================================
   7. 点指示器点击
   ============================================ */
function initDots() {
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      if (i !== findCurrentPageIndex()) scrollToPage(i);
    });
  });
}

/* ============================================
   8. 键盘
   ============================================ */
function initKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (isScrolling) return;
    const cur = findCurrentPageIndex();
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      if (cur < pages.length - 1) scrollToPage(cur + 1);
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      if (cur > 0) scrollToPage(cur - 1);
    } else if (e.key === 'Home') { e.preventDefault(); scrollToPage(0); }
    else if (e.key === 'End')  { e.preventDefault(); scrollToPage(pages.length - 1); }
  });
}

/* ============================================
   9. 二维码 & 分享
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
  const shareData = {
    title: '青年发展中心实践部纳新',
    text: '实践部纳新啦！扫码加入我们，一起把青春打磨成光芒四射的瞬间 ✨',
    url: window.location.href,
  };
  if (navigator.share) {
    navigator.share(shareData).catch(() => showToast('分享失败，请复制链接后手动发送'));
  } else {
    navigator.clipboard.writeText(window.location.href).then(
      () => showToast('链接已复制，快去分享给好友吧！')
    );
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
   10. 启动
   ============================================ */
function init() {
  initParallax();
  initScrollAnimations();
  initDots();
  initTouch();
  initKeyboard();
  updateQr();

  if (pageContainer) {
    pageContainer.addEventListener('wheel', handleWheel, { passive: false });
    pageContainer.addEventListener('scroll', updateDots, { passive: true });
  }

  if (musicBtn) {
    musicBtn.addEventListener('click', toggleMusic);
  }

  if (shareBtn) {
    shareBtn.addEventListener('click', handleShare);
  }

  updateDots();
}

document.addEventListener('DOMContentLoaded', init);
