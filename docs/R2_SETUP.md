# Cloudflare R2 存储配置指南

本项目已配置使用 Cloudflare R2 作为媒体文件存储。

## 前置要求

1. Cloudflare 账号
2. 已创建的 R2 Bucket

## 配置步骤

### 1. 创建 R2 Bucket

1. 登录 Cloudflare Dashboard
2. 导航到 **R2** 服务
3. 点击 **Create bucket**
4. 输入 bucket 名称(例如: `amz-payload-media`)
5. 选择区域(建议选择离用户最近的区域)
6. 点击 **Create bucket**

### 2. 生成 R2 API Token

1. 在 R2 页面,点击 **Manage R2 API Tokens**
2. 点击 **Create API token**
3. 配置权限:
   - **Token name**: 给 token 起个名字(例如: `payload-cms-token`)
   - **Permissions**: 选择 `Object Read & Write`
   - **TTL**: 根据需要设置过期时间
4. 点击 **Create API Token**
5. 保存显示的 **Access Key ID** 和 **Secret Access Key**

### 3. 配置公开访问(可选)

如果需要公开访问上传的文件:

#### 方法 1: 使用 R2.dev 子域名(免费)

1. 在 Bucket 设置中,找到 **Public access** 部分
2. 点击 **Allow Access**
3. 系统会生成一个 `https://<bucket-name>.<account-hash>.r2.dev` 格式的 URL

#### 方法 2: 使用自定义域名(推荐)

1. 在 Bucket 设置中,点击 **Custom Domains**
2. 点击 **Connect Domain**
3. 输入你的域名(例如: `media.yourdomain.com`)
4. 按照提示添加 DNS 记录
5. 等待 DNS 生效

### 4. 配置环境变量

复制 `.env.example` 到 `.env` 并填写以下配置:

```bash
# Cloudflare R2 Storage
R2_ENDPOINT=https://<your-account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=<your-access-key-id>
R2_SECRET_ACCESS_KEY=<your-secret-access-key>
R2_BUCKET_NAME=<your-bucket-name>
R2_PUBLIC_URL=<your-public-url>
```

**参数说明:**

- `R2_ENDPOINT`: R2 API 端点
  - 格式: `https://<account-id>.r2.cloudflarestorage.com`
  - Account ID 可以在 Cloudflare Dashboard 右侧找到
- `R2_ACCESS_KEY_ID`: 步骤 2 中生成的 Access Key ID

- `R2_SECRET_ACCESS_KEY`: 步骤 2 中生成的 Secret Access Key

- `R2_BUCKET_NAME`: 步骤 1 中创建的 bucket 名称

- `R2_PUBLIC_URL`: 公开访问 URL
  - R2.dev 子域名: `https://<bucket-name>.<account-hash>.r2.dev`
  - 自定义域名: `https://media.yourdomain.com`

### 5. 重启应用

配置完成后,重启应用使配置生效:

```bash
pnpm dev
```

## 验证配置

1. 登录 Payload CMS 后台
2. 导航到 **Media** 集合
3. 尝试上传一个文件
4. 上传成功后,文件应该存储在 R2 中
5. 访问文件的公开 URL 验证是否可以访问

## 故障排查

### 上传失败

- 检查 R2 API Token 权限是否正确
- 确认 Access Key ID 和 Secret Access Key 是否正确
- 检查 Bucket 名称是否正确

### 无法访问上传的文件

- 确认已配置公开访问(R2.dev 或自定义域名)
- 检查 `R2_PUBLIC_URL` 是否正确
- 如果使用自定义域名,确认 DNS 记录已生效

### CORS 错误

如果遇到 CORS 错误,需要在 R2 Bucket 设置中配置 CORS:

1. 在 Bucket 设置中找到 **CORS policy**
2. 添加以下配置:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

## 成本说明

Cloudflare R2 的定价:

- **存储**: $0.015/GB/月
- **Class A 操作**(写入): $4.50/百万次请求
- **Class B 操作**(读取): $0.36/百万次请求
- **出站流量**: 免费(这是 R2 的主要优势!)

相比 AWS S3,R2 的出站流量免费可以节省大量成本。

## 参考资料

- [Cloudflare R2 文档](https://developers.cloudflare.com/r2/)
- [Payload Cloud Storage Plugin](https://payloadcms.com/docs/plugins/cloud-storage)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
