// 把 dist 打包成可加载的 Chrome/Edge MV3 扩展(dist-ext)。
// 用法:npm run build:ext  →  在浏览器「加载已解压的扩展程序」选 dist-ext。
import { cpSync, rmSync, writeFileSync, existsSync } from 'fs';

if (!existsSync('dist')) {
  console.error('请先 vite build 生成 dist');
  process.exit(1);
}

rmSync('dist-ext', { recursive: true, force: true });
cpSync('dist', 'dist-ext', { recursive: true });

const manifest = {
  manifest_version: 3,
  name: 'HyperClass · 课堂工具箱',
  version: '0.1.0',
  description: '打开即用的中小学课堂工具箱:随机点名、计时器、地图填图、函数演示等。',
  action: { default_title: 'HyperClass · 课堂工具箱' },
  background: { service_worker: 'background.js' },
  icons: {
    16: 'icons/icon-16.png',
    32: 'icons/icon-32.png',
    48: 'icons/icon-48.png',
    128: 'icons/icon-128.png',
  },
};
writeFileSync('dist-ext/manifest.json', JSON.stringify(manifest, null, 2));

// 点工具栏图标 → 在新标签整页打开工具箱(空间大,适合课堂大屏)
writeFileSync(
  'dist-ext/background.js',
  "chrome.action.onClicked.addListener(() => {\n  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });\n});\n",
);

console.log('✓ 扩展已生成: dist-ext/  (浏览器扩展页 → 开发者模式 → 加载已解压的扩展程序)');
