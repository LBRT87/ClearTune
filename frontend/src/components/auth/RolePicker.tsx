"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { homeFor, type Role } from "@/lib/profile-types";
import { randomListenerName } from "@/lib/display-name";

const ROLES: { key: Role; title: string; why: string; dest: string }[] = [
  {
    key: "artist",
    title: "ARTIST",
    why: "Upload your songs, set who gets what, and money lands in your wallet every time it plays.",
    dest: "→ /dashboard",
  },
  {
    key: "listener",
    title: "LISTENER",
    why: "You listen, and every play sends money to whoever made it. Nothing for you to manage.",
    dest: "→ /home",
  },
];

export function RolePicker({
  preselected,
  onDone,
}: {
  /** From the landing CTA's `?role=`. Preselects, doesn't lock in. */
  preselected: Role | null;
  onDone: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [picked, setPicked] = useState<Role | null>(preselected);
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [listenerName] = useState(randomListenerName);

  useEffect(() => {
    if (step === 2 && picked === "artist") inputRef.current?.focus();
  }, [step, picked]);

  function choose(role: Role) {
    setPicked(role);
    setErr("");
    setStep(2);
  }

  async function submit() {
    if (!picked) return;
    const displayName = picked === "artist" ? name.trim() : listenerName;

    if (picked === "artist" && !displayName) {
      setErr("Enter your artist name first.");
      return;
    }

    setSaving(true);
    setErr("");
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: picked, display_name: displayName }),
      });

      if (res.status === 409) {
        setErr(`"${displayName}" is already taken. Try another name.`);
        setSaving(false);
        inputRef.current?.focus();
        return;
      }

      if (!res.ok) {
        setErr("Couldn't save. Try again in a moment.");
        setSaving(false);
        return;
      }

      onDone();
      router.replace(homeFor(picked));
    } catch {
      setErr("Couldn't save. Try again in a moment.");
      setSaving(false);
    }
  }

  /* ── STEP 1 ── */
  if (step === 1) {
    return (
      <div className="auth-screen">
        <div className="auth-col">
          <div className="auth-steps" style={{ marginBottom: "var(--a3)" }}>
            <b>1</b>—<span>2</span>
            <span style={{ marginLeft: 10 }}>LAST STEP</span>
          </div>
          <p className="lede" style={{ marginBottom: "var(--a4)", color: "var(--ink)" }}>
            Who are you here as?
          </p>

          <div style={{ width: "100%", display: "grid", gap: "var(--a2)" }}>
            {ROLES.map((r) => (
              <button
                key={r.key}
                className={`role-row${picked === r.key ? " on" : ""}`}
                onClick={() => choose(r.key)}
              >
                <span style={{ display: "grid", gap: "var(--a1)" }}>
                  <h3>{r.title}</h3>
                  <span className="why">{r.why}</span>
                  <span className="dest">{r.dest}</span>
                </span>
                <span className="go">▸</span>
              </button>
            ))}
          </div>

          <p className="small" style={{ marginTop: "var(--a4)", color: "var(--dimmer)" }}>
            Your role decides where you land, not what you're allowed to do.
          </p>
        </div>
      </div>
    );
  }

  /* ── STEP 2 ── */
  const isArtist = picked === "artist";
  return (
    <div className="auth-screen">
      <div className="auth-col">
        <div className="auth-steps" style={{ marginBottom: "var(--a3)" }}>
          <span>1</span>—<b>2</b>
          <span style={{ marginLeft: 10 }}>{isArtist ? "ARTIST" : "LISTENER"}</span>
        </div>
        <p className="lede" style={{ marginBottom: "var(--a4)", color: "var(--ink)" }}>
          {isArtist ? "What name should your songs be published under?" : "Just one more tap."}
        </p>

        <div style={{ width: "100%", display: "grid", gap: "var(--a4)" }}>
          {isArtist ? (
            <div className={`field${err ? " bad" : ""}`}>
              <label htmlFor="stage-name">ARTIST NAME</label>
              <input
                id="stage-name"
                ref={inputRef}
                value={name}
                maxLength={24}
                autoComplete="off"
                placeholder="e.g. hindia"
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
              {err ? (
                <div className="err">
                  <b>!</b>
                  <span>{err}</span>
                </div>
              ) : (
                <div className="hint">
                  This name sticks to the credits of every song you publish.
                </div>
              )}
            </div>
          ) : (
            <div className="ph" style={{ textAlign: "left", borderColor: "#3a3a3a" }}>
              <div className="tag">YOUR DISPLAY NAME</div>
              <div className="data" style={{ color: "var(--ink)", fontSize: 26 }}>
                {listenerName}
              </div>
              <div className="say" style={{ margin: 0 }}>
                Generated automatically. Nothing for you to fill in.
              </div>
              {err && (
                <div className="err" style={{ marginTop: "var(--a1)" }}>
                  <b>!</b>
                  <span>{err}</span>
                </div>
              )}
            </div>
          )}

          <button
            className={`btn btn-purple${saving ? " waiting" : ""}`}
            onClick={submit}
            disabled={saving}
          >
            {saving ? (
              <>
                SAVING<span className="dots" />
              </>
            ) : isArtist ? (
              "GO TO DASHBOARD"
            ) : (
              "GO TO HOME"
            )}
          </button>
        </div>

        <button
          className="tlink"
          style={{ marginTop: "var(--a3)" }}
          onClick={() => {
            setErr("");
            setStep(1);
          }}
          disabled={saving}
        >
          ← change role
        </button>
      </div>
    </div>
  );
}
