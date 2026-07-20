//The PlayControlButtons is responcible for rendering the Back, Fast forward, paue and play buttons
export default function PlayControlButtons({playing, onTogglePlay, onBack, onForward, className = "", }) 
{
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Sets the current timestamp back by 15 seconds */}
      <button
        onClick={onBack}
        className="w-14 h-14 p-2 rounded-2xl bg-white/10 hover:bg-white/20 shadow-md"
        aria-label="Back 15s"
      >
        <img src="/images/Fast.png" alt="" className="w-full h-full object-contain rotate-180" />
      </button>

      {/* The play or pause is toggled, based on the 'playing' props"*/}
        <button
          onClick={onTogglePlay}
          className="w-16 h-16 p-2 rounded-2xl bg-white/10 hover:bg-white/20 shadow-md"
          aria-label={playing ? "Pause" : "Play"}
        >
          <img
            src={playing ? "/images/PauseButton.png" : "/images/Playbutton.png"}
            alt=""
            className="w-full h-full object-contain"
          />
        </button>

      {/* Fasts forward by 15 seconds*/}
      <button
        onClick={onForward}
        className="w-14 h-14 p-2 rounded-2xl bg-white/10 hover:bg-white/20 shadow-md"
        aria-label="Forward 15s"
      >
        <img src="/images/FastForward.png" alt="" className="w-full h-full object-contain" />
      </button>
    </div>
  );
}
