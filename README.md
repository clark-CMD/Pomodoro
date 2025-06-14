# 番茄工作法计时器 (Pomodoro Timer)

这是一个使用 React, TypeScript 和 Tailwind CSS 构建的番茄工作法计时器应用。

## 特性

- **多种计时阶段**: 支持“工作”、“短时休息”和“长时间休息”。
- **可自定义时长**: 用户可以为每个阶段自定义分钟数。
- **长休周期管理**: 设置在完成多少个“番茄钟”后进入“长时间休息”。
- **番茄钟计数**: 自动追踪并显示已完成的番茄钟数量。
- **动态主题**: 背景和进度条颜色根据当前阶段变化。
- **美观的 UI**: 现代化的卡片式设计和动画效果。
- **设置持久化**: 用户设置会保存在浏览器的 localStorage 中。
- **音效提示**: 阶段切换时有声音提示。
- **PWA 支持**:
    - **可安装**: 可以“添加到主屏幕”以获得类似原生应用的体验。
    - **离线可用**: 通过 Service Worker 缓存核心资源，应用可在离线状态下加载和使用。
    - **快速加载**: 缓存策略有助于后续访问时更快地加载。

## PWA (Progressive Web App) 设置

为了提供更好的用户体验，特别是当应用被“添加到主屏幕”时，此应用已配置为 PWA。

### 1. Web App Manifest (`public/manifest.json`)
此文件向浏览器提供有关您的应用的信息，例如名称、图标、启动 URL 和显示模式。它对于“添加到主屏幕”功能至关重要。

### 2. Icons (`public/icons/`)
应用需要各种尺寸的图标用于主屏幕、启动画面等。
- **`icon-192x192.png`** 和 **`icon-512x512.png`**: 标准 PWA 图标。
- **`icon-maskable-192x192.png`** 和 **`icon-maskable-512x512.png`**: 可适配图标 (Maskable icons) 确保您的图标在所有 Android 设备上看起来都很棒。
- **`apple-touch-icon.png`**: iOS 设备用于主屏幕图标 (推荐尺寸 180x180px)。

**重要**: 项目中已包含 `icon-192.svg`, `icon-512.svg`, 和 `apple-touch-icon.svg` 作为**占位符**。您需要：
1.  将这些 SVG 文件转换为相应的 PNG 格式。
2.  确保文件名与 `public/manifest.json` 和 `index.html` 中引用的名称匹配 (例如, `public/icons/icon-192x192.png`, `public/icons/apple-touch-icon.png`)。
3.  为可适配图标创建版本，确保它们在安全区域内正确显示。您可以使用像 [Maskable.app](https://maskable.app/editor) 这样的工具来测试和生成可适配图标。

### 3. Service Worker (`sw.js`)
Service Worker 是一个在后台运行的脚本，独立于网页。它负责缓存应用的核心资源（HTML, CSS, JavaScript 模块, 图标等）。
- **离线优先**: 在首次访问后，应用可以从缓存加载，即使没有网络连接。
- **性能提升**: 从缓存加载资源通常比从网络加载更快。
- **自动更新**: 当部署新版本的应用时，Service Worker 逻辑有助于更新缓存的资源。

## 本地开发

### 环境要求

- Node.js (推荐 v18 或更高版本)
- npm 或 yarn

### 安装依赖

```bash
npm install
# 或者
yarn install
```

### 启动开发服务器

```bash
npm run dev
# 或者
yarn dev
```

应用将在 `http://localhost:5173` (或 Vite 指定的其他端口) 上运行。
**注意**: Service Worker 功能（如离线缓存）通常在生产构建或通过 HTTPS 提供的服务上表现最可靠。一些浏览器可能会限制 Service Worker 在不安全的 HTTP 本地主机上的某些功能，但基本注册和缓存通常有效。

### 构建生产版本

```bash
npm run build
# 或者
yarn build
```

构建产物将生成在 `dist` 目录中。

## 部署到 Cloudflare Pages

Cloudflare Pages 是一个非常适合部署此类静态站点（或通过 Functions 实现 SSR/ISR 的应用）的平台。

### 步骤

1.  **准备 Git 仓库**:
    *   确保你的项目已经是一个 Git 仓库，并且已经推送到 GitHub, GitLab 或 Bitbucket。

2.  **登录 Cloudflare**:
    *   访问 [Cloudflare Dashboard](https://dash.cloudflare.com/) 并登录。

3.  **导航到 Pages**:
    *   在左侧菜单中，选择 "Workers & Pages"。
    *   点击 "Create application"。

4.  **连接到 Git 提供商**:
    *   选择 "Pages" 标签页。
    *   点击 "Connect to Git"。
    *   选择你的 Git 提供商 (GitHub, GitLab) 并授权 Cloudflare 访问你的仓库。

5.  **选择仓库**:
    *   选择你想要部署的番茄计时器项目的仓库。
    *   点击 "Begin setup"。

6.  **配置构建设置**:
    *   **Project name**: 可以自定义，默认为仓库名。
    *   **Production branch**: 选择你的主分支 (例如 `main` 或 `master`)。
    *   **Framework preset**: 选择 `Vite`。Cloudflare Pages 通常能很好地识别 Vite 项目并自动填充大部分设置。
        *   如果未自动识别，或者你需要自定义：
            *   **Build command**: `npm run build` (或者 `yarn build`，取决于你项目中 `package.json` 的脚本)
            *   **Build output directory**: `dist` (这是 Vite 默认的输出目录)
            *   **Root directory** (可选): 如果你的 `package.json` 不在仓库根目录，请指定。通常留空。
    *   **Environment variables** (可选):
        *   此项目不需要特定的环境变量进行构建或运行。

7.  **保存并部署**:
    *   点击 "Save and Deploy"。
    *   Cloudflare Pages 将开始拉取你的代码、构建项目并部署。
    *   你可以在部署日志中查看进度。

8.  **访问你的应用**:
    *   部署完成后，Cloudflare Pages 会提供一个唯一的 `*.pages.dev` 子域名 (例如 `your-project-name.pages.dev`)，你可以通过此 URL 访问你的番茄计时器。
    *   你也可以配置自定义域名。

### 注意事项

*   **Node.js 版本**: Cloudflare Pages 允许你指定构建时使用的 Node.js 版本。如果你的项目有特定版本要求，可以在 "Environment variables" (Advanced) 中设置 `NODE_VERSION` (例如 `NODE_VERSION=18`)。通常默认版本即可。
*   **构建时间**: 首次构建可能需要几分钟。后续的提交会自动触发新的构建和部署。
*   **Service Worker 和 HTTPS**: Service Workers 要求通过 HTTPS 提供服务才能注册和运行（`localhost` 是一个例外）。Cloudflare Pages 默认提供 HTTPS，因此 Service Worker 可以正常工作。
*   **`public` 目录**: 确保您的 `public` 目录（包含 `manifest.json` 和 `icons/`）中的内容被正确复制到构建输出目录的根级别。Vite 默认会这样做。

通过以上步骤，你的番茄工作法计时器应用就可以成功部署到 Cloudflare Pages 上，并作为 PWA 供全球用户访问和安装。
