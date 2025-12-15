// import express from "express";
// import fetch from "node-fetch";
// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";

// const router = express.Router();

// // Needed for ES modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// router.post("/narrate", async (req, res) => {
//   try {
//     const { text, sceneIndex } = req.body;

//     if (!text) {
//       return res.status(400).json({ error: "Text is required" });
//     }

//     const audioDir = path.join(__dirname, "../public/audio");
//     if (!fs.existsSync(audioDir)) {
//       fs.mkdirSync(audioDir, { recursive: true });
//     }

//     const audioFileName = `scene-${sceneIndex}.mp3`;
//     const audioPath = path.join(audioDir, audioFileName);

//     // 🔊 OpenRouter TTS (teacher-style narration)
//     const response = await fetch(
//       "https://openrouter.ai/api/v1/audio/speech",
//       {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           model: "openai/gpt-4o-mini-tts",
//           voice: "alloy",
//           input: text,
//         }),
//       }
//     );

//     if (!response.ok) {
//       throw new Error("TTS generation failed");
//     }

//     const audioBuffer = Buffer.from(await response.arrayBuffer());
//     fs.writeFileSync(audioPath, audioBuffer);

//     return res.json({
//       audioUrl: `/audio/${audioFileName}`,
//     });
//   } catch (err) {
//     console.error("❌ Narration error:", err);
//     res.status(500).json({ error: "Narration failed" });
//   }
// });

// export default router;



import express from "express";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

// Needed for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.post("/narrate", async (req, res) => {
  try {
    const { text, sceneIndex } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const audioDir = path.join(__dirname, "../public/audio");
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    const audioFileName = `scene-${sceneIndex}.mp3`;
    const audioPath = path.join(audioDir, audioFileName);

    const response = await fetch(
      "https://openrouter.ai/api/v1/audio/speech",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini-tts",
          voice: "alloy",
          input: text,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("TTS generation failed");
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(audioPath, audioBuffer);

    // ✅ FIXED: FULL URL
    return res.json({
      audioUrl: `http://localhost:5000/audio/${audioFileName}`,
    });
  } catch (err) {
    console.error("❌ Narration error:", err);
    res.status(500).json({ error: "Narration failed" });
  }
});

export default router;


