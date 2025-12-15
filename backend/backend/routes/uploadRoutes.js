// import express from "express";
// import multer from "multer";
// import PDFParser from "pdf2json";

// const router = express.Router();
// const upload = multer({ storage: multer.memoryStorage() });

// // UPLOAD PDF + EXTRACT TEXT
// router.post("/upload-pdf", upload.single("pdf"), (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: "No PDF uploaded" });
//     }

//     const pdfParser = new PDFParser(null, 1);
//     const pdfData = req.file.buffer;

//     pdfParser.on("pdfParser_dataError", (err) => {
//       console.error(err.parserError);
//       res.status(500).json({ error: "Failed to read PDF" });
//     });

//     pdfParser.on("pdfParser_dataReady", (pdf) => {
//       let extractedText = "";

//       try {
//         pdf.Pages.forEach((page) => {
//           page.Texts.forEach((t) => {
//             t.R.forEach((r) => {
//               extractedText += decodeURIComponent(r.T) + " ";
//             });
//           });
//           extractedText += "\n\n";
//         });

//         res.json({ text: extractedText });

//       } catch (error) {
//         console.error("Extract error:", error);
//         res.status(500).json({ error: "Failed to extract text" });
//       }
//     });

//     pdfParser.parseBuffer(pdfData);

//   } catch (err) {
//     console.error("UPLOAD ERROR:", err);
//     res.status(500).json({ error: "Internal error" });
//   }
// });

// export default router;



// import express from "express";
// import multer from "multer";
// import * as pdfjsLib from "pdfjs-dist";
// import Chat from "../models/Chat.js";
// import fetch from "node-fetch";

// const router = express.Router();
// const upload = multer({ storage: multer.memoryStorage() });

// const MODEL = "meta-llama/llama-3-70b-instruct";

// // Required for Node
// pdfjsLib.GlobalWorkerOptions.workerSrc =
//   "node_modules/pdfjs-dist/build/pdf.worker.js";

// router.post("/pdf", upload.single("pdf"), async (req, res) => {
//   try {
//     const { chatId } = req.body;

//     if (!req.file) return res.status(400).json({ error: "No PDF uploaded" });
//     if (!chatId) return res.status(400).json({ error: "chatId missing" });

//     console.log("📄 PDF received:", req.file.originalname);

//     const pdfData = new Uint8Array(req.file.buffer);
//     const loadingTask = pdfjsLib.getDocument({ data: pdfData });

//     const pdf = await loadingTask.promise;

//     let extracted = "";
//     for (let i = 1; i <= pdf.numPages; i++) {
//       const page = await pdf.getPage(i);
//       const content = await page.getTextContent();
//       extracted += content.items.map((t) => t.str).join(" ") + "\n";
//     }

//     console.log("📘 Extracted text length:", extracted.length);

//     // --- AI Simplified Explanation ---
//     const prompt = `
// Explain this PDF clearly and very simply.
// Break it into:

// 1) Short Summary  
// 2) Key Points  
// 3) Important Definitions  
// 4) Simple explanation like teaching a beginner  
// 5) Real-life examples  

// PDF CONTENT:
// ${extracted}
//     `;

//     const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         model: MODEL,
//         messages: [
//           { role: "system", content: "You simplify notes clearly like a tutor." },
//           { role: "user", content: prompt },
//         ],
//       }),
//     });

//     const data = await aiRes.json();
//     const explanation =
//       data?.choices?.[0]?.message?.content ||
//       "Unable to summarize PDF.";

//     // --- SAVE AI explanation inside chat ---
//     const chat = await Chat.findById(chatId);
//     chat.messages.push({
//       role: "ai",
//       text: explanation,
//       time: new Date(),
//     });

//     await chat.save();

//     res.json({
//       explanation,
//       chat,
//     });
//   } catch (err) {
//     console.error("🔥 PDF error:", err);
//     res.status(500).json({ error: "Failed to extract PDF" });
//   }
// });

// export default router;



// backend/backend/routes/uploadRoutes.js

import express from "express";
import multer from "multer";
import pdf from "pdf-parse";
import fetch from "node-fetch";
import Chat from "../models/Chat.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const MODEL = "meta-llama/llama-3-70b-instruct";

// -------------------------------------------------------------
// PDF UPLOAD + EXTRACT + SAVE TO CHAT
// -------------------------------------------------------------
router.post("/pdf", upload.single("pdf"), async (req, res) => {
  try {
    const { userId, chatId } = req.body;

    if (!req.file) return res.status(400).json({ error: "No PDF uploaded" });

    // Extract text
    const dataBuffer = req.file.buffer;
    const pdfExtract = await pdf(dataBuffer);
    const extractedText = pdfExtract.text;

    // AI prompt
    const prompt = `
You are a friendly tutor.

Summarize this PDF clearly for a college student:
1. Summary
2. Key Points
3. Definitions
4. Easy Explanation  
5. Real Examples

CONTENT:
${extractedText}
    `;

    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: "You explain concepts simply." },
          { role: "user", content: prompt }
        ]
      })
    });

    const aiData = await aiRes.json();
    const explanation =
      aiData?.choices?.[0]?.message?.content ||
      "Could not extract explanation.";

    // -------------------------
    // SAVE INTO CHAT MESSAGES
    // -------------------------
    let chat;

    if (chatId) {
      // append into existing chat
      chat = await Chat.findById(chatId);
      chat.messages.push({
        role: "ai",
        text: explanation,
        time: new Date()
      });
      await chat.save();
    } else {
      // create a new chat
      chat = await Chat.create({
        userId,
        title: req.file.originalname,
        messages: [
          {
            role: "ai",
            text: explanation,
            time: new Date()
          }
        ]
      });
    }

    return res.json({
      message: "PDF processed successfully",
      explanation,
      chat
    });

  } catch (err) {
    console.error("PDF Upload Error:", err);
    return res.status(500).json({ error: "Failed to process PDF" });
  }
});

export default router;
