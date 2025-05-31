
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
        *   此项目不需要特定的环境变量进行构建或运行，因为 API 密钥等不是此项目的一部分。

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
*   **`_redirects` 文件**: 如果你的应用使用了 React Router (此项目未使用 `BrowserRouter` 而是依赖 hash，所以不需要特别处理 SPA 路由回退)，对于使用 `BrowserRouter` 的 SPA，你可能需要在 `public` 目录下创建一个 `_redirects` 文件，内容为 `/* /index.html 200`，以确保所有路由都由 `index.html` 处理。但对于此番茄钟项目，由于其简单性或不依赖路径路由，此步骤可能不是必需的。当前项目使用默认的 Vite 构建，不需要特殊路由配置。

通过以上步骤，你的番茄工作法计时器应用就可以成功部署到 Cloudflare Pages 上，并供全球用户访问。
    