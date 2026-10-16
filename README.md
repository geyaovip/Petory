# Petory · AI 桌面陪伴应用

将宠物照片转化为可驻留桌面的个性化宠物，结合对话、专注计时、久坐提醒和成长记录，提供日常桌面陪伴体验。项目包含 Electron 客户端、服务端 API、管理功能与产品官网。

[产品官网](https://petory.chat/) · [发行记录](https://github.com/geyaovip/Petory/releases) · [产品功能](docs/product/FEATURES.md) · [项目文档](docs/README.md)

官网可公开浏览；桌面能力需下载客户端使用，安装包支持情况以具体发行版本为准。

## 核心功能

| 模块 | 功能说明 |
| --- | --- |
| 个性化宠物 | 上传照片，生成待机、开心、专注、睡觉、提醒、生气等姿势。 |
| 桌面陪伴 | 宠物驻留与互动、状态管理、示例宠物及本地管理。 |
| 对话 | 集成模型聊天能力，与桌面宠物交互。 |
| 专注与提醒 | 专注计时、久坐提醒及相关状态切换。 |
| 成长与恢复 | 成长记录、宠物数据管理和云端恢复导入。 |
| 账号与更新 | 邮箱 Magic Link 登录、版本更新及安装包发布。 |

当前产品规则为每个账号终身仅可成功创建一只自定义宠物，删除本地数据不会重置创建资格。完整规则见[产品功能文档](docs/product/FEATURES.md)。

## 技术架构

| 层级 | 技术 |
| --- | --- |
| 桌面客户端 | Electron、React、TypeScript、electron-vite |
| 图像处理 | Sharp、抠图与图像生成管线，默认接入 Seedream |
| 对话 | Kimi 相关适配与远程 API |
| 服务端 | Hono、Prisma、PostgreSQL |
| 分发更新 | Electron Builder、Electron Updater、GitHub Releases |
| 托管 | Cloudflare Pages 官网、服务端 Docker 与 Cloudflare Tunnel |

客户端按主进程、预加载与渲染进程划分职责；服务端承担账号和远程能力，官网提供产品与下载入口。

## 本地开发

```bash
git clone https://github.com/geyaovip/Petory.git
cd Petory
npm install
cp .env.example .env
cp server/.env.example server/.env
npm run dev
```

需要按环境模板配置图像生成与聊天服务，例如 `ARK_API_KEY`、`KIMI_API_KEY`。未配置的外部能力不能仅凭客户端启动成功认定可用。图像处理依赖说明见[开发文档](docs/README.md)。

本地联调服务端：

```bash
npm run server:install
npm run server:db:up
npm run server:db
npm run server:dev
```

`server:db` 会调整所连接数据库结构，仅在独立开发数据库运行。

## 项目结构

| 路径 | 用途 |
| --- | --- |
| [`src/renderer/`](src/renderer/) | React 客户端界面 |
| [`src/shared/`](src/shared/) | 跨进程类型、常量、提示词与文案 |
| [`electron/`](electron/) | 主进程、窗口、宠物状态、图像与更新管线 |
| [`server/`](server/) | API 与管理端 |
| [`website/`](website/) | 官网、下载页与更新资源 |
| [`docs/`](docs/) | 产品、开发、版本与部署说明 |

## 检查、打包与发布

```bash
npm run typecheck
npm run build
npm run pack:mac
npm run pack:win
npm run website:preview
```

安装包通过 GitHub Releases 分发，官网由 Cloudflare Pages 托管；服务端和下载镜像分别部署。工作流、更新源与镜像重试说明见[服务端文档](docs/backend/README.md)。具体操作系统的安装与自动更新应以对应发行包的实际验证结果为准。
