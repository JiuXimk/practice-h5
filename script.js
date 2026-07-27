const qrImage = document.getElementById('qrImage');
const shareBtn = document.getElementById('shareBtn');
const pageContainer = document.querySelector('.page-container');
const pages = Array.from(document.querySelectorAll('.page'));
let isScrolling = false;

function updateQr() {
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
    text: '实践部纳新啦，扫码加入青年发展中心实践部！',
    url: window.location.href,
  };

  if (navigator.share) {
    navigator.share(shareData).catch(() => {
      alert('分享失败，请复制链接后手动发送。');
    });
  } else {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert('页面链接已复制到剪贴板，分享到你的社交平台即可。');
    });
  }
}

function scrollToPage(index) {
  if (index < 0 || index >= pages.length) return;
  isScrolling = true;
  pages[index].scrollIntoView({ behavior: 'smooth' });
  window.setTimeout(() => { isScrolling = false; }, 650);
}

function findCurrentPageIndex() {
  const buffer = window.innerHeight / 4;
  return pages.findIndex(page => {
    const rect = page.getBoundingClientRect();
    return rect.top >= -buffer && rect.top < window.innerHeight - buffer;
  });
}

function handleWheel(event) {
  if (isScrolling) return;
  if (Math.abs(event.deltaY) < 20) return;
  event.preventDefault();
  const direction = event.deltaY > 0 ? 1 : -1;
  const currentIndex = findCurrentPageIndex();
  const nextIndex = Math.max(0, Math.min(pages.length - 1, currentIndex + direction));
  if (nextIndex !== currentIndex) {
    scrollToPage(nextIndex);
  }
}

if (pageContainer) {
  pageContainer.addEventListener('wheel', handleWheel, { passive: false });
}

if (qrImage) {
  updateQr();
}

if (shareBtn) {
  shareBtn.addEventListener('click', handleShare);
}
