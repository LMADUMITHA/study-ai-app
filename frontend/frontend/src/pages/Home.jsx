import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ArrowUp,
  ChevronDown,
  Trash2,
  Upload,
  FileText,
} from "lucide-react";
import { auth, googleProvider } from "../firebase";
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import MindmapCanvas from "../components/Mindmap/MindmapCanvas";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";



/*
  Full-featured Home.jsx for StudyAI
  - Explore landing (center card with image + single search)
  - Left: chat history
  - Right: tools (Upload PDF with progress modal, Mindmap, Video, Export)
  - Chat area appears after sending a question (or selecting a chat)
  - AI typing indicator + simple bullet formatting
*/

const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

function formatTime(t) {
  try {
    return new Date(t).toLocaleTimeString();
  } catch {
    return new Date().toLocaleTimeString();
  }
}

// very small markdown-ish renderer: bullets and paragraphs
function RenderedMessage({ text }) {
  if (!text) return null;
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  // detect bullet block: lines starting with -, *, or numeric "1." etc.
  const groups = [];
  let current = { type: "para", lines: [] };

  const isBullet = (l) =>
    /^(-|\*|\u2022|\d+\.)\s+/.test(l) || /^\s*[-\u2022*]\s+/.test(l);

  for (let ln of lines) {
    if (ln === "") {
      if (current.lines.length) {
        groups.push(current);
        current = { type: "para", lines: [] };
      }
      continue;
    }
    if (isBullet(ln)) {
      // bullet content without leading marker
      const content = ln.replace(/^(-|\*|\u2022|\d+\.)\s+/, "").trim();
      if (current.type !== "ul") {
        if (current.lines.length) groups.push(current);
        current = { type: "ul", lines: [content] };
      } else {
        current.lines.push(content);
      }
    } else {
      if (current.type !== "para") {
        if (current.lines.length) groups.push(current);
        current = { type: "para", lines: [ln] };
      } else {
        current.lines.push(ln);
      }
    }
  }
  if (current.lines.length) groups.push(current);

  return (
    <div className="text-sm leading-relaxed">
      {groups.map((g, idx) =>
        g.type === "ul" ? (
          <ul key={idx} className="list-disc ml-5 mb-3">
            {g.lines.map((li, i) => (
              <li key={i} className="mb-1">
                {li}
              </li>
            ))}
          </ul>
        ) : (
          <p key={idx} className="mb-3">
            {g.lines.join(" ")}
          </p>
        )
      )}
    </div>
  );
}

const ChatBubble = ({ m }) => {
  const isUser = m.role === "user";
  return (
    <div
      className={`max-w-[80%] py-3 px-4 rounded-xl ${
        isUser ? "self-end bg-orange-500 text-white" : "self-start bg-white text-gray-900"
      }`}
    >
      {isUser ? (
        <div className="text-sm whitespace-pre-wrap">{m.text}</div>
      ) : (
        <RenderedMessage text={m.text} />
      )}
      <div className="text-xs mt-2 opacity-60 text-right">{formatTime(m.time)}</div>
    </div>
  );
};

const getVideoBackground = (sceneText) => {
  const text = sceneText.toLowerCase();

  if (text.includes("jvm")) return "/video-bg/jvm-intro.jpg";
  if (text.includes("class loader")) return "/video-bg/class-loader.jpg";
  if (text.includes("memory") || text.includes("heap")) return "/video-bg/memory.jpg";
  if (text.includes("execution")) return "/video-bg/execution.jpg";

  return "/video-bg/default.jpg";
};


export default function Home() {
  // view toggles
  const [explore, setExplore] = useState(false); // show homepage first
  const [user, setUser] = useState(null);
  const [openMenu, setOpenMenu] = useState(false);
  const dropdownRef = useRef(null);

  // chats + state
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);


  const mindmapRef = useRef(null);
  const audioRef = useRef(null);



  // UI inputs
  const [query, setQuery] = useState(""); // bottom input in chat
  const [exploreQuery, setExploreQuery] = useState(""); // central search in Explore
  const chatScrollRef = useRef(null);

    // Mindmap modal state
const [showMindmap, setShowMindmap] = useState(false);
const [mindmapInput, setMindmapInput] = useState("");
const [mindmapResult, setMindmapResult] = useState(null);
const [fullPreview, setFullPreview] = useState(false);

  // file upload + progress
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);



// Video modal state
// Video modal + generation state
const [showVideoModal, setShowVideoModal] = useState(false);
const [videoInput, setVideoInput] = useState("");
const [videoResult, setVideoResult] = useState(null);
const [videoLoading, setVideoLoading] = useState(false);
// const [videoScript, setVideoScript] = useState(null);
const [showVideoPreview, setShowVideoPreview] = useState(false);
// Practice Quiz modal
const [showQuizModal, setShowQuizModal] = useState(false);

// Practice Quiz states
const [quizTopic, setQuizTopic] = useState("");
const [quizContent, setQuizContent] = useState("");
const [quizQuestions, setQuizQuestions] = useState([]);
const [quizLoading, setQuizLoading] = useState(false);

const [currentQuestion, setCurrentQuestion] = useState(0);
const [userAnswers, setUserAnswers] = useState({});


