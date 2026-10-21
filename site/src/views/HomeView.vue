<script setup>
// ===== HomeView.vue - Landing page: hero, stats band, highlights, latest news, team preview, join CTA =====
// [EN header added H-line 2026-10-09; original Chinese notes below remain authoritative for tuning history.]
// [Deep Signal pass 2026-10-20: layered hero composition, editorial stat band, numbered
//  highlight cards and a calmer section rhythm. Ink selectors/formulas are unchanged.]
// Route: #/ | Data: site.json, news.json, people.json | i18n: home.*, common.*
// Two animation systems coexist here by design (commit G1c): the A-line hero canvas
// (NeuralCanvas, own rAF loop) and the InkIntent framework (src/ink/, v-tuned directive
// neurons + CSS variable bus --exc/--fire consumed by ::after/::before halos).
// Sections top-to-bottom: hero (data-ink container), stats band, highlight cards (second
// data-ink container), latest 3 news, team preview band (PI + 6 members), join CTA box.
// The main CTA intercepts plain left-clicks to play a light-burst before routing (plan A3).
import { computed, ref, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import NeuralCanvas from '../components/NeuralCanvas.vue'
import SectionHead from '../components/SectionHead.vue'
import NewsCard from '../components/NewsCard.vue'
import PersonCard from '../components/PersonCard.vue'
import LineIcon from '../components/LineIcon.vue'
import site from '../data/site.json'
import news from '../data/news.json'
import people from '../data/people.json'
import { tx, bySince } from '../utils/tx'

const { t, locale } = useI18n()

// Hero handwriting chars exist only for zh (paired with the stroke SVG line below them);
// an empty array in en makes the .handwriting block self-hide via :not(:has(.hw-char)).
const chars = computed(() => (locale.value === 'zh' ? ['意', '念', '写', '字'] : []))

// 亮点卡只讲故事，数字留给统计带与时间线，避免同一数字多处重复
const highlights = computed(() => [
  {
    icon: 'pen',
    title: { zh: '意念写字', en: 'Thought writing' },
    desc: {
      zh: '全球首次侵入式脑机接口脑控机械臂书写汉字，让高位截瘫志愿者用“意念”写出整句话。',
      en: 'World-first invasive BCI writing Chinese characters with a robotic arm — a paralyzed volunteer writes full sentences by thought.',
    },
  },
  {
    icon: 'brain',
    title: { zh: '手写多维编码', en: 'Coding of handwriting' },
    desc: {
      zh: 'Nature Communications 揭示运动皮层对手写三维轨迹、握力与笔压的多维编码机制。',
      en: 'Nature Communications paper on multidimensional motor-cortical coding of handwriting.',
    },
  },
  {
    icon: 'chip',
    title: { zh: '全植入微系统', en: 'Fully implantable microsystem' },
    desc: {
      zh: '“硬币大小”、无线供电的 64 通道全植入式脑机接口微系统（IEEE BioCAS 2024）。',
      en: 'A coin-sized, wirelessly powered 64-channel fully implantable BCI microsystem (IEEE BioCAS 2024).',
    },
  },
  {
    icon: 'trophy',
    title: { zh: '国际认可', en: 'International recognition' },
    desc: {
      zh: '“脑写汉字”入选国际 BCI Award 提名（全球 12 强），研究获央视、中新网等报道。',
      en: 'Brain-writing named among the 12 nominees of the International BCI Award; covered by CCTV and more.',
    },
  },
])

// Newest 3 news items for the home teaser (full list lives on #/news).
const latestNews = computed(() => [...news].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3))
// PI first, then up to 6 PhD+master members ordered by join year (bySince, earliest first).
const teamPreview = computed(() => [
  people.pi,
  ...[...people.phd, ...people.master].sort(bySince).slice(0, 6)
])

// ---- CTA 神经元募集链（交互计划 A3）----
const router = useRouter()
const ctaBtn = ref(null) // RouterLink 组件实例
const ctaDom = computed(() => ctaBtn.value?.$el ?? ctaBtn.value ?? null)
const ctaHover = ref(false)
const burst = ref(null) // {n, x, y}，n 递增触发画布光点传播
let navTimer = 0
let flashTimers = []

