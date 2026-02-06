(function () {
  if (document.getElementById("kiri-widget")) return;

  const iframe = document.createElement("iframe");
  iframe.id = "kiri-widget";
  iframe.src = "https://kiri-backend-prod-production.up.railway.app/chat.html";

  Object.assign(iframe.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    width: "380px",
    height: "560px",
    border: "none",
    borderRadius: "20px",
    zIndex: "999999",
    boxShadow: "0 30px 80px rgba(0,0,0,0.8)"
  });

  document.body.appendChild(iframe);
})();
