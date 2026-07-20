import  { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopHeadings from "./TopHeadings";
import { auth, db, call } from "../CLIENT/firebaseClient";
import {
  collection, doc, getDoc, onSnapshot, query, where, orderBy, limit,
} from "firebase/firestore";

//joins classnames (ignores values that are falsy)
const cx = (...c) => c.filter(Boolean).join(" ");

//tailwind code that is reused
const pill = "px-6 py-2 rounded-2xl text-white/90 text-lg font-semibold bg-white/10 shadow-md backdrop-blur-md";
const grid2 = "grid grid-cols-2 gap-12";
const btnBase = "px-3 py-2 rounded-xl text-xs shadow-md";
const likeBtn = (liked) => cx(btnBase, liked ? "bg-pink-600 text-white" : "bg-white/20 text-white/90 hover:bg-white/30");
const listenBtn = cx(btnBase, "bg-white/10 text-white/80 hover:bg-white/20");
const shareBtn  = cx(btnBase, "bg-white/20 text-white/90 hover:bg-white/30");


// glass card, show handles the fade in animation, delay staggers several cards, rolebutton avoids nested btton elements.
function Card({ children, onClick, show, delay = 0, roleButton = true }) {
  const common = cx(
    "relative w-full aspect-square rounded-[26px] cursor-pointer outline-none",
    "backdrop-blur-[6px] bg-white/10",
    "shadow-[0_14px_30px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.14)]",
    "transition-all duration-[600ms] ease-out",
    show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
    "hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-white/60"
  );

  const inner = <div className="absolute inset-0 p-4 flex flex-col">{children}</div>;

  // <div role="button"> is used for avoidign nesting button  
  return roleButton ? (
    <div role="button" tabIndex={0}
         onClick={onClick}
         onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(e); } }}
         className={common}
         style={{ transitionDelay: `${delay}ms` }}>
      {inner}
    </div>
  ) : (
    <div className={common} style={{ transitionDelay: `${delay}ms` }}>{inner}</div>
  );
}

//Headings label
const Pill = ({ children, className = "" }) => <div className={cx(pill, className)}>{children}</div>;

export default function SharePage() {
  const navigate = useNavigate();
//auth state
  const [uid, setUid] = useState(null);
  const [email, setEmail] = useState("");
  const [mounted, setMounted] = useState(false);
//private stories and comunity posts comlums
  const [privateStories, setPrivateStories] = useState([]); 
  const [posts, setPosts] = useState([]);                   

//track cards to animate the new cards.
  const seenPosts = useRef(new Set());        
  const [postVisible, setPostVisible] = useState({}); 
//callable functions for liking/sharing stories
  const likeFn  = useMemo(() => call("likeStory"), []);
  const shareFn = useMemo(() => call("shareStory"), []);

  // page animation 
  useEffect(() => { const t = setTimeout(() => setMounted(true), 0); return () => clearTimeout(t); }, []);

  // auth listener
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUid(u?.uid ?? null);
      setEmail(u?.email ?? "");
    });
    return () => unsub();
  }, []);

  // listens to stories that arent shared
  useEffect(() => {
    if (!uid) { setPrivateStories([]); return; }
    //only 
    const qPriv = query(
      collection(db, "stories"),
      where("ownerUid", "==", uid),
      where("shared", "==", false),
      orderBy("createdAt", "desc"),
      limit(12)
    );
    const unsub = onSnapshot(qPriv, (snap) => {
      const arr = [];
      snap.forEach((d) => {
        const data = d.data() || {};
        arr.push({ id: d.id, title: data.title || "Untitled story", createdAt: data.createdAt?.toMillis?.() || 0 });
      });
      setPrivateStories(arr);
    });
    return () => unsub();
  }, [uid]);

// community posts query
useEffect(() => {
  const qCom = query(
    collection(db, "communityPosts"),
    where("visible", "==", true), 
    orderBy("updatedAt", "desc"),
    limit(12)
  );
  const unsub = onSnapshot(qCom, async (snap) => {
    const base = [];
    snap.forEach((d) => {
      const x = d.data() || {};
      base.push({ id: d.id, likes: Number(x.likes || 0), updatedAt: x.updatedAt?.toMillis?.() || 0 });
    });

    // fetch the titles and owners
    const withStory = await Promise.all(
      base.map(async (p) => {
        try {
          const sSnap = await getDoc(doc(db, "stories", p.id));
          const s = sSnap.data() || {};
          return { ...p, title: s.title || "Untitled story", ownerUid: s.ownerUid || null };
        } catch {
          return { ...p, title: "Untitled story", ownerUid: null };
        }
      })
    );

    // posts liked by the user marked
    let withLiked = withStory;
    if (uid) {
      withLiked = await Promise.all(
        withStory.map(async (p) => {
          try {
            const likeSnap = await getDoc(doc(db, "communityPosts", p.id, "likes", uid));
            return { ...p, liked: likeSnap.exists() };
          } catch {
            return { ...p, liked: false };
          }
        })
      );
    } else {
      withLiked = withStory.map((p) => ({ ...p, liked: false }));
    }

    // item animation
    const newVis = {};
    withLiked.forEach((p) => {
      if (!seenPosts.current.has(p.id)) {
        newVis[p.id] = false;          //  start out hidden 
        seenPosts.current.add(p.id);   // if the item has been seen then remember it 
      }
    });
    if (Object.keys(newVis).length) {
      setPostVisible((prev) => ({ ...prev, ...newVis }));
      setTimeout(() => {
        setPostVisible((prev) => {
          const next = { ...prev };
          Object.keys(newVis).forEach((id) => { next[id] = true; });
          return next;
        });
      }, 0);
    }

    setPosts(withLiked);
  });
  return () => unsub();
}, [uid]);

  // toggles like 
  const toggleLike = async (storyId) => {
    if (!uid) { if (confirm("You’re not signed in. Go to login now?")) navigate("/login"); return; }
    try {
      const res = await likeFn({ storyId });
      const likedNext = res?.data?.liked ?? res?.liked ?? null;
      const likesNext = Number(res?.data?.likes ?? res?.likes ?? null);
      setPosts((prev) => prev.map((p) => p.id === storyId
        ? { ...p, liked: likedNext ?? p.liked, likes: Number.isFinite(likesNext) ? likesNext : p.likes }
        : p));
    } catch (e) {
      alert(e?.message || "Failed to update like");
    }
  };
