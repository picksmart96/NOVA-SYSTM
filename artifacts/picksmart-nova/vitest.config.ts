import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@workspace/nova-shared": path.resolve(import.meta.dirname, "../../lib/nova-shared/src/novaCommandMatcher.ts"),
    },
  },
  test: {
    environment: "node",
  },
});
