import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download } from "lucide-react";

/*
  MindmapModal.jsx
  - Popup modal
  - Text input
  - Generate mindmap (mocked now, AI later)
  - Export buttons
*/

export default function MindmapModal({ onClose }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mindmap, setMindmap] = useState(null);

  // TEMP: mock mindmap (replace with API later)
  const generateMindmap = async () => {
  if (!input.trim()) {
    alert("Please enter a topic or text");
    return;
  }

  setLoading(true);          // ✅ START loading
  setMindmapResult(null);    // ✅ clear previous mindmap

  try {
    // ⏳ Simulate AI delay (replace with real API later)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setMindmapResult({
      title: input,
      nodes: [
        {
          label: "Key Concepts",
          children: ["Definition", "Purpose", "Usage"],
        },
        {
          label: "Advantages",
          children: ["Fast", "Efficient", "Reusable"],
        },
        {
          label: "Examples",
          children: ["Real-life case", "Code example"],
        },
      ],
    });
  } catch (err) {
    console.error("Mindmap generation failed", err);
    alert("Failed to generate mindmap");
  } finally {
    setLoading(false);       // ✅ STOP loading
  }
};

  return (
    <AnimatePresence>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white w-[720px] max-h-[90vh] rounded-2xl shadow-xl p-6 overflow-y-auto"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-extrabold text-gray-800">
              🧠 Generate Mindmap
            </h2>
            <button onClick={onClose}>
              <X className="text-gray-500 hover:text-red-500" />
            </button>
          </div>

          {/* Input */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter a topic, sentence, or paragraph..."
            className="w-full h-32 p-4 border rounded-xl outline-none focus:ring-2 focus:ring-orange-400"
          />

          {/* Generate Button */}
       <button
  onClick={generateMindmap}
  disabled={loading}
  className={`mt-4 px-6 py-3 rounded-xl font-semibold transition ${
    loading
      ? "bg-gray-400 cursor-not-allowed"
      : "bg-orange-500 hover:bg-orange-600 text-white"
  }`}
>
  {loading ? "Generating mindmap..." : "Generate Mindmap"}
</button>


          {/* Mindmap Output */}
          {mindmap && (
            <div className="mt-6">
              <h3 className="text-xl font-bold text-center mb-4">
                {mindmap.center}
              </h3>

              <div className="grid grid-cols-3 gap-4">
                {mindmap.branches.map((b, i) => (
                  <div
                    key={i}
                    className="border rounded-xl p-4 bg-gray-50 shadow-sm"
                  >
                    <h4 className="font-bold mb-2 text-orange-600">
                      {b.title}
                    </h4>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {b.points.map((p, j) => (
                        <li key={j}>{p}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Export Buttons */}
              <div className="flex justify-end gap-3 mt-6">
                <button className="px-4 py-2 border rounded-lg flex items-center gap-2">
                  <Download size={16} /> Export PDF
                </button>
                <button className="px-4 py-2 border rounded-lg flex items-center gap-2">
                  <Download size={16} /> Export JPG
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