// Read the live media query at click time (not a mount-time snapshot), matching the
// runtime-switchable behavior of NeuralCanvas and ink/runtime.js.
function prefersReduced() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// capture 拦截主 CTA 未修饰左键点击：先播 450ms 光点传播再导航。
// 修饰键/中键不拦截，保留新标签页等原生行为；reduced-motion 不延迟。
function onCtaClick(e) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  if (!e.target.closest('a.primary')) return
  e.preventDefault()
  e.stopPropagation()
  burst.value = { n: (burst.value?.n || 0) + 1, x: e.clientX, y: e.clientY }
  // 时序：光点 450ms 传播（12 点错峰 14ms，~604ms 到齐）→ 420ms 起按钮闪光 → 660ms 导航
  flashTimers.push(setTimeout(() => {
    ctaDom.value?.classList.add('cta-burst')
    flashTimers.push(setTimeout(() => ctaDom.value?.classList.remove('cta-burst'), 480))
  }, 420))
  clearTimeout(navTimer)
  if (prefersReduced()) router.push('/research')
  else navTimer = setTimeout(() => router.push('/research'), 660)
}

// Unmount during the burst chain must cancel pending timers, otherwise the deferred
// router.push / class toggles would fire against a dead component.
onBeforeUnmount(() => {
  clearTimeout(navTimer)
  flashTimers.forEach(clearTimeout)
})
</script>

