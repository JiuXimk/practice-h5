/* ============================================
   青年发展中心实践部纳新 H5 — 交互脚本
   ============================================ */

// ── DOM 引用 ──────────────────────────────────
const pageContainer = document.getElementById('pageContainer');
const pages = Array.from(document.querySelectorAll('.page'));
const dots = Array.from(document.querySelectorAll('.dot'));
const starCanvas = document.getElementById('starCanvas');
const shareBtn = document.getElementById('shareBtn');
const qrImage = document.getElementById('qrImage');
const ambientGlows = document.querySelectorAll('.ambient-glow');
const floatingDecors = document.querySelectorAll('.floating-decor');

// ── 状态 ──────────────────────────────────────
let isScrolling = false;
let currentPageIndex = 0;

/* ============================================
   1. 星空粒子画布
   ============================================ */

function initStarfield() {
  if (!starCanvas) return;

  const ctx = starCanvas.getContext('2d');
  let width, height;
  const stars = [];
  const STAR_COUNT = 180;
  const STAR_COLORS = [
    'rgba(255, 255, 255, 0.9)',
    'rgba(200, 220, 255, 0.8)',
    'rgba(180, 200, 255, 0.7)',
    'rgba(255, 220, 200, 0.7)',
  ];

  function resize() {
    width = starCanvas.width = window.innerWidth;
    height = starCanvas.height = window.innerHeight;
  }

  function createStar() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 2.0 + 0.6,
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      twinkleSpeed: Math.random() * 0.015 + 0.005,
      twinkleOffset: Math.random() * Math.PI * 2,
      driftX: (Math.random() - 0.5) * 0.15,
      driftY: (Math.random() - 0.5) * 0.10,
      baseOpacity: Math.random() * 0.6 + 0.4,
    };
  }

  function initStars() {
    stars.length = 0;
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push(createStar());
    }
  }

  function drawStars(timestamp) {
    ctx.clearRect(0, 0, width, height);

    for (const star of stars) {
      // 闪烁
      const twinkle = Math.sin(timestamp * star.twinkleSpeed + star.twinkleOffset);
      const alpha = star.baseOpacity * (0.55 + 0.45 * ((twinkle + 1) / 2));

      // 缓慢漂移 + 循环
      star.x += star.driftX;
      star.y += star.driftY;

      if (star.x < -10) star.x = width + 10;
      if (star.x > width + 10) star.x = -10;
      if (star.y < -10) star.y = height + 10;
      if (star.y > height + 10) star.y = -10;

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);

      // 外层光晕
      const glow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.r * 3);
      glow.addColorStop(0, star.color.replace('0.', `0.${Math.floor(alpha * 9 + 1)}`).replace(/[\d.]+\)$/, `${alpha * 0.35})`));
      glow.addColorStop(0.5, star.color.replace(/[\d.]+\)$/, `${alpha * 0.10})`));
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fill();

      // 核心亮点
      ctx.fillStyle = star.color.replace(/[\d.]+\)$/, `${alpha})`);
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function animate(timestamp) {
    drawStars(timestamp);
    requestAnimationFrame(animate);
  }

  resize();
  initStars();
  requestAnimationFrame(animate);

  window.addEventListener('resize', () => {
    resize();
    initStars();
  });
}

/* ============================================
   2. 视差滚动效果
   ============================================ */

function initParallax() {
  if (!pageContainer) return;

  function updateParallax() {
    const scrollTop = pageContainer.scrollTop;
    const viewHeight = window.innerHeight;
    const totalHeight = pages.length * viewHeight;
    const scrollFraction = totalHeight > 0 ? scrollTop / (totalHeight - viewHeight) : 0;

    // 光晕随滚动移动
    if (ambientGlows.length >= 3) {
      ambientGlows[0].style.transform =
        `translate(${-20 + scrollFraction * 60}px, ${10 + scrollFraction * 30}px) scale(${1 - scrollFraction * 0.1})`;
      ambientGlows[1].style.transform =
        `translate(${30 - scrollFraction * 50}px, ${-10 - scrollFraction * 20}px) scale(${1 + scrollFraction * 0.08})`;
      ambientGlows[2].style.transform =
        `translate(${-10 + scrollFraction * 40}px, ${20 - scrollFraction * 40}px) scale(${1 - scrollFraction * 0.06})`;
    }

    // 浮动装饰随滚动偏移
    if (floatingDecors.length >= 3) {
      floatingDecors[0].style.transform =
        `translateY(${scrollFraction * 30}px) rotate(${scrollFraction * 8}deg)`;
      floatingDecors[1].style.transform =
        `translateY(${-scrollFraction * 20}px) rotate(${-scrollFraction * 6}deg)`;
      floatingDecors[2].style.transform =
        `translateY(${scrollFraction * 40}px) rotate(${scrollFraction * 10}deg)`;
    }
  }

  pageContainer.addEventListener('scroll', updateParallax, { passive: true });
}

/* ============================================
   3. 入场动画 — Intersection Observer
   ============================================ */

