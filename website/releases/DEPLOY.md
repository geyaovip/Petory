# Petory 发布与更新通道

## 1. 本地打包前

```bash
npm run typecheck
npm run qa
```

## 2. 构建安装包

```bash
# macOS
npm run pack:mac

# Windows
npm run pack:win
```

产物在 `release/` 目录。

## 3. 同步官网与更新清单

```bash
npm run release:prepare
```

会执行：

- `release:sync` → 更新 `website/releases/latest.json`（版本号与下载链接）
- `copy-update-feed` → 将 `release/latest*.yml` 复制到 `website/releases/`

## 4. 上传到 GitHub Releases

1. 创建 tag `v{version}`（与 `package.json` 一致）
2. 上传 `release/` 中的 `.dmg` / `.exe`
3. 确认 `latest.json` 里的 URL 与 Release 资源一致

## 5. 部署官网与更新 Feed

将以下内容部署到 `https://petory.chat/`：

| 路径 | 内容 |
|------|------|
| `/` | `website/` 静态页 |
| `/releases/latest.json` | 下载页读取 |
| `/releases/latest-mac.yml` | macOS 自动更新 |
| `/releases/latest.yml` | Windows 自动更新 |

应用内 `electron-updater` 默认读取 `https://petory.chat/releases`。

可通过环境变量 `UPDATE_FEED_URL` 覆盖。

## 6. 发布后验收

- [ ] 下载页显示正确版本号
- [ ] 新装用户可完成：登录 → 上传 → 多姿势生成 → 桌宠显示
- [ ] 设置 → 检查更新 能发现新版本（需上一版本已安装）
- [ ] Pro 兑换后姿势补全可用
- [ ] 久未互动后桌宠进入睡觉姿势
- [ ] 透明区域可穿透，点到宠物 PNG 本体可拖拽/点击
- [ ] 设置开启声音后，点击与提醒有轻提示音
- [ ] 宠物管理 → 单姿势重生成可用（不扣额度）
- [ ] 成长页显示徽章与最近互动
- [ ] 导出数据 JSON 含 `schemaVersion: 2`

## 7. V1.4 体验增强摘要

| 功能 | 说明 |
|------|------|
| Alpha 命中 | 按 PNG 透明通道判断可点击区域 |
| 同伴宠姿势 | 点击同伴短暂显示开心姿势 |
| 单姿势重生成 | `pet.regeneratePose`，宠物管理入口 |
| 音效 | `enableSound` + Web Audio 轻提示音 |
| 成长页 | 徽章、最近互动、姿势数 |
| 数据导出 | schema v2，云同步字段预留 |

**未做（按产品约定）**：点击穿透开关（默认始终穿透）、真实登录/支付、完整云同步。
