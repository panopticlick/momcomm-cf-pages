# R2 存储配置完成

## ✅ 已完成的配置

1. **安装依赖包**
   - `@payloadcms/plugin-cloud-storage`
   - `@aws-sdk/client-s3`
   - `@aws-sdk/lib-storage`

2. **更新 Payload 配置**
   - 在 `src/payload.config.ts` 中集成了 cloudStoragePlugin
   - 配置了 s3Adapter 用于 R2 存储
   - Media 集合现在会将文件上传到 R2

3. **环境变量配置**
   - 更新了 `.env.example` 添加 R2 相关配置项

4. **文档**
   - 创建了详细的配置指南: `docs/R2_SETUP.md`

## 📝 下一步操作

### 1. 配置环境变量

在你的 `.env` 文件中添加以下配置(参考 `.env.example`):

```bash
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_URL=https://your-bucket.your-domain.com
```

### 2. 在 Cloudflare 创建 R2 资源

1. 创建 R2 Bucket
2. 生成 API Token(需要 Object Read & Write 权限)
3. 配置公开访问(可选择 R2.dev 子域名或自定义域名)

详细步骤请查看: `docs/R2_SETUP.md`

### 3. 重启开发服务器

配置完成后重启:

```bash
pnpm dev
```

## 🔍 验证

1. 登录 Payload CMS 后台
2. 进入 Media 集合
3. 上传一个测试文件
4. 检查文件是否成功上传到 R2
5. 访问文件的公开 URL 验证访问

## ⚠️ 注意事项

- 确保 R2 API Token 有正确的权限
- 如果使用自定义域名,需要配置 DNS 记录
- R2 出站流量免费,相比 S3 可以节省大量成本
- 建议在生产环境使用自定义域名而不是 R2.dev 子域名

## 📚 相关文档

- [R2 配置详细指南](./R2_SETUP.md)
- [Cloudflare R2 官方文档](https://developers.cloudflare.com/r2/)
- [Payload Cloud Storage Plugin](https://payloadcms.com/docs/plugins/cloud-storage)
