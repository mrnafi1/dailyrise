import { useState } from "react";
import { loginWithGoogle, signUpWithEmail, loginWithEmail, resetPassword } from "./firebase";

// ══════════════════════════════════════════════════════════════════════════════
// AUTH SCREEN — Login / Signup / Forgot Password / Google Sign-in
// ══════════════════════════════════════════════════════════════════════════════



export default function Auth({ onSuccess, lang }) {
  const [mode, setMode] = useState("login"); // login | signup | forgot
  const [email, sEmail] = useState("");
  const [password, sPassword] = useState("");
  const [confirmPw, sConfirmPw] = useState("");
  const [name, sName] = useState("");
  const [loading, sLoading] = useState(false);
  const [error, sError] = useState("");
  const [resetSent, sResetSent] = useState(false);

  const T = {
    en: {
      welcome: "Welcome Back", welcomeSub: "Sign in to sync your progress",
      signupTitle: "Create Account", signupSub: "Start your growth journey",
      forgotTitle: "Reset Password", forgotSub: "We'll email you a reset link",
      name: "Full Name", email: "Email", password: "Password", confirmPw: "Confirm Password",
      login: "Sign In", signup: "Create Account", reset: "Send Reset Link",
      noAccount: "Don't have an account?", haveAccount: "Already have an account?",
      signupLink: "Sign up", loginLink: "Sign in", forgotLink: "Forgot password?",
      backToLogin: "← Back to login", orContinue: "or continue with",
      google: "Continue with Google",
      resetSentMsg: "Check your email for the reset link!",
      errPwMatch: "Passwords don't match", errPwShort: "Password must be at least 6 characters",
      errGeneric: "Something went wrong. Please try again.",
      skipGuest: "Continue as Guest",
    },
    bn: {
      welcome: "স্বাগতম ফিরে", welcomeSub: "তোমার অগ্রগতি sync করতে লগইন করো",
      signupTitle: "অ্যাকাউন্ট তৈরি করো", signupSub: "তোমার উন্নতির যাত্রা শুরু করো",
      forgotTitle: "পাসওয়ার্ড রিসেট", forgotSub: "আমরা ইমেইলে reset link পাঠাবো",
      name: "পুরো নাম", email: "ইমেইল", password: "পাসওয়ার্ড", confirmPw: "পাসওয়ার্ড নিশ্চিত করো",
      login: "লগইন করো", signup: "অ্যাকাউন্ট তৈরি করো", reset: "রিসেট লিংক পাঠাও",
      noAccount: "অ্যাকাউন্ট নেই?", haveAccount: "আগে থেকে অ্যাকাউন্ট আছে?",
      signupLink: "সাইন আপ করো", loginLink: "লগইন করো", forgotLink: "পাসওয়ার্ড ভুলে গেছো?",
      backToLogin: "← লগইনে ফিরে যাও", orContinue: "অথবা চালিয়ে যাও",
      google: "Google দিয়ে চালিয়ে যাও",
      resetSentMsg: "তোমার ইমেইলে reset link পাঠানো হয়েছে, চেক করো!",
      errPwMatch: "পাসওয়ার্ড মিলছে না", errPwShort: "পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে",
      errGeneric: "কিছু একটা ভুল হয়েছে। আবার চেষ্টা করো।",
      skipGuest: "Guest হিসেবে চালিয়ে যাও",
    },
  };
  const t = T[lang] || T.en;

  const friendlyError = (code) => {
    const map = {
      "auth/user-not-found": lang === "bn" ? "এই ইমেইলে কোনো অ্যাকাউন্ট নেই" : "No account found with this email",
      "auth/wrong-password": lang === "bn" ? "ভুল পাসওয়ার্ড" : "Incorrect password",
      "auth/email-already-in-use": lang === "bn" ? "এই ইমেইল আগে থেকে ব্যবহৃত" : "Email already in use",
      "auth/invalid-email": lang === "bn" ? "অবৈধ ইমেইল" : "Invalid email address",
      "auth/weak-password": t.errPwShort,
      "auth/invalid-credential": lang === "bn" ? "ভুল ইমেইল বা পাসওয়ার্ড" : "Invalid email or password",
      "auth/popup-closed-by-user": "",
    };
    return map[code] || t.errGeneric;
  };

  const handleGoogle = async () => {
    sError(""); sLoading(true);
    try {
      const user = await loginWithGoogle();
      onSuccess(user);
    } catch (err) {
      const msg = friendlyError(err.code);
      if (msg) sError(msg);
    }
    sLoading(false);
  };

  const handleSubmit = async () => {
    sError("");
    if (mode === "forgot") {
      if (!email) { sError(lang === "bn" ? "ইমেইল দাও" : "Enter your email"); return; }
      sLoading(true);
      try {
        await resetPassword(email);
        sResetSent(true);
      } catch (err) {
        sError(friendlyError(err.code));
      }
      sLoading(false);
      return;
    }
    if (mode === "signup") {
      if (password.length < 6) { sError(t.errPwShort); return; }
      if (password !== confirmPw) { sError(t.errPwMatch); return; }
      sLoading(true);
      try {
        const user = await signUpWithEmail(email, password, name);
        onSuccess(user);
      } catch (err) {
        sError(friendlyError(err.code));
      }
      sLoading(false);
      return;
    }
    // login
    if (!email || !password) { sError(lang === "bn" ? "ইমেইল ও পাসওয়ার্ড দাও" : "Enter email and password"); return; }
    sLoading(true);
    try {
      const user = await loginWithEmail(email, password);
      onSuccess(user);
    } catch (err) {
      sError(friendlyError(err.code));
    }
    sLoading(false);
  };

  const iS = { background: "rgba(255,255,255,.07)", border: "1.5px solid rgba(255,255,255,.14)", borderRadius: 14, padding: "13px 16px", color: "#fff", fontSize: 15, outline: "none", width: "100%", boxSizing: "border-box" };
  const labelS = { fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: ".07em" };

  const title = mode === "login" ? t.welcome : mode === "signup" ? t.signupTitle : t.forgotTitle;
  const sub = mode === "login" ? t.welcomeSub : mode === "signup" ? t.signupSub : t.forgotSub;
  const icon = mode === "login" ? "🌅" : mode === "signup" ? "✨" : "🔑";

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#0d0b1e 0%,#1a1040 45%,#0d1a2e 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -100, right: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,111,255,0.2) 0%,transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -80, left: -60, width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle,rgba(167,139,250,0.13) 0%,transparent 70%)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: "linear-gradient(135deg,#6d5fff,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 12px", boxShadow: "0 8px 28px rgba(109,95,255,.45)" }}>🌅</div>
          <div style={{ fontSize: 19, fontWeight: 900, color: "#fff", letterSpacing: -.4 }}>DailyRise</div>
        </div>

        <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 28, padding: "26px 22px", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)" }}>
          {/* Reset success state */}
          {mode === "forgot" && resetSent ? (
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <div style={{ fontSize: 44, marginBottom: 14 }}>📧</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 8 }}>{t.resetSentMsg}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)", marginBottom: 20 }}>{email}</div>
              <button onClick={() => { setMode("login"); sResetSent(false); sError(""); }} style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 14, padding: "12px 20px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{t.backToLogin}</button>
            </div>
          ) : (
            <>
              <div style={{ textAlign: "center", marginBottom: 22 }}>
                <div style={{ width: 60, height: 60, borderRadius: 18, background: "linear-gradient(135deg,rgba(124,111,255,.25),rgba(167,139,250,.15))", border: "1px solid rgba(124,111,255,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 12px" }}>{icon}</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: -.4, marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>{sub}</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 6 }}>
                {mode === "signup" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={labelS}>{t.name}</span>
                    <input value={name} onChange={e => sName(e.target.value)} placeholder={lang === "bn" ? "যেমন: রাফিক" : "e.g. Rafiq"} style={iS} />
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={labelS}>{t.email}</span>
                  <input value={email} onChange={e => sEmail(e.target.value)} type="email" placeholder="you@example.com" style={iS} />
                </div>
                {mode !== "forgot" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={labelS}>{t.password}</span>
                    <input value={password} onChange={e => sPassword(e.target.value)} type="password" placeholder="••••••••" style={iS} onKeyDown={e => e.key === "Enter" && !loading && handleSubmit()} />
                  </div>
                )}
                {mode === "signup" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={labelS}>{t.confirmPw}</span>
                    <input value={confirmPw} onChange={e => sConfirmPw(e.target.value)} type="password" placeholder="••••••••" style={iS} onKeyDown={e => e.key === "Enter" && !loading && handleSubmit()} />
                  </div>
                )}
                {mode === "login" && (
                  <div style={{ textAlign: "right", marginTop: -4 }}>
                    <button onClick={() => { setMode("forgot"); sError(""); }} style={{ background: "none", border: "none", color: "#a78bfa", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}>{t.forgotLink}</button>
                  </div>
                )}
              </div>

              {error && <div style={{ background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 10, padding: "8px 12px", fontSize: 12, color: "#fca5a5", marginTop: 8, marginBottom: 4 }}>{error}</div>}

              <button onClick={handleSubmit} disabled={loading} style={{ width: "100%", marginTop: 14, padding: "13px", borderRadius: 14, background: "linear-gradient(135deg,#6d5fff,#a78bfa)", border: "none", color: "#fff", fontSize: 14, fontWeight: 800, cursor: loading ? "default" : "pointer", boxShadow: "0 4px 22px rgba(109,95,255,.4)", opacity: loading ? .7 : 1 }}>
                {loading ? "..." : mode === "login" ? t.login : mode === "signup" ? t.signup : t.reset}
              </button>

              {mode !== "forgot" && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0 14px" }}>
                    <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.1)" }} />
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,.35)" }}>{t.orContinue}</span>
                    <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.1)" }} />
                  </div>

                  <button onClick={handleGoogle} disabled={loading} style={{ width: "100%", padding: "12px", borderRadius: 14, background: "#fff", border: "none", color: "#1f1f1f", fontSize: 14, fontWeight: 700, cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                    <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.61z" /><path fill="#34A853" d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.35 0-4.34-1.58-5.05-3.71H.96v2.33A9 9 0 0 0 9 18z" /><path fill="#FBBC05" d="M3.95 10.71A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l2.99-2.33z" /><path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l2.99 2.33C4.66 5.16 6.65 3.58 9 3.58z" /></svg>
                    {t.google}
                  </button>
                </>
              )}

              <div style={{ textAlign: "center", marginTop: 18, fontSize: 12, color: "rgba(255,255,255,.4)" }}>
                {mode === "login" && <>{t.noAccount} <button onClick={() => { setMode("signup"); sError(""); }} style={{ background: "none", border: "none", color: "#a78bfa", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>{t.signupLink}</button></>}
                {mode === "signup" && <>{t.haveAccount} <button onClick={() => { setMode("login"); sError(""); }} style={{ background: "none", border: "none", color: "#a78bfa", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>{t.loginLink}</button></>}
                {mode === "forgot" && <button onClick={() => { setMode("login"); sError(""); }} style={{ background: "none", border: "none", color: "#a78bfa", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>{t.backToLogin}</button>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
