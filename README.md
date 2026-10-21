# Hao Lab · 郝耀耀课题组主页

浙江大学脑机智能全国重点实验室 郝耀耀课题组官方网站。



## 目录结构

```
site/                        # 前端工程
├── vite.config.js           # base: './'（相对路径,子路径部署免改）
├── index.html
├── scripts/regress.mjs      # 自动化回归清单（本地验收用）
└── src/
    ├── data/                # ★ 全部网站内容（改 JSON 即改网站,速览见 data/README.md）
    ├── ink/                 # 意笔 InkIntent 框架（L0 信号→L1/L2 运行时→L3 解码→L4 读出）
    ├── assets/fonts/        # 自托管拉丁可变字体（Space Grotesk / JetBrains Mono,OFL）
    ├── components/          # NavBar / PageHead / 卡片等共享组件
    ├── views/               # 九个公开栏目 + 隐藏 #/lab
    ├── router/ i18n/ styles/ directives/ utils/
    └── theme.js             # canvas 共享调色常量（与 styles/main.css 的 --accent/--warm 同步）
```

## 本地开发

```bash
cd site
npm install
npm run dev        # http://localhost:5173
npm run build      # 产物在 site/dist/,纯静态
npm run regress    # 自动化回归清单（需本地浏览器,见 scripts/regress.mjs 头注）
```

## 更新网站内容

所有内容都在 `site/src/data/` 下的 JSON 文件里：

| 文件 | 内容 | 说明 |
|---|---|---|
| `site.json` | 站点信息、统计数据、合作团队、相册 | 改联系方式、加合作方 |
| `people.json` | PI、博士生、硕士、本科、校友 | 加成员：往对应数组加一项（照抄现有条目格式即可） |
| `publications.json` | 论文、专利、奖项 | 按年份倒序；`flag:"featured"` 会高亮 |
| `news.json` | 新闻动态 | 加一条卡片；英文来源名填 `sourceEn`；`url` 留空则仅显示来源与日期 |
| `research.json` | 四大研究方向 | 文案为 `{zh, en}` 双语字段 |
| `timeline.json` | 大事记 | 关于页展示（首页已去重） |

双语约定：文本字段写 `{"zh": "中文", "en": "English"}`；英文没翻译就填中文，会自动回退。

成员照片放 `site/public/images/`，然后在 `people.json` 对应成员的 `photo` 填 `images/文件名`；不填自动显示姓氏/首字母艺术占位。

## 意笔交互框架

首页 hero 按钮与亮点卡已接入「意笔 InkIntent」神经交互：指针逼近/停驻时元素外围浮现克制的青色光环响应（青=系统回应），触屏/reduced-motion/flag off 自动静默为零。
整体关闭开关：`localStorage.inkintent = 'off'`（改后刷新页面生效）。

`#/lab` 直链进入（不进导航栏）：框架的活体演示——五通道信号监视器、神经元档案试验台、
落墨笔迹与放电、DTW 手写解码、弧线募集、完整试验编排演出。

## 视觉体系与字体

- **设计令牌**集中在 `site/src/styles/main.css`：三层表面 + `--bg-3`、描边/圆角/阴影/动效/字号
  token、全站静态极光+网格氛围层 `.bg-atmosphere`、`.card/.btn/.tag/.page-head` 基础件。
  品牌色 `--accent/--warm/--accent-2/--grad` 未改；canvas 仍以 `site/src/theme.js` 为唯一颜色源，
  改品牌色须两处同步。
- **拉丁字体自托管**：`site/src/assets/fonts/`（Space Grotesk 300–700、JetBrains Mono 100–800，
  latin 子集可变 woff2，OFL 许可与来源见同目录 README）。中文正文继续系统 PingFang/雅黑，
  Noto Serif SC 仍由 Google Fonts 提供。
- **内页页头**统一用 `components/PageHead.vue`；桌面导航断点为 **1140px**，低于此走抽屉。
- **跳过导航链接**由 `App.vue` 的 `skipToMain()` 聚焦 `<main>`，**不要改成裸 `href="#main"`**：
  hash 路由会把它当作路由并触发 catch-all 回首页。

## 代码注释与维护规范

- **双语注释并存**：每个源文件有英文头注（Purpose / 架构位置 / 契约）；带日期的中文调参注记
  是调参史唯一权威，不翻译不删除。新增注释用英文。
- **共享模块**：canvas 画布初始化统一走 `site/src/ink/utils/canvas.js` 的 `setupCanvas()`
  （`NeuralCanvas` hero 画布例外）；canvas 颜色统一走 `site/src/theme.js`。
- 编辑器配置见 `.editorconfig`（2 空格 / LF / UTF-8）。

## 部署

- **GitHub Pages（本仓库已配置）**：推送到 `main` 即自动构建发布，工作流见
  `.github/workflows/deploy.yml`。
- **任意静态托管**：`npm run build` 后把 `site/dist/` 内容放到网站根目录即可；
  路由为 hash 模式，无需服务器 rewrite 配置。
- 部署在子路径（如 `https://xxx.edu.cn/~haolab/`）时无需改动，`vite.config.js` 已设相对 base。

## 环境要求

Node.js ≥ 18，npm ≥ 9。
