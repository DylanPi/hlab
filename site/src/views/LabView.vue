<script setup>
// ===== LabView.vue - Hidden living-demo route wiring the 12 InkIntent demo components =====
// [EN header added H-line 2026-10-09; original Chinese notes below remain authoritative for tuning history.]
// Route: #/lab (hidden: absent from NavBar, direct link only) | Data: none - ink components
// are self-contained | i18n: lab.*
// Living documentation of the InkIntent framework (spec: docs/UI-FRAMEWORK.md); sections
// grew with framework phases F1-F4 (Chinese header below maps the phases).
// Top-to-bottom: status header (flag / reduced-motion / coarse-pointer badges + flag toggle),
// SignalMonitor, NeuronBench, tuning demo on plain UI elements, InkPad + SpikeStrip,
// DTW decode (DecodeBubble + Galaxy) + DwellRing, FieldWave + ArcRecruit, FocusDim + Engram,
// Choreo. Most demos receive :active="flagOn && !reduced" so they idle when off/degraded.
// /lab · 意笔 InkIntent 活体文档(隐藏演示路由,§10.2)
// 不进 NavBar,直链 #/lab 进入;根节点 data-ink="on"(容器级 flag,§10.3)。
// 分区随 F1–F4 逐期生长:F1 信号/调谐/群体 → F2 读出 → F3 解码 → F4 编排演出。
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { inkEnabled, enablePredict } from '../ink/runtime'
import { useIntentSignal } from '../ink/signal'
import { decode as dtwDecode, alphabet } from '../ink/decoders/dtw'
import { recognize as gestureRec } from '../ink/decoders/gesture'
import SignalMonitor from '../ink/components/SignalMonitor.vue'
import NeuronBench from '../ink/components/NeuronBench.vue'
import InkPad from '../ink/components/InkPad.vue'
import SpikeStrip from '../ink/components/SpikeStrip.vue'
import FieldWave from '../ink/components/FieldWave.vue'
import ArcRecruit from '../ink/components/ArcRecruit.vue'
import DecodeBubble from '../ink/components/DecodeBubble.vue'
import Galaxy from '../ink/components/Galaxy.vue'
import DwellRing from '../ink/components/DwellRing.vue'
import FocusDim from '../ink/components/FocusDim.vue'
import Engram from '../ink/components/Engram.vue'
import Choreo from '../ink/components/Choreo.vue'

const { t, locale } = useI18n()
// Shared intent-signal runtime; only its reduced/coarse state is read here for the badges.
const signal = useIntentSignal()
const root = ref(null)
const flagOn = ref(true)
const reduced = signal.state.reduced
const coarse = signal.state.coarse

// ---- L3 解码:写字板笔迹累积,停笔 900ms 成字(多笔字如「十」「王」才成立);
// 手势只认单笔,即时反馈 ----
const decResult = ref(null)
const gestureMsg = ref('')
let gestureTimer = 0
const pending = { strokes: [], timer: 0 }
// Decode alphabet follows the UI locale (zh hanzi vs en letters); rendered in the section intro.
const alphabetList = () => alphabet(locale.value === 'en' ? 'en' : 'zh').join(' ')

function onStroke(stroke) {
  const g = gestureRec(stroke)
  if (g) {
    gestureMsg.value = t('lab.g_' + g.name)
    clearTimeout(gestureTimer)
    gestureTimer = setTimeout(() => { gestureMsg.value = '' }, 2600)
  }
  pending.strokes.push(stroke.pts.map(p => [p.x, p.y]))
  clearTimeout(pending.timer)
  pending.timer = setTimeout(commitDecode, 900)
}
function commitDecode() {
  if (!pending.strokes.length) return
  decResult.value = dtwDecode(locale.value === 'en' ? 'en' : 'zh', pending.strokes)
  pending.strokes = []
}
function clearDecode() {
  decResult.value = null
  gestureMsg.value = ''
  pending.strokes = []
  clearTimeout(pending.timer)
}

function readFlag() {
  flagOn.value = inkEnabled(root.value)
}
function toggleFlag() {
  // hash 路由下 localStorage 改动需整页加载才重新初始化(HANDOVER §5 同款坑)
  localStorage.setItem('inkintent', flagOn.value ? 'off' : 'on')
  location.reload()
}

onMounted(() => {
  readFlag()
  enablePredict(flagOn.value && !reduced)
})
onBeforeUnmount(() => enablePredict(false))
</script>

