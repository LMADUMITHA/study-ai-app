// import express from "express";
// import OpenAI from "openai";

// const router = express.Router();

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// router.post("/generate", async (req, res) => {
//   try {
//     const { topic, content, count = 5 } = req.body;

//     if (!topic && !content) {
//       return res.status(400).json({ error: "Topic or content is required" });
//     }

//     const prompt = `
// Generate ${count} multiple choice questions for practice.

// Topic/Content:
// ${topic || content}

// Rules:
// - Each question must have 4 options
// - Clearly specify the correct answer
// - Provide a short explanation
// - Return STRICT JSON only

// Format:
// [
//   {
//     "question": "",
//     "options": ["", "", "", ""],
//     "correctAnswer": "",
//     "explanation": ""
//   }
// ]
// `;

//     const response = await openai.chat.completions.create({
//       model: "gpt-4o-mini",
//       messages: [{ role: "user", content: prompt }],
//       temperature: 0.4,
//     });

//     const quiz = JSON.parse(response.choices[0].message.content);

//     res.json({ quiz });
//   } catch (err) {
//     console.error("Quiz generation error:", err);
//     res.status(500).json({ error: "Quiz generation failed" });
//   }
// });

// export default router;


import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.post("/generate", async (req, res) => {
  try {
    const { topic, content, count = 5 } = req.body;

    if (!topic && !content) {
      return res.status(400).json({ error: "Topic or content is required" });
    }

    const prompt = `
Generate ${count} multiple choice questions for practice.

Topic or Content:
${topic || content}

Rules:
- 4 options per question
- Mention correctAnswer clearly
- Provide short explanation
- Return STRICT JSON ONLY

Format:
[
  {
    "question": "",
    "options": ["", "", "", ""],
    "correctAnswer": "",
    "explanation": ""
  }
]
`;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3-70b-instruct",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter error:", data);
      throw new Error("Quiz generation failed");
    }

   const raw = data.choices[0].message.content;

const jsonStart = raw.indexOf("[");
const jsonEnd = raw.lastIndexOf("]") + 1;

if (jsonStart === -1 || jsonEnd === -1) {
  console.error("Invalid AI response:", raw);
  return res.status(500).json({ error: "Invalid quiz format from AI" });
}

const quiz = JSON.parse(raw.slice(jsonStart, jsonEnd));


    res.json({ quiz });
  } catch (err) {
    console.error("Quiz error:", err);
    res.status(500).json({ error: "Quiz generation failed" });
  }
});

export default router;
