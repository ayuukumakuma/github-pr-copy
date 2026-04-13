const HEADER_SELECTORS = [
  "#partial-discussion-header h1",
  "h1.gh-header-title",
  "main h1",
];
const TITLE_SELECTORS = [
  "[data-testid='issue-title']",
  ".markdown-title",
  "bdi",
];
const TITLE_NOISE_PATTERNS = [
  /^#\d+$/,
  /^Edit title$/i,
];

const ACTIONS_CONTAINER_CLASS = "copy-pr-actions";
const COPY_BUTTON_CLASS = "copy-pr-title-button";
const COPIED_BUTTON_CLASS = "is-copied";
const FEEDBACK_STYLE_ID = "copy-pr-feedback-style";
const COPIED_LABEL = "✓ Copied";
const FEEDBACK_DURATION_MS = 1000;
const buttonRestoreTimers = new WeakMap();

const ensureFeedbackStyle = () => {
  if (document.getElementById(FEEDBACK_STYLE_ID)) {
    return;
  }

  const styleElement = document.createElement("style");
  styleElement.id = FEEDBACK_STYLE_ID;
  styleElement.textContent = `
    .${COPY_BUTTON_CLASS}.${COPIED_BUTTON_CLASS} {
      border-color: var(--fgColor-success, #1a7f37);
      box-shadow: inset 0 0 0 1px var(--fgColor-success, #1a7f37);
      color: var(--fgColor-success, #1a7f37);
    }
  `;

  (document.head ?? document.body).appendChild(styleElement);
};

const getHeaderElement = () => {
  for (const selector of HEADER_SELECTORS) {
    const headerElement = document.querySelector(selector);
    if (headerElement) {
      return headerElement;
    }
  }

  return null;
};

const getTitleText = (headerElement) => {
  for (const selector of TITLE_SELECTORS) {
    const titleElement = headerElement.querySelector(selector);
    const titleText = titleElement?.textContent?.trim();
    if (titleText) {
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

const isTitleNoise = (text) => {
  return TITLE_NOISE_PATTERNS.some((pattern) => pattern.test(text));
};

const sanitizeTitleForMarkdownLink = (title) => {
  return title
    .replaceAll("[", "【")
    .replaceAll("]", "】")
    .replaceAll("(", "（")
    .replaceAll(")", "）");
};

const ensureButtons = () => {
  ensureFeedbackStyle();

  const headerElement = getHeaderElement();
  if (!headerElement) {
    return;
  }

  if (headerElement.querySelector(`.${ACTIONS_CONTAINER_CLASS}`)) {
    return;
  }

  const title = getTitleText(headerElement);
  if (!title) {
    return;
  }

  const url = window.location.href;
  const textlinkTitle = sanitizeTitleForMarkdownLink(title);
  const container = document.createElement("span");
  container.classList.add(ACTIONS_CONTAINER_CLASS);

  const buttons = [
    createButton({ title: "Title", text: title }),
    createButton({ title: "Url", text: url }),
    createButton({
      title: "Textlink",
      text: `[${textlinkTitle}](${url})`,
    }),
  ];

  buttons.forEach((button) => {
    container.appendChild(button);
  });
  headerElement.appendChild(container);
};

const observer = new MutationObserver(ensureButtons);

const showCopiedFeedback = (button, initialLabel) => {
  const existingTimer = buttonRestoreTimers.get(button);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  button.textContent = COPIED_LABEL;
  button.classList.add(COPIED_BUTTON_CLASS);

  const restoreTimer = setTimeout(() => {
    button.textContent = initialLabel;
    button.classList.remove(COPIED_BUTTON_CLASS);
    buttonRestoreTimers.delete(button);
  }, FEEDBACK_DURATION_MS);

  buttonRestoreTimers.set(button, restoreTimer);
};

const createButton = ({ title, text }) => {
  const button = document.createElement("button");
  const initialLabel = title;
  button.textContent = title;
  button.style.marginLeft = "10px";
  button.classList.add("btn", "btn-sm", COPY_BUTTON_CLASS);
  button.onclick = () => {
    if (!text) {
      return;
    }

    navigator.clipboard
      .writeText(text)
      .then(() => {
        showCopiedFeedback(button, initialLabel);
      })
      .catch((err) => {
        console.error(err);
      });
  };
  return button;
};

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

ensureButtons();
