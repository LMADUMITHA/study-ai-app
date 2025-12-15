import { motion } from "framer-motion";

export default function Globe() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1 }}
      className="relative w-72 h-72 rounded-full bg-gradient-to-br from-blue-400 via-blue-600 to-indigo-900 shadow-[0_0_80px_rgba(0,140,255,0.6)]"
    >
      {/* glow */}
      <div className="absolute inset-0 rounded-full blur-2xl bg-blue-500/40 -z-10" />

      {/* rotating grid */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
        className="absolute inset-0 rounded-full border border-white/20"
      />

      <motion.div
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
        className="absolute inset-4 rounded-full border border-white/10"
      />
    </motion.div>
  );
}