<template>
  <!-- ======== Hero ======== -->
  <!-- data-ink="on":意笔容器级开关(G1 并回主线),localStorage inkintent='off' 一票否决 -->
  <section class="hero" data-ink="on">
    <NeuralCanvas :cta-el="ctaDom" :cta-hover="ctaHover" :burst="burst" />
    <div class="hero-glow" aria-hidden="true"></div>
    <div class="hero-rings" aria-hidden="true"></div>
    <div class="container hero-inner">
      <p class="kicker mono" v-reveal>
        <span class="kicker-dot" aria-hidden="true"></span>{{ t('home.heroKicker') }}
      </p>
      <h1 class="hero-title" v-reveal="{ delay: '0.1s' }">
        <span class="line1">{{ t('home.heroTitle') }}</span>
        <span class="line2 grad-text">{{ t('home.heroTitle2') }}</span>
      </h1>
      <div class="handwriting" v-reveal="{ delay: '0.35s' }" aria-hidden="true">
        <span v-for="(c, i) in chars" :key="i" class="hw-char" :style="{ animationDelay: 0.9 + i * 0.45 + 's' }">{{ c }}</span>
        <svg class="hw-line" viewBox="0 0 320 30" preserveAspectRatio="none">
          <path d="M4 22 C 60 8, 120 28, 180 14 S 290 20, 316 10" fill="none" />
        </svg>
      </div>
      <p class="hero-sub" v-reveal="{ delay: '0.25s' }">{{ t('home.heroSub') }}</p>
      <!-- Capture-phase handler intercepts the primary CTA (see onCtaClick in script);
           both buttons are v-tuned InkIntent archive neurons (cta / navItem profiles). -->
      <div class="hero-cta" v-reveal="{ delay: '0.4s' }" @click.capture="onCtaClick">
        <RouterLink
          ref="ctaBtn"
          to="/research"
          class="btn primary"
          v-tuned="'cta'"
          @mouseenter="ctaHover = true"
          @mouseleave="ctaHover = false"
        >{{ t('home.ctaResearch') }}<span class="btn-arrow" aria-hidden="true">→</span></RouterLink>
        <RouterLink to="/join" class="btn ghost" v-tuned="'navItem'">{{ t('home.ctaJoin') }}</RouterLink>
      </div>
    </div>
    <div class="scroll-hint mono" aria-hidden="true">
      <span class="scroll-line"></span>SCROLL
    </div>
  </section>

  <!-- ======== 数据带 ======== -->
  <section class="stats">
    <div class="container stats-grid">
      <div v-for="(s, i) in site.stats" :key="i" class="stat" v-reveal="{ delay: i * 0.08 + 's' }">
        <div class="stat-num grad-text">{{ s.value }}</div>
        <div class="stat-label">{{ t('home.' + s.labelKey) }}<template v-if="s.suffixKey">{{ t('home.' + s.suffixKey) }}</template></div>
      </div>
    </div>
  </section>

  <!-- ======== 亮点成果(第二个 data-ink 容器:card 档案神经元) ======== -->
  <section class="section alt" data-ink="on">
    <div class="container">
      <SectionHead :eyebrow="'01 / Highlights'" :title="t('home.highlightsTitle')" :desc="t('home.highlightsDesc')" />
      <div class="grid cols-4">
        <div v-for="(h, i) in highlights" :key="i" class="card hov hl" v-tuned="'card'" v-reveal="{ delay: i * 0.08 + 's' }">
          <span class="hl-idx mono" aria-hidden="true">0{{ i + 1 }}</span>
          <div class="hl-icon"><LineIcon :name="h.icon" :size="42" /></div>
          <h3>{{ tx(h.title) }}</h3>
          <p>{{ tx(h.desc) }}</p>
          <span class="hl-line" aria-hidden="true"></span>
        </div>
      </div>
    </div>
  </section>

  <!-- ======== 最新动态 ======== -->
  <section class="section">
    <div class="container">
      <SectionHead :eyebrow="'02 / News'" :title="t('home.newsTitle')">
        <RouterLink to="/news" class="view-all">{{ t('common.viewAll') }} →</RouterLink>
      </SectionHead>
      <div class="grid cols-3">
        <NewsCard v-for="(n, i) in latestNews" :key="n.date" :item="n" v-reveal="{ delay: i * 0.08 + 's' }" />
      </div>
    </div>
  </section>

  <!-- ======== 团队风貌 ======== -->
  <section class="section alt">
    <div class="container">
      <SectionHead :eyebrow="'03 / People'" :title="t('home.peopleTitle')" :desc="t('home.peopleDesc')" />
      <div class="people-band">
        <PersonCard v-for="(p, i) in teamPreview" :key="i" :person="p" :role="i === 0 ? t('common.pi') : ''" />
        <RouterLink to="/people" class="card hov more">
          <div class="more-inner">
            <span class="more-arrow">→</span>
            <span>{{ t('home.peopleCta') }}</span>
          </div>
        </RouterLink>
      </div>
    </div>
  </section>

  <!-- ======== 加入 CTA ======== -->
  <section class="section cta-section">
    <div class="container cta-box" v-reveal>
      <svg class="cta-wave" viewBox="0 0 720 70" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="ctaWaveGrad" x1="0" y1="0" x2="1" y2="0">
            <stop stop-color="#38d6ff" stop-opacity="0" />
            <stop offset="0.45" stop-color="#38d6ff" stop-opacity="0.7" />
            <stop offset="1" stop-color="#ffb45c" stop-opacity="0.55" />
          </linearGradient>
        </defs>
        <path d="M0 35 H150 L168 16 L186 54 L204 35 H360 L378 22 L396 48 L414 35 H560 L578 12 L596 58 L614 35 H720" fill="none" stroke="url(#ctaWaveGrad)" stroke-width="1.5" />
      </svg>
      <h2>{{ t('home.joinTitle') }}</h2>
      <p>{{ t('home.joinDesc') }}</p>
      <RouterLink to="/join" class="btn primary">{{ t('home.joinCta') }}</RouterLink>
    </div>
  </section>
</template>

