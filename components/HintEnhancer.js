"use client";

import { useEffect } from "react";

export default function HintEnhancer() {
  useEffect(() => {
    let lastForm = null;

    function installHintControl() {
      const form = document.querySelector("form.answer-card");

      if (!form) {
        lastForm = null;
        window.__friendguessHint = "";
        return;
      }

      if (form === lastForm && form.querySelector("[data-fg-hint-control]")) return;
      if (form.querySelector("[data-fg-hint-control]")) {
        lastForm = form;
        return;
      }

      lastForm = form;
      window.__friendguessHint = "";

      const wrapper = document.createElement("div");
      wrapper.dataset.fgHintControl = "true";
      wrapper.className = "fg-hint-control";

      const label = document.createElement("label");
      label.className = "fg-hint-toggle";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.setAttribute("aria-label", "Add a hint");

      const text = document.createElement("span");
      text.innerHTML = "<strong>💡 Add a hint?</strong><small>Optional — everyone will see it during the round.</small>";

      const hintInput = document.createElement("input");
      hintInput.type = "text";
      hintInput.className = "fg-hint-input";
      hintInput.placeholder = "Type an optional hint…";
      hintInput.maxLength = 100;
      hintInput.hidden = true;

      checkbox.addEventListener("change", () => {
        hintInput.hidden = !checkbox.checked;
        if (!checkbox.checked) {
          hintInput.value = "";
          window.__friendguessHint = "";
        } else {
          hintInput.focus();
        }
      });

      hintInput.addEventListener("input", () => {
        window.__friendguessHint = hintInput.value.slice(0, 100);
      });

      label.appendChild(checkbox);
      label.appendChild(text);
      wrapper.appendChild(label);
      wrapper.appendChild(hintInput);

      const submitButton = form.querySelector('button[type="submit"], .primary-button');
      if (submitButton) form.insertBefore(wrapper, submitButton);
      else form.appendChild(wrapper);
    }

    installHintControl();

    const observer = new MutationObserver(installHintControl);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      window.__friendguessHint = "";
    };
  }, []);

  return null;
}
