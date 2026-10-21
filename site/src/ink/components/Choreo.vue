<script setup>
// ===== Choreo - 7-beat experiment choreography demo (cue/voice/delay/demo/attempt/decode/reward) =====
// [EN header added H-line 2026-10-09; original Chinese notes below remain authoritative for tuning history.]
// Ink readout contract: subscribes onFrame/onFire + CSS vars only (UI-FRAMEWORK sec.5/sec.7). Degrades to one static frame when reduced/flag-off (sec.3).
// Loop driver: a setTimeout chain (later) advances the beats; the single onFrame subscription only
// redraws the shared stage canvas (demo replay by arc length + reward burst particles).
// Timing constants live in DUR (ms): cue 500 / voice 1000 / delay 300 / demo 1700 / decode 600 / reward 1500.
// Choreography 试验编排(§8,论文方法节时序直送):
// cue 500ms(深绿目标卡) → voice 1s(副题滑入) → delay 300ms(静默)
// → demo(模板逐笔回放) → attempt(输入窗口,可被任意提前书写打断)
// → decode ~600ms(解码演出) → reward 1.5s(一致则粒子庆祝) → cooldown → 下一轮。
// 任何 demo 前的拍都可被用户书写打断直接跳 attempt(编排服务于交互,§8 末条)。
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import InkPad from './InkPad.vue'
import { decode as dtwDecode, rawTemplates } from '../decoders/dtw'
import { onFrame } from '../runtime'
import { useIntentSignal } from '../signal'
import { setupCanvas } from '../utils/canvas'
import { ACCENT, WARM, rgba } from '../../theme'

const props = defineProps({ active: Boolean })
const { t, locale } = useI18n()
const signal = useIntentSignal()

const BEATS = ['cue', 'voice', 'delay', 'demo', 'attempt', 'decode', 'reward']
const DUR = { cue: 500, voice: 1000, delay: 300, decode: 600, reward: 1500, cooldown: 1200, demo: 1700 }

const phase = ref('cue')
const target = ref('十')
const result = ref(null)
const replayT0 = ref(0) // demo 回放起点(0=未在回放)
const cv = ref(null)
let timers = []
let pending = { strokes: [], timer: 0 }
let burst = [] // reward 粒子
let unsub = () => {}
let round = 0

// 动画许可(reduced/flag off → 静态拍)。computed 保证 active 变化时跟随
// (H 线修复:原先 setup 期取一次常量,prop 后续变化不生效)
const anim = computed(() => props.active && !signal.state.reduced)

// Track every pending timeout in one array so an interrupt or unmount can cancel the whole chain at once.
function later(fn, ms) { timers.push(setTimeout(fn, ms)) }
function clearTimers() { timers.forEach(clearTimeout); timers = [] }

function tpl() {
  return rawTemplates(locale.value === 'en' ? 'en' : 'zh')
}

function pick() {
  const chars = Object.keys(tpl())
  let c = chars[(Math.random() * chars.length) | 0]
  if (c === target.value) c = chars[(chars.indexOf(c) + 1) % chars.length]
  return c
}

// Full round reset: cancel timers, drop pending input/burst, pick a fresh target, restart at beat 0.
function startRound() {
  clearTimers()
  round++
  result.value = null
  pending = { strokes: [], timer: 0 }
  burst = []
  target.value = pick()
  phase.value = 'cue'
  replayT0.value = 0
  later(() => { phase.value = 'voice' }, DUR.cue)
  later(() => { phase.value = 'delay' }, DUR.cue + DUR.voice)
  later(() => {
    phase.value = 'demo'
    replayT0.value = performance.now()
    later(() => {
      if (phase.value === 'demo') { phase.value = 'attempt'; replayT0.value = 0 }
    }, DUR.demo)
  }, DUR.cue + DUR.voice + DUR.delay)
}

// 用户书写:attempt 前的任何拍 → 立即跳 attempt(§8 打断规则)
function onStroke(stroke) {
  if (phase.value !== 'attempt') {
    clearTimers()
    phase.value = 'attempt'
    replayT0.value = 0
  }
  pending.strokes.push(stroke.pts.map(p => [p.x, p.y]))
  clearTimeout(pending.timer)
  pending.timer = setTimeout(commit, 900)
}

