/* ============================================
   青年发展中心实践部纳新 H5 — Into The Sun
   ============================================ */

const shareBtn = document.getElementById('shareBtn');
const qrImage = document.getElementById('qrImage');
const musicBtn = document.getElementById('musicToggle');
const musicIcon = musicBtn ? musicBtn.querySelector('.music-icon') : null;
const bgmAudio = document.getElementById('bgmAudio');
const dots = Array.from(document.querySelectorAll('#pageDots .dot'));

let swiper, currentIndex = 0;

/* ============================================
   1. Swiper
   ============================================ */
function initSwiper() {
  swiper = new Swiper('.main-swiper', {
    direction: 'vertical',
    loop: false,
    speed: 600,
    mousewheel: { forceToAxis: true, sensitivity: 0.8, thresholdDelta: 8, thresholdTime: 300 },
    keyboard: { enabled: true, onlyInViewport: true },
    touchRatio: 1, touchAngle: 45,
    resistance: true, resistanceRatio: 0.6,
    observer: true, observeParents: true,
    on: {
      slideChange() {
        currentIndex = swiper.activeIndex;
        updateDots();
      },
      slideChangeTransitionEnd() {
        triggerAnimations(swiper.activeIndex);
      },
    },
  });
}

/* ============================================
   2. 入场动画
   ============================================ */
function triggerAnimations(idx) {
  const slide = swiper.slides[idx];
  if (!slide) return;
  slide.querySelectorAll('.anim-item').forEach((el, i) => {
    el.classList.remove('visible');
    setTimeout(() => el.classList.add('visible'), i * 55);
  });
}

/* ============================================
   3. 页码
   ============================================ */
function updateDots() {
  dots.forEach((d, i) => d.classList.toggle('active', i === currentIndex));
}
function initDots() {
  dots.forEach((d, i) => d.addEventListener('click', () => {
    if (swiper && i !== currentIndex) swiper.slideTo(i);
  }));
}

/* ============================================
   4. 背景音乐 — Into The Sun（自动从第5秒开始）
   ============================================ */
function startBgm() {
  if (!bgmAudio || !bgmAudio.paused) return;
  bgmAudio.currentTime = 5;
  bgmAudio.play().then(() => {
    musicBtn.classList.add('playing');
    if (musicIcon) musicIcon.textContent = '🎵';
  }).catch(() => {});
}

function tryAutoPlay() {
  // 尝试立即播放
  startBgm();
  // 如果被浏览器阻止，等用户首次交互时播放
  if (bgmAudio && bgmAudio.paused) {
    const playOnTouch = () => {
      startBgm();
      document.removeEventListener('touchstart', playOnTouch);
      document.removeEventListener('click', playOnTouch);
      document.removeEventListener('wheel', playOnTouch);
    };
    document.addEventListener('touchstart', playOnTouch, { once: true });
    document.addEventListener('click', playOnTouch, { once: true });
    document.addEventListener('wheel', playOnTouch, { once: true });
  }
}

function toggleMusic() {
  if (!bgmAudio) return;
  if (bgmAudio.paused) {
    startBgm();
  } else {
    bgmAudio.pause();
    musicBtn.classList.remove('playing');
    if (musicIcon) musicIcon.textContent = '🔇';
  }
}

/* ============================================
   5. 二维码 & 分享
   ============================================ */
function updateQr() {
  if (!qrImage) return;
  const url = window.location.href;
  qrImage.src = url.startsWith('http')
    ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(url)}`
    : 'https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=https%3A%2F%2Fexample.com';
}

function handleShare() {
  if (navigator.share) {
    navigator.share({
      title: '青年发展中心实践部纳新',
      text: '实践部纳新啦！扫码加入我们 ✨',
      url: window.location.href,
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(window.location.href).then(() => showToast('链接已复制！'));
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
   6. 目录导航（第1页标签点击跳转）
   ============================================ */
function initNavItems() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const slide = parseInt(item.dataset.slide);
      if (swiper && !isNaN(slide)) swiper.slideTo(slide);
    });
  });
}

/* ============================================
   7. 视口缩放
   ============================================ */
function setViewportScale() {
  const vp = document.getElementById('viewport');
  if (!vp) return;
  const sw = window.screen.width;
  const ch = document.documentElement.clientHeight || window.screen.height;
  let s = sw / ch >= 320 / 568 ? ch / 568 : sw / 320;
  vp.setAttribute('content', `width=320,initial-scale=${s},maximum-scale=${s},user-scalable=no,viewport-fit=cover`);
}

/* ============================================
   7. 可拖拽装饰图片
   ============================================ */
function initDraggableDecorations() {
  const decors = document.querySelectorAll('.bg-im');
  if (!decors.length) return;

  let dragEl = null, sx = 0, sy = 0, ox = 0, oy = 0;

  decors.forEach(el => {
    el.style.cursor = 'grab';
    el.addEventListener('pointerdown', e => {
      dragEl = el;
      dragEl.setPointerCapture(e.pointerId);
      sx = e.clientX; sy = e.clientY;
      const r = dragEl.getBoundingClientRect();
      ox = r.left; oy = r.top;
      dragEl.style.transition = 'none';
      dragEl.style.zIndex = '10';
      e.preventDefault();
    });
    el.addEventListener('pointermove', e => {
      if (dragEl !== el) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      el.style.left = (ox + dx) + 'px';
      el.style.top  = (oy + dy) + 'px';
      el.style.right = 'auto';
      el.style.bottom = 'auto';
    });
    el.addEventListener('pointerup', () => {
      if (dragEl !== el) return;
      el.style.transition = 'all .6s cubic-bezier(.16,1,.3,1)';
      el.style.zIndex = '0';
      setTimeout(() => {
        el.style.left = ''; el.style.top = '';
        el.style.right = ''; el.style.bottom = '';
      }, 60);
      dragEl = null;
    });
    el.addEventListener('pointercancel', () => {
      if (dragEl !== el) return;
      el.style.transition = 'all .6s cubic-bezier(.16,1,.3,1)';
      el.style.zIndex = '0';
      el.style.left = ''; el.style.top = '';
      el.style.right = ''; el.style.bottom = '';
      dragEl = null;
    });
  });
}

/* ============================================
   8. 初始化
   ============================================ */
function init() {
  setViewportScale();
  initSwiper();
  initDots();
  updateQr();
  setTimeout(() => triggerAnimations(0), 300);
  if (musicBtn) musicBtn.addEventListener('click', toggleMusic);
  if (shareBtn) shareBtn.addEventListener('click', handleShare);
  window.addEventListener('resize', setViewportScale);
  initNavItems();
  initDraggableDecorations();
  tryAutoPlay();
}

document.addEventListener('DOMContentLoaded', init);
