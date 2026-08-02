(() => {
  const storageKey = "veil-age-ok-reina";
  const gate = document.getElementById("english-age-gate");
  const story = document.getElementById("english-story");
  const confirm = document.getElementById("confirm-age");

  const reveal = () => {
    gate?.setAttribute("hidden", "");
    story?.removeAttribute("hidden");
  };

  try {
    if (localStorage.getItem(storageKey) === "yes") reveal();
  } catch {
    // The notice remains visible if browser storage is unavailable.
  }

  confirm?.addEventListener("click", () => {
    try { localStorage.setItem(storageKey, "yes"); } catch { /* keep the current-session view available */ }
    reveal();
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  });
})();
