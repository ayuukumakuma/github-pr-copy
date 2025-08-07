const observer = new MutationObserver(() => {
  const headerElement = document.querySelector(
    "#partial-discussion-header > div.gh-header-show > div > h1",
  );

  let titleElement;
  if (headerElement && !document.querySelector(".copy-pr-title-button")) {
    titleElement = document.querySelector(
      "#partial-discussion-header > div.gh-header-show > div > h1 > bdi",
    );

    const title = titleElement.textContent;
    const url = window.location.href;

    const titleCopyButton = createButton({ title: "Title", text: title });
    const urlCopyButton = createButton({ title: "Url", text: url });
    const textUrlCopyButton = createButton({
      title: "Textlink",
      text: `[${title}](${url})`,
    });

    headerElement.appendChild(titleCopyButton);
    headerElement.appendChild(urlCopyButton);
    headerElement.appendChild(textUrlCopyButton);
  }
});

const createButton = ({ title, text }) => {
  const button = document.createElement("button");
  button.textContent = title;
  button.style.marginLeft = "10px";
  button.classList.add("btn", "btn-sm", "copy-pr-title-button");
  button.onclick = () => {
    if (text) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          showTooltip(button, "copied!");
        })
        .catch((err) => {
          console.error(err);
        });
    }
  };
  return button;
};

const showTooltip = (element, message) => {
  const tooltip = document.createElement("div");
  tooltip.textContent = message;
  tooltip.style.position = "absolute";
  tooltip.style.backgroundColor = "rgba(255, 255, 255, 0.3)";
  tooltip.style.color = "#fff";
  tooltip.style.padding = "5px";
  tooltip.style.fontSize = "12px";
  tooltip.style.width = "60px";
  tooltip.style.textAlign = "center";
  tooltip.style.fontWeight = "200";
  tooltip.style.borderRadius = "5px";
  tooltip.style.top = `${element.offsetTop - 32}px`;
  tooltip.style.left = `${element.offsetLeft + element.offsetWidth / 2 - 30}px`;
  document.body.appendChild(tooltip);
  setTimeout(() => {
    tooltip.remove();
  }, 1000);
};

observer.observe(document.body, {
  childList: true,
  subtree: true,
});
