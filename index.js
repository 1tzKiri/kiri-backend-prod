const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.send("OK FROM RAILWAY");
});

const PORT = process.env.PORT;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Listening on", PORT);
});
