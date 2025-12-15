// import express from "express";
// const router = express.Router();

// router.post("/ask", async (req, res) => {
//   try {
//     const { question } = req.body;

//     if (!question) {
//       return res.status(400).json({ error: "Question is required" });
//     }

//     const response = await fetch(
//   "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=" +
//     process.env.GEMINI_API_KEY,
//   {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       contents: [
//         {
//           parts: [{ text: question }]
//         }
//       ]
//     })
//   }
// );

// const data = await response.json();
// console.log("🔍 Gemini raw response:", JSON.stringify(data, null, 2));

// const answer =
//   data?.candidates?.[0]?.content?.parts?.[0]?.text ||
//   "No response from AI";

// res.json({ answer });


//   } catch (error) {
//     console.error("❌ Gemini Error:", error);
//     res.status(500).json({ error: "AI failed to respond" });
//   }
// });

// export default router;



// import express from "express";
// import fetch from "node-fetch";
// import Chat from "../models/Chat.js";

// const router = express.Router();

// // AI Route (Handles Chat Queries)
// router.post("/ask", async (req, res) => {
//   try {
//     const { question, userId, userName } = req.body;

//     if (!question) return res.status(400).json({ error: "Question required" });

//     console.log("📩 Received Query:", question);

//     const response = await fetch(
//   "https://openrouter.ai/api/v1/chat/completions", {
//     method: "POST",
//     headers: {
//       "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
//       "Content-Type": "application/json"
//     },
//     body: JSON.stringify({
//       model: "meta-llama/llama-3-70b-instruct",
//       messages: [
//         { role: "system", content: "You are a helpful study assistant." },
//         { role: "user", content: question }
//       ]
//     })
//   }
// );


//     const data = await response.json();
//     console.log("🤖 OpenRouter AI Response:", data);

//     const answer =
//       data?.choices?.[0]?.message?.content ||
//       "AI couldn't provide a proper response.";

//     // 🗄️ Save to DB if logged in
//     if (userId) {
//       await Chat.create({
//         userId,
//         userName: userName || "User",
//         question,
//         answer
//       });
//     }

//     return res.json({ answer });

//   } catch (error) {
//     console.error("AI Error ❌", error);
//     return res.status(500).json({ error: "AI request failed" });
//   }
// });

// export default router;



// backend/routes/aiRoutes.js



// import express from "express";
// import Chat from "../models/Chat.js";
// import fetch from "node-fetch"; // or global fetch if available

// const router = express.Router();

// /*
//   NOTE: In production, validate Firebase ID token (Authorization header)
//   and extract userId on server-side. Here we accept userId from the request
//   for simplicity (dev).
// */

// // Create a new chat (POST /api/chats)
// router.post("/chats", async (req, res) => {
//   try {
//     const { userId, title } = req.body;
//     if (!userId) return res.status(400).json({ error: "userId required" });

//     const chat = await Chat.create({
//       userId,
//       title: title || "New Chat",
//       messages: [],
//     });

//     return res.json(chat);
//   } catch (err) {
//     console.error("Create chat error", err);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// });

// // Get chats for a user (GET /api/chats?userId=...)
// router.get("/chats", async (req, res) => {
//   try {
//     const { userId } = req.query;
//     if (!userId) return res.status(400).json({ error: "userId required" });

//     const chats = await Chat.find({ userId }).sort({ updatedAt: -1 }).lean();
//     return res.json(chats);
//   } catch (err) {
//     console.error("List chats error", err);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// });

// // Get single chat (GET /api/chats/:id)
// router.get("/chats/:id", async (req, res) => {
//   try {
//     const chat = await Chat.findById(req.params.id).lean();
//     if (!chat) return res.status(404).json({ error: "Not found" });
//     return res.json(chat);
//   } catch (err) {
//     console.error("Get chat error", err);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// });

// // Delete chat (DELETE /api/chats/:id)
// router.delete("/chats/:id", async (req, res) => {
//   try {
//     await Chat.findByIdAndDelete(req.params.id);
//     return res.json({ ok: true });
//   } catch (err) {
//     console.error("Delete chat error", err);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// });

