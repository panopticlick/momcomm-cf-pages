# Blog Shortcode 模块

支持在文章内容中嵌入动态内容。

## 语法

使用双大括号语法：`{{ type arg="value" }}`

### 参数支持

- `tags`: JSON 字符串数组，例如 `tags=["tag1", "tag2"]`
- `search`: 搜索关键词，例如 `search="keyword"`
- `limit`: 数量限制，默认 10 (Topics) 或 6 (Posts)
- `h2`: 自定义 H2 标题内容
- `h3`: 自定义 H3 标题内容
- `subtitle`: 可选副标题/描述文本

## 使用示例

### 1. 相关主题 BY Tags

```txt
{{ topics tags=["name"] }}
```

### 2. 相关主题 BY Search

```txt
{{ topics search="keyword" }}
```

### 3. 相关 Post BY Tags

```txt
{{ posts tags=["name"] }}
```

## 实现说明

### 服务端渲染架构

Shortcode 在服务端预渲染，无前端 XHR 请求：

1. **预处理**：`src/services/shortcode/process.ts`
   - `processShortcodes()` 解析 RichText 中的 shortcode
   - 服务端调用 `getTopics()` / `getPostsByTags()` 获取数据
   - 返回按 index 索引的 `ShortcodeData` 数组

2. **数据传递**：通过 React Context
   - `src/components/frontend/shortcode/ShortcodeContext.tsx`
   - `ShortcodeProvider` 包裹 RichText 组件

3. **渲染器**：`src/components/frontend/shortcode/ShortcodeRenderer.tsx`
   - 从 Context 获取预加载数据
   - 按 index 匹配 shortcode 与数据

4. **展示组件**：纯展示，无状态管理
   - `TopicsShortcode.tsx`
   - `PostsShortcode.tsx`

### 数据流

```
page.tsx (服务端)
  ↓ processShortcodes(content)
  ↓ ShortcodeData[]
PostContent / TopicContent
  ↓ ShortcodeProvider
RichText + converters
  ↓ ShortcodeRenderer
TopicsShortcode / PostsShortcode (纯展示)
```
