import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ["src"],
      exclude: ["src/**/*.test.ts", "src/**/*.test.tsx"],
      outDir: "dist",
      rollupTypes: false,
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        "i18n/index": resolve(__dirname, "src/i18n/index.ts"),
      },
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "ra-core",
        "papaparse",
        "lucide-react",
        "@radix-ui/react-dialog",
        "@radix-ui/react-tooltip",
        "@radix-ui/react-slot",
        "class-variance-authority",
        "clsx",
        "tailwind-merge",
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
    sourcemap: true,
    minify: false,
  },
});
