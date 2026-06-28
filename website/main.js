// 滚动进入视口时触发显隐动画
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }
}, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// 首屏元素立即显示(无需滚动)
requestAnimationFrame(() => {
  document.querySelectorAll('.hero .reveal, .nav .reveal').forEach((el) => el.classList.add('in'));
});

// 复制邮箱
const EMAIL = 'hyperclass@163.com';
const copyBtn = document.getElementById('copyMail');
if (copyBtn) {
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      const old = copyBtn.textContent;
      copyBtn.textContent = '✓ 已复制 ' + EMAIL;
      copyBtn.disabled = true;
      setTimeout(() => { copyBtn.textContent = old; copyBtn.disabled = false; }, 1800);
    } catch { window.location.href = 'mailto:' + EMAIL; }
  });
}

// 页脚年份
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
