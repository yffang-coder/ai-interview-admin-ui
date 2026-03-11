# AI 面试官前端（Admin UI）

本模块是管理后台前端，基于 Vue3 + Vite + Element Plus，使用 Nginx 作为静态资源与反向代理。

## 本地开发
- 环境要求：Node.js 18+
- 安装依赖：`npm install`
- 启动开发：`npm run dev`
- 构建生产：`npm run build:prod`

## 生产镜像与运行
- Dockerfile：
  - [Dockerfile](./Dockerfile)
- 构建镜像：
  - `docker build -t ai-interview-frontend -f fronted/ai_admin/ai-interview-admin-ui/Dockerfile fronted/ai_admin/ai-interview-admin-ui`
- 端口映射（compose）：`8091:80`
  - 访问首页：`http://<server>:8091/`

## Nginx 反向代理
- 配置文件：
  - [nginx.conf](./nginx.conf)
- 路由规则：
  - 静态资源：`/` 指向 `/usr/share/nginx/html`
  - 后端接口：`/prod-api/` → `ai-interview-backend:8080/`（保留末尾斜杠以去除前缀）
  - MinIO 对象访问：`/pic/` → `minio:9000/`（容器内部端口 9000）
- 注意：
  - 如果 MinIO 或后端不在同一网络，需根据实际网络名将前端容器加入对应网络或改为真实主机地址与端口

## 接口基础路径
- 前端使用 `VITE_APP_BASE_API` 作为后端基础路径，开发默认 `http://localhost:8080`（见 [vite.config.js](./vite.config.js)）
- 生产环境通过 Nginx 统一代理到 `/prod-api/`，无需修改代码

## 常见问题
- 访问 `/prod-api` 返回 401：
  - 检查 Nginx 是否使用 `location /prod-api/ { proxy_pass http://.../; }`（末尾斜杠必需）
  - 后端匿名白名单仅匹配无前缀路由，如 `/captchaImage`，代理不去前缀会导致 401
- MinIO 图片访问失败：
  - 需转发到 `minio:9000`，而不是宿主机映射端口 `19000`
  - 容器间通信使用服务名与容器内部端口
