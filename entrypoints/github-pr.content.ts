import { defineContentScript } from "#imports";

import { ensurePrCopyButtons } from "../lib/github-pr-copy";

export default defineContentScript({
  matches: ["https://github.com/*/*/pull/*"],
  main(ctx) {
    const refreshButtons = () => ensurePrCopyButtons();
    const observer = new MutationObserver(refreshButtons);
    const observedNode = document.body ?? document.documentElement;

    observer.observe(observedNode, {
      childList: true,
      subtree: true,
    });

    ctx.addEventListener(window, "wxt:locationchange", refreshButtons);
    ctx.onInvalidated(() => {
      observer.disconnect();
    });

    refreshButtons();
  },
});
