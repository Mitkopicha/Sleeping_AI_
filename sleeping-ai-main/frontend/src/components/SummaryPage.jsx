import { useMemo, useState, useEffect } from "react";
import TopHeadings from "./TopHeadings";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../CLIENT/firebaseClient";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { v4 as uuid } from "uuid";

// splits  body
function parseTitleBody(s = "") {
  const t = s.trim();
  if (!t) return { title: "", body: "" };

  
  const bold = t.match(/^\s*\*\*(.+?)\*\*\s*:?\s*(.*)$/);
  if (bold) return { title: bold[1].trim(), body: (bold[2] || "").trim() };

  // text before ** treated as title
  const parts = t.split("**");
  if (parts.length > 1 && parts[0].trim()) {
    const title = parts[0].trim().replace(/[:\-–—]+$/, "");
    const body = parts.slice(1).join("**").replace(/^[:\s\-–—]+/, "").trim();
    return { title, body: body || t };
  }

  // title up to first colon
  const i = t.indexOf(":");
  if (i > 0) return { title: t.slice(0, i).trim(), body: t.slice(i + 1).trim() };

  // first sentence as title
  const sent = t.match(/^(.+?[.!?])(\s+)([\s\S]*)$/);
  if (sent) return { title: sent[1].trim(), body: sent[3].trim() };

  // fallback: first 7 words as title
  const w = t.split(/\s+/);
  return { title: w.slice(0, 7).join(" "), body: w.slice(7).join(" ") || t };
}

export default function SummaryPage() {
  // summaries from session (function result) or simple examples
  const stored = JSON.parse(sessionStorage.getItem("summaries") || "[]");
  const examples = [
    "A slow journey across Philosophy, meeting kind strangers and finding stillness along the way.",
    "A gentle walk through Philosophy, where soft lights and distant sounds slowly fade into calm.",
    "Philosophy as a drifting shoreline: slow waves, warm air, and a quiet place to breathe.",
  ];

  // show 3 items to match your mock
  const summaries = useMemo(() => {
    const list = stored.length ? stored : examples;
    return list.slice(0, 3);
  }, [stored]);

  // selected card index (middle by default)
  const [sel, setSel] = useState(0);
  useEffect(() => {
    const mid = Math.max(0, Math.floor((summaries.length - 1) / 2));
    setSel(mid);
  }, [summaries.length]);

  // prev/next just change which one is selected (no sliding)
  const prev = () => setSel((i) => Math.max(0, i - 1));
  const next = () => setSel((i) => Math.min(summaries.length - 1, i + 1));

  // bottom controls – values stored with the story
  const [minutes, setMinutes] = useState(10);
  const [ambient, setAmbient] = useState("None");

  const navigate = useNavigate();

  // create a story doc and go to player
  async function createStory() {
    try {
      if (!auth.currentUser) {
        alert("Please sign in first.");
        navigate("/login");
        return;
      }
      const raw = summaries[sel] || "";
      const { title, body } = parseTitleBody(raw);
      const id = uuid();

      await setDoc(doc(db, "stories", id), {
        title: title || "Untitled story",
        body: body || raw,
        audioUrl: "/audio/test.wav", // placeholder audio
        uid: auth.currentUser.uid,
        ownerUid: auth.currentUser.uid,
        shared: false,
        minutes,
        ambient,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      navigate(`/player/${id}`);
    } catch (e) {
      console.error(e);
      alert(e?.message || "Failed to create story");
    }
  }

  return (
    <div className="relative min-h-screen bg-[#1B1340] bg-gradient-to-b from-[#1B1340] to-[#0b0b12] text-white">
      {/* header used across pages */}
      <TopHeadings posClass="absolute top-2 left-4" />

      {/* stage */}
      <div className="mx-auto max-w-6xl pt-20 pb-28 px-6">

        {/* three cards centered — no horizontal translate */}
        <div className="flex justify-center items-start gap-10 mt-10">
          {summaries.map((s, i) => {
            const { title, body } = parseTitleBody(s);
            const isSel = i === sel;

            // scale/opacity only – keeps layout stable
            const scale = isSel ? 1 : 0.94;
            const opacity = isSel ? "opacity-100" : "opacity-70";
            const ring = isSel ? "ring-1 ring-white/20" : "ring-1 ring-white/10";

            return (
              <article
                key={i}
                className={`w-[420px] min-h-[420px] rounded-[28px] ${opacity} ${ring}
                            bg-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.25)] backdrop-blur-sm p-8
                            transition-all duration-200`}
                style={{ transform: `scale(${scale})` }}
                onClick={() => setSel(i)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " " ? setSel(i) : null)}
              >
                {title && <div className="text-white/90 font-semibold mb-3">{title}</div>}
                <p className="text-white/85 leading-7">{body}</p>
              </article>
            );
          })}
        </div>

        {/* bottom bar like your mock */}
        <div className="mt-10 flex items-center justify-center gap-6">
          <button
            onClick={prev}
            disabled={sel === 0}
            className="w-8 h-8 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-40"
            aria-label="Previous"
          >
            ‹
          </button>

          <div className="flex items-center gap-2">
            <span className="text-white/70 text-sm">Duration</span>
            <select
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className="px-3 py-2 rounded-xl bg-white/10 text-white text-sm shadow"
            >
              {[5, 10, 15, 20].map((m) => (
                <option key={m} value={m}>{m} min</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-white/70 text-sm">Ambient</span>
            <select
              value={ambient}
              onChange={(e) => setAmbient(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white/10 text-white text-sm shadow"
            >
              {["None", "Rain", "Waves", "Forest"].map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          <button
            onClick={createStory}
            className="px-6 py-3 rounded-2xl bg-white/25 hover:bg-white/35 text-white font-semibold shadow"
          >
            Generate Story
          </button>

          <button
            onClick={next}
            disabled={sel === summaries.length - 1}
            className="w-8 h-8 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-40"
            aria-label="Next"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
