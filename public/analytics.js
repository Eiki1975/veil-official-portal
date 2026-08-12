// gtag.js expects this standard global queue function. It reads each queued
// command as an Arguments object, not an array.
function gtag() {
  window.dataLayer.push(arguments);
}

// Static entry pages do not load the React bundle, so they need their own
// production-only GA4 bootstrap. The measurement ID is public by design.
if (location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
  const analyticsId = "G-0SLZ2V7X9C";
  const analyticsScript = document.createElement("script");
  analyticsScript.async = true;
  analyticsScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(analyticsId)}`;
  document.head.appendChild(analyticsScript);

  window.dataLayer = window.dataLayer || [];
  gtag("js", new Date());
  gtag("config", analyticsId);
}
