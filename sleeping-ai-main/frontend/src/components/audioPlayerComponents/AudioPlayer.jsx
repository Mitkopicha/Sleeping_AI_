export default function AudioPlayer({ audioRef, audioUrl, fallbackAudio = "/audio/test.wav", mounted, isPlaying, current, duration, onTimeLineSet,})  {
  
  //formats the time for the audio player
function formatTime(sec) {
  if (!isFinite(sec)) return "0:00";
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
  const pct = duration ? Math.max(0, Math.min(100, (current / duration) * 100)) : 0;

  return (
    <div className="flex flex-col items-center">
      <audio ref={audioRef} src={audioUrl || fallbackAudio} preload="metadata" />

      {/* Circle animations and timeline */}
      <div
        className={`w-full max-w-[720px] transition-all duration-700 delay-150 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        <div className="w-[720px] h-[84px] mx-auto flex items-center justify-center rounded-2xl bg-white/10 shadow-md backdrop-blur-md">
            {/* Bubbles animated */}
          <div className="flex items-center gap-3">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`flex items-center justify-center rounded-full bg-white/30 ${
                  isPlaying ? "animate-bounce" : ""
                } ${i === 1 ? "w-10 h-10" : "w-9 h-9"}`}
                style={{ animationDelay: `${i * 130}ms` }}
              />
            ))}
          </div>
        </div>
{/* Current time */}
        <div className="mt-3 flex items-center gap-4">
          <span className="w-10 text-right text-xs text-white/80">
            {formatTime(current)}
          </span>

          <div className="relative flex-1 h-2 rounded-full bg-white/20">
            <div
              className="absolute top-0 left-0 h-full rounded-full bg-white/80"
              style={{ width: `${pct}%` }}
            />
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(pct)}
              onChange={onTimeLineSet}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Seek"
            />
          </div>
{/* Time duration */}
          <span className="w-10 text-xs text-white/80">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
