<script setup>
// ===== ResearchView.vue - Four research directions: chain diagram + alternating detail articles =====
// [EN header added H-line 2026-10-09; original Chinese notes below remain authoritative for tuning history.]
// Route: #/research | Data: research.json, people.json (member names) | i18n: research.*
// Top-to-bottom: page head; four-node chain card (codec -> microsystem -> hanzi writing ->
// clinical translation; SVG arrow separators rotate 90deg on narrow screens); then one
// article per direction - icon visual, question/approach blocks, highlights list,
// representative paper, member chips and source links. Odd articles flip the visual right.
import { useI18n } from 'vue-i18n'
import PageHead from '../components/PageHead.vue'
import LineIcon from '../components/LineIcon.vue'
import research from '../data/research.json'
import people from '../data/people.json'
import { tx } from '../utils/tx'

const { t } = useI18n()

// 相关成员按英文名从 people.json 解析，保持姓名单一数据源
const roster = [
  ...people.phd.map((p) => ({ p, role: 'people.phd' })),
  ...people.master.map((p) => ({ p, role: 'people.master' })),
]
// Resolve each direction's member list (English-name strings in research.json) against the
// people.json roster; unmatched names are dropped rather than rendered raw.
function membersOf(r) {
  return (r.members || [])
    .map((n) => roster.find(({ p }) => p.name && p.name.en === n))
    .filter(Boolean)
}
</script>

<template>
  <PageHead index="03" eyebrow="Research" :title="t('research.title')" :lead="t('research.lead')" />

  <!-- 四方向研究链条：编解码 → 微系统 → 汉字书写 → 临床转化 -->
  <section class="section chain-sec">
    <div class="container">
      <div class="chain card" v-reveal role="group" :aria-label="t('research.chainAria')">
        <p class="chain-cap mono">{{ t('research.chainLabel') }}</p>
        <div class="chain-row">
          <template v-for="(r, i) in research" :key="r.id">
            <div class="chain-node">
              <span class="chain-idx mono">0{{ i + 1 }}</span>
              <LineIcon :name="r.icon" :size="34" />
              <strong>{{ tx(r.title) }}</strong>
              <span class="chain-role">{{ tx(r.role) }}</span>
            </div>
            <div v-if="i < research.length - 1" class="chain-sep" aria-hidden="true">
              <svg viewBox="0 0 40 16" width="40" height="16" fill="none">
                <path d="M2 8h28" stroke="url(#chainGrad)" stroke-width="2" stroke-linecap="round" />
                <path d="M27 3l8 5-8 5" stroke="url(#chainGrad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                <defs>
                  <linearGradient id="chainGrad" x1="0" y1="0" x2="40" y2="0" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#38d6ff" /><stop offset="1" stop-color="#7c8cff" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </template>
        </div>
      </div>
    </div>
  </section>

  <!-- Direction detail articles: even index = visual left, odd flips visual to the right -->
  <section class="section">
    <div class="container">
      <article
        v-for="(r, i) in research"
        :key="r.id"
        class="dir"
        :class="{ flip: i % 2 === 1 }"
        v-reveal
      >
        <div class="dir-visual">
          <LineIcon :name="r.icon" :size="100" />
          <span class="dir-index mono">0{{ i + 1 }}</span>
        </div>
        <div class="dir-body">
          <h2>{{ tx(r.title) }}</h2>
          <p class="dir-desc">{{ tx(r.desc) }}</p>
          <div class="dir-qa">
            <div class="qa-block">
              <span class="tag">{{ t('research.question') }}</span>
              <p>{{ tx(r.question) }}</p>
            </div>
            <div class="qa-block">
              <span class="tag purple">{{ t('research.approach') }}</span>
              <p>{{ tx(r.approach) }}</p>
            </div>
          </div>
          <div class="dir-block">
            <span class="tag">{{ t('research.highlights') }}</span>
            <ul>
              <li v-for="(h, j) in r.highlights" :key="j">{{ tx(h) }}</li>
            </ul>
          </div>
          <p class="dir-rep">
            <span class="tag warm">{{ t('research.repPaper') }}</span>
            <span class="rep-text">{{ tx(r.rep) }}</span>
          </p>
          <div class="dir-extra">
            <div v-if="membersOf(r).length" class="extra-block">
              <span class="label mono">{{ t('research.members') }}</span>
              <div class="member-chips">
                <span v-for="m in membersOf(r)" :key="m.p.name.en" class="m-chip">
                  {{ tx(m.p.name) }}<em class="mono">{{ t(m.role) }}</em>
                </span>
              </div>
            </div>
            <div v-if="r.links && r.links.length" class="extra-block">
              <span class="label mono">{{ t('research.sources') }}</span>
              <div class="src-links">
                <a v-for="(l, j) in r.links" :key="j" :href="l.url" target="_blank" rel="noopener">{{ tx(l.label) }} ↗</a>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
/* ---- 四方向链条图 ---- */
.chain-sec { padding-top: 0; }
.chain {
  position: relative; overflow: hidden;
  display: flex; flex-direction: column; gap: 1.3rem; padding: 2.1rem 1.8rem;
  background:
    radial-gradient(60% 80% at 86% 0%, rgba(56, 214, 255, 0.08), transparent 70%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.028), rgba(255, 255, 255, 0) 38%),
    var(--bg-2);
}
.chain::before {
  content: ""; position: absolute; top: 0; left: 1.8rem; right: 1.8rem; height: 1px;
  background: linear-gradient(90deg, rgba(56, 214, 255, 0.55), rgba(124, 140, 255, 0.25), transparent);
  opacity: 0.65;
}
.chain-cap { position: relative; margin: 0; font-size: 0.74rem; letter-spacing: 0.24em; color: var(--ink-dim); text-transform: uppercase; }
.chain-row { position: relative; display: flex; align-items: stretch; gap: 0.4rem; }
.chain-node {
  position: relative; flex: 1; display: flex; flex-direction: column; align-items: center;
  text-align: center; gap: 0.5rem; padding: 1.2rem 0.7rem 1rem;
  border: 1px solid var(--line); border-radius: var(--r-sm);
  background: linear-gradient(180deg, rgba(56, 214, 255, 0.05), rgba(19, 28, 49, 0.55));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}
