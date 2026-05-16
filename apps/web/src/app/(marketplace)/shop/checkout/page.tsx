"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart.store";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

const SAVED_ADDRESS_KEY = "nepthok_saved_address";
const LAST_ORDER_KEY = "nepthok_last_order";

const PROVINCES = [
  "Bagmati",
  "Gandaki",
  "Lumbini",
  "Koshi",
  "Madhesh",
  "Karnali",
  "Sudurpaschim",
];

type PaymentMethod = "COD" | "ESEWA" | "KHALTI";
type MobileStep = 1 | 2 | 3;

interface Address {
  province: string;
  district: string;
  municipality: string;
  tole: string;
}

interface FormData {
  email: string;
  phone: string;
  address: Address;
  payment: PaymentMethod;
  saveAddress: boolean;
  discountCode: string;
}

function formatPrice(n: number) {
  return `Rs. ${n.toLocaleString("en-IN")}`;
}

function loadSavedAddress(): Address | null {
  try {
    const raw = localStorage.getItem(SAVED_ADDRESS_KEY);
    if (raw) return JSON.parse(raw) as Address;
  } catch {
    // ignore
  }
  return null;
}

// ─── Step indicator (mobile) ──────────────────────────────────────────────────
function StepIndicator({ current }: { current: MobileStep }) {
  const steps: { label: string; num: MobileStep }[] = [
    { label: "Contact", num: 1 },
    { label: "Address", num: 2 },
    { label: "Pay", num: 3 },
  ];
  return (
    <div className="flex items-center justify-center gap-0 mb-6">
      {steps.map((s, i) => {
        const done = current > s.num;
        const active = current === s.num;
        return (
          <div key={s.num} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-200 ${
                  done
                    ? "bg-blue-600 border-blue-600 text-white"
                    : active
                      ? "bg-white border-blue-600 text-blue-600"
                      : "bg-gray-100 border-gray-300 text-gray-400"
                }`}
              >
                {done ? "✓" : s.num}
              </div>
              <span
                className={`text-[10px] font-medium ${
                  active
                    ? "text-blue-600"
                    : done
                      ? "text-gray-700"
                      : "text-gray-400"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-12 h-px mb-5 mx-1 ${current > s.num ? "bg-blue-600" : "bg-gray-200"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Payment radio card ───────────────────────────────────────────────────────
function PaymentCard({
  id,
  label,
  description,
  selected,
  onSelect,
}: {
  id: PaymentMethod;
  label: string;
  description: string;
  selected: boolean;
  onSelect: (id: PaymentMethod) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`w-full text-left border rounded-lg p-3 transition-all duration-150 ${
        selected
          ? "border-blue-600 bg-blue-50 ring-1 ring-blue-300"
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      <div className="flex items-start gap-2">
        <div
          className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
            selected ? "border-blue-600" : "border-gray-300"
          }`}
        >
          {selected && (
            <div className="w-2 h-2 rounded-full bg-blue-600" />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
    </button>
  );
}

// ─── Input component ──────────────────────────────────────────────────────────
function Input({
  label,
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  required,
}: {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-10 px-3 border rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all duration-150 ${
          error ? "border-red-400 bg-red-50" : "border-gray-200"
        }`}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const initCart = useCartStore((s) => s.initCart);
  const hydrated = useCartStore((s) => s.hydrated);

  const [step, setStep] = useState<MobileStep>(1);
  const [form, setForm] = useState<FormData>({
    email: "",
    phone: "",
    address: { province: "", district: "", municipality: "", tole: "" },
    payment: "COD",
    saveAddress: false,
    discountCode: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) initCart();
  }, [hydrated, initCart]);

  // Pre-fill saved address on mount
  useEffect(() => {
    const saved = loadSavedAddress();
    if (saved) {
      setForm((f) => ({ ...f, address: saved }));
    }
  }, []);

  // Derived totals
  const itemEntries = Object.values(items);
  const subtotal = itemEntries.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery = subtotal >= 1500 ? 0 : 100;
  const discount = 0;
  const total = subtotal + delivery - discount;

  // ── Helpers ────────────────────────────────────────────────────────────────
  function setField<K extends keyof FormData>(key: K, val: FormData[K]) {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  function setAddress(key: keyof Address, val: string) {
    setForm((f) => ({ ...f, address: { ...f.address, [key]: val } }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  const validateContact = useCallback(() => {
    const errs: Record<string, string> = {};
    if (!form.email.trim()) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      errs.email = "Enter a valid email.";
    if (!form.phone.trim()) errs.phone = "Phone is required.";
    else if (!/^(97|98)\d{8}$/.test(form.phone.trim()))
      errs.phone = "Enter a valid 10-digit Nepal number (starts with 97 or 98).";
    return errs;
  }, [form.email, form.phone]);

  const validateAddress = useCallback(() => {
    const errs: Record<string, string> = {};
    if (!form.address.province) errs.province = "Province is required.";
    if (!form.address.district.trim()) errs.district = "District is required.";
    if (!form.address.municipality.trim())
      errs.municipality = "Municipality is required.";
    return errs;
  }, [form.address]);

  function handleNextStep() {
    if (step === 1) {
      const errs = validateContact();
      if (Object.keys(errs).length) { setErrors(errs); return; }
      setStep(2);
    } else if (step === 2) {
      const errs = validateAddress();
      if (Object.keys(errs).length) { setErrors(errs); return; }
      setStep(3);
    }
  }

  async function handleSubmit() {
    const contactErrs = validateContact();
    const addrErrs = validateAddress();
    const allErrs = { ...contactErrs, ...addrErrs };
    if (Object.keys(allErrs).length) {
      setErrors(allErrs);
      // On mobile, send back to the right step
      if (Object.keys(contactErrs).length) setStep(1);
      else setStep(2);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const body = {
      items: Object.values(items).map((i) => ({
        productId: i.productId,
        tenantId: i.tenantId,
        quantity: i.qty,
        price: i.price,
      })),
      customerEmail: form.email.trim(),
      customerPhone: `+977${form.phone.trim()}`,
      deliveryAddress: {
        province: form.address.province,
        district: form.address.district.trim(),
        municipality: form.address.municipality.trim(),
        tole: form.address.tole.trim(),
      },
      paymentMethod: form.payment,
      notes: "",
    };

    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const json = (await res.json()) as { message?: string };
        throw new Error(json.message || "Failed to place order.");
      }

      const json = (await res.json()) as {
        data: { id: string; orderNumber: string };
      };
      const { id: orderId, orderNumber } = json.data;

      // Save last order to localStorage
      try {
        localStorage.setItem(
          LAST_ORDER_KEY,
          JSON.stringify({ orderId, orderNumber, email: form.email.trim(), paymentMethod: form.payment })
        );
      } catch {
        // ignore
      }

      // Optionally save address
      if (form.saveAddress) {
        try {
          localStorage.setItem(
            SAVED_ADDRESS_KEY,
            JSON.stringify(form.address)
          );
        } catch {
          // ignore
        }
      }

      clearCart();
      router.push(`/shop/orders/${orderId}`);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (!hydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm animate-pulse">Loading…</p>
      </div>
    );
  }

  // ── Empty cart guard ───────────────────────────────────────────────────────
  if (itemEntries.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-4 text-center">
        <span className="text-5xl">🛒</span>
        <h1 className="text-xl font-semibold text-gray-900">
          Your cart is empty
        </h1>
        <a
          href="/shop"
          className="mt-2 inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors duration-150"
        >
          Continue shopping →
        </a>
      </div>
    );
  }

  // ── Shared section content ─────────────────────────────────────────────────
  const contactFields = (grid2col = false) => (
    <div className={grid2col ? "grid grid-cols-2 gap-4" : "flex flex-col gap-4"}>
      <Input
        label="Email"
        id="email"
        type="email"
        placeholder="you@example.com"
        value={form.email}
        onChange={(v) => setField("email", v)}
        error={errors.email}
        required
      />
      {/* Phone with +977 prefix */}
      <div className="flex flex-col gap-1">
        <label htmlFor="phone" className="text-sm font-medium text-gray-700">
          Phone<span className="text-red-500 ml-0.5">*</span>
        </label>
        <div
          className={`flex h-10 border rounded-lg overflow-hidden text-sm transition-all duration-150 ${
            errors.phone
              ? "border-red-400 bg-red-50"
              : "border-gray-200 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400"
          }`}
        >
          <span className="flex items-center px-3 bg-gray-100 text-gray-400 font-medium select-none shrink-0 border-r border-gray-200">
            +977
          </span>
          <input
            id="phone"
            type="tel"
            placeholder="98XXXXXXXX"
            value={form.phone}
            onChange={(e) => setField("phone", e.target.value)}
            className="flex-1 px-3 outline-none bg-transparent text-gray-900 placeholder-gray-400"
          />
        </div>
        {errors.phone ? (
          <p className="text-xs text-red-500">{errors.phone}</p>
        ) : (
          <p className="text-xs text-blue-600">
            We may call to confirm COD orders.
          </p>
        )}
      </div>
    </div>
  );

  const addressFields = (grid2col = false) => (
    <div className="flex flex-col gap-4">
      {/* Province + District */}
      <div className={grid2col ? "grid grid-cols-2 gap-4" : "flex flex-col gap-4"}>
        <div className="flex flex-col gap-1">
          <label htmlFor="province" className="text-sm font-medium text-gray-700">
            Province<span className="text-red-500 ml-0.5">*</span>
          </label>
          <select
            id="province"
            value={form.address.province}
            onChange={(e) => setAddress("province", e.target.value)}
            className={`h-10 px-3 border rounded-lg text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all duration-150 bg-white ${
              errors.province ? "border-red-400 bg-red-50" : "border-gray-200"
            }`}
          >
            <option value="">Select province…</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {errors.province && (
            <p className="text-xs text-red-500">{errors.province}</p>
          )}
        </div>
        <Input
          label="District"
          id="district"
          placeholder="e.g. Kathmandu"
          value={form.address.district}
          onChange={(v) => setAddress("district", v)}
          error={errors.district}
          required
        />
      </div>

      {/* Municipality */}
      <div className={grid2col ? "grid grid-cols-2 gap-4" : "flex flex-col gap-4"}>
        <Input
          label="Municipality / VDC"
          id="municipality"
          placeholder="e.g. Kathmandu Metropolitan"
          value={form.address.municipality}
          onChange={(v) => setAddress("municipality", v)}
          error={errors.municipality}
          required
        />
        {/* fill second col on desktop; skip on mobile */}
        {grid2col && <div />}
      </div>

      {/* Tole / Landmark */}
      <div className="flex flex-col gap-1">
        <label htmlFor="tole" className="text-sm font-medium text-gray-700">
          Tole / Landmark
        </label>
        <textarea
          id="tole"
          placeholder="Near Sundhara, opposite NIC Asia Bank…"
          value={form.address.tole}
          onChange={(e) => setAddress("tole", e.target.value)}
          rows={2}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all duration-150 resize-none"
        />
      </div>
    </div>
  );

  const paymentOptions = (grid3col = false) => (
    <div className={grid3col ? "grid grid-cols-3 gap-3" : "flex flex-col gap-3"}>
      <PaymentCard
        id="COD"
        label="Cash on Delivery"
        description="Pay when you receive · most popular"
        selected={form.payment === "COD"}
        onSelect={(id) => setField("payment", id)}
      />
      <PaymentCard
        id="ESEWA"
        label="eSewa"
        description="Pay with eSewa wallet"
        selected={form.payment === "ESEWA"}
        onSelect={(id) => setField("payment", id)}
      />
      <PaymentCard
        id="KHALTI"
        label="Khalti"
        description="Pay with Khalti wallet"
        selected={form.payment === "KHALTI"}
        onSelect={(id) => setField("payment", id)}
      />
    </div>
  );

  const orderSummaryBox = (
    <div className="border border-gray-200 rounded-lg bg-white p-4 flex flex-col gap-2.5">
      <h3 className="text-sm font-semibold text-gray-900">Order summary</h3>
      <div className="flex flex-col gap-2 text-sm text-gray-600">
        <div className="flex items-center justify-between">
          <span>Subtotal</span>
          <span className="font-mono font-medium text-gray-900">
            {formatPrice(subtotal)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Delivery</span>
          <span className="font-mono font-medium text-gray-900">
            {delivery === 0 ? (
              <span className="text-green-600">Free!</span>
            ) : (
              formatPrice(delivery)
            )}
          </span>
        </div>
        {discount > 0 && (
          <div className="flex items-center justify-between text-green-700">
            <span>Discount</span>
            <span className="font-mono font-medium">− {formatPrice(discount)}</span>
          </div>
        )}
        <div className="border-t border-gray-100 pt-2 flex items-center justify-between">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="font-mono text-base font-bold text-gray-900">
            {formatPrice(total)}
          </span>
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // MOBILE layout: stepped
  // ═══════════════════════════════════════════════════════════════════════════
  const mobileView = (
    <div className="lg:hidden min-h-screen bg-gray-50 px-4 py-6 pb-32">
      <StepIndicator current={step} />

      {/* Step 1: Contact */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              How do we reach you?
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              We use this to send order updates and tracking.
            </p>
          </div>
          {contactFields(false)}
        </div>
      )}

      {/* Step 2: Address */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Where should we deliver?
            </h2>
          </div>
          {addressFields(false)}
        </div>
      )}

      {/* Step 3: Payment */}
      {step === 3 && (
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-gray-900">
              How would you like to pay?
            </h2>
            {paymentOptions(false)}
            {form.payment === "COD" && (
              <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
                A delivery agent will collect cash when they hand over your
                package. You may be called to confirm delivery.
              </p>
            )}
          </div>
          {orderSummaryBox}
          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {submitError}
            </p>
          )}
        </div>
      )}

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 px-4 py-3">
        {step < 3 ? (
          <button
            type="button"
            onClick={handleNextStep}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-3 rounded-lg transition-colors duration-150"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold py-3 rounded-lg transition-colors duration-150 flex items-center justify-center gap-1"
          >
            {submitting ? (
              "Placing order…"
            ) : (
              <>
                <span>Place order ·</span>
                <span className="font-mono">{formatPrice(total)}</span>
              </>
            )}
          </button>
        )}
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((s) => (s - 1) as MobileStep)}
            className="w-full text-center text-sm text-gray-500 hover:text-gray-700 py-2 mt-1"
          >
            ← Back
          </button>
        )}
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // DESKTOP layout: 2-column single-page
  // ═══════════════════════════════════════════════════════════════════════════
  const desktopView = (
    <div className="hidden lg:block min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>
        <div className="grid grid-cols-[1fr_380px] gap-8 items-start">
          {/* ── LEFT COLUMN ──────────────────────────────────────────── */}
          <div className="flex flex-col gap-6">
            {/* Contact section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                Contact information
              </h2>
              {contactFields(true)}
            </div>

            {/* Delivery address section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                Delivery address
              </h2>
              {addressFields(true)}
              <div className="mt-4 flex items-center gap-2">
                <input
                  id="saveAddress"
                  type="checkbox"
                  checked={form.saveAddress}
                  onChange={(e) => setField("saveAddress", e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded accent-blue-600"
                />
                <label
                  htmlFor="saveAddress"
                  className="text-sm text-gray-600 cursor-pointer"
                >
                  ✓ Save to this browser
                </label>
              </div>
            </div>

            {/* Payment section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                Payment method
              </h2>
              {paymentOptions(true)}
              {form.payment === "COD" && (
                <p className="mt-4 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
                  A delivery agent will collect cash when they hand over your
                  package. You may be called to confirm delivery.
                </p>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN (sticky summary) ────────────────────────── */}
          <div className="sticky top-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4">
              <h2 className="text-base font-semibold text-gray-900">
                Order summary
              </h2>

              {/* Line items */}
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                {Object.values(items).map((item) => (
                  <div
                    key={`${item.productId}-${item.tenantId}`}
                    className="flex items-center justify-between text-sm text-gray-600 gap-2"
                  >
                    <span className="flex-1 truncate">
                      {item.productName}{" "}
                      <span className="text-gray-400">×{item.qty}</span>
                    </span>
                    <span className="font-mono font-medium text-gray-900 shrink-0">
                      {formatPrice(item.price * item.qty)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-3 flex flex-col gap-2 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono font-medium text-gray-900">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Delivery (KTM Valley)</span>
                  <span className="font-mono font-medium text-gray-900">
                    {delivery === 0 ? (
                      <span className="text-green-600">Free!</span>
                    ) : (
                      formatPrice(delivery)
                    )}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between text-green-700">
                    <span>Discount</span>
                    <span className="font-mono font-medium">
                      − {formatPrice(discount)}
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-100 pt-2.5 flex items-center justify-between">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span
                    className="font-mono text-xl font-bold text-gray-900"
                    style={{ fontFamily: "var(--font-geist-mono, monospace)" }}
                  >
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              {/* Discount code */}
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-gray-700">
                  Discount code
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.discountCode}
                    onChange={(e) => setField("discountCode", e.target.value)}
                    placeholder="Enter code"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all duration-150"
                  />
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors duration-150 shrink-0"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {submitError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {submitError}
                </p>
              )}

              {/* Place order */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold py-3 rounded-lg transition-colors duration-150 flex items-center justify-center gap-1"
              >
                {submitting ? (
                  "Placing order…"
                ) : (
                  <>Place order → {formatPrice(total)}</>
                )}
              </button>

              <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
                <span>🔒</span>
                <span>No account created. Order tracked via email.</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {mobileView}
      {desktopView}
    </>
  );
}
