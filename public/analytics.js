(() => {
  // Static entry pages do not load the React bundle, so they need their own
  // production-only GA4 bootstrap. The measurement ID is public by design.
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") return;

  const analyticsId = "G-0SLZ2V7X9C";
  const analyticsWindow = window;
  analyticsWindow.dataLayer ||= [];

  // gtag.js consumes queued commands as Arguments objects, not arrays.
  function gtag(..._args) {
    analyticsWindow.dataLayer.push(arguments);
  }

  gtag("js", new Date());
  gtag("config", analyticsId);

  const analyticsScript = document.createElement("script");
  analyticsScript.async = true;
  analyticsScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(analyticsId)}`;
  document.head.appendChild(analyticsScript);
})();
