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
  let dragEl = null, startX, startY, origLeft, origTop, hasMoved = false;

  function onStart(e) {
    dragEl = e.target.closest('.bg-im');
    if (!dragEl) return;
    e.stopPropagation();
    const touch = e.touches ? e.touches[0] : e;
    startX = touch.clientX;
    startY = touch.clientY;
    const rect = dragEl.getBoundingClientRect();
    origLeft = rect.left;
    origTop = rect.top;
    hasMoved = false;
    dragEl.style.transition = 'none';
    dragEl.style.zIndex = '5';
  }

  function onMove(e) {
    if (!dragEl) return;
    const touch = e.touches ? e.touches[0] : e;
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
    hasMoved = true;
    dragEl.style.left = (origLeft + dx) + 'px';
    dragEl.style.top = (origTop + dy) + 'px';
    dragEl.style.right = 'auto';
    dragEl.style.bottom = 'auto';
  }

  function onEnd() {
    if (!dragEl) return;
    dragEl.style.transition = 'all 0.6s cubic-bezier(0.16,1,0.3,1)';
    dragEl.style.zIndex = '0';
    setTimeout(() => {
      dragEl.style.left = '';
      dragEl.style.top = '';
      dragEl.style.right = '';
      dragEl.style.bottom = '';
    }, 50);
    dragEl = null;
  }

  decors.forEach(el => {
    el.style.cursor = 'grab';
    el.addEventListener('mousedown', onStart);
    el.addEventListener('touchstart', onStart, { passive: false });
  });
  document.addEventListener('mousemove', onMove);
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('mouseup', onEnd);
  document.addEventListener('touchend', onEnd);
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
