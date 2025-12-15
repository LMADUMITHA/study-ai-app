import express from "express";
import Chat from "../models/Chat.js";

const router = express.Router();

router.post("/add", async (req, res) => {
  try {
    const { chatId, role, text } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ error: "Chat not found" });

    chat.messages.push({ role, text, time: new Date() });
    await chat.save();

    res.json(chat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save message" });
  }
});

export default router;
