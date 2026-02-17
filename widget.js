const currentScript = document.currentScript;
const SITE_KEY = currentScript.getAttribute("data-site-key");
(function () {
  if (document.getElementById("kiri-launcher")) return;

  // 🔘 Launcher button
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
    
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    cursor: "pointer",
    zIndex: "999999",
    boxShadow: "0 10px 30px rgba(0,0,0,.4)"
  });

  // 💬 Chat iframe (HIDDEN by default)
  const iframe = document.createElement("iframe");
  iframe.src = "https://kiri-backend-prod-production.up.railway.app/chat.html?siteKey=" + SITE_KEY;
  iframe.id = "kiri-widget";

  Object.assign(iframe.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    width: "380px",
    height: "560px",
    border: "none",
    borderRadius: "20px",
    display: "none",
    zIndex: "999999",
    boxShadow: "0 30px 80px rgba(0,0,0,.5)"
  });

  // 🔁 Toggle behavior
  button.onclick = () => {
    button.style.display = "none";
    iframe.style.display = "block";
  };

  window.addEventListener("message", (e) => {
  if (e.origin !== "https://kiri-backend-prod-production.up.railway.app") return;
  if (e.data === "kiri-close") {
      iframe.style.display = "none";
      button.style.display = "flex";
    }
  });

  document.body.appendChild(button);
  document.body.appendChild(iframe);
})();
