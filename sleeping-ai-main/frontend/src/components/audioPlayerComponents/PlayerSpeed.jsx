
// setOpen controls the speed pickers expansion.
// setValue sets the play speed value
// When component is hovered over it expands allowing the user to select their preffered audio speed

export default function PlayerSpeed({ open, setOpen, value, setValue }) {
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <div
      className="group"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}>
      <div
        className={`relative h-12 rounded-2xl bg-white/10 shadow-md overflow-hidden backdrop-blur-sm transition-all duration-300 ${
          open ? "w-[380px] px-2" : "w-14"
        }`} >

        {/* current selected audio speed. */}
        <div className="absolute left-0 top-0 w-14 h-12 flex items-center justify-center pointer-events-none">
          <span className="font-mono text-lg font-light text-white">{value}x</span>
       
        </div>

        {/* The avalable speeds are displayed once the component expands */}
        <div
          className={`flex items-center gap-2 h-12 transition-all duration-200 ${
            open ? "opacity-100 pl-10" : "opacity-0 pointer-events-none"
          }`} >

          {speeds.map((sp) => 
          (
            <button
              key={sp}
              onClick={() => { setValue(sp); setOpen(false); }}
              className={`h-10 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition ${
                sp === value ? "ring-2 ring-white/70" : ""
              }`} >

              <span className={`text-sm font-semibold ${sp === value ? "text-white" : "text-white/90"}`}>{sp}×</span>
            </button>
         
         ))}

        </div>
      </div>
    </div>
  );
}