function initScrollAnimations() {
  // 给需要动画的元素打标记
  const animatableSelectors = [
    '.hero-badge', '.hero-title', '.hero-tagline', '.hero-keywords', '.scroll-hint',
    '.section-header', '.about-item', '.about-image',
    '.work-card',
    '.photo-card',
    '.qr-card', '.invite-intro', '.invite-closing', '.share-btn',
  ];

  const allElements = [];
  animatableSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      el.classList.add('animate-in');
      allElements.push(el);
    });
  });

  if (allElements.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // 入场后不再观察，保持可见
        observer.unobserve(entry.target);
      }
    }
  }, {
    root: pageContainer,
    rootMargin: '0px 0px -60px 0px',
    threshold: 0.15,
  });

  allElements.forEach(el => observer.observe(el));

  // 第1页元素立即显示（因为已经在视口内）
  setTimeout(() => {
    const page1 = document.getElementById('page1');
    if (page1) {
      page1.querySelectorAll('.animate-in').forEach(el => el.classList.add('visible'));
    }
  }, 200);
}

/* ============================================
   4. 页码指示器
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

  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === idx);
  });
}

/* ============================================
   5. 滚轮翻页
   ============================================ */

function scrollToPage(index) {
  if (index < 0 || index >= pages.length) return;
  isScrolling = true;
  currentPageIndex = index;

  pages[index].scrollIntoView({ behavior: 'smooth' });

  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });

  setTimeout(() => { isScrolling = false; }, 700);
}

function handleWheel(event) {
  if (isScrolling) return;
  if (Math.abs(event.deltaY) < 15) return;
  event.preventDefault();

  const direction = event.deltaY > 0 ? 1 : -1;
  const currentIndex = findCurrentPageIndex();
  const nextIndex = Math.max(0, Math.min(pages.length - 1, currentIndex + direction));

  if (nextIndex !== currentIndex) {
    scrollToPage(nextIndex);
  }
}

/* ============================================
   6. 触摸滑动支持
   ============================================ */

function initTouchSupport() {
  let touchStartY = 0;
  let touchActive = false;

  pageContainer.addEventListener('touchstart', (e) => {
    if (isScrolling) return;
    touchStartY = e.touches[0].clientY;
    touchActive = true;
  }, { passive: true });

  pageContainer.addEventListener('touchend', (e) => {
    if (!touchActive || isScrolling) { touchActive = false; return; }
    touchActive = false;

    const deltaY = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(deltaY) < 30) return;

    const direction = deltaY > 0 ? 1 : -1;
    const currentIndex = findCurrentPageIndex();
    const nextIndex = Math.max(0, Math.min(pages.length - 1, currentIndex + direction));

    if (nextIndex !== currentIndex) {
      scrollToPage(nextIndex);
    }
  });
}

/* ============================================
   7. 点指示器点击跳转
   ============================================ */

function initDotNavigation() {
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      if (i !== findCurrentPageIndex()) {
        scrollToPage(i);
      }
    });
  });
}

/* ============================================
   8. 键盘导航
   ============================================ */

function initKeyboardNav() {
  document.addEventListener('keydown', (e) => {
    if (isScrolling) return;
    const currentIndex = findCurrentPageIndex();

    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      if (currentIndex < pages.length - 1) scrollToPage(currentIndex + 1);
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      if (currentIndex > 0) scrollToPage(currentIndex - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      scrollToPage(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      scrollToPage(pages.length - 1);
    }
  });
}

/* ============================================
   9. 二维码 & 分享
   ============================================ */

function updateQr() {
  if (!qrImage) return;
  const currentUrl = window.location.href;
  if (!currentUrl.startsWith('http')) {
    qrImage.src = 'https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=https%3A%2F%2Fexample.com';
    return;
  }
  const encoded = encodeURIComponent(currentUrl);
  qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encoded}`;
}

function handleShare() {
  const shareData = {
    title: '青年发展中心实践部纳新',
    text: '实践部纳新啦！扫码加入我们，一起把青春打磨成光芒四射的瞬间 ✨',
    url: window.location.href,
  };

  if (navigator.share) {
    navigator.share(shareData).catch(() => {
      copyToClipboard();
    });
  } else {
    copyToClipboard();
  }
}

function copyToClipboard() {
  navigator.clipboard.writeText(window.location.href).then(() => {
    showToast('链接已复制，快去分享给好友吧！');
  }).catch(() => {
    alert('链接复制失败，请手动复制页面地址分享。');
  });
}

/* ── 简易 Toast ── */
function showToast(message) {
  const existing = document.querySelector('.custom-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'custom-toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 999;
    padding: 14px 28px;
    border-radius: 999px;
    background: rgba(18, 26, 48, 0.92);
    border: 1px solid rgba(255,255,255,0.15);
    color: #f0f2f8;
    font-size: 0.95rem;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    animation: toastIn 0.4s cubic-bezier(0.16,1,0.3,1),
               toastOut 0.35s 2s cubic-bezier(0.16,1,0.3,1) forwards;
    pointer-events: none;
  `;

  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes toastIn  { from { opacity:0; transform:translateX(-50%) translateY(20px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
    @keyframes toastOut { to   { opacity:0; transform:translateX(-50%) translateY(-12px); } }
  `;
  document.head.appendChild(styleSheet);
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
    styleSheet.remove();
  }, 2500);
}

/* ============================================
   10. 初始化
   ============================================ */

function init() {
  initStarfield();
  initParallax();
  initScrollAnimations();
  initDotNavigation();
  initTouchSupport();
  initKeyboardNav();
  updateQr();

  // 监听滚动更新指示器
  if (pageContainer) {
    pageContainer.addEventListener('wheel', handleWheel, { passive: false });
    pageContainer.addEventListener('scroll', updateDots, { passive: true });
  }

  // 分享按钮
  if (shareBtn) {
    shareBtn.addEventListener('click', handleShare);
  }

  // 首次指示器状态
  updateDots();
}

// ── 启动 ──
document.addEventListener('DOMContentLoaded', init);