// /*
//   ASK endpoint: receives { question, userId, userName, chatId? }
//   - If chatId provided -> append messages to that chat
//   - Else -> create a new chat with messages
//   - Call AI provider (your existing logic) and save AI reply
// */
// router.post("/ask", async (req, res) => {
//   try {
//     const { question, userId, userName, chatId } = req.body;
//     if (!question) return res.status(400).json({ error: "Question required" });

//     // Minimal validation
//     if (!userId) return res.status(400).json({ error: "userId required" });

//     // Append user message (create chat if needed)
//     let chat = null;
//     if (chatId) {
//       chat = await Chat.findById(chatId);
//     }
//     if (!chat) {
//       chat = await Chat.create({
//         userId,
//         title: question.length > 40 ? question.slice(0, 40) + "..." : question,
//         messages: [],
//       });
//     }

//     const userMessage = { role: "user", text: question, time: new Date() };
//     chat.messages.push(userMessage);
//     await chat.save();

//     // --- Call AI provider here ---
//     // Replace with your existing AI integration. Example stub:
//     // const aiAnswer = `You asked: "${question}". AI response will be integrated here soon.`;

//     // Example: if you already make a fetch call to Gemini / OpenRouter etc,
//     // put that call here and set aiAnswer to the returned text.

//     // Below is a placeholder which you should replace with your current AI call:
//     let aiAnswer = "AI is thinking...";

//     try {
//       // Example call: replace URL, headers, body according to your provider
//       const aiResp = await fetch("http://localhost:5000/local-ai-stub", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ prompt: question }),
//       });
//       const aiJson = await aiResp.json();
//       aiAnswer = aiJson.answer || aiAnswer;
//     } catch (aiErr) {
//       // If AI provider fails, fallback text
//       console.warn("AI provider call failed", aiErr);
//       aiAnswer = `You asked: "${question}". AI response will be integrated here soon.`;
//     }

//     const aiMessage = { role: "ai", text: aiAnswer, time: new Date() };
//     chat.messages.push(aiMessage);
//     await chat.save();

//     // Return the updated chat and the aiAnswer
//     return res.json({ chat, answer: aiAnswer });
//   } catch (err) {
//     console.error("Ask route error:", err);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// });

// export default router;



// backend/routes/aiRoutes.js



// import express from "express";
// import Chat from "../models/Chat.js";
// import mongoose from "mongoose";
// // Use global fetch if available (Node 18+). If not, try to import node-fetch.
// let fetchFn = globalThis.fetch;
// if (!fetchFn) {
//   try {
//     // dynamic import to avoid crash if node-fetch not installed
//     // If you prefer static import, install node-fetch and use: import fetch from 'node-fetch'
//     const mod = await import("node-fetch");
//     fetchFn = mod.default;
//   } catch (e) {
//     // fetchFn remains undefined — we'll handle that below
//     fetchFn = undefined;
//   }
// }

// const router = express.Router();

// /*
//   NOTE:
//   - In production, validate the user's Firebase ID token on the server and extract userId from it.
//   - For dev convenience we accept userId from the request body (but this is NOT secure).
// */

// /**
//  * Create a new chat
//  * POST /api/chats
//  * body: { userId, title? }
//  */
// router.post("/chats", async (req, res) => {
//   try {
//     const { userId, title } = req.body;
//     if (!userId) return res.status(400).json({ error: "userId required" });

//     const chat = await Chat.create({
//       userId,
//       title: title || "New Chat",
//       messages: [],
//     });

//     return res.json(chat);
//   } catch (err) {
//     console.error("Create chat error", err);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// });

// /**
//  * List chats for a user
//  * GET /api/chats?userId=...
//  */
// router.get("/chats", async (req, res) => {
//   try {
//     const { userId } = req.query;
//     if (!userId) return res.status(400).json({ error: "userId required" });

//     const chats = await Chat.find({ userId }).sort({ updatedAt: -1 }).lean();
//     return res.json(chats);
//   } catch (err) {
//     console.error("List chats error", err);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// });

// /**
//  * Get single chat
//  * GET /api/chats/:id
//  */
// router.get("/chats/:id", async (req, res) => {
//   try {
//     const chat = await Chat.findById(req.params.id).lean();
//     if (!chat) return res.status(404).json({ error: "Not found" });
//     return res.json(chat);
//   } catch (err) {
//     console.error("Get chat error", err);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// });

