# ☁️ 全能云存储分发系统 (R2 + CF Worker) 架构复盘与知识沉淀

> **记录时间**: 2026-02-28
> **标签**: `R2`, `Cloudflare`, `图床`, `鉴权`, `CORS`

## 1. 架构演进背景

在早期的体系中，依赖于明文或无保护直连的图床网关。为了让独立抽离的新核心技能 `file-hosting-master-skill` 能够在高度安全的前提下一键上传处理多模态文件素材（包括全尺寸图片、短视频、音频等），重构了底层分发组件。

## 2. 核心架构设计 (Worker + R2 Binding)

图床不再暴露 S3 或走公共 R2 网关，而是封装成了 **Cloudflare Worker 代理层**:

- **前端请求**: 用户或 Agent 带上文件（`FormData: { file: File }`）
- **代理节点**: `r2-upload-proxy.webkubor.workers.dev` 负责计算拦截
- **存储后端**: 绑定的 `images` R2 存储桶

## 3. 🛡️ 顶配安全墙 (Auth Shield) 设计

由于 Cloudflare 免费分配的流量虽然巨大（每天 10W 次请求，下行无限），但恶意上传会挤占免费存储额度（10GB/月）。我们在此次引入了彻底的**代码脱敏和环境变量鉴权**：

1. **彻底的代码脱敏**: 原代码中的 `CF_ACCOUNT_ID`、`CF_API_TOKEN`、`R2_BUCKET_NAME` 从代码侧彻底抹除，改为了安全的 `env.xxx` 动态读取模式。配合 ES Modules 标准：

```javascript
export default {
  async fetch(request, env, ctx) {
     const CF_ACCOUNT_ID = env.CF_ACCOUNT_ID; // 凭据从此变得彻底隐身
  }
}
```

1. **核心拦路虎 (Bearer Token 门禁)**:
增加了通过比对 `Authorization` 头信息与面板环境里的秘文进行的防抖保护拦截：

```javascript
const authHeader = request.headers.get("Authorization");
const expectedToken = `Bearer ${env.UPLOAD_SECRET_TOKEN}`;

if (!authHeader || authHeader !== expectedToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
}
```

## 4. 给 Agent 或者老爹的调用指南

往后其他自动化脚本和前端的接入方法必须附带 Header：

```bash
curl -X POST \
     -H "Authorization: Bearer wk_r2_c9f2...[秘钥见内部ENV]" \
     -F "file=@/本地路径/图片.png" \
     https://r2-upload-proxy.webkubor.workers.dev/
```

这套极致白嫖 + 企业级安全锁定的架构将永久充当 AI Common 体系和老爹个人宇宙的御用静态资源分发中心。