<style scoped>
/* Hero */
.hero {
  position: relative;
  min-height: 92vh;
  display: flex; align-items: center;
  padding: 7rem 0 5rem;
  overflow: hidden;
  background:
    radial-gradient(58% 42% at 78% 16%, rgba(124, 140, 255, 0.12), transparent 66%),
    radial-gradient(42% 38% at 12% 78%, rgba(56, 214, 255, 0.08), transparent 68%),
    linear-gradient(180deg, rgba(7, 11, 20, 0.55), rgba(7, 11, 20, 0.9) 78%, var(--bg-0));
}
.hero-glow {
  position: absolute; left: 4%; top: 22%; width: 560px; height: 560px;
  background: radial-gradient(circle, rgba(56, 214, 255, 0.1), transparent 68%);
  pointer-events: none;
}
.hero-rings {
  position: absolute; right: -12%; top: 4%; width: min(760px, 72vw); aspect-ratio: 1;
  border-radius: 50%;
  background: repeating-radial-gradient(circle, transparent 0 79px, rgba(120, 150, 200, 0.075) 80px 81px);
  -webkit-mask-image: radial-gradient(circle, #000 0 58%, transparent 74%);
  mask-image: radial-gradient(circle, #000 0 58%, transparent 74%);
  opacity: 0.6;
  pointer-events: none;
}
@media (max-width: 760px) {
  .hero-glow, .hero-rings { display: none; }
}
.hero-inner { position: relative; z-index: 1; }
.kicker {
  display: inline-flex; align-items: center; gap: 0.55rem;
  max-width: 100%; margin: 0 0 1.35rem; padding: 0.38rem 0.9rem 0.38rem 0.72rem;
  font-size: 0.72rem; letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--ink-dim);
  background: rgba(19, 28, 49, 0.42);
  border: 1px solid var(--line);
  border-radius: var(--r-pill);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}
.kicker-dot {
  width: 6px; height: 6px; border-radius: 50%; flex: none;
  background: var(--accent); box-shadow: 0 0 10px rgba(56, 214, 255, 0.8);
}
/* The English institution line is long; tighten it on phones so the pill stays 2 lines. */
@media (max-width: 640px) {
  .kicker { font-size: 0.64rem; letter-spacing: 0.1em; padding: 0.34rem 0.78rem 0.34rem 0.62rem; }
}
.hero-title {
  font-family: var(--font-serif);
  font-size: var(--text-hero);
  line-height: 1.08; margin: 0 0 1.5rem; font-weight: 900;
  display: flex; flex-direction: column;
  letter-spacing: 0.005em;
}
.hero-title .line2 { letter-spacing: 0.03em; }
.hero-sub { max-width: 620px; color: var(--ink-dim); font-size: 1.04rem; line-height: 1.85; margin: 0 0 2.2rem; }
.hero-cta { display: flex; gap: 0.9rem; flex-wrap: wrap; align-items: center; }
.btn-arrow { display: inline-block; margin-left: 0.1rem; transition: transform 0.2s var(--ease-out); }
.btn.primary:hover .btn-arrow { transform: translateX(3px); }
/* 光点抵达时的突触闪光（交互 A3），风格对齐 .btn.primary:hover */
.btn.primary.cta-burst {
  box-shadow: 0 0 0 2px rgba(56, 214, 255, 0.45), 0 8px 40px rgba(56, 214, 255, 0.55);
}

/* 意笔并回(G1)：hero 两枚按钮 = cta/navItem 档案神经元。读出走 ::after 光环而非
   元素自身 box-shadow——scoped 优先级会盖掉 A 线 .btn.primary:hover 的既有辉光。
   渲染路径(G1d)：光环固定满强度,每帧只动 opacity/transform(合成器属性,零重绘)——
   此前 border/shadow 的 alpha 与 blur 逐帧变,真实 GPU 路径每帧重绘有掉帧感;
   70ms transition 兜底平滑偶发低帧。flag off 时变量缺省 0 → opacity 0,零视觉。 */
/* EN note (G1d render-path constraint): halo border/box-shadow stay at fixed intensity;
   per-frame animation touches ONLY opacity/transform (compositor properties, zero repaint).
   Spec: docs/UI-FRAMEWORK.md; Chinese block above keeps the tuning rationale. */
.hero-cta .btn { position: relative; }
.hero-cta .btn::after {
  content: ''; position: absolute; inset: -5px; border-radius: 999px; pointer-events: none;
  border: 1px solid rgba(56, 214, 255, 0.55);
  box-shadow: 0 0 16px rgba(56, 214, 255, 0.5), 0 0 30px rgba(56, 214, 255, 0.22);
  opacity: calc(0.8 * var(--exc, 0) + 0.55 * var(--fire, 0));
  transform: scale(calc(1 + 0.025 * var(--exc, 0) + 0.045 * var(--fire, 0)));
  transition: opacity 70ms linear, transform 70ms linear;
  will-change: opacity, transform;
}

.handwriting { position: relative; display: inline-flex; gap: 0.5rem; margin: -0.4rem 0 1.6rem; }
.hw-char {
  font-family: var(--font-serif); font-size: clamp(1.5rem, 3.4vw, 2.3rem); font-weight: 900;
  color: var(--warm);
  opacity: 0; transform: translateY(10px) rotate(-4deg);
  animation: hwIn 0.6s cubic-bezier(0.2, 0.8, 0.3, 1.3) forwards;
  filter: drop-shadow(0 0 12px rgba(255, 180, 92, 0.35));
}
.hw-line { position: absolute; left: 0; right: 0; bottom: -10px; width: 100%; height: 26px; }
.hw-line path {
  stroke: rgba(255, 180, 92, 0.55); stroke-width: 2.5; stroke-linecap: round;
  stroke-dasharray: 420; stroke-dashoffset: 420;
  animation: draw 1.6s 2.2s ease forwards;
}
@keyframes hwIn { to { opacity: 1; transform: none; } }
@keyframes draw { to { stroke-dashoffset: 0; } }
.handwriting:not(:has(.hw-char)) { display: none; }

@media (prefers-reduced-motion: reduce) {
  .hw-char { animation: none; opacity: 1; transform: none; }
  .hw-line path { animation: none; stroke-dashoffset: 0; }
  .scroll-hint { animation: none; }
  .btn.primary:hover .btn-arrow { transform: none; }
  .more:hover .more-arrow { transform: none; }
}

.scroll-hint {
  position: absolute; bottom: 1.5rem; left: 50%; transform: translateX(-50%);
  display: flex; flex-direction: column; align-items: center; gap: 0.55rem;
  font-size: 0.6rem; letter-spacing: 0.34em; color: var(--ink-faint);
  animation: bob 2.2s ease-in-out infinite;
}
.scroll-line { width: 1px; height: 38px; background: linear-gradient(180deg, var(--accent), transparent); opacity: 0.5; }
@keyframes bob { 50% { transform: translate(-50%, 6px); } }

/* Stats */
.stats {
  position: relative;
  border-block: 1px solid var(--line-soft);
  background: linear-gradient(180deg, rgba(12, 19, 34, 0.9), rgba(9, 15, 28, 0.92));
}
.stats-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 0;
  padding-block: 2.5rem;
}
.stat { padding: 0.35rem 1.3rem; border-left: 1px solid var(--line-soft); text-align: center; }
.stat:first-child { border-left: 0; }
.stat-num {
  font-family: var(--font-en); font-size: clamp(1.9rem, 3.8vw, 2.7rem); font-weight: 700;
  line-height: 1.1; letter-spacing: -0.02em; font-variant-numeric: tabular-nums;
}
.stat-label { font-size: 0.8rem; line-height: 1.55; color: var(--ink-dim); margin-top: 0.4rem; }
@media (max-width: 760px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); padding-block: 1.7rem; }
  .stat { padding: 0.85rem 0.8rem; }
  .stat:nth-child(3) { border-left: 0; }
  .stat:nth-child(n + 3) { border-top: 1px solid var(--line-soft); }
}

