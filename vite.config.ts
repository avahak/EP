import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: '/test',
    define: {
        BUILD_DATE: JSON.stringify(new Date().toLocaleString('en-FI', { 
            timeZone: 'Europe/Helsinki', 
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        })),
    },
})
