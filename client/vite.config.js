import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const isProd = mode === "production";

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: "0.0.0.0",
      port: 5173,
      hmr: {
        host: "localhost",
        port: 5173,
      },
      proxy: {
        "/api": {
          target: "http://server:3000",
          changeOrigin: true,
        },
      },
      watch: {
        usePolling: true,
        interval: 500,
      },
    },
    build: {
      minify: isProd ? "terser" : false,
      terserOptions: isProd
        ? {
            compress: {
              drop_console: true,
              drop_debugger: true,
            },
          }
        : {},
    },
  };
});
