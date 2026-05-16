"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";
import { Icon, Badge } from "@/components/nk/primitives";

interface AccessCheck { hasAccess: boolean; }

export default function MessagesPage() {
  const [compose, setCompose] = useState(false);
  const [phone, setPhone]     = useState("");
  const [body, setBody]       = useState("");

  const { data: access, isLoading: accessLoading } = useQuery<AccessCheck>({
    queryKey: ["access", "messages"],
    queryFn: () => get<AccessCheck>("/subscriptions/check-access?feature=sms"),
  });

  if (accessLoading) {
    return (
      <div style={{ padding: 22 }}>
        <div style={{ height: 28, width: 140, background: "var(--nk-bg-2)", borderRadius: 6 }} />
      </div>
    );
  }

  if (!access?.hasAccess) {
    return (
      <div style={{ padding: 22 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.018em", margin: "0 0 16px" }}>Messages</h1>
        <div className="nk-card" style={{ padding: "48px 24px", textAlign: "center" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--nk-bg-2)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <Icon name="lock" size={20} color="var(--nk-muted)" />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>PRO Feature</div>
          <div style={{ fontSize: 13, color: "var(--nk-muted)", maxWidth: 360, margin: "0 auto 18px", lineHeight: 1.5 }}>
            SMS messaging lets you reach customers directly from their order history. Available on the PRO plan with 2,000 messages/month.
          </div>
          <a href="/subscription" className="nk-btn nk-btn-primary" style={{ display: "inline-flex" }}>
            Upgrade to PRO <Icon name="arrowRight" size={13} />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.018em", margin: 0 }}>Messages</h1>
          <div style={{ fontSize: 12.5, color: "var(--nk-muted)", marginTop: 3 }}>SMS your customers · 2,000 messages/month</div>
        </div>
        <button className="nk-btn nk-btn-primary" style={{ gap: 6 }} onClick={() => setCompose(true)}>
          <Icon name="msg" size={14} />
          Compose
        </button>
      </div>

      {/* Compose panel */}
      {compose && (
        <div className="nk-card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>New Message</div>
            <button className="nk-btn nk-btn-ghost nk-btn-icon" onClick={() => setCompose(false)}>
              <Icon name="x" size={14} color="var(--nk-muted)" />
            </button>
          </div>
          <div>
            <label className="nk-label">Recipient phone</label>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 1, top: 1, bottom: 1, display: "inline-flex", alignItems: "center", gap: 6, padding: "0 10px 0 12px", borderRight: "1px solid var(--nk-border)", fontSize: 13, color: "var(--nk-fg-2)", background: "var(--nk-surface-2)", borderRadius: "var(--nk-r-md) 0 0 var(--nk-r-md)" }}>
                <span style={{ width: 18, height: 12, background: "linear-gradient(to bottom, #dc143c 50%, #003893 50%)", borderRadius: 2, display: "inline-block" }} />
                +977
              </div>
              <input
                className="nk-input nk-tnum"
                style={{ paddingLeft: 84 }}
                placeholder="98XXX XXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="nk-label">Message</label>
            <textarea
              className="nk-input"
              rows={4}
              placeholder="Type your message…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              style={{ resize: "vertical", minHeight: 80 }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 11.5, color: "var(--nk-muted)" }}>
              <span>{body.length} chars</span>
              <span>{Math.ceil(body.length / 160)} SMS segment{Math.ceil(body.length / 160) !== 1 ? "s" : ""}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="nk-btn nk-btn-secondary" onClick={() => setCompose(false)}>Cancel</button>
            <button
              className="nk-btn nk-btn-primary"
              disabled={!phone || !body}
              onClick={() => {
                setCompose(false);
                setPhone("");
                setBody("");
              }}
            >
              Send SMS <Icon name="arrowRight" size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Empty state / integration note */}
      <div className="nk-card" style={{ padding: "48px 24px", textAlign: "center" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--nk-bg-2)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
          <Icon name="msg" size={20} color="var(--nk-muted)" />
        </div>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>SMS integration coming soon</div>
        <div style={{ fontSize: 13, color: "var(--nk-muted)", maxWidth: 400, margin: "0 auto", lineHeight: 1.5 }}>
          The messaging module is built and ready. Once the SMS integration is configured, you'll be able to send messages directly to customers from their order history.
        </div>
      </div>
    </div>
  );
}