//share story to community 
  const shareThis = async (storyId) => {
    if (!uid) { if (confirm("You’re not signed in. Go to login now?")) navigate("/login"); return; }
    try {
      await shareFn({ storyId, share: true });
    } 
    //error handler
    catch (e) {
      alert(e?.message || "Failed to share");
    }
  };






  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#1B1340] to-[#C1B3E0] text-white px-6 pt-20">
      <TopHeadings />

      {/* email indicator */}
      <div className="absolute top-20 right-4 text-xs text-white/80">
        {email ? (
          <span>Signed in: {email}</span>
        ) : (
          <button onClick={() => navigate("/login")} className="underline underline-offset-2">Not signed in — Login</button>
        )}
      </div>
      {/* centers the title */}

      <div className={cx(
        "w-full flex justify-center mb-8 transition-all duration-500 ease-out",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      )}>
        <Pill>Library</Pill>
      </div>

      {/* grids and section headers */}
      <div className={cx(
        "max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12",
        "transition-opacity duration-[600ms] ease-out",
        mounted ? "opacity-100" : "opacity-0"
      )}>
        {/* left header */}
        <div
          className={cx(
            "flex justify-center lg:justify-start -mt-2",
            "transition-all duration-500 ease-out",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
          )}
          style={{ transitionDelay: "80ms" }}
        >
          <Pill className="text-base">Private</Pill>
        </div>

        {/* right header */}
        <div
          className={cx(
            "flex justify-center lg:justify-end -mt-2",
            "transition-all duration-500 ease-out",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
          )}
          style={{ transitionDelay: "120ms" }}
        >
          <Pill className="text-base">Community</Pill>
        </div>

        {/* private cards column */}
        <div className={grid2}>
          {privateStories.map((s, i) => (
            <Card key={s.id} onClick={() => navigate(`/player/${s.id}`)} show={mounted} delay={150 + i * 60}>
              <div className="text-left">
                <div className="text-white/90 font-semibold text-sm line-clamp-2">{s.title}</div>
              </div>
              <div className="mt-auto flex items-center justify-between">
                <button
                  onClick={(e) => { e.stopPropagation(); shareThis(s.id); }}
                  className={shareBtn}
                >
                  📣 Share
                </button>
                <span className="text-[11px] text-white/60">
                  {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ""}
                </span>
              </div>
            </Card>
          ))}

          {/* private placehlders */}
          {Array.from({ length: Math.max(0, 6 - privateStories.length) }).map((_, i) => (
            <div
              key={`priv-skel-${i}`}
              className={cx(
                "aspect-square rounded-[26px] bg-white/10 backdrop-blur-[6px]",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_10px_22px_rgba(0,0,0,0.18)]",
                "transition-all duration-[600ms] ease-out",
                mounted ? "opacity-40 translate-y-0" : "opacity-0 translate-y-2" )}

              style={{ transitionDelay: `${150 + (privateStories.length + i) * 60}ms` }}
            />
          ))}

        </div>

        {/* right column */}
        <div className={grid2}>
          {posts.map((p, i) => (
            <Card
              key={p.id}
              onClick={() => navigate(`/player/${p.id}`)}
              show={postVisible[p.id] ?? mounted}
              delay={150 + i * 60}
            >
              <div className="text-left">
                <div className="text-white/90 font-semibold text-sm line-clamp-2">{p.title}</div>
              </div>
              <div className="mt-auto flex items-center justify-between">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleLike(p.id); }}
                  aria-pressed={p.liked}
                  className={likeBtn(p.liked)}
                >
                  {p.liked ? "Unlike" : "🤍 Like"} · {p.likes}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/player/${p.id}`); }}
                  className={listenBtn}
                >
                  ▶ Listen
                </button>
              </div>
            </Card>
          ))}

          {/*  placeholders */}
          {Array.from({ length: Math.max(0, 6 - posts.length) }).map((_, i) => (
            <div
              key={`com-skel-${i}`}
              className={cx(
                "aspect-square rounded-[26px] bg-white/10 backdrop-blur-[6px]",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_10px_22px_rgba(0,0,0,0.18)]",
                "transition-all duration-[600ms] ease-out",
                mounted ? "opacity-40 translate-y-0" : "opacity-0 translate-y-2"
              )}
              style={{ transitionDelay: `${150 + (posts.length + i) * 60}ms` }}
            />
          ))}
        </div>
      </div>

      <div className="h-10" />
    </div>
  );
}
