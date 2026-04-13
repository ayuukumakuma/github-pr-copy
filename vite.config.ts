import { defineConfig } from "vite-plus";
import { WxtVitest } from "wxt/testing/vitest-plugin";

export default defineConfig({
  fmt: {
    ignorePatterns: ["AGENTS.md", ".pnpm-store/**", ".output/**", ".wxt/**"],
    semi: true,
    sortPackageJson: true,
  },
  lint: {
    ignorePatterns: ["AGENTS.md", ".pnpm-store/**", ".output/**", ".wxt/**"],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  staged: {
    "*": "vp check --fix",
  },
  plugins: [WxtVitest()],
  run: {
    tasks: {
      dev: {
        command: "wxt",
      },
      build: {
        command: "wxt build",
      },
      zip: {
        command: "wxt zip",
      },
    },
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.spec.ts"],
    exclude: [".output/**", ".wxt/**"],
  },
});
