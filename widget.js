const currentScript = document.currentScript;
const SITE_KEY = currentScript.getAttribute("data-site-key");

(function () {
  if (document.getElementById("kiri-launcher")) return;

  const FRONTEND_URL = "https://kiri-frontend.vercel.app";

  const button = document.createElement("div");
  button.id = "kiri-launcher";
  button.innerHTML = "✦";

  Object.assign(button.style, {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    width: "60px",
    height: "60px",
    borderRadius: "20px",
    background: "linear-gradient(135deg,#2563eb,#22c55e,#a855f7)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    fontSize: "24px",
    cursor: "pointer",
    zIndex: "2147483647",
    boxShadow: "0 20px 60px rgba(0,0,0,.45)",
    transition: "transform .2s ease, opacity .2s ease"
  });

  button.onmouseenter = () => {
    button.style.transform = "translateY(-3px) scale(1.03)";
  };

  button.onmouseleave = () => {
    button.style.transform = "translateY(0) scale(1)";
  };

  const iframe = document.createElement("iframe");
  iframe.id = "kiri-widget-frame";
  iframe.src = FRONTEND_URL + "/chat.html?siteKey=" + encodeURIComponent(SITE_KEY);

  Object.assign(iframe.style, {
    position: "fixed",
    bottom: "96px",
    right: "24px",
    width: "380px",
    height: "620px",
    maxWidth: "calc(100vw - 32px)",
    maxHeight: "calc(100vh - 120px)",
    border: "none",
    borderRadius: "22px",
    boxShadow: "0 30px 90px rgba(0,0,0,0.55)",
    display: "none",
    zIndex: "2147483646",
    overflow: "hidden",
    background: "transparent"
  });

  document.body.appendChild(button);
  document.body.appendChild(iframe);

  button.onclick = () => {
    button.style.display = "none";
    iframe.style.display = "block";
  };

  window.addEventListener("message", (event) => {
    if (event.origin !== FRONTEND_URL) return;

    if (event.data === "kiri-close") {
      iframe.style.display = "none";
      button.style.display = "flex";
    }
  });

  const mobileStyles = () => {
    if (window.innerWidth <= 520) {
      iframe.style.right = "12px";
      iframe.style.bottom = "12px";
      iframe.style.width = "calc(100vw - 24px)";
      iframe.style.height = "calc(100vh - 24px)";
      iframe.style.maxHeight = "calc(100vh - 24px)";
      iframe.style.borderRadius = "20px";
    } else {
      iframe.style.right = "24px";
      iframe.style.bottom = "96px";
      iframe.style.width = "380px";
      iframe.style.height = "620px";
      iframe.style.maxHeight = "calc(100vh - 120px)";
      iframe.style.borderRadius = "22px";
    }
  };

  mobileStyles();
  window.addEventListener("resize", mobileStyles);
})();
