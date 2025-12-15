import { useEffect, useState } from "react";

export default function GalaxyBackground() {
  const [pos, setPos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const move = (e) => {
      setPos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <>
      {/* Base galaxy gradient */}
      <div className="fixed inset-0 -z-30 bg-galaxy" />

      {/* Nebula light */}
      <div
        className="fixed inset-0 -z-20 transition-all duration-300"
        style={{
          background: `radial-gradient(
            circle at ${pos.x}% ${pos.y}%,
            rgba(120, 255, 180, 0.12),
            rgba(0,0,0,0.85) 55%
          )`,
        }}
      />

      {/* Stars layer */}
      <div className="fixed inset-0 -z-10 stars" />
    </>
  );
}