const [quizStarted, setQuizStarted] = useState(false);
const [quizFinished, setQuizFinished] = useState(false);
const [showUploadModal, setShowUploadModal] = useState(false);
const [isDragging, setIsDragging] = useState(false);
const isMindmapReady = Boolean(mindmapResult);



   const handleOpenMindmap = () => {
    setMindmapInput("");
    setMindmapResult(null);
    setShowMindmap(true);
  };

  const handleGenerateMindmap = async () => {
  if (!mindmapInput.trim()) {
    alert("Please enter a topic or content");
    return;
  }

  try {
    setMindmapResult(null);

    const res = await fetch("http://localhost:5000/api/mindmap", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: mindmapInput,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to generate mindmap");
    }

    setMindmapResult(data.mindmap);

  } catch (err) {
    console.error("Mindmap error:", err);
    alert("Mindmap generation failed");
  }
};

const handleGenerateQuiz = async () => {
  if (!quizTopic.trim() && !quizContent.trim()) {
    alert("Please enter a topic or paste content");
    return;
  }

  try {
    setQuizLoading(true);
    console.log("Generating quiz...");

    const res = await fetch("http://localhost:5000/api/quiz/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: quizTopic,
        content: quizContent,
        count: 5,
      }),
    });

    const data = await res.json();
    console.log("Quiz received:", data);

    if (!res.ok) throw new Error(data.error);

    // ✅ Store quiz
    setQuizQuestions(data.quiz);

    // ✅ Reset quiz progress
    setCurrentQuestion(0);
    setUserAnswers({});

    // ✅ Control quiz UI flow
    setQuizStarted(true);
    setQuizFinished(false);
  } catch (err) {
    console.error("Quiz generation failed:", err);
    alert("Quiz generation failed");
  } finally {
    setQuizLoading(false);
  }
};




  const handleCloseMindmap = () => {
  setShowMindmap(false);
  setMindmapInput("");
  setMindmapResult(null);
};


  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) loadChats(u.uid);
      else {
        setChats([]);
        setCurrentChat(null);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpenMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!chatScrollRef.current) return;
    chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight + 200;
  }, [currentChat, loadingAi, chats]);

  const handleLogin = async () => {
    try {
      googleProvider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("login err", err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setChats([]);
      setCurrentChat(null);
    } catch (err) {
      console.error("logout err", err);
    }
  };

  // load chats for user
  const loadChats = async (userId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/chats?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setChats(data);
      } else {
        setChats([]);
      }
    } catch (err) {
      console.error("loadChats error", err);
    }
  };

  // create new chat
  const handleNewChat = async () => {
    if (!user) {
      await handleLogin();
      if (!auth.currentUser) return;
    }
    try {
      const res = await fetch("http://localhost:5000/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: auth.currentUser.uid, title: "New Chat" }),
      });
      const chat = await res.json();
      setChats((s) => [chat, ...s]);
      setCurrentChat(chat);
      setExplore(false);
    } catch (err) {
      console.error("create chat err", err);
    }
  };

  // delete chat
  const handleDeleteChat = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/chats/${id}`, { method: "DELETE" });
      setChats((s) => s.filter((c) => c._id !== id));
      if (currentChat?._id === id) setCurrentChat(null);
    } catch (err) {
      console.error("delete chat err", err);
    }
  };

  // select chat
  const handleSelectChat = async (chat) => {
    try {
      const res = await fetch(`http://localhost:5000/api/chats/${chat._id}`);
      if (res.ok) {
        const fresh = await res.json();
        setCurrentChat(fresh);
        setExplore(false);
        return;
      }
    } catch (err) {
      console.warn("fetch chat failed, using local", err);
    }
    setCurrentChat(chat);
    setExplore(false);
  };

  // helper to update chat list with a saved chat
  const upsertChat = (chat) => {
    setChats((s) => {
      const found = s.find((c) => c._id === chat._id);
      if (found) return s.map((c) => (c._id === chat._id ? chat : c));
      return [chat, ...s];
    });
    setCurrentChat(chat);
  };

  // ASK AI (from chat bottom input)
  const handleSend = async () => {
    const text = query.trim();
    if (!text) return;
    if (!auth.currentUser) {
      await handleLogin();
      if (!auth.currentUser) return;
    }

    setQuery("");
    setLoadingAi(true);

    // build payload
    const payload = {
      question: text,
      userId: auth.currentUser.uid,
      userName: auth.currentUser.displayName || auth.currentUser.email,
      chatId: currentChat?._id,
    };

    // optimistic UI: append user message locally
    const userMsg = { role: "user", text, time: new Date().toISOString(), id: uid() };
    const localChat = {
      ...(currentChat || { _id: "tmp-" + uid(), title: text.slice(0, 40) }),
      messages: [...(currentChat?.messages || []), userMsg],
    };
    setCurrentChat(localChat);
    setChats((s) => s.map((c) => (c._id === localChat._id ? localChat : c)));

    try {
      const res = await fetch("http://localhost:5000/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json?.chat) {
        upsertChat(json.chat);
      } else {
        // fallback: append AI answer locally
        const aiMsg = { role: "ai", text: json?.answer || "No answer", time: new Date().toISOString(), id: uid() };
        const updated = { ...localChat, messages: [...(localChat.messages || []), aiMsg] };
        setCurrentChat(updated);
        setChats((s) => s.map((c) => (c._id === updated._id ? updated : c)));
      }
    } catch (err) {
      console.error("ask error", err);
      const aiMsg = { role: "ai", text: "Sorry — something went wrong.", time: new Date().toISOString(), id: uid() };
      const updated = { ...localChat, messages: [...(localChat.messages || []), aiMsg] };
      setCurrentChat(updated);
      setChats((s) => s.map((c) => (c._id === updated._id ? updated : c)));
    } finally {
      setLoadingAi(false);
      // ensure we are in chat view
      setExplore(false);
    }
  };

  // SEND from Explore search bar: open chat automatically
  const handleExploreSend = async () => {
    const text = exploreQuery.trim();
    if (!text) return;
    if (!auth.currentUser) {
      await handleLogin();
      if (!auth.currentUser) return;
    }

    setExploreQuery("");
    setLoadingAi(true);

    const payload = {
      question: text,
      userId: auth.currentUser.uid,
      userName: auth.currentUser.displayName || auth.currentUser.email,
      chatId: null, // create a new chat by default from Explore
    };

    // optimistic local chat creation
    const userMsg = { role: "user", text, time: new Date().toISOString(), id: uid() };
    const localChat = { _id: "tmp-" + uid(), title: text.slice(0, 40), messages: [userMsg] };
    setCurrentChat(localChat);
    setChats((s) => [localChat, ...s]);

    try {
      const res = await fetch("http://localhost:5000/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json?.chat) {
        upsertChat(json.chat);
      } else {
        const aiMsg = { role: "ai", text: json?.answer || "No answer", time: new Date().toISOString(), id: uid() };
        const updated = { ...localChat, messages: [...localChat.messages, aiMsg] };
        setCurrentChat(updated);
        setChats((s) => s.map((c) => (c._id === updated._id ? updated : c)));
      }
    } catch (err) {
      console.error("explore ask err", err);
    } finally {
      setLoadingAi(false);
      setExplore(false); // switch to chat view after sending
    }
  };

  // Export chat as PDF (server returns blob)
  const handleExportChatPDF = async () => {
    if (!currentChat?.messages?.length) return alert("No content to export.");
    const textContent = currentChat.messages
      .map((m) => `${m.role === "user" ? "You" : "AI"}:\n${m.text}\n\n`)
      .join("");
    try {
      const res = await fetch("http://localhost:5000/api/pdf/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: textContent, title: currentChat.title || "notes" }),
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(currentChat.title || "notes").replace(/\s+/g, "-")}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("export pdf err", err);
      alert("Export failed.");
    }
  };
  
