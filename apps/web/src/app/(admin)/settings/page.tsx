"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Icon } from "@/components/nk/primitives";
import { useAuthStore } from "@/store/auth.store";
import { patch } from "@/lib/api";
import { User } from "@/types";

// ── Schemas ───────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .regex(/^(\+977)?[9][6-9]\d{8}$/, "Must be a valid Nepal phone number")
    .or(z.literal("")),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Required"),
    newPassword: z.string().min(8, "Must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Required"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

// ── Input helper ──────────────────────────────────────────────────────────────

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--nk-muted)", marginBottom: 5 }}>
        {label}
      </label>
      {children}
      {error && (
        <div style={{ fontSize: 11.5, color: "var(--nk-danger)", marginTop: 4 }}>{error}</div>
      )}
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <div
      style={{
        padding: "14px 0",
        borderBottom: "1px solid var(--nk-border)",
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color: "var(--nk-muted)",
      }}
    >
      {title}
    </div>
  );
}

// ── Profile section ───────────────────────────────────────────────────────────

function ProfileSection() {
  const user = useAuthStore((s) => s.user);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? "",
      phone: user?.phone ?? "",
    },
  });

  async function onSubmit(values: ProfileForm) {
    try {
      const updated = await patch<User>("/auth/profile", {
        name: values.name,
        phone: values.phone || undefined,
      });
      const store = useAuthStore.getState();
      store.login(store.token!, updated);
      toast.success("Profile updated");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to update profile";
      toast.error(msg);
    }
  }

  return (
    <div className="nk-card" style={{ padding: "0 18px", marginBottom: 16 }}>
      <SectionHeader title="Profile" />
      <form onSubmit={handleSubmit(onSubmit)} style={{ paddingTop: 16, paddingBottom: 8 }}>
        {/* Read-only email */}
        <Field label="Email">
          <input
            className="nk-input"
            value={user?.email ?? ""}
            readOnly
            disabled
            style={{ opacity: 0.6, cursor: "not-allowed" }}
          />
        </Field>

        <Field label="Name" error={errors.name?.message}>
          <input
            className="nk-input"
            placeholder="Your name"
            {...register("name")}
          />
        </Field>

        <Field label="Phone" error={errors.phone?.message}>
          <input
            className="nk-input"
            placeholder="+977 98XXXXXXXX"
            {...register("phone")}
          />
        </Field>

        <div style={{ paddingBottom: 8 }}>
          <button
            type="submit"
            className="nk-btn nk-btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Change password section ───────────────────────────────────────────────────

function ChangePasswordSection() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  async function onSubmit(values: PasswordForm) {
    try {
      await patch("/auth/change-password", {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success("Password changed");
      reset();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to change password";
      toast.error(msg);
    }
  }

  return (
    <div className="nk-card" style={{ padding: "0 18px", marginBottom: 16 }}>
      <SectionHeader title="Change Password" />
      <form onSubmit={handleSubmit(onSubmit)} style={{ paddingTop: 16, paddingBottom: 8 }}>
        <Field label="Current password" error={errors.currentPassword?.message}>
          <input
            type="password"
            className="nk-input"
            placeholder="Current password"
            {...register("currentPassword")}
          />
        </Field>

        <Field label="New password" error={errors.newPassword?.message}>
          <input
            type="password"
            className="nk-input"
            placeholder="Min. 8 characters"
            {...register("newPassword")}
          />
        </Field>

        <Field label="Confirm new password" error={errors.confirmPassword?.message}>
          <input
            type="password"
            className="nk-input"
            placeholder="Repeat new password"
            {...register("confirmPassword")}
          />
        </Field>

        <div style={{ paddingBottom: 8 }}>
          <button
            type="submit"
            className="nk-btn nk-btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Changing…" : "Change password"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <div style={{ padding: 22, maxWidth: 600 }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.018em", margin: 0 }}>
          Settings
        </h1>
        <div style={{ fontSize: 12.5, color: "var(--nk-muted)", marginTop: 3 }}>
          Account and preferences.
        </div>
      </div>

      <ProfileSection />
      <ChangePasswordSection />

      {/* Session */}
      <div className="nk-card" style={{ padding: "0 18px" }}>
        <SectionHeader title="Session" />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 0",
            fontSize: 13,
          }}
        >
          <div>
            <div style={{ fontWeight: 500 }}>Sign out</div>
            <div style={{ fontSize: 11.5, color: "var(--nk-muted)", marginTop: 2 }}>
              End your current session.
            </div>
          </div>
          <button
            className="nk-btn nk-btn-secondary"
            style={{ gap: 6, color: "var(--nk-danger)" }}
            onClick={() => useAuthStore.getState().logout()}
          >
            <Icon name="logout" size={13} />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
