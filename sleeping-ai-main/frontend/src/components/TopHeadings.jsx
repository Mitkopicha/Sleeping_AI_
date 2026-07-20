import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../CLIENT/firebaseClient";
//the top headings representign the homepage,currency,settings and store (both the currency and store redirect to the same page)
//  and finally the login indicator, this compnent is displayed in every page except the login one.
const TopHeadings = () => {

  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState("");

// checks if email is empty 
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUserEmail(u?.email ?? "");
    });
    return () => unsub();
  }, []);

  return (
    <div className="absolute top-2 left-4 right-4 z-50 flex items-center gap-2">
      {/* div that positions buttons*/}
      <div className="flex gap-2 items-center">

        {/* Home redirects to the homepage where the topic can be selected.*/}
        <button
          onClick={() => navigate("/")}
          className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl backdrop-blur-md shadow-md hover:bg-white/10 transition"
          aria-label="Home"
        >
          <img
            src="/images/BookEmoticon.png"
            alt="Home"
            className="w-8 h-8 object-contain"
          />
        </button>

        {/* Credits showcases the current amount of credits in the users account, also redirects to the store*/}
        <button
          onClick={() => navigate("/credits")}
          className="w-16 h-10 flex items-center justify-center gap-1 bg-white/5 rounded-xl backdrop-blur-md shadow-md hover:bg-white/10 transition px-2"
          aria-label="Credits"
        >
          <img
            src="/images/coinsEmoticon.png"
            alt="Coins"
            className="w-7 h-7 object-contain"
          />
          <span className="text-sm font-semibold text-black">53</span>
        </button>

        {/* Settings button redirects to the user settings.*/}
        <button
          onClick={() => navigate("/settings")}
          className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl backdrop-blur-md shadow-md hover:bg-white/10 transition"
          aria-label="Settings"
        >
          <img
            src="/images/SettingsEmoticon.png"
            alt="Settings"
            className="w-8 h-8 object-contain"
          />
        </button>

        {/* Store button redirects to the credit purchasing store*/}
        <button
          onClick={() => navigate("/credits")}
          className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl backdrop-blur-md shadow-md hover:bg-white/10 transition"
          aria-label="Open credits store"
        >
          <img
            src="/images/storeEmoticon.png"
            alt="Store"
            className="w-8 h-8 object-contain"
          />
        </button>
      </div>

      {/* Login indicator checks if user is logged in, if they are then the email is displayed, if they are not a login button redirecting to login page is displayed */}
      <div
        className="h-10 max-w-[260px] px-5 flex items-center bg-white/5 rounded-xl backdrop-blur-md shadow-md text-xs text-white/80 truncate select-none cursor-pointer"
        role="status"
        aria-live="polite"
        title={userEmail || "Login"}
        onClick={() => {
          if (!userEmail) navigate("/login");
        }}
      >
        {userEmail ? `Signed in: ${userEmail}` : (
          <span className="underline underline-offset-2">Login</span>
        )}
      </div>
    </div>
  );
};

export default TopHeadings;