/* Highlights */
.hl { display: flex; flex-direction: column; }
.hl-idx {
  position: absolute; top: 1rem; right: 1.2rem;
  font-size: 0.72rem; letter-spacing: 0.12em; color: var(--ink-faint);
}
.hl .hl-icon {
  width: 54px; height: 54px; margin-bottom: 1.05rem;
  display: grid; place-items: center;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(56, 214, 255, 0.1), rgba(56, 214, 255, 0.02));
  border: 1px solid rgba(56, 214, 255, 0.16);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}
.hl h3 { margin: 0 0 0.45rem; font-size: 1.04rem; }
.hl p { margin: 0; font-size: 0.87rem; color: var(--ink-dim); flex: 1; }
.hl-line {
  position: absolute; left: 1.6rem; right: 1.6rem; bottom: 0; height: 1px;
  background: linear-gradient(90deg, var(--accent), var(--accent-2), transparent);
  transform: scaleX(0.18); transform-origin: left;
  opacity: 0.35; transition: transform 0.35s var(--ease-out), opacity 0.35s ease;
}
.hl:hover .hl-line { transform: scaleX(1); opacity: 0.75; }
@media (prefers-reduced-motion: reduce) {
  .hl-line { transition: none; transform: scaleX(1); }
}

/* 意笔并回(G1)：亮点卡 = card 档案神经元(握力主导,悬停减速停留时激发)。
   渲染路径(G1d)：提亮改 ::before 定色渐变叠层(z-index:-1 压在背景上、文字下),
   光环固定满强度——每帧只动 opacity/transform(合成器属性);此前逐帧变 filter 会
   整卡重绘,真实 GPU 路径有掉帧感。isolation 供 z-index:-1 生效。flag off 时
   opacity 0,与现状像素一致;不碰 .card/.hov 的 transition 与 hover 特效。 */
