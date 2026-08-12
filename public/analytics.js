// Static entry pages do not load the React bundle, so they need their own
// production-only GA4 bootstrap. The measurement ID is public by design.
if (location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
  const analyticsId = "G-0SLZ2V7X9C";
  window.dataLayer ||= [];

  // Keep the standard global function form used in Google's installation
  // snippet. gtag.js reads queued commands as Arguments objects, not arrays.
  window.gtag ||= function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag("js", new Date());
  window.gtag("config", analyticsId);

  const analyticsScript = document.createElement("script");
  analyticsScript.async = true;
  analyticsScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(analyticsId)}`;
  document.head.appendChild(analyticsScript);
}