const handleGenerateVideo = async () => {
  if (!videoInput.trim()) {
    alert("Please enter content for video generation");
    return;
  }

  try {
    setVideoLoading(true);
    setVideoResult(null);

    const res = await fetch("http://localhost:5000/api/video/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: videoInput }),
    });

    if (!res.ok) {
      throw new Error("Video generation failed");
    }

    const data = await res.json();

    console.log("🎬 Video scenes received:", data);

    // ✅ IMPORTANT
    setVideoResult(data);

  } catch (err) {
    console.error("❌ Video generation error:", err);
    alert("Video generation failed");
  } finally {
    setVideoLoading(false);
  }
};

const handleAutoNarration = async (sceneText, sceneIndex) => {
  try {
    const res = await fetch("http://localhost:5000/api/video/narrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: sceneText,
        sceneIndex,
      }),
    });

    if (!res.ok) throw new Error("Narration failed");

    const data = await res.json();

    // ✅ inject audioUrl into correct scene
    setVideoResult((prev) => {
      const updatedScenes = [...prev.scenes];
      updatedScenes[sceneIndex] = {
        ...updatedScenes[sceneIndex],
        audioUrl: data.audioUrl,
      };
      return { ...prev, scenes: updatedScenes };
    });
  } catch (err) {
    console.error("Auto narration error:", err);
  }
};




const handleGenerateNarration = async (sceneText, index) => {
  try {
    const res = await fetch("http://localhost:5000/api/video/narrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: sceneText,
        sceneIndex: index, // ✅ FIXED
      }),
    });

    const data = await res.json();

    setVideoResult((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s, i) =>
        i === index ? { ...s, audioUrl: data.audioUrl } : s
      ),
    }));
  } catch (err) {
    console.error("Narration error:", err);
    alert("Audio generation failed");
  }
};


  const handleExportMindmapPNG = async () => {
  if (!mindmapRef.current) {
    alert("Mindmap not ready");
    return;
  }

  try {
    const dataUrl = await toPng(mindmapRef.current, {
      cacheBust: true,
      pixelRatio: 2, // HIGH quality
      backgroundColor: "#ffffff",
    });

    const link = document.createElement("a");
    link.download = `${mindmapResult.title || "mindmap"}.png`;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error("PNG export failed", err);
    alert("Failed to export PNG");
  }
};



