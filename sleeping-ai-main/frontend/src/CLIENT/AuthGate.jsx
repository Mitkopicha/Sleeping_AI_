import { useEffect, useState } from "react";
import {
  auth,
  functions,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  httpsCallable,
} from "./firebaseClient";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";

const IS_EMU = import.meta.env.VITE_USE_EMULATORS === "1";

export default function AuthGate({ children }) {
  const [user, setUser] = useState(null);
  const [topic, setTopic] = useState("Philosophy");
  const [result, setResult] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  async function signIn() {
    const email = "test@example.com";
    const password = "testing123";
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      if (e?.code === "auth/user-not-found" && IS_EMU) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        throw e;
      }
    }
  }

  async function callSummaries() {
    try {
      setResult("…calling…");
      const fn = httpsCallable(functions, "generateSummaries");
      const resp = await fn({ topic });
      setResult(JSON.stringify(resp.data, null, 2));
    } catch (e) {
      setResult(`Error: ${e?.message || String(e)}`);
      console.error(e);
    }
  }

  if (!user) {
    return (
      <div style={{ padding: 24 }}>
        <button onClick={signIn}>Sign in (dev)</button>
      </div>
    );
  }

  return (
    <>
      {/* Optional dev tools (shown only when using emulators) */}
      {IS_EMU && (
        <div style={{ padding: 12, fontSize: 12, display: "flex", gap: 8, alignItems: "center" }}>
          <span>Signed in as {user.email}</span>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            style={{ marginLeft: 8 }}
            placeholder="Topic"
          />
          <button onClick={callSummaries} style={{ marginLeft: 8 }}>
            Test Function
          </button>
          <button onClick={() => signOut(auth)} style={{ marginLeft: 8 }}>
            Sign out
          </button>
        </div>
      )}
      {children}
      {IS_EMU && <pre style={{ padding: 12, whiteSpace: "pre-wrap" }}>{result}</pre>}
    </>
  );
}