<template>
  <div ref="root" class="lab" data-ink="on">
    <!-- Header: framework status badges (ink flag / reduced-motion / coarse pointer) + flag toggle -->
    <header class="lab-head container">
      <p class="eyebrow">InkIntent · /lab</p>
      <h1>{{ t('lab.title') }}</h1>
      <p class="lead">{{ t('lab.lead') }}</p>
      <div class="badges">
        <span class="badge" :class="flagOn ? 'ok' : 'off'">
          <i class="dot"></i>{{ flagOn ? t('lab.flagOn') : t('lab.flagOff') }}
        </span>
        <span v-if="reduced" class="badge warn">{{ t('lab.reduced') }}</span>
        <span v-if="coarse" class="badge warn">{{ t('lab.coarse') }}</span>
        <button class="btn ghost small" @click="toggleFlag">
          {{ flagOn ? t('lab.toggleOff') : t('lab.toggleOn') }}
        </button>
      </div>
    </header>

    <!-- Live intent-signal scope -->
    <section id="lab-signal" class="container lab-sec">
      <h2 class="sec-title">{{ t('lab.monTitle') }}</h2>
      <p class="sec-desc">{{ t('lab.monDesc') }}</p>
      <SignalMonitor :active="flagOn && !reduced" />
    </section>

    <!-- Tuned-neuron population bench -->
    <section id="lab-bench" class="container lab-sec">
      <h2 class="sec-title">{{ t('lab.benchTitle') }}</h2>
      <p class="sec-desc">{{ t('lab.benchDesc') }}</p>
      <NeuronBench :active="flagOn && !reduced" />
    </section>

    <!-- Tuning demo: navItem / cta / card archive-neuron profiles attached to plain UI elements -->
    <section class="container lab-sec">
      <h2 class="sec-title">{{ t('lab.demoTitle') }}</h2>
      <p class="sec-desc">{{ t('lab.demoDesc') }}</p>
      <div class="demo">
        <nav class="demo-nav">
          <a v-for="i in 5" :key="i" v-tuned="'navItem'" class="demo-nav-item mono" :data-i="i">0{{ i }}</a>
        </nav>
        <div class="demo-mid">
          <button v-tuned="'cta'" class="btn primary">{{ t('lab.demoCta') }}</button>
          <div class="demo-cards">
            <div v-tuned="'card'" class="demo-card">{{ t('lab.demoCard1') }}</div>
            <div v-tuned="'card'" class="demo-card">{{ t('lab.demoCard2') }}</div>
            <div v-tuned="'card'" class="demo-card">{{ t('lab.demoCard3') }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Ink pad + spike strip: pen input drives firing; emitted strokes feed the decoder below -->
    <section id="lab-ink" class="container lab-sec">
      <h2 class="sec-title">{{ t('lab.inkTitle') }}</h2>
      <p class="sec-desc">{{ t('lab.inkDesc') }}</p>
      <InkPad :active="flagOn && !reduced" @stroke="onStroke" />
      <div class="sub-block">
        <h3>{{ t('lab.spikeTitle') }}</h3>
        <p class="sub-desc">{{ t('lab.spikeDesc') }}</p>
        <div class="panel"><SpikeStrip :active="flagOn && !reduced" /></div>
      </div>
    </section>

    <!-- L3 decode: DTW result bubble + top-6 Galaxy neighbours; DwellRing dwell-confirm clears state -->
    <section id="lab-decode" class="container lab-sec">
      <h2 class="sec-title">{{ t('lab.decTitle') }}</h2>
      <p class="sec-desc">{{ t('lab.decDesc') }}<span class="mono alpha">「{{ alphabetList() }}」</span></p>
      <div class="dec-grid">
        <div class="dec-main">
          <DecodeBubble v-if="decResult" :result="decResult" />
          <div v-else class="dec-empty">{{ t('lab.decEmpty') }}</div>
          <p v-if="gestureMsg" class="gesture-toast mono">{{ gestureMsg }}</p>
        </div>
        <Galaxy v-if="decResult" :top6="decResult.top6" />
      </div>
      <div class="sub-block">
        <h3>{{ t('lab.dwellTitle') }}</h3>
        <p class="sub-desc">{{ t('lab.dwellDesc') }}</p>
        <DwellRing @confirm="clearDecode" />
      </div>
    </section>

    <!-- Population field wave + arc recruitment -->
    <section class="container lab-sec">
      <h2 class="sec-title">{{ t('lab.waveTitle') }}</h2>
      <p class="sec-desc">{{ t('lab.waveDesc') }}</p>
      <div class="panel"><FieldWave :active="flagOn && !reduced" /></div>
      <div class="sub-block">
        <h3>{{ t('lab.arcTitle') }}</h3>
        <p class="sub-desc">{{ t('lab.arcDesc') }}</p>
        <ArcRecruit :active="flagOn && !reduced" />
      </div>
    </section>

    <!-- Focus dim (attention) + engram (memory trace) -->
    <section class="container lab-sec">
      <h2 class="sec-title">{{ t('lab.focusTitle') }}</h2>
      <p class="sec-desc">{{ t('lab.focusDesc') }}</p>
      <FocusDim />
      <div class="sub-block">
        <h3>{{ t('lab.engramTitle') }}</h3>
        <p class="sub-desc">{{ t('lab.engramDesc') }}</p>
        <Engram />
      </div>
    </section>

    <!-- Choreo: orchestrated multi-element performance stage -->
    <section class="container lab-sec">
      <h2 class="sec-title">{{ t('lab.choreoTitle') }}</h2>
      <p class="sec-desc">{{ t('lab.choreoDesc') }}</p>
      <Choreo :active="flagOn && !reduced" />
    </section>

    <footer class="container lab-foot">{{ t('lab.footNote') }}</footer>
  </div>
</template>

<style scoped>
.lab { padding: 6.5rem 0 3rem; }
.lab-head h1 { font-size: clamp(1.9rem, 4vw, 2.6rem); margin: 0 0 0.6rem; }
.lab-head .lead { color: var(--ink-dim); max-width: 760px; margin: 0 0 1.2rem; }
.badges { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
.badge {
  display: inline-flex; align-items: center; gap: 0.45rem;
  font-size: 0.76rem; font-family: var(--font-mono);
  padding: 0.28rem 0.7rem; border-radius: 999px;
  border: 1px solid rgba(120, 150, 200, 0.35); color: var(--ink-dim);
}
.badge .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--ink-dim); }
.badge.ok { color: var(--accent); border-color: rgba(56, 214, 255, 0.4); }
.badge.ok .dot { background: var(--accent); box-shadow: 0 0 8px rgba(56, 214, 255, 0.8); }
.badge.off .dot { background: var(--ink-dim); }
.badge.warn { color: var(--warm); border-color: rgba(255, 180, 92, 0.4); }
.badge.warn .dot { background: var(--warm); }
.btn.small { padding: 0.32rem 0.9rem; font-size: 0.8rem; }

