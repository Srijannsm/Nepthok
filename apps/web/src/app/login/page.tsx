"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { post } from "@/lib/api";
import { useAuthStore } from "../../store/auth.store";
import { User } from "../../types";
import { Icon, Logo } from "../../components/nk/primitives";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [showPw, setShowPw] = useState(false);
  const [mode, setMode] = useState<"email" | "phone">("email");
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const data = await post<{ accessToken: string; user: User }>("/auth/login", values);
      login(data.accessToken, data.user);
      router.push(data.user.role === "SUPER_ADMIN" ? "/superadmin" : "/dashboard");
    } catch {
      toast.error("Invalid email or password");
    }
  };

  return (
    <div className="nk-root nk-light" style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", minHeight: "100vh" }}>

      {/* ── Left: dark marketing hero ── */}
      <div style={{
        background: "var(--nk-fg)",
        color: "var(--nk-bg)",
        padding: 56,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative background circles */}
        <svg width="600" height="600" style={{ position: "absolute", right: -120, bottom: -120, opacity: 0.07 }} aria-hidden="true" viewBox="0 0 100 100">
          {[48, 36, 24, 12].map((r) => (
            <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="0.4" />
          ))}
          <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="0.4" />
          <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="0.4" />
        </svg>

        {/* Logo */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 9 }}>
          <span className="nk-logo-mark" style={{ width: 28, height: 28, borderRadius: 7, background: "var(--nk-bg)", fontSize: 13 }}>
            <span>N</span>
          </span>
          <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.022em" }}>Nepthok</span>
        </div>

        {/* Headline + feature bullets */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", maxWidth: 480 }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)", marginBottom: 16 }}>
            Seller Portal
          </div>
          <h1 style={{ fontSize: 44, fontWeight: 600, letterSpacing: "-0.028em", lineHeight: 1.05, margin: 0, color: "#fff" }}>
            Run your store like the team behind it never sleeps.
          </h1>
          <p style={{ marginTop: 18, fontSize: 15, lineHeight: 1.55, color: "rgba(255,255,255,0.65)", maxWidth: 420 }}>
            Real-time orders. Inventory that updates itself. Customer messaging built in.
            Nepali payments. One quiet, fast dashboard.
          </p>

          <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { icon: "zap",    title: "Real-time order & payment sync",   sub: "eSewa, Khalti, COD — reconciled to the rupee." },
              { icon: "layers", title: "Inventory across SKUs & variants",  sub: "Low-stock alerts before you sell out." },
              { icon: "msg",    title: "SMS your customers from one inbox", sub: "PRO tier · 2,000 messages / month." },
            ].map((f) => (
              <div key={f.title} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.08)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "rgba(255,255,255,0.85)" }}>
                  <Icon name={f.icon} size={15} />
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: "#fff" }}>{f.title}</div>
                  <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{f.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 14, fontSize: 11.5, color: "rgba(255,255,255,0.55)" }}>
          <span>Hosted in Singapore · sgp1</span>
          <span className="nk-sep" style={{ background: "rgba(255,255,255,0.4)" }} />
          <span>99.95% uptime · 30d</span>
          <span className="nk-sep" style={{ background: "rgba(255,255,255,0.4)" }} />
          <span>© 2026 Nepthok</span>
        </div>
      </div>

      {/* ── Right: sign-in form ── */}
      <div style={{ display: "flex", flexDirection: "column", padding: "40px 56px", background: "var(--nk-bg)" }}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <span style={{ fontSize: 12, color: "var(--nk-muted)" }}>
            Don't have an account?{" "}
            <a href="#" style={{ color: "var(--nk-fg)", textDecoration: "none", fontWeight: 500, borderBottom: "1px solid var(--nk-fg)" }}>
              Sign up
            </a>
          </span>
        </div>

        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "100%", maxWidth: 380 }}>
            <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.022em", margin: "0 0 6px" }}>Sign in</h1>
            <p style={{ fontSize: 13, color: "var(--nk-muted)", marginBottom: 28 }}>
              Enter your credentials to access your store dashboard.
            </p>

            {/* Mode tabs */}
            <div role="tablist" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: 3, background: "var(--nk-bg-2)", border: "1px solid var(--nk-border)", borderRadius: "var(--nk-r-md)", fontSize: 12.5, fontWeight: 500, marginBottom: 22 }}>
              {(["email", "phone"] as const).map((m) => (
                <button key={m} type="button" onClick={() => { setMode(m); setOtpSent(false); }} style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "7px 10px", borderRadius: 5, border: 0, cursor: "pointer",
                  background: mode === m ? "var(--nk-surface)" : "transparent",
                  color: mode === m ? "var(--nk-fg)" : "var(--nk-muted)",
                  boxShadow: mode === m ? "var(--nk-shadow-sm)" : "none",
                  transition: "background .12s,color .12s",
                }}>
                  <Icon name={m === "email" ? "mail" : "phone"} size={13} />
                  {m === "email" ? "Email" : "Phone · OTP"}
                </button>
              ))}
            </div>

            {mode === "email" ? (
              <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label className="nk-label">Work email</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--nk-muted)", pointerEvents: "none" }}>
                      <Icon name="mail" size={15} />
                    </span>
                    <input className="nk-input" style={{ paddingLeft: 34 }} placeholder="you@store.com" autoComplete="email" {...register("email")} />
                  </div>
                  {errors.email && <p style={{ fontSize: 11.5, color: "var(--nk-danger)", marginTop: 4 }}>{errors.email.message}</p>}
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <label className="nk-label">Password</label>
                    <a href="#" style={{ fontSize: 11.5, color: "var(--nk-accent)", textDecoration: "none", fontWeight: 500 }}>Forgot?</a>
                  </div>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--nk-muted)", pointerEvents: "none" }}>
                      <Icon name="lock" size={15} />
                    </span>
                    <input className="nk-input" style={{ paddingLeft: 34, paddingRight: 38 }} type={showPw ? "text" : "password"} placeholder="••••••••" autoComplete="current-password" {...register("password")} />
                    <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "transparent", border: 0, cursor: "pointer", color: "var(--nk-muted)", padding: 4 }}>
                      <Icon name={showPw ? "arrowUp" : "arrowDown"} size={14} />
                    </button>
                  </div>
                  {errors.password && <p style={{ fontSize: 11.5, color: "var(--nk-danger)", marginTop: 4 }}>{errors.password.message}</p>}
                </div>
                <button type="submit" className="nk-btn nk-btn-primary" style={{ width: "100%", height: 40, fontSize: 13.5 }} disabled={isSubmitting}>
                  {isSubmitting ? "Signing in…" : "Sign in to dashboard"}
                  {!isSubmitting && <Icon name="arrowRight" size={14} />}
                </button>
              </form>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label className="nk-label">Phone number</label>
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", left: 1, top: 1, bottom: 1, display: "inline-flex", alignItems: "center", gap: 6, padding: "0 10px 0 12px", borderRight: "1px solid var(--nk-border)", fontSize: 13, color: "var(--nk-fg-2)", background: "var(--nk-surface-2)", borderRadius: "var(--nk-r-md) 0 0 var(--nk-r-md)" }}>
                      <span style={{ width: 18, height: 12, background: "linear-gradient(to bottom, #dc143c 50%, #003893 50%)", borderRadius: 2, display: "inline-block" }} />
                      +977
                    </div>
                    <input className="nk-input nk-tnum" style={{ paddingLeft: 84 }} placeholder="98XXX XXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                </div>
                {otpSent && (
                  <div>
                    <label className="nk-label">6-digit code</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <input key={i} className="nk-input nk-tnum" maxLength={1} style={{ textAlign: "center", padding: 0, height: 42, fontSize: 16, fontWeight: 600 }} />
                      ))}
                    </div>
                  </div>
                )}
                <button type="button" className="nk-btn nk-btn-primary" style={{ width: "100%", height: 40, fontSize: 13.5 }} onClick={() => !otpSent && setOtpSent(true)}>
                  {otpSent ? "Verify & continue" : "Send OTP"}
                  <Icon name="arrowRight" size={14} />
                </button>
              </div>
            )}

            <div style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: "var(--nk-fg-2)" }}>
              New to Nepthok?{" "}
              <a href="#" style={{ color: "var(--nk-accent)", textDecoration: "none", fontWeight: 600 }}>
                Become a seller →
              </a>
            </div>
          </div>
        </div>

        <div style={{ fontSize: 11, color: "var(--nk-muted)", textAlign: "center" }}>
          Protected by Nepthok security · Built in Lalitpur 🇳🇵
        </div>
      </div>
    </div>
  );
}
