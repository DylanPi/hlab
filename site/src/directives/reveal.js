// ===== v-reveal — one-shot scroll-in reveal directive (fade + rise) =====
// [EN header added H-line 2026-10-09; original Chinese notes below remain authoritative for tuning history.]
// On mount, tags the element with .reveal (hidden state, styled in main.css) and
// observes it; when 12% of the element enters the viewport, .in is added and the
// observer disconnects; the animation never re-triggers on scroll back up. Optional
// binding value { delay } sets transitionDelay. Reduced-motion is enforced in CSS
// (main.css forces .reveal visible), not here.
// Applied via v-reveal to v-for items and section heads across all views (registered in main.js).
// v-reveal：进入视口时淡入上移（一次性）
export const reveal = {
  mounted(el, binding) {
    el.classList.add('reveal')
    if (binding.value?.delay) el.style.transitionDelay = binding.value.delay
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.classList.add('in')
            io.disconnect()
          }
        }
      },
      { threshold: 0.12 }
    )
    io.observe(el)
    el._io = io
  },
  unmounted(el) {
    el._io?.disconnect()
  },
}