.lab-sec { padding-block: 2.6rem; }
.lab-sec + .lab-sec { border-top: 1px solid var(--line); }
.sub-block { margin-top: 2.2rem; }
.sub-block h3 { font-size: 1.05rem; margin: 0 0 0.3rem; }
.sub-desc { color: var(--ink-dim); font-size: 0.88rem; margin: 0 0 0.9rem; }
.panel { background: var(--bg-1); border: 1px solid var(--line); border-radius: 12px; padding: 0.6rem; }
.dec-grid { display: flex; gap: 1.6rem; align-items: flex-start; flex-wrap: wrap; }
.dec-main { flex: 1 1 380px; display: flex; flex-direction: column; gap: 1rem; min-width: 0; }
.dec-empty {
  border: 1px dashed rgba(120, 150, 200, 0.35); border-radius: 12px;
  color: var(--ink-dim); padding: 1.8rem 1.4rem; text-align: center; font-size: 0.9rem;
}
.alpha { color: var(--accent); }
.gesture-toast {
  margin: 0; color: var(--warm); font-size: 0.85rem;
  border: 1px solid rgba(255, 180, 92, 0.35); border-radius: 999px;
  display: inline-block; padding: 0.3rem 1rem;
  animation: toast-in 0.3s ease;
}
@keyframes toast-in { from { transform: translateY(6px); opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .gesture-toast { animation: none; } }
.lab-foot { padding-top: 2.4rem; color: var(--ink-dim); font-size: 0.8rem; border-top: 1px solid var(--line); }

.demo { display: flex; flex-direction: column; gap: 1.6rem; }
.demo-nav { display: flex; gap: 0.6rem; justify-content: center; flex-wrap: wrap; }
.demo-nav-item {
  padding: 0.55rem 1.1rem; border-radius: 10px; cursor: default; color: var(--ink-dim);
  border: 1px solid rgba(120, 150, 200, 0.25); background: var(--bg-1); font-size: 0.85rem;
  box-shadow: 0 0 calc(20px * var(--exc, 0)) rgba(56, 214, 255, calc(0.5 * var(--exc, 0)));
  border-color: rgba(56, 214, 255, calc(0.2 + 0.6 * var(--exc, 0)));
  color: rgb(232 238 248 / calc(0.62 + 0.38 * var(--exc, 0)));
}
.demo-nav-item[data-predicted] { transform: scale(1.06); border-style: dashed; }
.demo-mid { display: flex; flex-direction: column; align-items: center; gap: 1.4rem; }
.demo-cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; width: min(680px, 100%); }
.demo-card {
  background: var(--bg-2); border: 1px solid var(--line); border-radius: var(--radius);
  padding: 1.1rem 1.2rem; font-size: 0.88rem; color: var(--ink-dim);
  box-shadow: 0 0 calc(26px * var(--exc, 0)) rgba(56, 214, 255, calc(0.45 * var(--exc, 0)));
  border-color: rgba(56, 214, 255, calc(0.16 + 0.55 * var(--exc, 0)));
}
@media (max-width: 640px) { .demo-cards { grid-template-columns: 1fr; }
  .lab { padding-top: 5.5rem; } }
</style>
