const HEADER_SELECTORS = [
  "#partial-discussion-header h1",
  "h1.gh-header-title",
  "main h1",
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
  const bdiElement = headerElement.querySelector("bdi");
  return (bdiElement?.textContent ?? headerElement.textContent ?? "").trim();
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
  const container = document.createElement("span");
  container.classList.add(ACTIONS_CONTAINER_CLASS);

  const buttons = [
    createButton({ title: "Title", text: title }),
    createButton({ title: "Url", text: url }),
    createButton({
      title: "Textlink",
      text: `[${title}](${url})`,
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
