// import express from "express";
// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import cors from "cors";
// import authRoutes from "./routes/authRoutes.js";
// import askRoutes from "./routes/askRoutes.js";


// dotenv.config();
// const app = express();

// app.use(cors());
// app.use(express.json());

// // Routes
// app.use("/api/auth", authRoutes);

// const PORT = process.env.PORT || 5000;

// mongoose.connect(process.env.MONGO_URI)
//   .then(() => {
//     console.log("MongoDB Connected");
//     app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
//   })
//   .catch(err => console.log("MongoDB Error:", err));


// import express from "express";
// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import cors from "cors";
// import authRoutes from "./routes/authRoutes.js";
// import askRoutes from "./routes/askRoutes.js"; // ✅ ADD THIS

// dotenv.config();
// const app = express();

// app.use(cors());
// app.use(express.json());

// // Routes
// app.use("/api/auth", authRoutes);
// app.use("/api", askRoutes); // ✅ ADD THIS

// const PORT = process.env.PORT || 5000;

// mongoose.connect(process.env.MONGO_URI)
//   .then(() => {
//     console.log("MongoDB Connected ✅");
//     app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
//   })
//   .catch(err => console.log("MongoDB Error:", err));


// import express from "express";
// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import cors from "cors";
// import aiRoutes from "./routes/aiRoutes.js";
// import chatsRoutes from "./routes/chatsRoutes.js";
// dotenv.config();

// const app = express();

// app.use(cors());
// app.use(express.json());

// // API Route
// app.use("/api", aiRoutes);
// app.use("/api/chats", chatsRoutes);

// const PORT = process.env.PORT || 5000;

// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => {
//     console.log("✅ MongoDB Connected");
//     app.listen(PORT, () =>
//       console.log(`⚡ Server running on http://localhost:${PORT}`)
//     );
//   })
//   .catch((err) => console.error("❌ MongoDB connection error:", err));



// backend/index.js (example)


// import express from "express";
// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import cors from "cors";
// import aiRoutes from "./routes/aiRoutes.js";

// dotenv.config();

// const app = express();
// app.use(cors());
// app.use(express.json());

// // mount API
// app.use("/api", aiRoutes);

// const PORT = process.env.PORT || 5000;
// mongoose.connect(process.env.MONGO_URI)
//   .then(() => {
//     console.log("✅ MongoDB Connected");
//     app.listen(PORT, () => console.log(`✅ Backend running on http://localhost:${PORT}`));
//   })
//   .catch(err => console.error("MongoDB Error:", err));



// import dotenv from "dotenv";
// dotenv.config(); // ✅ MUST be first line

// import express from "express";
// import mongoose from "mongoose";
// import cors from "cors";

// // ✅ ONLY AFTER dotenv.config()
// import aiRoutes from "./routes/aiRoutes.js";
// import uploadRoutes from "./routes/uploadRoutes.js";
// import pdfExportRoutes from "./routes/pdfExportRoutes.js";
// import messageRoutes from "./routes/messageRoutes.js";
// import mindmapRoutes from "./routes/mindmapRoutes.js";
// import videoRoutes from "./routes/videoRoutes.js";
// import videoNarrationRoutes from "./routes/videoNarrationRoutes.js";
// import path from "path";
// const app = express();
// app.use(cors());
// app.use(express.json());

// // 🔍 TEMP DEBUG (remove later)


// app.use("/api", aiRoutes);
// app.use("/api/upload", uploadRoutes);
// app.use("/api/pdf", pdfExportRoutes);
// app.use("/api/messages", messageRoutes);
// app.use("/api", mindmapRoutes);
// app.use("/api/video", videoRoutes);
// app.use("/api/video", videoNarrationRoutes);
// app.use("/audio", express.static("public/audio"));


// const PORT = process.env.PORT || 5000;

// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => {
//     console.log("✅ MongoDB Connected");
//     app.listen(PORT, () =>
//       console.log(`✅ Backend running on http://localhost:${PORT}`)
//     );
//   })
//   .catch((err) => console.error("MongoDB Error:", err));



import dotenv from "dotenv";
dotenv.config(); // ✅ MUST be first line

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Routes
import aiRoutes from "./routes/aiRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import pdfExportRoutes from "./routes/pdfExportRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import mindmapRoutes from "./routes/mindmapRoutes.js";
import videoRoutes from "./routes/videoRoutes.js";
import videoNarrationRoutes from "./routes/videoNarrationRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
const app = express();

// ✅ ES module dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// Routes
app.use("/api", aiRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/pdf", pdfExportRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api", mindmapRoutes);
app.use("/api/video", videoRoutes);
app.use("/api/video", videoNarrationRoutes);
app.use("/api/quiz", quizRoutes);
// ✅ FIXED audio static serving
app.use(
  "/audio",
  express.static(path.join(__dirname, "public/audio"))
);

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    app.listen(PORT, () =>
      console.log(`✅ Backend running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => console.error("MongoDB Error:", err));
