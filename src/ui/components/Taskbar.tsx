import { useEffect, useState } from "react";

interface TaskbarProps {
  readonly player: string;
}

function formatTime(d: Date): string {
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

export function Taskbar({ player }: TaskbarProps) {
  const [now, setNow] = useState(() => formatTime(new Date()));

  useEffect(() => {
    const id = setInterval(() => setNow(formatTime(new Date())), 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="taskbar">
      <button type="button" className="start-btn">
        <span className="start-flower" />
        <span>start</span>
      </button>
      <div className="task-window">
        <span style={{ color: "var(--bi-magenta)" }}>&#9678;</span> CYCLES — {player} to move
      </div>
      <div className="task-grow" />
      <div className="task-tray">
        <span className="icon">&#9829;</span>
        <span className="icon">&#9836;</span>
        <span>{now}</span>
      </div>
    </div>
  );
}
