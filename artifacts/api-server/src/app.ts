import express from "express";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("NOVA API is running 🚀");
});

app.get("/test", (req, res) => {
  res.json({ message: "API working ✅" });
});

export default app;