const handleExportMindmapPDF = async () => {
  if (!mindmapRef.current) {
    alert("Mindmap not ready");
    return;
  }

  try {
    const dataUrl = await toPng(mindmapRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    });

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: "a4",
    });

    const imgProps = pdf.getImageProperties(dataUrl);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight =
      (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(
      dataUrl,
      "PNG",
      0,
      0,
      pdfWidth,
      pdfHeight
    );

    pdf.save(`${mindmapResult.title || "mindmap"}.pdf`);
  } catch (err) {
    console.error("PDF export failed", err);
    alert("Failed to export PDF");
  }
};

const handleSlideChange = async (swiper) => {
  const index = swiper.activeIndex;
  const scene = videoResult.scenes[index];

  if (!scene.audioUrl) {
    await handleGenerateNarration(scene.text, index);
  }
};





  // PDF upload with progress (XMLHttpRequest for progress events)
  const handlePDFUpload = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (!auth.currentUser) {
    await handleLogin();
    if (!auth.currentUser) return;
  }

  const formData = new FormData();
  formData.append("pdf", file);
  formData.append("userId", auth.currentUser.uid);
  if (currentChat?._id) formData.append("chatId", currentChat._id);

  setUploading(true);
  setUploadProgress(0);

  const xhr = new XMLHttpRequest();
  xhr.open("POST", "http://localhost:5000/api/upload/pdf", true);

  xhr.upload.onprogress = function (event) {
    if (event.lengthComputable) {
      const percent = Math.round((event.loaded / event.total) * 100);
      setUploadProgress(percent);
    }
  };

  xhr.onload = function () {
    setUploading(false);
    setUploadProgress(100);
    try {
      const json = JSON.parse(xhr.responseText);
      if (json?.chat) {
        upsertChat(json.chat);
        setExplore(false);
      } else if (json?.explanation) {
        const aiMessage = {
          role: "ai",
          text: json.explanation,
          time: new Date().toISOString(),
          id: uid(),
        };

        if (currentChat) {
          const updated = {
            ...currentChat,
            messages: [...(currentChat.messages || []), aiMessage],
          };
          upsertChat(updated);
        } else {
          const tmp = {
            _id: "tmp-" + uid(),
            title: file.name,
            messages: [aiMessage],
          };
          setChats((s) => [tmp, ...s]);
          setCurrentChat(tmp);
        }
        setExplore(false);
      } else {
        alert("Upload succeeded but no explanation returned.");
      }
    } catch (err) {
      console.error("parse upload response", err);
      alert("Upload completed but server returned invalid JSON.");
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  xhr.onerror = function () {
    setUploading(false);
    setUploadProgress(0);
    alert("Upload failed.");
  };

  xhr.send(formData);
};

/* ✅ PASTE handlePDFDrop EXACTLY HERE ⬇️ */

const handlePDFDrop = async (e) => {
  e.preventDefault();
  e.stopPropagation();
  setIsDragging(false);

  const file = e.dataTransfer.files?.[0];
  if (!file) return;

  if (file.type !== "application/pdf") {
    alert("Please upload a PDF file only");
    return;
  }

  // reuse your existing upload logic
  const fakeEvent = {
    target: { files: [file] },
  };

  await handlePDFUpload(fakeEvent);
  setShowUploadModal(false);
};



/* ❌ NOTHING AFTER THIS EXCEPT OTHER HANDLERS */

const userNameShort =
  user?.displayName?.split?.(" ")[0] ||
  user?.email?.split?.("@")[0] ||
  "You";

  return (
    <div className="relative min-h-screen bg-[#f7d38a] text-gray-900">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 w-full bg-white shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-extrabold text-orange-600">StudyAI</h2>

          <ul className="flex gap-8 font-semibold">
            <li>Home</li>
            <li>Subjects</li>
            <li>Notes</li>
            <li>PYQs</li>
          </ul>

          {!user ? (
            <button onClick={handleLogin} className="px-5 py-2 rounded-full bg-orange-500 text-white">
              Login
            </button>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setOpenMenu(!openMenu)} className="flex items-center gap-2 font-semibold">
                Hi {userNameShort} 👋 <ChevronDown size={18} />
              </button>
              {openMenu && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute right-0 mt-3 w-40 bg-white rounded-lg shadow-md overflow-hidden">
                  <button onClick={handleLogout} className="w-full px-4 py-3 text-left hover:bg-gray-100">Logout</button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </nav>

      <AnimatePresence mode="wait">
        {/* HOMEPAGE (initial) */}
        {!explore && !currentChat && (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-screen max-w-7xl mx-auto flex items-center px-12 pt-24">
            <div className="w-1/2 space-y-6">
              <h1 className="text-[4rem] font-extrabold leading-tight">Learn Smarter with <span className="text-orange-600">AI</span></h1>
              <p className="text-gray-700 text-lg">Notes, explanations and PYQs powered by intelligence.</p>
              <div className="flex items-center gap-4">
                <button onClick={() => setExplore(true)} className="px-8 py-3 rounded-full bg-gray-900 text-white hover:scale-105 transition">Explore StudyAI →</button>
                <button onClick={handleNewChat} className="px-6 py-3 rounded-full border">Quick New Chat</button>
              </div>
            </div>

            <div className="w-1/2 flex justify-center">
              <img src="/study-doodle.png" alt="study" className="w-[520px] animate-float" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Explore / Chat layout (when explore true OR a chat is open) */}
      {(explore || currentChat) && (
        <div className="min-h-screen flex px-6 pt-28 gap-6">
          {/* Left - Chat history */}
          <div className="w-72 bg-white rounded-xl shadow-md p-4 h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold">Your Chats</h3>
              <button className="text-sm text-gray-500" onClick={handleNewChat}>New</button>
            </div>

            {chats.length === 0 && <p className="text-gray-500 text-sm">No chats yet — click "New" to start</p>}
            {chats.map((c) => (
              <div key={c._id} className="flex justify-between items-start gap-2 mb-3">
                <div className="flex-1 cursor-pointer" onClick={() => handleSelectChat(c)}>
                  <div className="font-semibold text-sm truncate">{c.title || "Untitled"}</div>
                  <div className="text-xs text-gray-400">{new Date(c.updatedAt || c.createdAt || Date.now()).toLocaleString()}</div>
                </div>
                <button onClick={() => handleDeleteChat(c._id)} className="text-gray-400 hover:text-red-500 p-2 rounded" title="Delete chat">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Center - Explore or Chat */}
          <div className="flex-1 flex flex-col items-center">
            {/* Explore card when explore true AND no currentChat open */}
            {explore && !currentChat && (
              <div className="w-full max-w-3xl bg-[#fdeecb] rounded-xl p-8 shadow-inner">
                <h2 className="text-3xl font-extrabold text-center mb-2">Explore with <span className="text-orange-600">STUDYAI</span></h2>
                <p className="text-center text-gray-700 mb-6">Try asking: "Explain recursion", "Summarize DBMS", or upload your notes as PDF.</p>

                {/* centered image */}
                <div className="flex justify-center mb-6">
                  <img src="/boy.png" alt="study boy" className="w-64 h-auto animate-float" />
                </div>

                {/* central search */}
                <div className="mx-auto max-w-2xl">
                  <div className="flex items-center bg-white rounded-full px-4 py-3 shadow-lg">
                    <Search className="text-gray-400 mr-3" />
                    <input
                      className="flex-1 outline-none text-gray-600"
                      placeholder="Search here — Explore with STUDYAI"
                      value={exploreQuery}
                      onChange={(e) => setExploreQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleExploreSend()}
                    />
                    <button onClick={handleExploreSend} className="ml-3 bg-orange-500 text-white p-3 rounded-full">
                      <ArrowUp size={16} />
                    </button>
                  </div>

                  {/* tips */}
                  <div className="mt-6 bg-white p-4 rounded-md">
                    <h4 className="font-semibold mb-2">Quick tips</h4>
                    <ul className="list-disc ml-5 text-gray-700">
                      <li>Ask for summaries, examples, or step-by-step explanations.</li>
                      <li>Upload a PDF then ask "Explain this simply".</li>
                      <li>Use bullet-friendly queries like “Key points of X”.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Chat view when a chat is selected OR after sending from explore */}
            {currentChat && (
              <div className="w-full flex-1 flex flex-col items-center">
                <div ref={chatScrollRef} className="w-full max-w-3xl h-[60vh] flex flex-col gap-4 p-6 overflow-auto rounded-lg bg-transparent">
                  {currentChat?.messages?.map((m, i) => (
                    <ChatBubble key={m.id || i} m={m} />
                  ))}

                  {loadingAi && <div className="self-start text-gray-600">AI is typing…</div>}
                </div>

                {/* input bottom */}
                <div className="w-full max-w-3xl mt-6 flex items-center bg-white shadow-lg rounded-full px-4 py-3">
                  <Search className="text-gray-400 mr-2" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask StudyAI anything..."
                    className="flex-1 outline-none"
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  />
                  <button onClick={handleSend} className="ml-3 bg-orange-500 text-white p-2 rounded-full">
                    <ArrowUp size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right - Tools */}
          <div className="w-80 flex flex-col gap-4">
            {/* Upload PDF */}
        {/* Upload PDF */}
<div className="bg-white p-4 rounded-xl shadow">
  <h3 className="font-bold text-lg flex items-center gap-2">
    <Upload size={18} /> Upload PDF
  </h3>

  <p className="text-sm text-gray-500">
    Upload notes → AI explains them and saves to the selected chat.
  </p>

  {/* hidden input stays for popup */}
  <input
    type="file"
    ref={fileInputRef}
    accept="application/pdf"
    className="hidden"
    onChange={handlePDFUpload}
  />

  <div className="mt-3 flex gap-2">
    {/* 🔥 CHANGED BUTTON */}
    <button
      onClick={() => setShowUploadModal(true)}
      className="px-4 py-2 bg-orange-500 text-white rounded-md"
    >
      Upload PDF
    </button>

    <button
      onClick={() => {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }}
      className="px-4 py-2 border rounded-md"
    >
      Clear
    </button>
  </div>
</div>


            {/* Mindmap */}
            <div className="bg-white p-4 rounded-xl shadow">
              <h3 className="font-bold text-lg">🧠 Mindmap</h3>
              <p className="text-sm text-gray-500">Generate a concept map from the chat or uploaded PDF.</p>
              <div className="mt-3 flex gap-2">
               <button
  onClick={handleOpenMindmap}
  className="px-4 py-2 bg-gray-900 text-white rounded-md"
>
  Generate
</button>

                <button className="px-4 py-2 border rounded-md">Export</button>
              </div>
            </div>

            {/* Video summary */}
            <div className="bg-white p-4 rounded-xl shadow">
              <h3 className="font-bold text-lg">🎬 Slides Summary</h3>
              <p className="text-sm text-gray-500">Convert explanation → storyboard → short video (placeholder).</p>
              <div className="mt-3 flex gap-2">
             <div className="flex justify-end mt-4">
  <button
  onClick={() => setShowVideoModal(true)}
  className="px-4 py-2 bg-gray-900 text-white rounded-md"
>
  Create Slides
</button>


</div>

{videoResult?.scenes?.length > 0 && (
  <div className="mt-6 space-y-4 max-h-[300px] overflow-y-auto">
    {videoResult.scenes.map((scene, idx) => (
      <div
        key={idx}
        className="border rounded-lg p-3 bg-gray-50"
      >
        <h5 className="font-semibold text-sm mb-1">
          Scene {idx + 1}
        </h5>
        <p className="text-sm text-gray-700">
          {scene.text}
        </p>
      </div>
    ))}
  </div>
)}


                <button className="px-4 py-2 border rounded-md">Preview</button>
              </div>
            </div>

            {/* Export PDF */}
            <div className="bg-white p-4 rounded-xl shadow">
              <h3 className="font-bold text-lg flex items-center gap-2"><FileText size={18} /> Export Notes</h3>
              <p className="text-sm text-gray-500">Download the current chat as a PDF.</p>
              <div className="mt-3">
                <button onClick={handleExportChatPDF} className="px-4 py-2 bg-orange-500 text-white rounded-md">Download PDF</button>
              </div>
            </div>

             {/* Practice Quiz */}
<div className="bg-white p-4 rounded-xl shadow">
  <h3 className="font-bold text-lg">📝 Practice Quiz</h3>
  <p className="text-sm text-gray-500">
    Generate MCQs from a topic or pasted content and test yourself.
  </p>

  <div className="mt-3">
    <button
      onClick={() => setShowQuizModal(true)}
      className="px-4 py-2 bg-gray-900 text-white rounded-md"
    >
      Start Quiz
    </button>
  </div>
</div>


          </div>
        </div>
      )}

      {/* Upload progress modal */}
      {uploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white p-6 rounded-lg w-[420px]">
            <h4 className="font-semibold mb-3">Uploading PDF</h4>
            <div className="w-full bg-gray-100 h-4 rounded overflow-hidden">
              <div className="h-4 rounded bg-orange-500" style={{ width: `${uploadProgress}%` }}></div>
            </div>
            <div className="text-sm text-gray-600 mt-3 flex justify-between">
              <span>{uploadProgress}%</span>
              <span>{uploadProgress < 100 ? "Processing..." : "Finishing..."}</span>
            </div>
          </div>
        </div>
      )}

{/* 🔥 ADD UPLOAD PDF POPUP HERE */}
{showUploadModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div
      className={`bg-orange-50 w-[650px] h-[400px] rounded-xl p-6 text-center 
  border-2 border-gray-300 transition-all
  hover:bg-orange-50 hover:border-orange-400
        ${isDragging ? "border-orange-500 bg-orange-50" : "border-dashed border-gray-400"}
      `}
      onDragOver={(e) => {
        e.preventDefault();   // 🔥 REQUIRED
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handlePDFDrop}
    >
      <h3 className="text-xl font-bold mb-3">📄 Upload PDF</h3>

    {/* Instruction */}
      <p className="text-gray-600">
        Drag & drop your PDF here
      </p>

     <div className="flex flex-col items-center mb-6">
    <img
      src="/down-arrow.png"
      alt="Drop here"
      className="w-20 h-20 mt-6 animate-float opacity-80"
    />
  </div>

      {/* OR */}
      <p className="text-gray-500 font-medium">OR</p>

      {/* Browse Button */}
      <button
        onClick={() => fileInputRef.current.click()}
        className="px-8 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition"
      >
        Browse PDF
      </button>

      <button
        onClick={() => setShowUploadModal(false)}
        className="block mx-auto mt-4 text-gray-500 hover:text-red-500"
      >
        Cancel
      </button>

      {isDragging && (
        <p className="mt-4 font-semibold text-orange-600">
          Drop PDF to upload
        </p>
      )}
    </div>
  </div>
)}



     {/* Mindmap Modal */}
{showMindmap && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="
        bg-white
        w-[560px]
        max-h-[85vh]
        rounded-xl
        shadow-xl
        flex
        flex-col
      "
    >
      {/* Header (STICKY) */}
      <div className="flex justify-between items-center px-6 py-4 border-b sticky top-0 bg-white z-10">
        <h3 className="text-xl font-bold">🧠 Generate Mindmap</h3>
        <button
          onClick={handleCloseMindmap}
          className="text-gray-500 hover:text-red-500 text-2xl leading-none"
        >
          ×
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="px-6 py-4 overflow-y-auto flex-1">
        {/* Input */}
        <textarea
          value={mindmapInput}
          onChange={(e) => setMindmapInput(e.target.value)}
          placeholder="Enter topic, paragraph, or content for mindmap..."
          className="w-full h-28 border rounded-lg p-3 outline-none resize-none"
        />

        {/* Generate Button */}
        <div className="flex justify-end mt-4">
          <button
            onClick={handleGenerateMindmap}
            className="px-6 py-2 bg-orange-500 text-white rounded-md"
          >
            Generate
          </button>
        </div>

        
      {/* Result */}
      {mindmapResult && (
        <div className="mt-6">
          <h4 className="font-semibold mb-2">
            Mindmap: {mindmapResult.title}
          </h4>
{/* 
          <div className="space-y-4">
  {mindmapResult.nodes.map((node, idx) => (
    <div key={idx}>
      <h5 className="font-semibold">{node.label}</h5>
      <ul className="list-disc ml-5 text-gray-700">
        {node.children.map((child, i) => (
          <li key={i}>{child}</li>
        ))}
      </ul>
    </div>
  ))}
</div> */}

        {/* <MindmapCanvas data={mindmapResult} /> */}
{mindmapResult && (
  <div
    ref={mindmapRef}
    className="w-full h-[600px] bg-white rounded-lg overflow-hidden"
  >
    <MindmapCanvas data={mindmapResult} />
  </div>
)}

  

            {/* Export buttons */}
            <div className="flex gap-3 mt-6 justify-end">
           <button
  onClick={handleExportMindmapPNG}
  disabled={!isMindmapReady}
  className={`px-6 py-2 rounded-md text-white ${
    isMindmapReady
      ? "bg-orange-500 hover:bg-orange-600"
      : "bg-gray-300 cursor-not-allowed"
  }`}
>
  Export PNG
</button>

              <button
  onClick={handleExportMindmapPDF}
  className="px-4 py-2 bg-orange-500 text-white rounded-md"
>
  Export PDF
</button>
              <button
  onClick={() => setFullPreview(true)}
  className="px-6 py-2 bg-orange-500 text-white rounded-md"
>
  Full Preview
</button>

            </div>
          </div>
        )}
      </div>
    </motion.div>
  </div>
)}

{fullPreview && (
  <div className="fixed inset-0 z-[9999] bg-white">
    {/* Top bar */}
    <div className="flex justify-between items-center px-6 py-4 border-b">
      <h3 className="font-bold text-lg">
        Mindmap Preview – {mindmapResult?.title}
      </h3>
      <button
        onClick={() => setFullPreview(false)}
        className="text-xl hover:text-red-500"
      >
        ✕
      </button>
    </div>

    {/* Fullscreen Canvas */}
    {/* <div className="h-[calc(100vh-64px)]">
      <MindmapCanvas data={mindmapResult} />
    </div> */}
   <div
  ref={mindmapRef}
  className="w-full h-[500px] border rounded-lg overflow-hidden bg-white"
>
  <MindmapCanvas data={mindmapResult} />
</div>

  </div>
)}



{/* Video Generator Modal */}
{/* Video Generator Modal */}
{showVideoModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-white w-[600px] max-h-[80vh] overflow-y-auto rounded-xl p-6 shadow-lg"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">🎬 Generate Video Explanation</h3>
        <button
          onClick={() => setShowVideoModal(false)}
          className="text-xl text-gray-400 hover:text-red-500"
        >
          ✕
        </button>
      </div>

      {/* Input */}
      <textarea
        value={videoInput}
        onChange={(e) => setVideoInput(e.target.value)}
        placeholder="Paste topic or content for video explanation..."
        className="w-full h-32 border rounded-lg p-3 resize-none outline-none"
      />

      {/* Generate */}
      <div className="flex justify-end mt-4">
        <button
          onClick={handleGenerateVideo}
          disabled={videoLoading}
          className="px-6 py-2 bg-orange-500 text-white rounded-md disabled:opacity-60"
        >
          {videoLoading ? "Generating..." : "Generate Slides"}
        </button>
      </div>

      {/* Scene Preview */}
      {videoResult?.scenes?.length > 0 && (
        <div className="mt-6 space-y-4 max-h-[300px] overflow-y-auto">
          {videoResult.scenes.map((scene, idx) => (
            <div key={idx} className="border rounded-md p-3 bg-gray-50">
              <h5 className="font-semibold text-sm mb-1">
                Scene {idx + 1}
              </h5>
              <p className="text-sm text-gray-700">{scene.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Preview Button */}
      {videoResult?.scenes?.length > 0 && (
        <div className="flex justify-end mt-4">
          <button
            onClick={() => {
              setShowVideoModal(false);
              setShowVideoPreview(true);
            }}
            className="px-4 py-2 border border-orange-500 text-orange-600 rounded-md hover:bg-orange-50"
          >
            Preview Full Screen
          </button>
        </div>
      )}
    </motion.div>
  </div>
)}




{/* Full Screen Video Preview */}
{/* Video Preview Modal */}
{/* Full Screen Video Preview */}
{showVideoPreview && (
  <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
    <div className="bg-white w-[85vw] h-[85vh] rounded-xl p-6 overflow-hidden">

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">🎥 Video Preview</h2>
        <button
          onClick={() => setShowVideoPreview(false)}
          className="text-xl hover:text-red-500"
        >
          ✕
        </button>
      </div>

      {/* Swiper Carousel */}
      <Swiper
        modules={[Navigation]}
        navigation
        onSlideChange={handleSlideChange}
        className="h-full"
      >
        {videoResult?.scenes?.map((scene, idx) => (
          <SwiperSlide key={idx}>
            <div className="h-full rounded-xl overflow-hidden relative">

              {/* Background */}
              <img
                src={getVideoBackground(scene.text)}
                className="absolute inset-0 w-full h-full object-cover"
                alt="background"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/60" />

              {/* Content */}
              <div className="relative z-10 p-8 text-white max-w-3xl">
                <h3 className="text-2xl font-bold mb-4">
                  Scene {idx + 1}
                </h3>

                <p className="text-lg leading-relaxed">
                  {scene.text}
                </p>

                {/* Auto-play voice */}
                {scene.audioUrl && (
                  <audio
                    src={`http://localhost:5000${scene.audioUrl}`}
                    autoPlay
                    controls
                    className="mt-6 w-full"
                  />
                )}
              </div>

            </div>
          </SwiperSlide>
        ))}
      </Swiper>

    </div>
  </div>
)}
{showQuizModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div
      className={`bg-white ${
        quizStarted ? "w-[900px]" : "w-[520px]"
      } rounded-xl p-6 shadow-lg`}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">📝 Practice Quiz</h3>
        <button
          onClick={() => {
            setShowQuizModal(false);
            setQuizStarted(false);
            setQuizFinished(false);
          }}
          className="text-xl hover:text-red-500"
        >
          ✕
        </button>
      </div>

      {/* BODY WRAPPER (VERY IMPORTANT) */}
      <>
        {/* ================= INPUT SCREEN ================= */}
        {!quizStarted && (
          <>
            <textarea
              value={quizContent}
              onChange={(e) => setQuizContent(e.target.value)}
              placeholder="Paste content (optional)..."
              className="w-full h-32 border rounded-lg p-3 resize-none outline-none"
            />

            <input
              value={quizTopic}
              onChange={(e) => setQuizTopic(e.target.value)}
              placeholder="Or enter topic (e.g. Java, DBMS)"
              className="w-full mt-4 border rounded-lg p-3 outline-none"
            />

            <div className="flex justify-end mt-4">
              <button
                onClick={handleGenerateQuiz}
                className="px-6 py-2 bg-orange-500 text-white rounded-md"
              >
                {quizLoading ? "Generating..." : "Generate Quiz"}
              </button>
            </div>
          </>
        )}

        {/* ================= QUIZ SCREEN ================= */}
        {quizStarted && !quizFinished && (
          <div className="mt-6">
            <h4 className="font-semibold mb-3">
              Question {currentQuestion + 1} / {quizQuestions.length}
            </h4>

            <p className="mb-4">
              {quizQuestions[currentQuestion].question}
            </p>

            <div className="space-y-2">
              {quizQuestions[currentQuestion].options.map((option, idx) => (
                <label
                  key={idx}
                  className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    checked={userAnswers[currentQuestion] === option}
                    onChange={() =>
                      setUserAnswers((prev) => ({
                        ...prev,
                        [currentQuestion]: option,
                      }))
                    }
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-between mt-6">
              <button
                disabled={currentQuestion === 0}
                onClick={() => setCurrentQuestion((q) => q - 1)}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Previous
              </button>

              <button
                onClick={() => {
                  if (currentQuestion < quizQuestions.length - 1) {
                    setCurrentQuestion((q) => q + 1);
                  } else {
                    setQuizFinished(true);
                  }
                }}
                className="px-6 py-2 bg-orange-500 text-white rounded"
              >
                {currentQuestion < quizQuestions.length - 1
                  ? "Next"
                  : "Finish"}
              </button>
            </div>
          </div>
        )}

        {/* ================= RESULT SCREEN ================= */}
        {quizFinished && (
          <div className="mt-6 max-h-[65vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Quiz Result</h2>

            <p className="text-lg mb-6">
              Score:{" "}
              <span className="font-bold text-orange-600">
                {
                  quizQuestions.filter(
                    (q, i) => userAnswers[i] === q.correctAnswer
                  ).length
                }{" "}
                / {quizQuestions.length}
              </span>
            </p>

            {quizQuestions.map((q, i) => {
              const isCorrect = userAnswers[i] === q.correctAnswer;

              return (
                <div
                  key={i}
                  className={`mb-4 p-4 rounded-lg border ${
                    isCorrect
                      ? "bg-green-50 border-green-400"
                      : "bg-red-50 border-red-400"
                  }`}
                >
                  <p className="font-semibold">
                    Q{i + 1}. {q.question}
                  </p>

                  <p>
                    Your answer:{" "}
                    <span
                      className={
                        isCorrect ? "text-green-600" : "text-red-600"
                      }
                    >
                      {userAnswers[i] || "Not answered"}
                    </span>
                  </p>

                  {!isCorrect && (
                    <p>
                      Correct answer:{" "}
                      <span className="text-green-600">
                        {q.correctAnswer}
                      </span>
                    </p>
                  )}

                  <p className="text-gray-700 mt-1">
                    Explanation: {q.explanation}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </>
    </div>
  </div>
)}




    </div>
  );
}


