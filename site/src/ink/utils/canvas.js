// ===== Shared canvas preparation helper (ink-framework components) =====
// Every ink canvas component repeated the same 6-line block: clamp DPR to 2,
// sync the backing store to the element's CSS size, reset the transform, clear.
// Extracted here (H-line cleanup, 2026-10-09) so the resize policy lives in
// exactly one place. Purely mechanical — math is identical to the old inline
// blocks.

// Prepare canvas `c` for one drawing pass and return `{ ctx, W, H }`.
// W/H default to the element's CSS box; pass explicit values when the canvas
// is a fixed square (DecodeBubble) or taller than its CSS height
// (SignalMonitor stacks N lanes). All subsequent drawing coordinates are then
// in CSS pixels — the DPR scaling is folded into the transform.
export function setupCanvas(c, W, H) {
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  if (W === undefined) W = c.clientWidth
  if (H === undefined) H = c.clientHeight
  if (c.width !== W * dpr || c.height !== H * dpr) { c.width = W * dpr; c.height = H * dpr }
  const ctx = c.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, W, H)
  return { ctx, W, H }
}