/* EN note (G1d): same compositor-only rule - ::before is a fixed brightening gradient layer,
   ::after the halo; both animate opacity/transform only. isolation makes z-index:-1 work. */
.card.hl { position: relative; isolation: isolate; }
.card.hl::before {
  content: ''; position: absolute; inset: 0; border-radius: var(--radius); pointer-events: none;
  z-index: -1;
  background: linear-gradient(180deg, rgba(56, 214, 255, 0.10), rgba(124, 140, 255, 0.05));
  opacity: calc(0.9 * var(--exc, 0));
  transition: opacity 70ms linear;
  will-change: opacity;
}
.card.hl::after {
  content: ''; position: absolute; inset: -1px; border-radius: var(--radius); pointer-events: none;
  border: 1px solid rgba(56, 214, 255, 0.6);
  box-shadow: 0 0 24px rgba(56, 214, 255, 0.35);
  opacity: calc(0.9 * var(--exc, 0) + 0.35 * var(--fire, 0));
  transform: scale(calc(1 + 0.02 * var(--exc, 0) + 0.03 * var(--fire, 0)));
  transition: opacity 70ms linear, transform 70ms linear;
  will-change: opacity, transform;
}

/* People band */
.people-band {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.2rem;
}
.more {
  display: flex; align-items: center; justify-content: center; min-height: 260px;
  border-style: dashed; background: rgba(19, 28, 49, 0.35);
  box-shadow: none;
}
.more-inner { display: flex; flex-direction: column; align-items: center; gap: 0.85rem; color: var(--ink-dim); }
.more-arrow {
  display: grid; place-items: center; width: 46px; height: 46px; border-radius: 50%;
  border: 1px solid rgba(56, 214, 255, 0.3); background: rgba(56, 214, 255, 0.08);
  color: var(--accent); font-size: 1.25rem;
  transition: transform 0.25s var(--ease-out), border-color 0.25s ease;
}
.more:hover .more-arrow { transform: translateX(5px); border-color: var(--accent); }
@media (prefers-reduced-motion: reduce) { .more-arrow { transition: none; } }
@media (max-width: 900px) { .people-band { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 560px) { .people-band { grid-template-columns: 1fr; } }

/* Join CTA */
.cta-box {
  position: relative; overflow: hidden;
  text-align: center; padding: 4rem 1.6rem 3.6rem;
  border: 1px solid rgba(56, 214, 255, 0.22); border-radius: var(--r-lg);
  background:
    radial-gradient(70% 100% at 50% 0%, rgba(56, 214, 255, 0.1), transparent 70%),
    linear-gradient(180deg, rgba(21, 31, 52, 0.92), rgba(13, 20, 36, 0.97));
  box-shadow: var(--shadow-card);
}
.cta-box::before {
  content: ""; position: absolute; top: 0; left: 12%; right: 12%; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(56, 214, 255, 0.55), rgba(255, 180, 92, 0.35), transparent);
  opacity: 0.8;
}
.cta-wave {
  position: absolute; left: 0; right: 0; bottom: 0; width: 100%; height: 64px;
  opacity: 0.28; pointer-events: none;
}
.cta-box h2 {
  position: relative; margin: 0 0 0.7rem;
  font-family: var(--font-serif); font-weight: 900;
  font-size: clamp(1.8rem, 3.8vw, 2.5rem); line-height: 1.3;
}
.cta-box p { position: relative; color: var(--ink-dim); max-width: 560px; margin: 0 auto 1.9rem; }
.cta-box .btn { position: relative; }

.view-all { font-size: 0.88rem; display: inline-block; }
</style>