// /**
//  * Delete chat
//  * DELETE /api/chats/:id
//  */
// router.delete("/chats/:id", async (req, res) => {
//   try {
//     await Chat.findByIdAndDelete(req.params.id);
//     return res.json({ ok: true });
//   } catch (err) {
//     console.error("Delete chat error", err);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// });

// /*
//   ASK endpoint:
//   POST /api/ask
//   body: { question, userId, userName?, chatId? }

//   Behavior:
//   - require question and userId
//   - if chatId provided -> append messages to that chat
//   - else -> create new chat with title derived from question
//   - call AI provider (env-configurable) and save AI reply to the chat
// */
// router.post("/ask", async (req, res) => {
//   try {
//     const { question, userId, userName, chatId } = req.body;

//     if (!question) return res.status(400).json({ error: "Question required" });
//     if (!userId) return res.status(400).json({ error: "userId required" });

//     // find or create chat
//     let chat = null;
//     if (chatId) {
//       if (chatId && mongoose.isValidObjectId(chatId)) {
//     chat = await Chat.findById(chatId);
// }
//     }
//     if (!chat) {
//       const title =
//         typeof question === "string"
//           ? question.trim().slice(0, 60) + (question.length > 60 ? "..." : "")
//           : "New Chat";
//       chat = await Chat.create({
//         userId,
//         title,
//         messages: [],
//       });
//     }

//     // append user message (locally)
//     const userMessage = { role: "user", text: question, time: new Date() };
//     chat.messages.push(userMessage);

//     // Call the AI provider. Use env var AI_PROVIDER_URL to configure.
//     // Expected behavior: POST JSON -> { answer: "..." } or provider-specific parsing needed.
//     const providerUrl = process.env.AI_PROVIDER_URL || ""; // set this in .env for real provider
//     let aiAnswer = `You asked: "${question}". AI response will be integrated here soon.`;

//     if (providerUrl && fetchFn) {
//       try {
//         // Example default payload - replace with what your provider expects
//         const providerReq = {
//           prompt: question,
//           userId,
//           userName,
//         };

//         const aiResp = await fetchFn(providerUrl, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(providerReq),
//         });

//         // provider may return non-JSON on error - guard parse
//         const aiJson = await aiResp.json().catch(() => null);

//         // Try a few common shapes:
//         if (aiJson) {
//           // common shape: { answer: "..." }
//           if (aiJson.answer) aiAnswer = aiJson.answer;
//           // openrouter / some providers: { output: [{ content: "..." }] } or other - check your provider
//           else if (aiJson.output && Array.isArray(aiJson.output) && aiJson.output[0]) {
//             // try a reasonable extraction
//             aiAnswer =
//               aiJson.output[0].content ||
//               aiJson.output[0].text ||
//               aiJson.output[0].message ||
//               JSON.stringify(aiJson.output[0]);
//           } else if (aiJson.result || aiJson.text) {
//             aiAnswer = aiJson.result || aiJson.text;
//           } else {
//             // fallback stringify small object for debugging
//             aiAnswer = (typeof aiJson === "string") ? aiJson : JSON.stringify(aiJson).slice(0, 200);
//           }
//         } else {
//           console.warn("AI provider returned non-json or empty");
//         }
//       } catch (providerErr) {
//         console.warn("AI provider call failed:", providerErr);
//         // keep fallback aiAnswer
//       }
//     } else {
//       // No provider configured or fetch not available — keep fallback aiAnswer
//     }

//     // append ai message and save once
//     const aiMessage = { role: "ai", text: aiAnswer, time: new Date() };
//     chat.messages.push(aiMessage);

//     await chat.save();

//     // return updated chat and answer
//     return res.json({ chat, answer: aiAnswer });
//   } catch (err) {
//     console.error("Ask route error:", err);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// });

// export default router;




// import express from "express";
// import Chat from "../models/Chat.js";
// import dotenv from "dotenv";
// import fetch from "node-fetch";
// import mongoose from "mongoose";

// dotenv.config();

// const router = express.Router();

// // MODEL YOU WANT TO USE
// const MODEL = "meta-llama/llama-3-70b-instruct";

// router.post("/ask", async (req, res) => {
//   try {
//     const { question, userId, chatId } = req.body;

//     if (!question || !question.trim()) {
//       return res.status(400).json({ error: "Question required" });
//     }
//     if (!userId) {
//       return res.status(400).json({ error: "userId required" });
//     }

