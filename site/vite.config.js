import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// ===== vite.config - build config for the Hlab site =====
// base './' emits relative asset URLs, so the built dist/ serves correctly from any path -
// the nginx web root on the Aliyun server today, a sub-path or custom domain later -
// without rebuilding. @vitejs/plugin-vue compiles the .vue single-file components.
// 部署在子路径（如 GitHub Pages 的 /Hlab/）时，把 base 改成对应路径
export default defineConfig({
  plugins: [vue()],
  base: './',
})
