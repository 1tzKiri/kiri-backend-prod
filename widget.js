const currentScript = document.currentScript;
const SITE_KEY = currentScript.getAttribute("data-site-key");

(function () {
  if (document.getElementById("kiri-launcher")) return;

  // ✅ Launcher Button (K)
  const button = document.createElement("div");
  button.id = "kiri-launcher";
  button.innerText = "K";

  Object.assign(button.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: "#1a1a1a",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "18px",
    cursor: "pointer",
    zIndex: "999999",
    boxShadow: "0 10px 30px rgba(0,0,0,.4)"
  });

  // ✅ Chat iframe (hidden by default)
  const iframe = document.createElement("iframe");
  iframe.src =
    "https://kiri-backend-prod-production.up.railway.app/chat.html?siteKey=" +
    SITE_KEY;

  Object.assign(iframe.style, {
    position: "fixed",
    bottom: "24px",
    right: "20px",
    width: "360px",
    height: "520px",
    border: "none",
    borderRadius: "18px",
    boxShadow: "0 30px 70px rgba(0,0,0,0.4)",
    display: "none", // important
    zIndex: "999998"
  });

  document.body.appendChild(button);
  document.body.appendChild(iframe);

  // ✅ Open
  button.onclick = () => {
    button.style.display = "none";
    iframe.style.display = "block";
  };

  // ✅ Close
  window.addEventListener("message", (event) => {
    if (
      event.origin !==
      "https://kiri-backend-prod-production.up.railway.app"
    )
      return;

    if (event.data === "kiri-close") {
      iframe.style.display = "none";
      button.style.display = "flex";
    }
  });
})();