//     console.log("📩 Incoming:", question);

//     // 🟦 Load or create chat
//     let chat = null;

//     if (chatId && mongoose.isValidObjectId(chatId)) {
//       chat = await Chat.findById(chatId);
//     }

//     if (!chat) {
//       chat = await Chat.create({
//         userId,
//         title: question.slice(0, 50),
//         messages: []
//       });
//     }

//     // Save user message
//     chat.messages.push({
//       role: "user",
//       text: question
//     });

//     // 🧠 CALL OPENROUTER
//     const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify({
//         model: MODEL,
//         messages: [
//           {
//             role: "system",
//             content: "You are StudyAI, a friendly college study assistant."
//           },
//           {
//             role: "user",
//             content: question
//           }
//         ]
//       })
//     });

//     const data = await aiRes.json();
//     console.log("🤖 AI RAW:", data);

//     if (data.error) {
//       return res.status(500).json({ error: data.error.message });
//     }

//     const aiAnswer =
//       data?.choices?.[0]?.message?.content ||
//       "I’m not sure. Try rephrasing your question.";

//     // Save AI message
//     chat.messages.push({
//       role: "ai",
//       text: aiAnswer
//     });

//     await chat.save();

//     return res.json({
//       answer: aiAnswer,
//       chatId: chat._id,
//       chat
//     });

//   } catch (err) {
//     console.error("🔥 Ask route error:", err);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// });

// export default router;


// backend/routes/aiRoutes.js



// import express from "express";
// import Chat from "../models/Chat.js";
// import dotenv from "dotenv";
// import mongoose from "mongoose";

// dotenv.config();

// /**
//  * IMPORTANT:
//  * - Put your OpenRouter API key in .env as OPENROUTER_API_KEY=sk-...
//  * - If you're using a different provider, replace the provider call block.
//  */

// // Optionally use global fetch (Node 18+). Fall back to dynamic import of node-fetch.
// let fetchFn = globalThis.fetch;
// if (!fetchFn) {
//   try {
//     const mod = await import("node-fetch");
//     fetchFn = mod.default;
//   } catch (e) {
//     console.warn("node-fetch not available and global fetch missing. AI calls will fail.", e);
//     fetchFn = undefined;
//   }
// }

// const router = express.Router();

// // Set to the model you want to use on OpenRouter (or your provider)
// const MODEL = process.env.OPENROUTER_MODEL || "meta-llama/llama-3-70b-instruct";

// router.post("/ask", async (req, res) => {
//   try {
//     const { question, userId, chatId } = req.body;

//     if (!question || !question.trim()) {
//       return res.status(400).json({ error: "Question required" });
//     }
//     if (!userId) {
//       return res.status(400).json({ error: "userId required" });
//     }

//     console.log("📩 Incoming question:", question);

//     // 1) find chat if chatId provided (validate objectId)
//     let chat = null;
//     if (chatId && mongoose.isValidObjectId(chatId)) {
//       chat = await Chat.findById(chatId);
//     }

//     // 2) create chat if not found
//     if (!chat) {
//       chat = await Chat.create({
//         userId,
//         title: question.trim().slice(0, 60),
//         messages: []
//       });
//     }

//     // 3) append user's message
//     const userMessage = { role: "user", text: question, time: new Date() };
//     chat.messages.push(userMessage);

//     // 4) call AI provider (OpenRouter example)
//     let aiAnswer = `You asked: "${question}". AI response will be integrated here soon.`;

//     if (!process.env.OPENROUTER_API_KEY) {
//       console.warn("OPENROUTER_API_KEY missing in .env — returning fallback response.");
//     } else if (!fetchFn) {
//       console.warn("fetch not available — cannot call AI provider.");
//     } else {
//       try {
//         const apiUrl = "https://openrouter.ai/api/v1/chat/completions";
//         const body = {
//           model: MODEL,
//           messages: [
//             {
//               role: "system",
//               content: "You are StudyAI, a friendly college study assistant. Keep replies clear and structured."
//             },
//             {
//               role: "user",
//               content: question
//             }
//           ]
//         };

//         const aiRes = await fetchFn(apiUrl, {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
//             "Content-Type": "application/json"
//           },
//           body: JSON.stringify(body)
//         });

