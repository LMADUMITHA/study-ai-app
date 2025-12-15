import React from "react";

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("USER") || "{}");

  return (
    <div style={{padding:20}}>
      <h1>Welcome {user.displayName || user.email}</h1>
      <p>This is your dashboard.</p>
      <button onClick={() => {
        localStorage.clear();
        window.location.href = "/";
      }}>Logout</button>
    </div>
  );
}
