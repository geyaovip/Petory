# Petory Docs

这是 Petory 的文档总入口。新的说明尽量先放到对应分组，再从这里汇总，避免版本、部署、产品说明散落在根目录里。

## 文档分组

### 产品与版本

| 文档 | 说明 |
|------|------|
| [FEATURES.md](./FEATURES.md) | 当前客户端能力总览 |
| [BACKLOG.md](./BACKLOG.md) | 待办与暂缓项 |
| [QA-INTERNAL.md](./QA-INTERNAL.md) | 内测验收清单 |
| [versions/README.md](./versions/README.md) | 版本目录 |

### 架构与实现

| 文档 | 说明 |
|------|------|
| [UI-DESIGN.md](./UI-DESIGN.md) | 客户端、管理端、官网统一视觉规范 |
| [C2.0.md](./C2.0.md) | 客户端接后台的对接说明 |
| [C2.3.md](./C2.3.md) | 客户端 2.3 体验说明 |
| [C2.4.md](./C2.4.md) | 客户端 2.4 体验说明 |
| [C2.5.md](./C2.5.md) | 客户端 2.5 体验说明 |
| [C2.6.md](./C2.6.md) | 客户端 2.6 内测补强 |
| [admin/README.md](./admin/README.md) | 管理端文档索引 |

### 运维与发布

| 文档 | 说明 |
|------|------|
| [DOCKER-DEV.md](./DOCKER-DEV.md) | 本地 Docker 开发 |
| [admin/DEPLOY.md](./admin/DEPLOY.md) | 管理端部署清单 |
| [admin/DATABASE.md](./admin/DATABASE.md) | PostgreSQL / Prisma 配置 |
| [admin/VERSION-ROADMAP.md](./admin/VERSION-ROADMAP.md) | 管理端版本规划 |
| [../website/releases/DEPLOY.md](../website/releases/DEPLOY.md) | 官网与更新清单发布流程 |

## 维护约定

1. 文档优先按“产品、架构、运维、版本”四类归档。
2. 涉及站点域名、更新 feed、发布链接时，优先同时检查 `src/shared/constants.ts`、`scripts/sync-release-manifest.mjs`、`website/releases/latest.json`。
3. 新增说明时优先补到对应目录的 `README.md` 或索引页，再在上层入口做一条链接。
4. 涉及客户端行为变化时，以 `src/shared/` 的类型、常量、提示文案为第一手来源。
