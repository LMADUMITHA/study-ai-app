// backend/routes/chatsRoutes.js
import express from "express";
import Chat from "../models/Chat.js";

const router = express.Router();

/**
 * GET /api/chats/:userId
 * Returns all chats for a user (most recent first)
 */
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: "userId required" });

    const chats = await Chat.find({ userId }).sort({ createdAt: -1 }).lean();
    res.json({ chats });
  } catch (err) {
    console.error("GET /api/chats error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * Optional: delete chat
 * DELETE /api/chats/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    await Chat.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/chats error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
