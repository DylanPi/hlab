// ===== profiles.js - preset tuning profiles for v-tuned elements =====
// [EN header added H-line 2026-10-09; original Chinese notes below remain authoritative for tuning history.]
// Layer: L1 config | Consumers: directives.js (via resolveProfile), test-bench
//        slider overrides | Spec: docs/UI-FRAMEWORK.md Sec.4.1
// Data flow: v-tuned binding value ('cta' | { profile:'cta', ...overrides }) ->
// resolveProfile() -> a fresh merged profile object handed to runtime registration.
// Invariant: the PROFILES constants are never mutated (runtime copies each
// profile defensively); every resolveProfile() call returns a brand-new object,
// so per-neuron tuning changes cannot leak between elements.
// ===== 意笔 InkIntent · 预置调谐档案(§4.1) =====
// 数值为默认,注册时可通过 v-tuned="{ profile:'card', radius:120, ... }" 覆盖。
// 字段:model(pen-up/pen-down/dual) pd(弧度|'random'|'auto'|null=全向)
//       dirBand 方向带宽(1-dirBand=余弦门槛) radius 感受野 px threshold 发放阈值
//       adapt 习惯化系数 lambda 速度调谐峰(px/帧) channels 各通道显式权重。

export const PROFILES = {
  // 主 CTA:双模型;悬停逼近(alt 下降沿)+ 驻留握力 + 对向运动
  cta: {
    name: 'cta', model: 'dual', pd: null, radius: 160, threshold: 0.5,
    adapt: 0.2, lambda: 9, dirBand: 0,
    channels: { v: 1.0, g: 0.8, alt: 0.6 },
  },
  // 导航项:提笔模型;pd:'auto' 由视心辐射指派(横向菜单「依次向右」)
  navItem: {
    name: 'navItem', model: 'pen-up', pd: 'auto', dirBand: 0.5, radius: 130,
    threshold: 0.55, adapt: 0.2, lambda: 12,
    channels: { v: 1.0, alt: 0.8 },
  },
  // 内容卡:悬停减速停留(握力主导);习惯化强——反复扫过逐次变弱
  card: {
    name: 'card', model: 'pen-up', pd: null, radius: 110, threshold: 0.6,
    adapt: 0.3, lambda: 6, dirBand: 0,
    channels: { g: 1.0, v: 0.4 },
  },
  // 装饰粒子:双模型,随机偏好方向(A 线粒子气质的框架化版本)
  particle: {
    name: 'particle', model: 'dual', pd: 'random', radius: 170, threshold: 0.55,
    adapt: 0.15, lambda: 8, dirBand: 0,
    channels: { v: 1.0, g: 0.3 },
  },
  // 落墨放电点:只吃压力,贴笔尖跟随(§7 R2)
  inkDot: {
    name: 'inkDot', model: 'pen-down', pd: null, radius: 60, threshold: 0.5,
    adapt: 0, lambda: 5, dirBand: 0,
    channels: { p: 1.0 },
  },
}

// 解析 v-tuned 绑定值:'cta' | { profile:'cta', ...覆盖 } → 合成后的档案(全新对象)
// EN: merge semantics - object spread gives per-key override wins; unknown or
// missing profile names silently fall back to 'card'; the 'profile' key itself
// is stripped from overrides before merging.
export function resolveProfile(value) {
  const base = typeof value === 'string'
    ? PROFILES[value] || PROFILES.card
    : PROFILES[value?.profile] || PROFILES.card
  const overrides = typeof value === 'string' ? {} : { ...value }
  delete overrides.profile
  return { ...base, ...overrides }
}
