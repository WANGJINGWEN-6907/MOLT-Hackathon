import { defineConfig, loadEnv } from "vite";
import { miaodaDevPlugin } from "miaoda-sc-plugin";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const aiBaseUrl = env.VITE_LLM_BASE_URL || ''

  return {
    plugins: [
      react(),
      miaodaDevPlugin(),
      svgr({
        svgrOptions: {
          icon: true,
          exportType: "named",
          namedExport: "ReactComponent",
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: aiBaseUrl ? {
        '/claude-api': {
          target: aiBaseUrl,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/claude-api/, ''),
        },
      } : {},
    },
  }
});
