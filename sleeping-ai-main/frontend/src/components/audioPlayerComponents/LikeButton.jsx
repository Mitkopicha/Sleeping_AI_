// the like button and like counter
export default function LikeButton({ liked, loading, onClick, count }) {
  return (
    <>
     {/* Heart button*/}
      <button
        onClick={onClick}
        disabled={loading}
        className={`relative w-12 h-12 rounded-xl shadow-md flex items-center justify-center ${
          loading ? "bg-white/10 opacity-50" : liked ? "bg-pink-600" : "bg-white/10 hover:bg-white/20"
        }`}
        
        aria-pressed={liked}
        aria-label={liked ? "Unlike" : "Like"} >

         {/* small animation when liked*/}
        {liked && <span className="absolute inset-0 rounded-xl bg-red-500/30 animate-ping" />}
        <img src="/images/heart.png" alt="" className="w-8 h-8 object-contain relative" />
    
      </button>
      {/* Number of likes */}
      <div className="w-12 h-12 rounded-xl bg-white/10 shadow-md flex items-center justify-center text-sm font-semibold text-white">
        <span>{count}</span>
      </div>
    </>
  );
}