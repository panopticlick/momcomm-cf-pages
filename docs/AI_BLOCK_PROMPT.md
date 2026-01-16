# AI Block

```bash
# 先创建ai block jobs
curl -H "Authorization: Bearer YOUR_CRON_SECRET_HERE" http://localhost:3000/api/cron/topics/ai-block/build
```

## ai block jobs 内容生成工作流程

1. 生成metadata

AiBlockJob 查询: type = "metadata" and status = "QUEUED"

messages:

- user: <products>[[getTopicProductsSimpleData.products JSON.stringify](../src/services/topics/get-topic-products-simple-data.ts)]</products>
- system: Prompt [prompt_metadata]

最终在输出中获取: [PromptMetadataSchema](../src/services/llm/validate-prompt-metadata.ts)

更新Topic meta相关信息, 注意introductory字段类型是richText编辑器

2. 生成content

AiBlockJob 查询: type = "content" and status = "METADATA_COMPLETED"

messages:

- user: <products>[getTopicProductsData.products JSON.stringify](../src/services/topics/get-topic-products-data.ts)</products>
- user: <metadata>[PromptMetadataSchema](../src/services/llm/validate-prompt-metadata.ts)</metadata>
- system: Prompt [prompt_content]

更新Topic content字段, 注意content字段类型是richText编辑器

3. 更新ai_status

Topic: 更新状态 ai_status = "CONTENT_COMPLETED"

## Seed ai blocks

导入样本数据

[seed-ai-blocks.ts](../src/scripts/seed-ai-blocks.ts)

```bash
pnpm seed:ai-blocks
```
