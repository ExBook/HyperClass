# HyperClass 官网(静态站)

`website/` 是 HyperClass 的产品主页,纯静态(`index.html` + `styles.css` + `main.js` + `assets/`),无需构建。

目录内包含 Cloudflare Pages 可识别的 `_headers`,以及基础 `robots.txt`。手动上传时整个 `website/` 文件夹一起上传即可。

## 部署到 Cloudflare Pages

**方式一:连接 Git 仓库**
- Framework preset:`None`
- Build command:留空
- Build output directory:`website`
- (Root directory 默认仓库根即可)

**方式二:Direct Upload**
- 直接把 `website/` 文件夹拖到 Cloudflare Pages 的「Upload assets」
- 上传后检查首页、下载按钮、截图资源是否正常加载

## 本地预览

```bash
cd website
python3 -m http.server 8000   # 然后打开 http://localhost:8000
```

> 资源(截图、Logo)都在 `website/assets/` 内,自包含;字体 Poppins 来自 Google Fonts CDN,无网络时回退到系统字体。
