// Volume slider
export default function VolumeSlider({ open, setOpen, value, onChange }) {
  const lastVolRef = useRef(0.5); // remember last non-zero volume
  const isMuted = Number(value) === 0;

  const handleMuteClick = () => {
    const cur = Number(value) || 0;
    if (cur === 0) {
      // unmute , sets volume to the previously saved one.
      onChange({ target: { value: lastVolRef.current || 0.5 } });
    } else {
      // mute, save the current audio value and then set to 0
      lastVolRef.current = cur;
      onChange({ target: { value: 0 } });
    }
  };

  const handleSliderChange = (e) => {
    const v = Number(e.target.value);
    if (v > 0) lastVolRef.current = v; // keep last non-zero
    onChange(e);
  };

  return (
    // wrapper expands on hover
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* expands when open is true */}
      <div
        className={`relative h-12 rounded-2xl bg-white/10 shadow-md overflow-hidden backdrop-blur-sm transition-all duration-300 ${
          open ? "w-[320px] px-2" : "w-14"
        }`}
      >
        {/* sound icon with mute toggle */}
        <div className="absolute left-0 top-0 w-14 h-12 flex items-center justify-center">
          <button
            type="button"
            onClick={handleMuteClick}
            title={isMuted ? "Unmute" : "Mute"}
            aria-label={isMuted ? "Unmute" : "Mute"}
            className="w-10 h-10 rounded-xl hover:bg-white/10 flex items-center justify-center"
          >
            <img src="/images/soundEmoticon.png" alt="" className="w-9 h-9 opacity-80" />
          </button>
        </div>

        {/* slider (inside the same container) */}
        <div
          className={`flex items-center gap-3 h-12 transition-all duration-200 ${
            open ? "opacity-100 pl-12" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* volume number */}
          <span className="w-12 text-xs text-white/70">
            {Math.round((Number(value) || 0) * 100)}%
          </span>

          {/* slider fill */}
          <div className="relative flex-1 h-2 rounded-full bg-white/20">
            <div
              className="absolute top-0 left-0 h-full rounded-full bg-white/80"
              style={{ width: `${(Number(value) || 0) * 100}%` }}
            />
            {/* input */}
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={Number(value) || 0}
              onChange={handleSliderChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Volume"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
