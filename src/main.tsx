import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.css";
import "./styles/notes-teaser.css";

// The GA4 measurement ID is public by design.  Keep development sessions out
// of the production property's reports unless an explicit local ID is supplied.
const analyticsId = import.meta.env.VITE_ANALYTICS_ID?.trim()
  || (import.meta.env.PROD ? "G-0SLZ2V7X9C" : undefined);

if (analyticsId) {
  const analyticsScript = document.createElement("script");
  analyticsScript.async = true;
  analyticsScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(analyticsId)}`;
  document.head.appendChild(analyticsScript);

  const analyticsWindow = window as Window & { dataLayer?: IArguments[] };
  analyticsWindow.dataLayer ||= [];
  // gtag.js consumes each queued call as an Arguments object. Keep this a
  // regular function (rather than an arrow) so `arguments` is the call's
  // actual argument list, matching Google's standard installation snippet.
  function gtag(..._args: unknown[]) {
    analyticsWindow.dataLayer?.push(arguments);
  }

  gtag("js", new Date());
  gtag("config", analyticsId);

  window.addEventListener("veil:analytics", (event) => {
    const detail = (event as CustomEvent<{ event?: string; detail?: string }>).detail;
    if (detail?.event) gtag("event", detail.event, { link_target: detail.detail });
  });
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
