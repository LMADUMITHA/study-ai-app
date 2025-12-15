


// import mongoose from "mongoose";

// const ChatSchema = new mongoose.Schema({
//   userId: { type: String, required: false },      // firebase uid
//   userName: { type: String, required: false },
//   question: { type: String, required: true },
//   answer: { type: String },                       // AI reply (string)
//   createdAt: { type: Date, default: Date.now }
// });

// export default mongoose.model("Chat", ChatSchema);



// // backend/models/Chat.js
// import mongoose from "mongoose";

// const MessageSchema = new mongoose.Schema({
//   role: { type: String, enum: ["user", "ai"], required: true },
//   text: { type: String, required: true },
//   time: { type: Date, default: () => new Date() },
// });

// const ChatSchema = new mongoose.Schema({
//   userId: { type: String, required: true, index: true },
//   title: { type: String, default: "New Chat" },
//   createdAt: { type: Date, default: () => new Date() },
//   updatedAt: { type: Date, default: () => new Date() },
//   messages: [MessageSchema],
// });

// ChatSchema.pre("save", function () {
//   this.updatedAt = new Date();
// });


// export default mongoose.model("Chat", ChatSchema);



import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "ai"], required: true },
  text: { type: String, required: true },
  time: { type: Date, default: () => new Date() },
});

const ChatSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, default: "New Chat" },
  messages: [MessageSchema],
  createdAt: { type: Date, default: () => new Date() },
  updatedAt: { type: Date, default: () => new Date() },
});

ChatSchema.pre("save", function () {
  this.updatedAt = new Date();
});

export default mongoose.model("Chat", ChatSchema);
