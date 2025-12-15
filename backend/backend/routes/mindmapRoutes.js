import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.post("/mindmap", async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Content is required" });
    }

   const prompt = `
You are an AI that generates mindmaps.

Return ONLY valid JSON.
NO explanations.
NO markdown.
NO extra text.

Strict format:
{
  "title": "Main Topic",
  "nodes": [
    {
      "label": "Heading",
      "children": ["point 1", "point 2"]
    }
  ]
}

Rules:
- Every main heading MUST be inside "nodes"
- Subpoints MUST go inside "children"
- Do NOT repeat items
- Do NOT flatten structure

Generate a clear, student-friendly mindmap for:

${content}
`;


    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3-70b-instruct",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3
      })
    });

    const data = await response.json();

    const raw = data.choices?.[0]?.message?.content;

    if (!raw) {
      return res.status(500).json({ error: "Invalid AI response" });
    }

    const mindmap = JSON.parse(raw);

    res.json({ mindmap });

  } catch (err) {
    console.error("Mindmap Error:", err);
    res.status(500).json({ error: "Mindmap generation failed" });
  }
});

export default router;
