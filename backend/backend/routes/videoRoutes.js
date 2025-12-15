import express from "express";
import fetch from "node-fetch";

const router = express.Router();

/**
 * POST /api/video/generate
 * Generates a scene-wise video script using OpenRouter
 */
router.post("/generate", async (req, res) => {
  try {
    console.log("🎬 Video API HIT");

    const { content } = req.body;
    console.log("📥 Content received:", content);

    // ✅ Validation
    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Content is required" });
    }

    // ✅ Prompt (JSON expected, but we still parse safely)
   const prompt = `
You are a JSON API.

Return ONLY valid JSON.
Do NOT add explanations, titles, or text outside JSON.
Use ONLY standard double quotes (").

STRICT FORMAT:
{
  "scenes": [
    { "text": "Scene explanation here" }
  ]
}

Rules:
- JSON must start with { and end with }
- Do not use smart quotes
- Do not include voice, visual, duration, or any extra keys

Topic:
${content}
`;


    console.log("📤 Sending request to OpenRouter...");

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3-70b-instruct",
          messages: [{ role: "user", content: prompt }],
        }),
      }
    );

    const data = await response.json();
    console.log("🤖 OpenRouter raw response:", data);

    const rawContent = data?.choices?.[0]?.message?.content;

    if (!rawContent) {
      console.error("❌ Empty AI response");
      return res.status(500).json({ error: "Video generation failed" });
    }

    // ✅ SAFE JSON EXTRACTION (IMPORTANT FIX)
    let videoScript;
try {
  const jsonMatch = rawContent.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    return res.status(500).json({ error: "Invalid AI response format" });
  }

  // 🔧 Fix smart quotes if AI uses them
  const cleanJson = jsonMatch[0]
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");

  videoScript = JSON.parse(cleanJson);
} catch (err) {
  console.error("❌ JSON Parse Error");
  console.error(rawContent);
  return res.status(500).json({ error: "Invalid video script format" });
}


    // ✅ Final validation
    if (!videoScript.scenes || !Array.isArray(videoScript.scenes)) {
      return res.status(500).json({ error: "Invalid scenes structure" });
    }

    console.log("✅ Video script generated successfully");

    return res.json(videoScript);
  } catch (error) {
    console.error("❌ Video Route Error:", error);
    return res.status(500).json({ error: "Video generation failed" });
  }
});

export default router;
