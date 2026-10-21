<script setup>
// ===== NeuronBench - live neuron-profile tuning bench with sliders (sec.10.2) =====
// [EN header added H-line 2026-10-09; original Chinese notes below remain authoritative for tuning history.]
// Ink readout contract: subscribes onFrame/onFire + CSS vars only (UI-FRAMEWORK sec.5/sec.7).
// Degradation (sec.3): when the flag is off there is no onFrame subscription and no stats updates -
// the bench sits static (it is CSS-driven, there is no canvas loop to stop).
// Sliders edit a reactive `params`; the `binding` computed feeds v-tuned, which hot-swaps the live
// neuron. Presets restore the five production profile defaults (mirroring ../profiles) verbatim.
// 神经元档案试验台(§10.2):滑杆实时改档案参数,看感受野/阈值/习惯化如何改变
// 神经元的激发与发放。参数经 v-tuned 的 updated 钩子热更新(runtime.updateNeuron)。
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { onFrame, neuronStats } from '../runtime'

const props = defineProps({ active: Boolean })
const { t } = useI18n()

const params = reactive({
  profile: 'card', model: 'pen-up', radius: 110, threshold: 0.6,
  adapt: 0.3, lambda: 6, wV: 0.4, wG: 1.0, wAlt: 0, wP: 0,
})
const binding = computed(() => ({
  profile: params.profile,
  model: params.model,
  radius: params.radius,
  threshold: params.threshold,
  adapt: params.adapt,
  lambda: params.lambda,
  channels: { v: params.wV, g: params.wG, alt: params.wAlt, p: params.wP },
}))

const target = ref(null)
const stats = reactive({ exc: 0, thetaEff: 0, recent: 0, fires: 0 })
const excBar = ref(null)
let unsub = () => {}

onMounted(() => {
  if (!props.active) return
  unsub = onFrame(() => {
    if (!target.value) return
    const s = neuronStats(target.value)
    if (!s) return
    stats.thetaEff = s.thetaEff
    stats.recent = s.recent
    stats.fires = s.fires
    // exc 条直写 style,免 per-frame 触发 Vue 渲染
    excBar.value?.style.setProperty('width', (s.exc * 100).toFixed(1) + '%')
    excBar.value?.style.setProperty('--over', s.exc >= s.thetaEff ? 1 : 0)
  })
})
onBeforeUnmount(() => unsub())

// Preset chip: bulk-assign the full parameter set of one production profile (values mirror ../profiles).
function preset(p) {
  Object.assign(params, {
    profile: p,
    card: { model: 'pen-up', radius: 110, threshold: 0.6, adapt: 0.3, lambda: 6, wV: 0.4, wG: 1.0, wAlt: 0, wP: 0 },
    cta: { model: 'dual', radius: 160, threshold: 0.5, adapt: 0.2, lambda: 9, wV: 1.0, wG: 0.8, wAlt: 0.6, wP: 0 },
    navItem: { model: 'pen-up', radius: 130, threshold: 0.55, adapt: 0.2, lambda: 12, wV: 1.0, wG: 0, wAlt: 0.8, wP: 0 },
    particle: { model: 'dual', radius: 170, threshold: 0.55, adapt: 0.15, lambda: 8, wV: 1.0, wG: 0.3, wAlt: 0, wP: 0 },
    inkDot: { model: 'pen-down', radius: 60, threshold: 0.5, adapt: 0, lambda: 5, wV: 0, wG: 0, wAlt: 0, wP: 1.0 },
  }[p])
}
</script>

