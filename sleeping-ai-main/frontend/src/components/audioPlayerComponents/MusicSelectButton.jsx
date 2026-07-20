import  { useEffect, useRef, useState } from "react";
import AudioIcon from "../../../images/audioEmoticon.png";

//Selects the background song to be played during the story
export default function MusicSelectButton({ songs = [], onSelect, className = "" }) {
//sets the popup to open or closed 
  const [open, setOpen] = useState(false);
  //chosen songs ID 
  const [songID, setSongID] = useState(null);
  //ref to widget 
  const wrapRef = useRef(null);
  

  
  useEffect(() => {
// popup is closed once a user clicks outisde of the song selection widget
    const onClick = (e) => {
      if (!wrapRef.current) return;

      if (!wrapRef.current.contains(e.target)) setOpen(false);
    
    }; if (open) document.addEventListener("mousedown", onClick)
        ;
    return () => document.removeEventListener("mousedown", onClick); }, 
  [open]);
//when song is chose the song is remembered , then the parent is notirfied and the popup is closed
  const choose = (song) => {
    setSongID(song.id);
    onSelect?.(song);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className={`relative inline-block ${className}`}>
      {/* Button */}
         <button
         type="button"
         onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="h-12 w-12 grid place-items-center rounded-xl bg-white/10 hover:bg-white/20 shadow-md" // w-20 makes it longer
        title="Choose background music"
        >
        <img src={AudioIcon} alt="Music" className="h-7 w-auto opacity-80" />   {/* keep aspect */}
         </button>

      {/* popup with animation */}
      <div
        className={ "absolute left-1/2 -translate-x-1/2 top-14 w-72 " +
          "rounded-3xl bg-white/10 backdrop-blur-md shadow-xl p-3 " +
          "transform origin-top transition-all duration-300 " +
         
          (open
            ? "opacity-100 scale-y-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-2 scale-y-0 pointer-events-none")  }
        
            role="listbox"
            aria-label="Background music"
      >        {/* if songs are empty return 'Tracks are not avalable '" */}

        {songs.length === 0 && (
          <div className="text-center text-white/70 text-sm py-3">
            Tracks are not avalable!
          </div>
        )}

        {/* list of songs*/}
        <ul className="space-y-2">
          {songs.map((s) => {
            const isSelected = s.id === songID;
            
            return ( <li key={s.id}>
                
                <button
                  type="button"
                  onClick={() => choose(s)}
                  className={
                    "w-full flex items-center gap-3 px-3 py-3 rounded-2xl " +
                    "bg-white/10 hover:bg-white/20 text-left " +
                    (isSelected ? "ring-2 ring-white/60 bg-white/20" : "") }>
                       
            <span className={ "grid place-items-center w-8 h-8 rounded-xl " + (isSelected ? "bg-white/30" : "bg-white/15") } 
            aria-hidden="true">
               
                <img
                    src="/images/audioEmoticon.png"
                    alt=""
                    className="w-5 h-5 object-contain opacity-90"/>

                </span>
                <span className="text-white/90 text-sm truncate">{s.title}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
