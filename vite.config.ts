import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' 让产物用相对路径,网页/扩展/Tauri/file:// 都能正确加载资源
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5173 },
})
