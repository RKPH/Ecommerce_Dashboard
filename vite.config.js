import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Listen on all interfaces (required for Docker)
    port: 5174,      // Match the port in your Docker Compose file
    allowedHosts: [
      'dashboard.d2f.io.vn', // Allow this hostname
      'localhost',           // Optional: keep for local development
    ],
  },
});