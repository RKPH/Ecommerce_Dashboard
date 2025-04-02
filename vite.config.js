import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', 
    port: 5174,      
    allowedHosts: [
      'dashboard.d2f.io.vn', // Allow this hostname
      'localhost',           // Optional: keep for local development
    ],
  },
});