import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: parseInt(process.env.PORT || "7513"),
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:4003",
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: parseInt(process.env.PORT || "7513"),
  },
});