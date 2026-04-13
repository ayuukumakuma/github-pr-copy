import { describe, expect, it } from "vite-plus/test";

import { extensionDescription, extensionName, manifestIcons } from "../lib/github-pr-copy-metadata";
import config, { manifest } from "../wxt.config";

describe("wxt config", () => {
  it("keeps the extension manifest minimal", () => {
    expect(config.modules).toBeUndefined();
    expect(manifest.name).toBe(extensionName);
    expect(manifest.description).toBe(extensionDescription);
    expect(manifest.icons).toEqual(manifestIcons);
    expect("permissions" in manifest).toBe(false);
    expect("host_permissions" in manifest).toBe(false);
  });
});
