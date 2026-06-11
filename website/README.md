# Petory 官网（静态站）

## 本地预览

```bash
npm run website:preview
```

浏览器打开 http://localhost:5180

## 部署

将 `website/` 目录整体部署到 `https://petory.chat`。当前优先推荐 Cloudflare Pages。

## 发布流程

1. 打包应用：`npm run pack:mac` / `npm run pack:win`
2. 同步下载清单：`npm run release:sync`
3. 上传 `release/` 中的安装包到 GitHub Releases 或 CDN
4. 上传 `release/latest*.yml` 到 `https://petory.chat/releases/`（供 electron-updater 使用）
5. 部署 `website/` 静态站

## 自动更新 Feed

`electron-updater` 从 `UPDATE_FEED_URL`（默认 `https://petory.chat/releases`）读取 `latest-mac.yml` / `latest.yml`。

打包后这些文件在 `release/` 目录，与安装包一起上传即可。
