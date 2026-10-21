# 数据文件速览（改这里 = 改网站）

> 本目录是网站**全部内容**的存放处。不需要懂代码：用任意文本编辑器打开 JSON，
> 改完保存 → `bash scripts/deploy.sh` 发布 → git commit。字段格式见根目录
> `README.md` 与 `docs/NEEDED-INFO.md`（加成员的完整示例）。

## 文件一览

| 文件 | 内容 | 常见改动 |
|---|---|---|
| `site.json` | 站点名、联系方式、合作团队、相册 | 换邮箱/地址；加合作方；相册加 `{src, caption}` |
| `people.json` | PI / 博士 / 硕士 / 本科 / 校友 | 加成员往对应数组加一项；毕业成员移入 `alumni` |
| `publications.json` | 论文（按年倒序）/ 专利 / 奖项 | 新论文加 `papers` 一条（`flag:"featured"` 高亮）；`type:"conference"` 区分会议 |
| `news.json` | 新闻动态 | 加一条卡片；英文来源名填 `sourceEn`；`url` 留空则仅显示来源与日期 |
| `research.json` | 四大研究方向 | 文案更新；成员映射用 `dir` 字段（须与 people.json 的 `dir` 一致） |
| `timeline.json` | 大事记（关于页展示） | 补里程碑 `{year, text}` |

## 三条铁律

1. **双语字段**：文本写 `{"zh": "中文", "en": "English"}`；英文没翻译就先填中文，
   页面会自动回退（英文页出现中文仅限人名/论文原题）。
2. **空数组有语义**：`gallery` 为 `[]` 显示设计化空态；people 各分组为空则整组隐藏。
   没有的内容**不要编造**，留空/删条目即可（红线见 `docs/HANDOVER.md` §4）。
3. **改完必验证**：发布前跑一遍快速回归（九栏目中英切换、390px 无横向滚动、
   论文页 BibTeX 复制；方法见 `docs/HANDOVER.md` §5）。

## JSON 语法提醒

- 最后一个条目后**不能有逗号**；字符串内的引号用中文引号或转义 `\"`。
- 改坏了页面打不开时：`git diff site/src/data/` 看改动，`git checkout -- <文件>` 回退。
- 图片放 `site/public/images/`，JSON 里引用 `images/文件名`。
