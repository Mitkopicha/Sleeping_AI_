import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import TopHeadings from "./TopHeadings";
// gap and width of buttons
const cheap_width = 160;           // each chip width
const chip_space = 16;               // space between chips (px)
const visible = 3;            // exactly 3 visible at once

// import callable functions instance from your client
import { functions, httpsCallable } from "../CLIENT/firebaseClient";

export default function TopicsPage() {
  //navigation helper for the router
  const navigate = useNavigate();
  //selected topic trough either clicking or written input
  const [topic, setTopic] = useState("");
  //loading whilst summaries are generated
  const [loading, setLoading] = useState(false);

  // default topics 
  const topics = useMemo(
    () => ["Science", "Philosophy", "History", "FanFiction", "Sci-Fi", "Comedy", "Wellness", "Travel"],
    []
  );

  //index of first visible topic 
  const [startIndex, setStartIndex] = useState(0);

  //scrolls left
  const prev = () =>
    setStartIndex((i) => Math.max(0, i - 1));

  //scrolls right
  const next = () =>
    setStartIndex((i) => Math.min(Math.max(0, topics.length - visible), i + 1));

  //calls the emulator trough a http function. Generates summaries
  const handleGenerateSummaries = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const call = httpsCallable(functions, "generateSummaries");
      const resp = await call({ topic });
      const data = resp.data || {};
      const summaries = data.summaries || [];
      sessionStorage.setItem("summaries", JSON.stringify(summaries));
      navigate("/summary");
    } catch (e) {
      console.error(e);
      alert("Could not generate summaries. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // refresh repeats the same call 
  const handleRefresh = async () => {
    sessionStorage.removeItem("summaries");
    await handleGenerateSummaries();
  };

  // computed widths/offset so no partial items are shown
  const VIEW_W = visible * cheap_width + (visible - 1) * chip_space;
  const offset = startIndex * (cheap_width + chip_space);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#1B1340] to-[#0b0b12] text-white px-4">
      {/* headings*/}
      <TopHeadings posClass="absolute top-2 left-4" />

      {/* title (instructs topic selection) */}
      <h1 className="text-lg font-semibold mt-16 mb-6">Select Topic</h1>

      <div className="flex items-center gap-4 mb-8 w-full justify-center">
        {/* left arrow */}
        <button
          onClick={prev}
          disabled={startIndex === 0}
          className={`arrow-btn ${startIndex === 0 ? "disabled" : ""}`}
          aria-label="Previous"
        >
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path
              d="M15 19l-7-7 7-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* visible window — exactly 3 chips, no clipping */}
        <div
          className="overflow-hidden rounded-[14px]"
          style={{ width: VIEW_W }}
        >
          <div
            className="flex items-center"
            style={{
              gap: `${chip_space}px`,
              width: topics.length * cheap_width + (topics.length - 1) * chip_space,
              transform: `translateX(-${offset}px)`,
              transition: "transform 400ms ease",
            }}
          >
            {topics.map((t) => (
              <button
                key={t}
                onClick={() => setTopic(t)}
                style={{ width: cheap_width }}
                className={`px-4 py-3 rounded-2xl shadow-md text-sm font-semibold text-center ${
                  topic === t ? "bg-white/20" : "bg-white/10 hover:bg-white/15"
                } text-white/90`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* right arrow */}
        <button
          onClick={next}
          disabled={startIndex >= Math.max(0, topics.length - visible)}
          className={`arrow-btn ${startIndex >= Math.max(0, topics.length - visible) ? "disabled" : ""}`}
          aria-label="Next"
        >
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path
              d="M9 5l7 7-7 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* input topic directly*/}
      <div className="text-center">
        <p className="mb-2 text-sm text-white/75">Input topic</p>
        <input
          type="text"
          placeholder="Enter topic..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="bg-white/10 placeholder-white/50 text-white/90 text-base w-[320px] py-2.5 px-4 rounded-[16px] shadow-inner focus:outline-none backdrop-blur-md border border-white/10 focus:border-white/30"
        />
      </div>

      {/* generate and refresh */}
      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={handleGenerateSummaries}
          disabled={!topic || loading}
          className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl shadow-md text-base font-semibold flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Generating…
            </>
          ) : (
            "Generate Summaries"
          )}
        </button>

        <button
          onClick={handleRefresh}
          disabled={!topic || loading}
          className="bg-white/10 hover:bg-white/20 px-5 py-3 rounded-xl shadow-md text-base font-semibold disabled:opacity-50"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
