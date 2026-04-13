export const HEADER_SELECTORS = [
  "#partial-discussion-header h1",
  "h1.gh-header-title",
  "main h1",
] as const;
export const TITLE_SELECTORS = ["[data-testid='issue-title']", ".markdown-title", "bdi"] as const;
export const TITLE_NOISE_PATTERNS = [/^#\d+$/, /^Edit title$/i] as const;

export const ACTIONS_CONTAINER_CLASS = "copy-pr-actions";
export const COPY_BUTTON_CLASS = "copy-pr-title-button";
export const COPIED_BUTTON_CLASS = "is-copied";
export const FEEDBACK_STYLE_ID = "copy-pr-feedback-style";
export const COPIED_LABEL = "✓ Copied";
export const FEEDBACK_DURATION_MS = 1000;

const buttonRestoreTimers = new WeakMap<HTMLButtonElement, number>();

export interface CopyButtonSpec {
  label: "Title" | "Url" | "Textlink";
  text: string;
}

export const isTitleNoise = (text: string): boolean =>
  TITLE_NOISE_PATTERNS.some((pattern) => pattern.test(text));

export const getHeaderElement = (root: ParentNode = document): HTMLElement | null => {
  for (const selector of HEADER_SELECTORS) {
    const headerElement = root.querySelector(selector);
    if (headerElement instanceof HTMLElement) {
      return headerElement;
    }
  }

  return null;
};

export const getTitleText = (headerElement: ParentNode): string => {
  for (const selector of TITLE_SELECTORS) {
    const titleElement = headerElement.querySelector(selector);
    const titleText = titleElement?.textContent?.trim();
    if (titleText && !isTitleNoise(titleText)) {
      return titleText;
    }
  }

  const textNodes = Array.from(headerElement.childNodes)
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => node.textContent?.trim() ?? "")
    .filter(Boolean)
    .filter((text) => !isTitleNoise(text));

  return textNodes.join(" ").trim();
};

export const sanitizeTitleForMarkdownLink = (title: string): string =>
  title.replaceAll("[", "【").replaceAll("]", "】").replaceAll("(", "（").replaceAll(")", "）");

export const createCopyButtonSpecs = (title: string, url: string): CopyButtonSpec[] => [
  { label: "Title", text: title },
  { label: "Url", text: url },
  {
    label: "Textlink",
    text: `[${sanitizeTitleForMarkdownLink(title)}](${url})`,
  },
];

const ensureFeedbackStyle = (doc: Document): void => {
  if (doc.getElementById(FEEDBACK_STYLE_ID)) {
    return;
  }

  const styleElement = doc.createElement("style");
  styleElement.id = FEEDBACK_STYLE_ID;
  styleElement.textContent = `
    .${ACTIONS_CONTAINER_CLASS} {
      display: inline-flex;
      gap: 10px;
      margin-left: 10px;
      vertical-align: middle;
    }

    .${COPY_BUTTON_CLASS}.${COPIED_BUTTON_CLASS} {
      border-color: var(--fgColor-success, #1a7f37);
      box-shadow: inset 0 0 0 1px var(--fgColor-success, #1a7f37);
      color: var(--fgColor-success, #1a7f37);
    }
  `;

  (doc.head ?? doc.body).appendChild(styleElement);
};

const showCopiedFeedback = (button: HTMLButtonElement, initialLabel: string): void => {
  const existingTimer = buttonRestoreTimers.get(button);
  if (existingTimer !== undefined) {
    window.clearTimeout(existingTimer);
  }

  button.textContent = COPIED_LABEL;
  button.classList.add(COPIED_BUTTON_CLASS);

  const restoreTimer = window.setTimeout(() => {
    button.textContent = initialLabel;
    button.classList.remove(COPIED_BUTTON_CLASS);
    buttonRestoreTimers.delete(button);
  }, FEEDBACK_DURATION_MS);

  buttonRestoreTimers.set(button, restoreTimer);
};

const createButton = (doc: Document, { label, text }: CopyButtonSpec): HTMLButtonElement => {
  const button = doc.createElement("button");
  button.textContent = label;
  button.classList.add("btn", "btn-sm", COPY_BUTTON_CLASS);
  button.addEventListener("click", async () => {
    if (!text) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      showCopiedFeedback(button, label);
    } catch (error: unknown) {
      console.error(error);
    }
  });

  return button;
};

const createActionsContainer = (doc: Document, title: string, url: string): HTMLSpanElement => {
  const container = doc.createElement("span");
  container.classList.add(ACTIONS_CONTAINER_CLASS);
  container.dataset.copyTitle = title;
  container.dataset.copyUrl = url;

  for (const buttonSpec of createCopyButtonSpecs(title, url)) {
    container.appendChild(createButton(doc, buttonSpec));
  }

  return container;
};

export const ensurePrCopyButtons = (
  doc: Document = document,
  url: string = window.location.href,
): boolean => {
  ensureFeedbackStyle(doc);

  const headerElement = getHeaderElement(doc);
  if (!headerElement) {
    return false;
  }

  const title = getTitleText(headerElement);
  if (!title) {
    return false;
  }

  const existingContainer = headerElement.querySelector(`.${ACTIONS_CONTAINER_CLASS}`);
  const isReusableContainer =
    existingContainer instanceof HTMLElement &&
    existingContainer.dataset.copyTitle === title &&
    existingContainer.dataset.copyUrl === url;
  if (isReusableContainer) {
    return false;
  }

  if (existingContainer instanceof HTMLElement) {
    existingContainer.remove();
  }

  headerElement.appendChild(createActionsContainer(doc, title, url));

  return true;
};
