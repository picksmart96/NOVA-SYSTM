import { Router } from "express";

const router = Router();

router.post("/request-access", (req, res) => {
  const data = req.body as Record<string, unknown>;

  console.log("=== NEW PICKSMART LEAD ===");
  console.log("Name:      ", data.name);
  console.log("Company:   ", data.company);
  console.log("Email:     ", data.email);
  console.log("Phone:     ", data.phone || "(not provided)");
  console.log("Selectors: ", data.selectors || "(not provided)");
  console.log("Message:   ", data.message || "(none)");
  console.log("========================");

  res.json({ success: true });
});

export default router;