//         // some providers return non-JSON on error; guard parse
//         const aiJson = await aiRes.json().catch(() => null);
//         console.log("🤖 AI RAW:", aiJson);

//         if (aiRes.ok && aiJson) {
//           // best-effort extraction from OpenRouter-like response
//           aiAnswer =
//             aiJson?.choices?.[0]?.message?.content ||
//             aiJson?.result ||
//             aiJson?.text ||
//             (typeof aiJson === "string" ? aiJson : JSON.stringify(aiJson).slice(0, 1000));
//         } else {
//           // Provider returned error
//           const errMsg =
//             (aiJson && aiJson.error && aiJson.error.message) ||
//             `AI provider responded with status ${aiRes.status}`;
//           console.warn("AI provider error:", errMsg);
//         }
//       } catch (aiErr) {
//         console.error("AI provider call failed:", aiErr);
//       }
//     }

//     // 5) append AI message and save chat
//     const aiMessage = { role: "ai", text: aiAnswer, time: new Date() };
//     chat.messages.push(aiMessage);
//     await chat.save();

//     // 6) return structured result for frontend
//     return res.json({
//       answer: aiAnswer,
//       chatId: chat._id,
//       chat
//     });
//   } catch (err) {
//     console.error("🔥 Ask route error:", err);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// });

// export default router;



import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import fetch from "node-fetch";
import Chat from "../models/Chat.js";

dotenv.config();

const router = express.Router();

// Model used on OpenRouter
const MODEL = "meta-llama/llama-3-70b-instruct";

// -------------------------------
// CREATE NEW CHAT
// -------------------------------
router.post("/chats", async (req, res) => {
  try {
    const { userId, title } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });

    const chat = await Chat.create({
      userId,
      title: title || "New Chat",
      messages: [],
    });

    return res.json(chat);
  } catch (err) {
    console.error("Create chat error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// -------------------------------
// GET ALL CHATS FOR USER
// -------------------------------
router.get("/chats", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId required" });

    const chats = await Chat.find({ userId }).sort({ updatedAt: -1 }).lean();
    return res.json(chats);
  } catch (err) {
    console.error("List chats error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// -------------------------------
// GET SINGLE CHAT
// -------------------------------
router.get("/chats/:id", async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id).lean();
    if (!chat) return res.status(404).json({ error: "Chat not found" });

    return res.json(chat);
  } catch (err) {
    console.error("Get chat error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// -------------------------------
// DELETE CHAT
// -------------------------------
router.delete("/chats/:id", async (req, res) => {
  try {
    await Chat.findByIdAndDelete(req.params.id);
    return res.json({ ok: true });
  } catch (err) {
    console.error("Delete chat error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// -------------------------------
// ASK → SAVE MESSAGE → FETCH AI → SAVE AI MESSAGE
// -------------------------------
router.post("/ask", async (req, res) => {
  try {
    const { question, userId, chatId } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: "Question required" });
    }
    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }

    console.log("📩 Incoming Question:", question);

    // -----------------------------
    // LOAD OR CREATE CHAT
    // -----------------------------
    let chat = null;

    if (chatId && mongoose.isValidObjectId(chatId)) {
      chat = await Chat.findById(chatId);
    }

    if (!chat) {
      chat = await Chat.create({
        userId,
        title: question.slice(0, 50),
        messages: [],
      });
    }

    // Add USER message
    chat.messages.push({
      role: "user",
      text: question,
      time: new Date(),
    });

    // -----------------------------
    // CALL OPENROUTER AI
    // -----------------------------
    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "StudyAI",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: "You are StudyAI, a friendly assistant for college students.",
          },
          {
            role: "user",
            content: question,
          },
        ],
      }),
    });

    const data = await aiRes.json();
    console.log("🤖 OpenRouter Response:", data);

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const aiAnswer =
      data?.choices?.[0]?.message?.content ||
      "I’m not sure. Try rephrasing your question.";

    // Add AI message
    chat.messages.push({
      role: "ai",
      text: aiAnswer,
      time: new Date(),
    });

    await chat.save();

    // Send updated chat back
    return res.json({
      answer: aiAnswer,
      chatId: chat._id,
      chat,
    });
  } catch (err) {
    console.error("🔥 Ask route error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// -------------------------------
export default router;
