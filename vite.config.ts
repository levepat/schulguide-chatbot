import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "/schulguide/",
  plugins: [react()],
  build: { chunkSizeWarningLimit: 1500 },
  test: {
    include: ["src/**/*.test.{ts,tsx}", "tools/**/*.test.ts"],
    environment: "node",
    alias: [
      {
        find: /^.*\/context\/schulinfo\.md\?raw$/,
        replacement: `${fileURLToPath(new URL("./src/prompt/fixtures/schulinfo.fixture.md", import.meta.url))}?raw`,
      },
    ],
  },
});
