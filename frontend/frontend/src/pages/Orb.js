// Orb.js
import React, { useEffect, useRef } from "react";
import "./Orb.css";

export default function Orb({ hoverIntensity = 0.3, rotateOnHover = true, hue = 0 }) {
  const orbRef = useRef(null);

  useEffect(() => {
    const orb = orbRef.current;

    const handleMouseMove = (e) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * hoverIntensity * 100;
      const y = (e.clientY / innerHeight - 0.5) * hoverIntensity * 100;

      orb.style.transform = `translate(${x}px, ${y}px) ${
        rotateOnHover ? `rotate(${x * 2}deg)` : ""
      }`;
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [hoverIntensity, rotateOnHover]);

  return (
    <div className="orb-container">
      <div
        className="orb"
        style={{
          filter: `hue-rotate(${hue}deg)`
        }}
        ref={orbRef}
      ></div>
    </div>
  );
}
