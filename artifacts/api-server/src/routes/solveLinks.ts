import { Router } from "express";
import type { IRouter } from "express";
import { SolveLink } from "../models/SolveLink";
import { requireAdmin } from "../middlewares/auth";
import {
  CreateSolveLinkBody,
  UpdateSolveLinkBody,
  UpdateSolveLinkParams,
  DeleteSolveLinkParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function toDoc(s: any) {
  return {
    id: String(s._id),
    title: s.title,
    description: s.description || null,
    imageUrl: s.imageUrl || null,
    url: s.url,
    clickCount: s.clickCount || 0,
    createdAt: s.createdAt?.toISOString() || new Date().toISOString(),
  };
}

router.get("/solve-links", async (_req, res): Promise<void> => {
  const links = await SolveLink.find().sort({ createdAt: -1 });
  res.json(links.map(toDoc));
});

router.post("/solve-links", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateSolveLinkBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const link = await SolveLink.create(parsed.data);
  res.status(201).json(toDoc(link));
});

router.patch("/solve-links/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = UpdateSolveLinkBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const link = await SolveLink.findByIdAndUpdate(raw, parsed.data, { new: true });
  if (!link) {
    res.status(404).json({ error: "Solve link not found" });
    return;
  }
  res.json(toDoc(link));
});

router.delete("/solve-links/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const link = await SolveLink.findByIdAndDelete(raw);
  if (!link) {
    res.status(404).json({ error: "Solve link not found" });
    return;
  }
  res.json({ message: "Solve link deleted" });
});

export default router;
