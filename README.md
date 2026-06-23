# Petory

上传一张照片，让它住进你的电脑。

**官网：** https://petory.chat

Petory 是一款 AI 桌面陪伴应用：上传宠物照片后生成可驻留桌面的桌宠，支持聊天、专注计时、久坐提醒与成长记录。

## 当前能力概览

- 邮箱 Magic Link 登录，无密码注册流程
- 上传照片生成 6 种姿势（待机、开心、专注、睡觉、提醒、生气），保持原图主体身份
- 每个账号终身仅可成功创建 1 只自定义宠物（删除本地后也不可再次创建）
- 桌面陪伴、宠物管理、示例宠物与云端恢复导入
- 图像生成默认使用火山引擎 **Doubao-Seedream-4.5**

更多产品说明见 [docs/product/FEATURES.md](./docs/product/FEATURES.md)。

## 目录结构

| 路径 | 说明 |
|------|------|
| `src/renderer/` | React 客户端界面 |
| `src/shared/` | 跨进程共享常量、类型、提示词与文案 |
| `electron/` | 主进程、窗口、更新器与图像管线 |
| `server/` | 后端 API 与管理后台 |
| `website/` | 官网与下载页 |
| `docs/` | 产品、版本与部署文档 |

## 本地开发

```bash
npm install
cp .env.example .env
cp server/.env.example server/.env
npm run dev
```

如需本地联调后端：

```bash
npm run server:install
npm run server:db
npm run server:dev
```

客户端依赖 `ARK_API_KEY`（Seedream 图像生成）与 `KIMI_API_KEY`（聊天能力）。

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Electron + Vite 开发环境 |
| `npm run build` | 构建生产资源 |
| `npm run typecheck` | TypeScript 类型检查 |
| `npm run pack:mac` | 打包 macOS 安装包 |
| `npm run pack:win` | 打包 Windows 安装包 |
| `npm run release:prepare` | 刷新官网版本元数据 |
| `npm run website:preview` | 预览静态官网 |
| `npm run server:dev` | 启动后端 API |
| `npm run docker:up` | Docker 启动 PostgreSQL + 官网 |

## 部署架构

| 组件 | 目标 |
|------|------|
| 客户端安装包 | GitHub Releases |
| 官网 | Cloudflare Pages（`petory.chat`） |
| 更新源 | `https://petory.chat/releases` |
| 后端 API / 管理端 | VPS Docker + Cloudflare Tunnel（`api.petory.chat`） |

## 发布与部署

**客户端：** 打 tag 后由 GitHub Actions **Release** 工作流自动构建 macOS / Windows 安装包，发布到 GitHub Releases，更新官网版本信息，并在配置 SSH 密钥后镜像 `.dmg` / `.exe` 到 VPS 下载目录。

**服务端：** 通过 GitHub Actions **Deploy Server** 或本地 `npm run deploy:server` 部署。

**下载镜像重试：** GitHub Actions **Mirror Downloads** 或 `npm run deploy:downloads -- --from-github`。

## 文档入口

- [docs/README.md](./docs/README.md) — 文档总览
- [docs/product/FEATURES.md](./docs/product/FEATURES.md) — 当前产品能力
- [docs/backend/README.md](./docs/backend/README.md) — 服务端与管理端
- [docs/development/DOCKER-DEV.md](./docs/development/DOCKER-DEV.md) — 本地 Docker 开发

## 维护约定

- `src/shared/` 为跨进程共享值的唯一来源
- `docs/` 为产品与部署说明的权威文档
- 勿将构建产物或运行时数据提交进源码目录
