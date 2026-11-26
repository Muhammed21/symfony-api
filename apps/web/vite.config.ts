import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const API_URL = process.env["API_URL"] ?? "http://localhost:8000";

export default defineConfig({
  plugins: [react()],
  envDir: "../..",
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: API_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
