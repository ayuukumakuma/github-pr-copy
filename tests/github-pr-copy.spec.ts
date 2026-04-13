import { beforeEach, describe, expect, it } from "vite-plus/test";

import {
  ACTIONS_CONTAINER_CLASS,
  FEEDBACK_STYLE_ID,
  createCopyButtonSpecs,
  ensurePrCopyButtons,
  getHeaderElement,
  getTitleText,
  sanitizeTitleForMarkdownLink,
} from "../lib/github-pr-copy";

describe("github-pr-copy helpers", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    document.body.innerHTML = "";
  });

  it("sanitizes markdown-link title characters", () => {
    expect(sanitizeTitleForMarkdownLink("[test] (draft)")).toBe("【test】 （draft）");
  });

  it("builds title, url, and textlink copy payloads", () => {
    expect(createCopyButtonSpecs("Fix [bug]", "https://example.com/pull/1")).toEqual([
      { label: "Title", text: "Fix [bug]" },
      { label: "Url", text: "https://example.com/pull/1" },
      {
        label: "Textlink",
        text: "[Fix 【bug】](https://example.com/pull/1)",
      },
    ]);
  });

  it("extracts title from issue-title element", () => {
    document.body.innerHTML = `
      <main>
        <h1>
          <span data-testid="issue-title">Refine copy button behavior</span>
          <span>#123</span>
        </h1>
      </main>
    `;

    const headerElement = getHeaderElement();
    expect(headerElement).not.toBeNull();
    expect(getTitleText(headerElement!)).toBe("Refine copy button behavior");
  });

  it("falls back to text nodes and removes title noise", () => {
    document.body.innerHTML = `
      <main>
        <h1>
          Ship stable copy button
          <span>Edit title</span>
          <span>#456</span>
        </h1>
      </main>
    `;

    const headerElement = getHeaderElement();
    expect(headerElement).not.toBeNull();
    expect(getTitleText(headerElement!)).toBe("Ship stable copy button");
  });

  it("creates one button group and reuses it when title and url stay the same", () => {
    document.body.innerHTML = `
      <main>
        <h1>
          <span data-testid="issue-title">Ship stable copy button</span>
        </h1>
      </main>
    `;

    expect(ensurePrCopyButtons(document, "https://github.com/a/b/pull/1")).toBe(true);
    expect(ensurePrCopyButtons(document, "https://github.com/a/b/pull/1")).toBe(false);

    const containers = document.querySelectorAll(`.${ACTIONS_CONTAINER_CLASS}`);
    expect(containers).toHaveLength(1);
    expect(document.getElementById(FEEDBACK_STYLE_ID)).not.toBeNull();
    expect(containers[0]?.querySelectorAll("button")).toHaveLength(3);
  });

  it("replaces button group when the current url changes", () => {
    document.body.innerHTML = `
      <main>
        <h1>
          <span data-testid="issue-title">Ship stable copy button</span>
        </h1>
      </main>
    `;

    expect(ensurePrCopyButtons(document, "https://github.com/a/b/pull/1")).toBe(true);
    expect(ensurePrCopyButtons(document, "https://github.com/a/b/pull/2")).toBe(true);

    const container = document.querySelector(`.${ACTIONS_CONTAINER_CLASS}`);
    expect(container).not.toBeNull();
    expect((container as HTMLElement).dataset.copyUrl).toBe("https://github.com/a/b/pull/2");
  });
});
