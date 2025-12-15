// import express from "express";

// const router = express.Router();

// router.post("/ask", async (req, res) => {
//   const { question } = req.body;

//   if (!question) {
//     return res.status(400).json({ error: "Question is required" });
//   }

//   // Temporary response (AI will be added later)
//   return res.json({
//     answer: `You asked: "${question}". AI response will be here soon ✅`
//   });
// });

// export default router;


// import express from "express";
// import Chat from "../models/Chat.js";
// import fetch from "node-fetch";
// import dotenv from "dotenv";
// dotenv.config();

// const router = express.Router();

// router.post("/ask", async (req, res) => {
//   try {
//     const { question, userId, userName } = req.body;

//     if (!question?.trim()) {
//       return res.status(400).json({ error: "Question required" });
//     }

//     console.log("📩 Incoming question:", question);

//     // ✨ Gemini API URL
//     const url =
//       "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

//     // 🔥 Google Gemini request with correct key + format
//     const response = await fetch(`${url}?key=${process.env.GEMINI_API_KEY}`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "x-goog-api-key": process.env.GEMINI_API_KEY
//       },
//       body: JSON.stringify({
//         contents: [
//           {
//             parts: [{ text: question }]
//           }
//         ]
//       })
//     });

//     const data = await response.json();

//     console.log("🔍 Gemini raw response:", JSON.stringify(data, null, 2));

//     // ❌ If Gemini returns an error
//     if (data.error) {
//       return res.json({
//         answer:
//           "AI service error ❌ — Please try again later.\n" + data.error.message
//       });
//     }

//     // 🎯 Extract the AI output correctly
//     const aiAnswer =
//       data?.candidates?.[0]?.content?.parts?.[0]?.text ??
//       "I’m thinking... Please try again!";

//     console.log("🤖 Gemini AI Answer:", aiAnswer);

//     // 💾 Save chat only if logged-in user present
//     if (userId) {
//       await Chat.create({
//         userId,
//         userName: userName || "Anonymous",
//         question,
//         answer: aiAnswer
//       });
//     }

//     return res.json({ answer: aiAnswer });
//   } catch (err) {
//     console.error("🔥 AI Processing Error:", err);
//     return res.status(500).json({ error: "Internal error. Try again later." });
//   }
// });

// export default router;


import express from "express";
import Chat from "../models/Chat.js";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const router = express.Router();

// You can change this to another model name later if you want
const MODEL = "meta-llama/llama-3-70b-instruct";

router.post("/ask", async (req, res) => {
  try {
    const { question, userId, userName } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: "Question required" });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      console.error("❌ OPENROUTER_API_KEY missing");
      return res
        .status(500)
        .json({ error: "AI key is not configured on the server." });
    }

    console.log("📩 Incoming question:", question);

    // 🧠 Call OpenRouter
    const aiResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          // optional but nice
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "StudyAI"
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            {
              role: "system",
              content:
                "You are a friendly study assistant for college students. Explain things clearly and simply."
            },
            {
              role: "user",
              content: question
            }
          ]
        })
      }
    );

    const data = await aiResponse.json();
    console.log("🔍 OpenRouter raw:", JSON.stringify(data, null, 2));

    if (data.error) {
      return res
        .status(500)
        .json({ error: data.error.message || "AI service error" });
    }

    const aiAnswer =
      data?.choices?.[0]?.message?.content ||
      "I’m not sure, please try asking in a different way.";

    console.log("🤖 AI Answer:", aiAnswer);

    // 💾 Save chat if userId present
    if (userId) {
      try {
        await Chat.create({
          userId,
          userName: userName || "Anonymous",
          question,
          answer: aiAnswer
        });
      } catch (dbErr) {
        console.error("Failed to save chat:", dbErr);
        // don't break the response if DB fails
      }
    }

    return res.json({
  answer: aiAnswer,
  chatId: chat._id,
  chat
});

  } catch (err) {
    console.error("🔥 Ask route error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
