import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
    "crag": "./src/cli.ts",
  },
  outDir: "bin",
  watch: ['./src/*'],
  external: ['typescript', '@hey-api/openapi-ts'],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  platform: "node",
  clean: true,
  splitting: false,
  treeshake: false,
})