<template>
  <div class="bench">
    <div class="bench-stage">
      <div ref="target" v-tuned="binding" class="bench-neuron" tabindex="0">
        <span class="mono">{{ t('lab.benchNeuron') }}</span>
        <i class="fire-flash" aria-hidden="true"></i>
      </div>
      <p class="bench-hint">{{ t('lab.benchHint') }}</p>
    </div>
    <div class="bench-ctl">
      <div class="presets">
        <button v-for="p in ['card', 'cta', 'navItem', 'particle', 'inkDot']" :key="p"
          class="chip mono" :class="{ on: params.profile === p }" @click="preset(p)">{{ p }}</button>
      </div>
      <label class="row">
        <span>{{ t('lab.pModel') }}</span>
        <select v-model="params.model" class="mono">
          <option value="pen-up">pen-up</option>
          <option value="pen-down">pen-down</option>
          <option value="dual">dual</option>
        </select>
      </label>
      <label class="row"><span>{{ t('lab.pRadius') }} <b class="mono">{{ params.radius }}</b></span>
        <input type="range" min="60" max="280" step="5" v-model.number="params.radius"></label>
      <label class="row"><span>{{ t('lab.pThreshold') }} <b class="mono">{{ params.threshold.toFixed(2) }}</b></span>
        <input type="range" min="0.2" max="1" step="0.05" v-model.number="params.threshold"></label>
      <label class="row"><span>{{ t('lab.pAdapt') }} <b class="mono">{{ params.adapt.toFixed(2) }}</b></span>
        <input type="range" min="0" max="0.6" step="0.05" v-model.number="params.adapt"></label>
      <label class="row"><span>{{ t('lab.pLambda') }} <b class="mono">{{ params.lambda }}</b></span>
        <input type="range" min="3" max="20" step="1" v-model.number="params.lambda"></label>
      <div class="ws">
        <label v-for="w in [['wV', 'lab.wV'], ['wG', 'lab.wG'], ['wAlt', 'lab.wAlt'], ['wP', 'lab.wP']]" :key="w[0]" class="row">
          <span>{{ t(w[1]) }} <b class="mono">{{ params[w[0]].toFixed(1) }}</b></span>
          <input type="range" min="0" max="1.5" step="0.1" v-model.number="params[w[0]]"></label>
      </div>
    </div>
    <div class="bench-read mono">
      <div class="excwrap"><i ref="excBar" class="excbar"></i></div>
      <div class="nums">
        <span>θ<sub>eff</sub>={{ stats.thetaEff.toFixed(2) }}</span>
        <span>{{ t('lab.recent') }} {{ stats.recent }}</span>
        <span>{{ t('lab.fires') }} {{ stats.fires }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bench { display: grid; grid-template-columns: 1.2fr 1fr; gap: 1rem; }
.bench-stage {
  background: var(--bg-1); border: 1px solid var(--line); border-radius: 12px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 1rem; min-height: 280px; position: relative;
}
.bench-neuron {
  position: relative;
  padding: 1rem 2rem; border-radius: 999px;
  border: 1px solid rgba(120, 150, 200, 0.4);
  color: var(--ink); background: var(--bg-2); cursor: default;
  /* --exc/--fire 由 runtime 写入;视觉全部 CSS 化(§7 约定) */
  box-shadow: 0 0 calc(26px * var(--exc, 0)) rgba(56, 214, 255, calc(0.55 * var(--exc, 0)));
  border-color: rgba(56, 214, 255, calc(0.2 + 0.6 * var(--exc, 0)));
  transform: scale(calc(1 + 0.04 * var(--exc, 0)));
}
.fire-flash {
  position: absolute; inset: -3px; border-radius: inherit; pointer-events: none;
  outline: 2px solid var(--accent); outline-offset: 3px;
  opacity: var(--fire, 0);
}
.bench-neuron[data-predicted] { border-style: dashed; }
.bench-hint { color: var(--ink-dim); font-size: 0.85rem; margin: 0; }
.bench-ctl { display: flex; flex-direction: column; gap: 0.55rem; }
.presets { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.chip {
  font-size: 0.72rem; padding: 0.22rem 0.6rem; border-radius: 999px; cursor: pointer;
  color: var(--ink-dim); background: rgba(19, 28, 49, 0.8); border: 1px solid rgba(120, 150, 200, 0.35);
}
.chip.on { color: var(--accent); border-color: var(--accent); }
.row { display: flex; flex-direction: column; gap: 0.15rem; font-size: 0.8rem; color: var(--ink-dim); }
.row span b { color: var(--ink); font-weight: 600; }
.row input[type='range'] { width: 100%; accent-color: var(--accent); }
.row select {
  background: var(--bg-2); color: var(--ink); border: 1px solid var(--line);
  border-radius: 6px; padding: 0.2rem 0.4rem; width: max-content;
}
.ws { display: grid; grid-template-columns: 1fr 1fr; gap: 0.3rem 0.8rem; }
.bench-read { grid-column: 1 / -1; background: var(--bg-1); border: 1px solid var(--line); border-radius: 10px; padding: 0.6rem 0.9rem; }
.excwrap { height: 8px; background: rgba(120, 150, 200, 0.15); border-radius: 4px; overflow: hidden; }
.excbar {
  display: block; height: 100%; width: 0; border-radius: 4px;
  background: linear-gradient(90deg, var(--warm), var(--accent));
}
.nums { display: flex; gap: 1.4rem; font-size: 0.74rem; color: var(--ink-dim); margin-top: 0.4rem; flex-wrap: wrap; }
@media (max-width: 860px) { .bench { grid-template-columns: 1fr; } }
</style>
