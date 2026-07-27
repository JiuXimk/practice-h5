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
   4. 背景音乐 — Into The Sun
   ============================================ */
function toggleMusic() {
  if (!bgmAudio) return;
  if (bgmAudio.paused) {
    bgmAudio.play().then(() => {
      musicBtn.classList.add('playing');
      if (musicIcon) musicIcon.textContent = '🎵';
    }).catch(() => showToast('点击按钮播放音乐 🎵'));
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
   6. 视口缩放
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
   7. 初始化
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
}

document.addEventListener('DOMContentLoaded', init);
