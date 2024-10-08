import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      "/socketio": {
        target: "ws://localhost:3010",
        ws: true,
      },
      "/api": {
        target: "http://localhost:3010",
      },
    },
  },
});
