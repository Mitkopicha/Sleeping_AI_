
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../CLIENT/firebaseClient";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

// Implements the user login functionality
const Login = () => {
  const navigate = useNavigate();

  //details state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); 

  // registers a new account
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  // sign in
  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err) {
      if (
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
      ) {
        setError("Login failed: Password or Username incorrect");
      } else {
        setError(err.message);
      }
    }
  };

  return (
    //centers the card
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-b from-[#1B1340] to-[#C1B3E0]">
     
      {/* Login card */}
      <div
        style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
        className="p-8 rounded-[31px] shadow-lg backdrop-blur-md w-[360px] h-[420px] text-white"
      >
        {/* Eror popup */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700 text-sm font-semibold">
            {error}
          </div>
        )}
        {/* Email  input */}
        <label className="block mb-2" htmlFor="email">Email 
        </label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mb-4 rounded-full bg-white/20 placeholder-white text-white focus:outline-none"
        />

        {/* Password  input */}
        <label className="block mb-2" htmlFor="password">
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mb-6 rounded-full bg-white/20 placeholder-white text-white focus:outline-none"
        />
        {/* Register buton */}
        <button
          onClick={handleRegister}
          style={{ backgroundColor: "rgba(193, 179, 224, 0.62)" }}
          className="w-full text-white py-2 rounded-full shadow-md transition"
        >
          Register
        </button>
        {/* Sign im button */}

        <button
          onClick={handleSignIn}
          style={{ backgroundColor: "rgba(193, 179, 224, 0.62)" }}
          className="w-full text-white py-2 rounded-full shadow-md transition mt-4"
        >
          Sign In
       
       </button>
      </div>
    </div>
  );
};

export default Login;
