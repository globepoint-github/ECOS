import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/eco/', // 배포 주소가 https://.../eco 밑이라 서브 경로로 빌드
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  }
})
