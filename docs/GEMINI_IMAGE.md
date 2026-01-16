# Gemini Image Generation Script

本项目包含一个基于 Gemini 2.5 Flash 模型的图片生成脚本，位于 `bin/gemini-image`。

## 前置条件

1.  **环境配置**: 确保 `bin` 目录下的 `.env` 文件中配置了 `GEMINI_API_KEY` (`bin/.env`)。
    ```env
    GEMINI_API_KEY=your_api_key_here
    GEMINI_BASE_URL=https://generativelanguage.googleapis.com # 可选，默认为 Google 官方节点
    ```
2.  **依赖工具**: 脚本依赖系统安装的 `curl` 和 `jq`。

## 使用方法

脚本位于 `bin/gemini-image`，支持直接在终端运行。

```bash
./bin/gemini-image -p "<提示词>" [选项]
```

### 参数说明

| 参数 | 必选 | 默认值                           | 说明                                    |
| :--- | :--- | :------------------------------- | :-------------------------------------- |
| `-p` | 是   | 无                               | 图片生成的文本提示词 (Prompt)           |
| `-o` | 否   | `tmp/gemini_<日期>_<随机数>.png` | 输出图片的路径                          |
| `-m` | 否   | `gemini-2.5-flash-image-preview` | 使用的模型名称                          |
| `-a` | 否   | `4:3`                            | 图片宽高比 (如 16:9, 4:3, 3:2, 9:16 等) |
| `-h` | 否   | 无                               | 显示帮助信息                            |

## 示例

### 1. 基础生成

生成一张图片并保存到默认路径（包含随机文件名的 `tmp` 目录）：

```bash
./bin/gemini-image -p "How to Choose the Best Travel Strollers"
```

### 2. 指定输出路径

将生成的图片保存为 `my-image.png`：

```bash
./bin/gemini-image -p "A cozy nursery flat-lay with soft toys" -o "my-image.png"
```

### 3. 指定模型

使用特定的模型版本：

```bash
./bin/gemini-image -p "Landscape of mountains" -m "gemini-2.5-flash-image-preview"
```

### 4. 指定宽高比

生成 16:9 的宽屏图片：

```bash
./bin/gemini-image -p "A wide angle shot of a beach" -a "16:9"
```

## 注意事项

- 脚本会自动加载 `bin/.env` 文件中的环境变量。
- 默认输出目录 `tmp/` 会自动创建（如果不存在）。
- 请确保网络可以访问 Gemini API 接口。
