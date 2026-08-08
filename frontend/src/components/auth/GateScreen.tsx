"use client";

import { useLogin } from "@privy-io/react-auth";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Kind = "signup" | "login";

const COPY = {
  signup: {
    artist: {
      eyebrow: "SIGN UP · ARTIST",
      h1: (
        <>
          START GETTING <em>PAID</em> PER PLAY.
        </>
      ),
      lede: "One account, your wallet is created instantly. Every time your song plays, your share lands there — not 90 days from now.",
    },
    listener: {
      eyebrow: "SIGN UP · LISTENER",
      h1: (
        <>
          LISTEN. IT <em>LANDS</em> INSTANTLY.
        </>
      ),
      lede: "Create an account, get a wallet, and every song you play sends money to whoever made it. You can see the numbers yourself.",
    },
  },
  login: {
    eyebrow: "LOG IN",
    h1: <>YOUR WALLET IS STILL HERE.</>,
    lede: "Nothing to set up again. Log in the same way you did last time.",
    note: "Use the same Google account you signed up with. A different account means a different wallet.",
  },
};

/* Inline Google icon: one <svg>, no CDN request. */
function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M21.35 11.1h-9.17v2.98h5.27c-.23 1.37-1.63 4.02-5.27 4.02-3.17 0-5.76-2.63-5.76-5.87s2.59-5.87 5.76-5.87c1.8 0 3.01.77 3.7 1.43l2.52-2.43C16.78 3.9 14.7 3 12.18 3 6.99 3 2.8 7.19 2.8 12.38s4.19 9.38 9.38 9.38c5.42 0 9-3.81 9-9.17 0-.62-.07-1.09-.16-1.49z"
      />
    </svg>
  );
}

export function GateScreen({ kind, role }: { kind: Kind; role: "artist" | "listener" }) {
  const [waiting, setWaiting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { login } = useLogin({
    onComplete: () => setWaiting(false),
    onError: () => setWaiting(false),
  });

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function start() {
    setWaiting(true);
    timer.current = setTimeout(() => setWaiting(false), 12000);
    login();
  }

  const c = kind === "signup" ? COPY.signup[role] : COPY.login;

  return (
    <div className="auth-screen">
      <div className="auth-col auth-col-wide">
        <div className="eyebrow" style={{ marginBottom: "var(--a3)" }}>
          {c.eyebrow}
        </div>
        <h1 style={{ marginBottom: "var(--a3)" }}>{c.h1}</h1>
        <p className="lede" style={{ marginBottom: "var(--a5)" }}>
          {c.lede}
        </p>

        <div style={{ width: "100%", display: "grid", gap: "var(--a2)", justifyItems: "center" }}>
          <button
            className={`btn btn-purple${waiting ? " waiting" : ""}`}
            onClick={start}
            disabled={waiting}
          >
            {waiting ? (
              <>
                OPENING GOOGLE<span className="dots" />
              </>
            ) : (
              <>
                <GoogleMark /> CONTINUE WITH GOOGLE
              </>
            )}
          </button>

          <div style={{ minHeight: 26 }}>
            {waiting && (
              <p className="small" style={{ color: "var(--dimmer)" }}>
                The Google window is opening. Don&apos;t close this page.
              </p>
            )}
          </div>

          <button className="tlink" onClick={start} disabled={waiting}>
            or use a code sent to your email
          </button>
        </div>

        {kind === "login" && (
          <p
            className="small"
            style={{ maxWidth: "38ch", marginTop: "var(--a3)", color: "var(--dimmer)" }}
          >
            {COPY.login.note}
          </p>
        )}

        <div style={{ marginTop: "var(--a4)" }}>
          {kind === "signup" ? (
            <Link className="tlink" href="/login">
              Already have an account? <b>LOG IN</b>
            </Link>
          ) : (
            <Link className="tlink" href="/signup">
              Don&apos;t have an account? <b>SIGN UP</b>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
