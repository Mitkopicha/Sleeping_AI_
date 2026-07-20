//you can posts with this button to the community
export default function ShareButton({ shared, loading, onClick }) {
  return (
  
    <button
      onClick={onClick} //click handler
      disabled={loading} //stops repeated clicks when loading
      title={shared ? "Unshare" : "Share"} //tooltip current state
      className={`ml-2 w-12 h-12 grid place-items-center rounded-xl shadow-md transition  
        ${loading ? "bg-white/10 cursor-not-allowed opacity-60" : shared ? "bg-green-600 hover:bg-green-700" : "bg-white/10 hover:bg-white/20"}`}
      aria-pressed={shared} //toggles state
      aria-busy={loading} //anounces the loading
    >
      {/* spinning loading animation*/}
      {loading ? (
        <div className="w-5 h-5 rounded-full border-2 border-white/80 border-t-transparent animate-spin" />
      ) : ( // share icon
        <img src="/images/share.png" alt="" className="w-7 h-7 object-contain" />

)}
    </button>
  );
}
