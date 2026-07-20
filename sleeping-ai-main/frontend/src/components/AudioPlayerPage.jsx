import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopHeadings from "./TopHeadings";
import { auth, db, call } from "../CLIENT/firebaseClient";
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";

//imported Components
import LikeButton from "./audioPlayerComponents/LikeButton";
import ShareButton from "./audioPlayerComponents/ShareButton";
import PlayerSpeed from "./audioPlayerComponents/PlayerSpeed";
import VolumeSlider from "./audioPlayerComponents/VolumeSlider";
import TransportControls from "./audioPlayerComponents/PlayControlButtons";
import AudioPlayer from "./audioPlayerComponents/AudioPlayer"
import MusicSelectButton from "./audioPlayerComponents/MusicSelectButton";

//fake ID for placeholder
const STORY_ID = "placeholder-story-123";
const FALLBACK_AUDIO = "/audio/test.wav";

//formats the time for the audio player
const formatTime = (sec) => {
  if (!isFinite(sec)) return "0:00";
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
};

export default function AudioPlayerPage() {
  const navigate = useNavigate();

  //mounts the animation gate
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);


  // auth and title 
  const [uid, setUid] = useState(null);
  const [title, setTitle] = useState("Loading story…");

//audio and likes 
  const [audioUrl, setAudioUrl] = useState("");
  const [likesCount, setLikesCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [loadingLike, setLoadingLike] = useState(false);

  //state sharing
  const [postVisible, setPostVisible] = useState(false);
  const [loadingShare, setLoadingShare] = useState(false);

//audio playback
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [volume, setVolume] = useState(1);
  const [rate, setRate] = useState(1);

  //hover expand states
  const [volOpen, setVolOpen] = useState(false);
  const [speedOpen, setSpeedOpen] = useState(false);

  //Firestore documents,memoized to not be lost when page renders
  const storyRef = useMemo(() => doc(db, "stories", STORY_ID), []);
  const postRef = useMemo(() => doc(db, "communityPosts", STORY_ID), []);
  const likeRef = useMemo(
    () => (uid ? doc(db, "communityPosts", STORY_ID, "likes", uid) : null),
    [uid]
  );
//play and pause images are preloaded
  useEffect(() => {
    ["/images/Playbutton.png", "/images/PauseButton.png"].forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);
  
  useEffect(() => {
    //Tracks auth
    const unsub = auth.onAuthStateChanged((u) => {
      //stores user ID
      setUid(u?.uid ?? null);
    });
    return () => unsub();
  }, []);

  //Placeholder story for testing purpose
  useEffect(() => {
    (async () => {
      const snap = await getDoc(storyRef);
      if (!snap.exists()) {
        await setDoc(
          storyRef,
          {
            title: "Ancient Egypt and it’s contributions to modern day technology",
            audioUrl: FALLBACK_AUDIO,
            shared: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
    })().catch(console.error);
  }, [storyRef]);

  //owner UID is attached when the current uid is discovered
  useEffect(() => {
    if (!uid) return;
    setDoc(storyRef, { ownerUid: uid }, { merge: true }).catch(() => {});
  }, [uid, storyRef]);

  //updates the tile/audioURL
  useEffect(() => {
    const unsub = onSnapshot(storyRef, (snap) => {
      const d = snap.data() || {};
      setTitle(d.title || "Untitled story");
      setAudioUrl(d.audioUrl || "");
    });
    return () => unsub();
  }, [storyRef]);

//updates when like count or visability is updated
  useEffect(() => {
    const unsub = onSnapshot(postRef, (snap) => {
      const d = snap.data() || {};
      setLikesCount(Number(d.likes || 0));
      setPostVisible(!!d.visible);
    });
    return () => unsub();
  }, [postRef]);


  //updates when story is liked
  useEffect(() => {
    if (!likeRef) {
      setLiked(false);
      return;
    }
    const unsub = onSnapshot(likeRef, (snap) => setLiked(snap.exists()));
    return () => unsub();
  }, [likeRef]);

  //Audio elemt eventts wired up alongside the volume being synced with the state
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onLoaded = () => setDuration(a.duration || 0);
    const onTime = () => setCurrent(a.currentTime || 0);
    const onEnd = () => setIsPlaying(false);

    a.addEventListener("loadedmetadata", onLoaded);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnd);

    a.volume = volume;
    a.playbackRate = rate;

    return () => {
      a.removeEventListener("loadedmetadata", onLoaded);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnd);
    };
  }, [volume, rate, audioUrl]);


  //toggles play and pause on the audio elemnt
  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (isPlaying) {
      a.pause();
      setIsPlaying(false);
    } else {
      a.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };


//skips the selected seconds
  const seekBy = (secs) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, Math.min((a.currentTime || 0) + secs, duration));
  };
