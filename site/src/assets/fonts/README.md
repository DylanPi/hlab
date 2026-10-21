# Self-hosted Latin fonts

自托管拉丁字体，供 `src/styles/main.css` 的 `@font-face` 使用。中文正文仍走系统
PingFang / 雅黑/Songti 栈；`Noto Serif SC` 仍由 Google Fonts 提供。把这两族加回
`index.html` 的 Google Fonts 请求会重复下载，勿这样做。

| 文件 | 字族 | 轴 | 来源 |
|---|---|---|---|
| `space-grotesk-latin.woff2` | Space Grotesk | `wght 300–700`（可变） | Google Fonts v22, latin subset |
| `jetbrains-mono-latin.woff2` | JetBrains Mono | `wght 100–800`（可变） | Google Fonts v24, latin subset |

- 两个文件都是 **latin 子集的可变字体**，一个文件覆盖全站用到的所有字重；`main.css`
  以 `font-weight: 300 700` / `100 800` 声明。
- 许可：SIL Open Font License 1.1，见同目录 `OFL-SpaceGrotesk.txt` 与
  `OFL-JetBrainsMono.txt`。保留版权与许可声明。
- 更新方式：从 `fonts.googleapis.com/css2?family=...`（带现代浏览器 UA）取 latin 块的
  `fonts.gstatic.com` woff2 URL，覆盖同名文件即可；无需构建步骤。
- 体积：Space Grotesk ≈22 KB，JetBrains Mono ≈31 KB。
