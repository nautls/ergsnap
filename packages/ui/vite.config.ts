import path from "path";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import svgLoader from "vite-svg-loader";

// https://vitejs.dev/config/

export default defineConfig(({ mode }) => {
  return {
    plugins: [vue(), svgLoader()],
    base: mode === "production" ? "ergsnap/" : "./",
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src")
      }
    },
    server: {
      port: 8000
    }
  };
});

// export default defineConfig({
//   plugins: [vue(), svgLoader()],
//   base: import.meta.env.PROD ? "./" : "",
//   resolve: {
//     alias: {
//       "@": path.resolve(__dirname, "./src")
//     }
//   },
//   server: {
//     port: 8000
//   }
// });