// converts the sliders value into a percentage and then sets the audios timestamp.
  const onTimeLineSet = (e) => {
    const a = audioRef.current;
    if (!a) return;
    const pct = Number(e.target.value) / 100;
    a.currentTime = pct * (duration || 0);
  };
//updates volume 
  const onVolume = (e) => {
    setVolume(Number(e.target.value));
  };
//toggles the like trough a function  
  const handleToggleLike = async () => {
    if (loadingLike) return;
    if (!auth.currentUser) {
      if (confirm("You’re not signed in. Go to login now?")) navigate("/login");
      return;
    }
    setLoadingLike(true);
    try {
      const likeFn = call("likeStory");
      const res = await likeFn({ storyId: STORY_ID });
      const likedNext = res?.data?.liked ?? res?.liked ?? liked;
      const likesNext = Number(res?.data?.likes ?? res?.likes ?? likesCount);
      setLiked(likedNext);
      setLikesCount(likesNext);
    } catch (e) {
      alert(e.message || "Failed to update like");
    } finally {
      setLoadingLike(false);
    }
  };

// Toggles the share 
const handleToggleShare = async () => {
  if (loadingShare) return;
  //checks if user is logged in
  if (!auth.currentUser) {
    if (confirm("You’re not signed in. Go to login now?")) navigate("/login");
    return;
  }
  setLoadingShare(true);
  const desired = !postVisible; 
  const prev = postVisible;     
  try {
    const shareStoryFn = call("shareStory");
    const res = await shareStoryFn({ storyId: STORY_ID, share: desired });
    // only update if server explicitly returns a boolean
    const serverShare = res?.data?.share ?? res?.share;
    if (typeof serverShare === "boolean") {
      setPostVisible(serverShare);
    } else {
      // keep the previous UI state,assuming that the server has not retunred a value
      setPostVisible(prev);
    }
  } catch (e) {
    console.error("shareStory failed:", e);
    alert(e.message || "Failed to share/unshare story");
    setPostVisible(prev);
  } finally {
    setLoadingShare(false);
  }
};


//progress percent for fill
  const pct = duration ? Math.max(0, Math.min(100, (current / duration) * 100)) : 0;

  return (
  <div className="relative flex min-h-screen flex-col items-center bg-gradient-to-b from-[#1B1340] to-[#C1B3E0] text-white">
    {/* Headings */}
    <TopHeadings posClass="absolute top-2 left-4 right-4" />
    
    {/* Divs can be positioned to the header */}
    <div className="w-full relative grid grid-cols-[auto_1fr_auto] items-center px-3 gap-3">
      <div className="justify-self-start" />

      {/* title and share */}
      <div className="absolute left-1/2 -translate-x-1/2 top-2 w-full max-w-[720px] z-[60]">
        <div
          className={`flex items-center justify-center gap-1 transition-all duration-700 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          <div className="flex-1 px-8 py-3 bg-white/10 rounded-2xl shadow-md text-center text-white/90 text-base font-semibold truncate">
            {title}
          </div>
      {/* Button that selects music, (currently using placeholders) */}
            <MusicSelectButton
              songs={[
                { id: "tut", title: "Hymn of Tutankhamun" },
                { id: "anubis", title: "Sound of Anubis" },
                { id: "ra", title: "The meaning of Ra" },
              ]}
              onSelect={(song) => console.log("Selected:", song)}
            />
          <ShareButton
            shared={postVisible}
            loading={loadingShare}
            onClick={handleToggleShare}
          />
         
        </div>
      </div>
    </div>

    {/* Audio Player */}
    <div className="flex-1 w-full grid place-items-center px-4">
      <div className="flex flex-col items-center">
        <AudioPlayer
          audioRef={audioRef}
          audioUrl={audioUrl || FALLBACK_AUDIO}
          mounted={mounted}
          isPlaying={isPlaying}
          current={current}
          duration={duration}
          pct={pct}
          formatTime={formatTime}
          onTimeLineSet={onTimeLineSet}
        />

        {/* Controls */}
        <div
          className={`mt-6 flex items-center justify-center gap-3 transition-all duration-700 delay-200 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          } relative z-[61]`}
        >
          <PlayerSpeed
            open={speedOpen}
            setOpen={setSpeedOpen}
            value={rate}
            setValue={setRate}
          />

          <VolumeSlider
            open={volOpen}
            setOpen={setVolOpen}
            value={volume}
            onChange={onVolume}
          />

          <TransportControls
            playing={isPlaying}
            onTogglePlay={togglePlay}
            onBack={() => seekBy(-15)}
            onForward={() => seekBy(15)}
          />

          <LikeButton
            liked={liked}
            loading={loadingLike}
            onClick={handleToggleLike}
            count={likesCount}
          />
        </div>
      </div>
    </div>
  </div>
);
}