// 900ms stroke-idle debounce (in onStroke) lands here: decode then reveal.
function commit() {
  if (!pending.strokes.length) return
  phase.value = 'decode'
  const lang = locale.value === 'en' ? 'en' : 'zh'
  const r = dtwDecode(lang, pending.strokes)
  pending.strokes = []
    later(() => {
    result.value = r
    phase.value = 'reward'
    if (r?.char === target.value) spawnBurst()
    later(() => startRound(), DUR.reward + DUR.cooldown)
    // animations off: skip the decode show, near-instant beat
  }, anim.value ? DUR.decode : 120)
}

function skip() {
  // attempt 等待中手动跳过:有笔迹就解,没有就直接下一轮
  if (pending.strokes.length) commit()
  else startRound()
}

function spawnBurst() {
  if (!anim.value) return
  // 26 particles spread around the compass, departure staggered up to 220ms so the burst feels hand-thrown.
  const now = performance.now()
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + Math.random() * 0.2
    burst.push({ a, v: 0.5 + Math.random() * 1.6, t0: now + Math.random() * 220 })
  }
}

// ---- demo 回放 + reward 粒子(同一张 stage canvas) ----
function drawStage(now) {
  const c = cv.value
  if (!c) return
  const { ctx, W, H } = setupCanvas(c)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // demo 逐笔回放:按弧长进度画模板
  if (phase.value === 'demo' && replayT0.value && anim.value) {
    const u = Math.min(1, (now - replayT0.value) / (DUR.demo - 200))
    drawTpl(ctx, tpl()[target.value], W, H, u)
  } else if (phase.value === 'demo') {
    drawTpl(ctx, tpl()[target.value], W, H, 1) // reduced:整字直出
  }

  // reward 庆祝粒子(暖色,从中心放射)
  burst = burst.filter(p => now - p.t0 < 900)
  for (const p of burst) {
    const age = now - p.t0
    if (age < 0) continue
    const u = age / 900
    const r = 26 + u * (W * 0.36)
    const x = W / 2 + Math.cos(p.a) * r
    const y = H / 2 + Math.sin(p.a) * r
    ctx.fillStyle = rgba(WARM, (0.85 * (1 - u)).toFixed(3))
    ctx.beginPath()
    ctx.arc(x, y, 2.4 * (1 - u * 0.6), 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawTpl(ctx, strokes, W, H, u) {
  // 计算总弧长,按 u 画部分折线(笔迹居中缩放进画布)
  let total = 0
  const lens = strokes.map(st => {
    let L = 0
    for (let i = 1; i < st.length; i++) L += Math.hypot(st[i][0] - st[i - 1][0], st[i][1] - st[i - 1][1])
    total += L
    return L
  })
  let budget = total * u
  const S = Math.min(W, H) * 0.72
  const map = ([x, y]) => [W / 2 + (x - 0.5) * S, H / 2 + (y - 0.5) * S]
  ctx.strokeStyle = rgba(ACCENT, 0.9)
  ctx.lineWidth = 3.5
  for (let si = 0; si < strokes.length && budget > 0; si++) {
    const st = strokes[si]
    ctx.beginPath()
    for (let i = 0; i < st.length && budget > 0; i++) {
      const [x, y] = map(st[i])
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      if (i > 0) budget -= Math.hypot(st[i][0] - st[i - 1][0], st[i][1] - st[i - 1][1])
    }
    ctx.stroke()
  }
}

onMounted(() => {
  startRound()
  if (anim.value) unsub = onFrame(now => drawStage(now))
  else drawStage(performance.now())
})
onBeforeUnmount(() => {
  clearTimers()
  clearTimeout(pending.timer)
  unsub()
})
</script>

<template>
  <div class="choreo">
    <div class="beats mono" aria-hidden="true">
      <span v-for="b in BEATS" :key="b" class="beat" :class="{ on: phase === b }">{{ b }}</span>
    </div>
    <div class="stage">
      <!-- 拍 0-1:cue 深绿目标卡(致敬试验绿字提示)+ voice 副题滑入 -->
      <div class="cue-card" :class="{ show: ['cue', 'voice', 'delay', 'demo'].includes(phase) }">
        <span class="cue-char">{{ target }}</span>
        <span class="cue-sub" :class="{ show: ['voice', 'delay', 'demo'].includes(phase) }">{{ t('lab.choreoVoice') }}</span>
      </div>
      <!-- 拍 3/6:demo 逐笔回放 & reward 庆祝 -->
      <canvas ref="cv" class="stage-cv" aria-hidden="true"></canvas>
      <!-- 拍 4:attempt 输入窗口(始终可写,提前写即打断) -->
      <div class="attempt" :class="{ on: phase === 'attempt' }">
        <InkPad :active="active" compact @stroke="onStroke" />
        <button class="btn ghost small skip" @click="skip">{{ t('lab.choreoSkip') }}</button>
      </div>
      <!-- 拍 5-6:decode/reward 结果 -->
      <div v-if="result && (phase === 'reward' || phase === 'decode')" class="verdict" :class="{ hit: result.char === target }">
        <template v-if="phase === 'reward'">
          <span class="v-char">{{ result.char }}</span>
          <span class="v-note mono">{{ result.char === target
            ? t('lab.choreoHit') + ' · ' + Math.round(result.conf * 100) + '%'
            : t('lab.choreoMiss') + '「' + target + '」 · ' + Math.round(result.conf * 100) + '%' }}</span>
        </template>
        <span v-else class="v-note mono">{{ t('lab.choreoDecoding') }}</span>
      </div>
    </div>
    <p class="choreo-note">{{ t('lab.choreoNote') }}</p>
  </div>
</template>

<style scoped>
.choreo { display: flex; flex-direction: column; gap: 0.9rem; }
.beats { display: flex; gap: 0.4rem; flex-wrap: wrap; }
.beat {
  font-size: 0.68rem; padding: 0.14rem 0.5rem; border-radius: 4px;
  color: var(--ink-dim); border: 1px solid transparent; letter-spacing: 0.05em;
}
.beat.on { color: var(--accent); border-color: rgba(56, 214, 255, 0.4); background: rgba(56, 214, 255, 0.07); }
.stage {
  position: relative; height: 340px; border-radius: 12px; overflow: hidden;
  background: var(--bg-1); border: 1px solid var(--line);
}
.stage-cv { position: absolute; inset: 0; width: 100%; height: 100%; }
.cue-card {
  position: absolute; left: 50%; top: 38%; transform: translate(-50%, -50%) scale(0.9);
  display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
  padding: 0.9rem 2.2rem; border-radius: 14px;
  background: rgba(16, 58, 38, 0.92); border: 1px solid rgba(96, 224, 150, 0.4); /* 深绿,致敬绿字提示 */
  opacity: 0; transition: opacity 0.3s, transform 0.3s; pointer-events: none;
}
.cue-card.show { opacity: 1; transform: translate(-50%, -50%) scale(1); }
.cue-char { font-family: var(--font-serif); font-size: 3rem; line-height: 1.1; color: #d7ffe8; }
.cue-sub { font-size: 0.8rem; color: rgba(180, 240, 205, 0.85); opacity: 0; transform: translateY(8px); transition: opacity 0.45s, transform 0.45s; }
.cue-sub.show { opacity: 1; transform: none; }
.attempt {
  position: absolute; left: 0; right: 0; bottom: 0; padding: 0.7rem 0.7rem 0.7rem;
  display: flex; gap: 0.6rem; align-items: stretch;
  background: linear-gradient(transparent, rgba(7, 11, 20, 0.6) 30%);
  opacity: 0.42; transition: opacity 0.35s;
}
.attempt.on { opacity: 1; }
.attempt .inkpad-wrap { flex: 1; }
.skip { align-self: flex-end; }
.verdict {
  position: absolute; left: 50%; top: 40%; transform: translate(-50%, -50%);
  display: flex; flex-direction: column; align-items: center; gap: 0.3rem;
  pointer-events: none;
}
.v-char { font-family: var(--font-serif); font-size: 3.6rem; color: var(--warm); text-shadow: 0 0 24px rgba(255, 180, 92, 0.5); }
.verdict:not(.hit) .v-char { color: var(--ink); text-shadow: none; }
.v-note { color: var(--accent); font-size: 0.8rem; }
.verdict:not(.hit) .v-note { color: var(--ink-dim); }
.choreo-note { color: var(--ink-dim); font-size: 0.8rem; margin: 0; }
@media (prefers-reduced-motion: reduce) {
  .cue-card, .cue-sub { transition: none; }
}
</style>
