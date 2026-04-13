import { defineConfig } from "wxt";

import { extensionDescription, extensionName, manifestIcons } from "./lib/github-pr-copy-metadata";

export const manifest = {
  name: extensionName,
  description: extensionDescription,
  icons: manifestIcons,
};

const config = defineConfig({
  manifest,
});

export default config;