.chain-node strong { font-size: 0.92rem; line-height: 1.35; }
.chain-role { font-size: 0.76rem; color: var(--warm); }
.chain-idx { position: absolute; top: 0.55rem; right: 0.65rem; font-size: 0.68rem; color: var(--ink-faint); opacity: 0.7; }
.chain-sep { position: relative; flex: none; width: 40px; height: 16px; align-self: center; }
.chain-sep svg { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); }
@media (max-width: 820px) {
  .chain-row { flex-direction: column; }
  .chain-sep { width: 16px; height: 40px; margin: 0 auto; }
  .chain-sep svg { transform: translate(-50%, -50%) rotate(90deg); }
}

/* ---- 方向详情 ---- */
.dir {
  display: grid; grid-template-columns: 260px 1fr; gap: 2.8rem;
  padding: 2.8rem 0; border-bottom: 1px dashed var(--line);
  align-items: start;
}
.dir:first-child { padding-top: 0; }
.dir:last-child { border-bottom: none; padding-bottom: 0; }
.dir.flip { grid-template-columns: 1fr 260px; }
.dir.flip .dir-visual { order: 2; }
.dir-visual {
  position: sticky; top: calc(var(--nav-h) + 1.5rem);
  overflow: hidden;
  border-radius: var(--radius);
  background:
    radial-gradient(80% 80% at 50% 20%, rgba(56, 214, 255, 0.09), transparent 70%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.028), rgba(255, 255, 255, 0) 38%),
    var(--bg-2);
  border: 1px solid var(--line);
  min-height: 230px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: var(--shadow-card);
}
.dir-visual::before {
  content: ""; position: absolute; width: 176px; height: 176px; border-radius: 50%;
  border: 1px solid rgba(56, 214, 255, 0.12);
  box-shadow: inset 0 0 40px rgba(56, 214, 255, 0.05), 0 0 40px rgba(56, 214, 255, 0.04);
}
.dir-visual::after {
  content: ""; position: absolute; top: 0; left: 1.2rem; right: 1.2rem; height: 1px;
  background: linear-gradient(90deg, rgba(56, 214, 255, 0.45), transparent);
  opacity: 0.55;
}
.dir-visual > :deep(svg) { position: relative; z-index: 1; }
.dir-index {
  position: absolute; left: 1rem; bottom: 0.8rem; z-index: 1;
  font-size: 2.4rem; font-weight: 600; color: rgba(159, 176, 202, 0.22);
}
.dir-body h2 { font-family: var(--font-serif); font-weight: 900; margin: 0 0 0.7rem; font-size: 1.55rem; line-height: 1.35; }
.dir-desc { color: var(--ink-dim); margin: 0 0 1.2rem; max-width: 680px; line-height: 1.85; }
.dir-qa { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.2rem; }
.qa-block {
  display: flex; flex-direction: column; gap: 0.55rem; align-items: flex-start;
  padding: 1rem 1.1rem; border: 1px solid var(--line-soft); border-radius: var(--r-sm);
  background: rgba(19, 28, 49, 0.38);
}
.qa-block p { margin: 0; font-size: 0.9rem; color: var(--ink); line-height: 1.75; }
.dir-block { margin-bottom: 1rem; }
.dir-block .tag { margin-bottom: 0.6rem; }
.dir-block ul { margin: 0.6rem 0 0; padding-left: 0; list-style: none; color: var(--ink-dim); font-size: 0.92rem; }
.dir-block li { position: relative; padding-left: 1rem; margin-bottom: 0.35rem; }
.dir-block li::before {
  content: ""; position: absolute; left: 0; top: 0.66em; width: 4px; height: 4px;
  border-radius: 50%; background: var(--accent); opacity: 0.7;
}
.dir-rep {
  display: flex; align-items: baseline; gap: 0.7rem; flex-wrap: wrap;
  margin: 0 0 1.2rem; padding: 0.7rem 0.95rem;
  border-left: 2px solid rgba(255, 180, 92, 0.42);
  border-radius: 0 var(--r-sm) var(--r-sm) 0;
  background: rgba(255, 180, 92, 0.045);
}
.rep-text { color: var(--ink); font-size: 0.92rem; }
.dir-extra { display: flex; gap: 2.4rem; flex-wrap: wrap; padding-top: 1.2rem; border-top: 1px dashed var(--line); }
.extra-block { display: flex; flex-direction: column; gap: 0.55rem; }
.label { font-size: 0.72rem; letter-spacing: 0.18em; color: var(--accent); text-transform: uppercase; }
.member-chips { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.m-chip {
  display: inline-flex; align-items: baseline; gap: 0.45rem;
  padding: 0.32rem 0.8rem; border-radius: 999px; font-size: 0.85rem;
  background: rgba(56, 214, 255, 0.08); border: 1px solid rgba(56, 214, 255, 0.22);
}
.m-chip em { font-style: normal; font-size: 0.68rem; color: var(--ink-dim); }
.src-links { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.85rem; }
@media (max-width: 820px) {
  .dir, .dir.flip { grid-template-columns: 1fr; }
  .dir.flip .dir-visual { order: 0; }
  .dir-visual { position: static; min-height: 160px; }
  .dir-visual::before { display: none; }
  .dir-qa { grid-template-columns: 1fr; }
}
</style>
