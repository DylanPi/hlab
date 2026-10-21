// ===== directives.js - v-tuned Vue directive wiring DOM elements into the neuron registry =====
// [EN header added H-line 2026-10-09; original Chinese notes below remain authoritative for tuning history.]
// Layer: L1 glue | Consumers: any template using v-tuned; installed once via
//        app.use(inkDirectives) in main.js | Spec: docs/UI-FRAMEWORK.md Sec.4.1
// Data flow: Vue lifecycle hooks -> resolveProfile(binding.value) -> runtime
// registerNeuron / updateNeuron / unregisterNeuron.
// Invariant: at most one neuron per element; an ancestor [data-ink="off"]
// suppresses registration entirely (local opt-out over global flag).
// ===== 意笔 InkIntent · v-tuned 指令(§4.1) =====
// 用法:<a v-tuned="'cta'"> 或 <div v-tuned="{ profile:'card', model:'pen-up', radius:120 }">
// 安装:main.js 里 app.use(inkDirectives)。
// 注册即神经元;祖先 [data-ink="off"] 或全局 flag off(localStorage)时不注册(§3 降级表)。

import { registerNeuron, updateNeuron, unregisterNeuron } from './runtime'
import { resolveProfile } from './profiles'

// True when any ancestor container opted this subtree out via data-ink="off".
function nearestInkOff(el) {
  return !!el?.closest?.('[data-ink="off"]')
}

const directive = {
  // mounted: become a neuron (no-op when an ancestor opted out or the flag is off).
  mounted(el, binding) {
    if (nearestInkOff(el)) return
    registerNeuron(el, resolveProfile(binding.value))
  },
  // updated: hot-swap tuning when the binding value changed (reference-equal
  // values are skipped); also unregister if the element ended up inside an
  // opt-out container between renders.
  updated(el, binding) {
    if (nearestInkOff(el)) { unregisterNeuron(el); return }
    if (binding.value === binding.oldValue) return
    updateNeuron(el, resolveProfile(binding.value))
  },
  // unmounted: always unregister (safe no-op if never registered).
  unmounted(el) {
    unregisterNeuron(el)
  },
}

// Vue plugin form: registers the single 'tuned' directive on the app.
export default {
  install(app) {
    app.directive('tuned', directive)
  },
}
