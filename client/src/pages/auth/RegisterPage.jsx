// src/pages/auth/RegisterPage.jsx
import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  PageShell, Card, Brand, Heading, StepBar,
  Field, Input, Select, Button, ErrorAlert, Divider,
} from "../../shared/ui/porter-ui";
import { API } from "../../shared/hooks/useApi.js"
// ─── Step 0: Role picker ────────────────────────────────────────────────────

function RolePicker({ onSelect }) {
  return (
    <>
      <Heading title="Create account" sub="Choose how you'll use Porter." />

      <div className="flex flex-col gap-3">
        {[
          { value: "rider", emoji: "🛵", label: "Rider", desc: "Deliver orders & earn per trip" },
          { value: "merchant", emoji: "🏪", label: "Merchant", desc: "List your store & accept orders" },
        ].map(r => (
          <button
            key={r.value}
            onClick={() => onSelect(r.value)}
            className="bg-zinc-950 border border-zinc-800 hover:border-orange-500 rounded-xl p-4 text-left transition-colors group"
          >
            <p className="text-sm font-semibold text-white group-hover:text-orange-400 transition-colors">
              {r.emoji} {r.label}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">{r.desc}</p>
          </button>
        ))}
      </div>

      <Divider label="already have an account?" />
      <Link to="/login" className="no-underline">
        <button className="w-full bg-transparent border border-zinc-800 hover:border-zinc-600 text-zinc-500 hover:text-zinc-300 text-sm rounded-xl py-2.5 transition-colors">
          Sign in instead
        </button>
      </Link>
    </>
  );
}

// ─── Step 1: Account info ───────────────────────────────────────────────────

function AccountForm({ role, onNext }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const clr = (k) => setErrors(p => ({ ...p, [k]: null }));

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email.includes("@")) e.email = "Valid email required";
    if (form.phone.length < 10) e.phone = "Valid phone required";
    if (form.password.length < 8) e.password = "Min. 8 characters";
    if (form.password !== form.confirm) e.confirm = "Passwords don't match";
    return e;
  }

  function handleNext(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onNext({ name: form.name, email: form.email, phone: form.phone, password: form.password });
  }

  const bind = (k) => ({
    value: form[k],
    onChange: e => { set(k, e.target.value); clr(k); },
  });

  return (
    <>
      <Heading
        title={role === "rider" ? "Join as Rider" : "Join as Merchant"}
        sub="Create your Porter account."
      />
      <form onSubmit={handleNext} className="flex flex-col gap-4">
        <Field label="Full name" error={errors.name}>
          <Input type="text" placeholder="Rosan Gurung" required {...bind("name")} />
        </Field>
        <Field label="Email" error={errors.email}>
          <Input type="email" placeholder="you@example.com" required {...bind("email")} />
        </Field>
        <Field label="Phone" error={errors.phone}>
          <Input type="tel" placeholder="98XXXXXXXX" required {...bind("phone")} />
        </Field>
        <Field label="Password" error={errors.password}>
          <Input type="password" placeholder="Min. 8 characters" required {...bind("password")} />
        </Field>
        <Field label="Confirm password" error={errors.confirm}>
          <Input type="password" placeholder="Re-enter password" required {...bind("confirm")} />
        </Field>
        <Button className="mt-1">Continue →</Button>
      </form>
    </>
  );
}

// ─── Step 2a: Rider vehicle details ────────────────────────────────────────

function RiderDetailsForm({ onNext, loading }) {
  const [form, setForm] = useState({ vehicleType: "Bike", plateNumber: "", address: "" });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  function handleNext(e) {
    e.preventDefault();
    onNext(form);
  }

  return (
    <>
      <Heading title="Vehicle details" sub="Tell us about your vehicle." />
      <form onSubmit={handleNext} className="flex flex-col gap-4">
        <Field label="Vehicle type">
          <Select value={form.vehicleType} onChange={e => set("vehicleType", e.target.value)}>
            <option value="Bike">🏍 Bike</option>
            <option value="Scooter">🛵 Scooter</option>
            <option value="Van">🚗 Van</option>
          </Select>
        </Field>
        <Field label="Plate / vehicle number">
          <Input
            type="text" placeholder="BA 1 PA 0001"
            value={form.plateNumber} onChange={e => set("plateNumber", e.target.value)} required
          />
        </Field>
        <Field label="Home address">
          <Input
            type="text" placeholder="Thamel, Kathmandu"
            value={form.address} onChange={e => set("address", e.target.value)} required
          />
        </Field>
        <Button loading={loading} className="mt-1">Submit →</Button>
      </form>
    </>
  );
}

// ─── Step 2b: Merchant business details ────────────────────────────────────

function MerchantDetailsForm({ onNext, loading }) {
  const [form, setForm] = useState({ businessName: "", businessType: "RESTAURANT", address: "", panNumber: "" });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  function handleNext(e) {
    e.preventDefault();
    onNext(form);
  }

  return (
    <>
      <Heading title="Business details" sub="Tell us about your business." />
      <form onSubmit={handleNext} className="flex flex-col gap-4">
        <Field label="Business name">
          <Input
            type="text" placeholder="Momo Corner Pvt. Ltd."
            value={form.businessName} onChange={e => set("businessName", e.target.value)} required
          />
        </Field>
        <Field label="Business type">
          <Select value={form.businessType} onChange={e => set("businessType", e.target.value)}>
            <option value="RESTAURANT">🍜 Restaurant</option>
            <option value="GROCERY">🛒 Grocery</option>
            <option value="PHARMACY">💊 Pharmacy</option>
            <option value="RETAIL">🛍 Retail</option>
            <option value="OTHER">📦 Other</option>
          </Select>
        </Field>
        <Field label="Business address">
          <Input
            type="text" placeholder="New Road, Kathmandu"
            value={form.address} onChange={e => set("address", e.target.value)} required
          />
        </Field>
        <Field label="PAN / VAT number (optional)">
          <Input
            type="text" placeholder="123456789"
            value={form.panNumber} onChange={e => set("panNumber", e.target.value)}
          />
        </Field>
        <Button loading={loading} className="mt-1">Submit →</Button>
      </form>
    </>
  );
}

// ─── Submit helper ──────────────────────────────────────────────────────────

async function submitRegistration(role, basicInfo, details) {
  const endpoint = role === "rider" ? "/api/auth/register/rider" : "/api/auth/register/merchant";
  const res = await fetch(`${API}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...basicInfo, ...details }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Registration failed");
  return data;
}

// ─── Main ───────────────────────────────────────────────────────────────────

const STEPS = ["Role", "Account", "Details", "Done"];

export default function RegisterPage() {
  const { role: urlRole } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(urlRole ? 1 : 0);
  const [role, setRole] = useState(urlRole || null);
  const [basicInfo, setBasicInfo] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function handleRolePick(r) { setRole(r); setStep(1); }
  function handleAccountNext(data) { setBasicInfo(data); setStep(2); }

  async function handleDetailsNext(details) {
    setError(null);
    setSubmitting(true);
    try {
      await submitRegistration(role, basicInfo, details);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell>
      <Card>
        <Brand />
        {role && <StepBar steps={STEPS} current={step} />}

        {step === 0 && <RolePicker onSelect={handleRolePick} />}
        {step === 1 && <AccountForm role={role} onNext={handleAccountNext} />}
        {step === 2 && role === "rider" && (
          <RiderDetailsForm onNext={handleDetailsNext} loading={submitting} />
        )}
        {step === 2 && role === "merchant" && (
          <MerchantDetailsForm onNext={handleDetailsNext} loading={submitting} />
        )}

        {step === 3 && (
          <>
            <div className="text-4xl mb-4">🎉</div>
            <Heading
              title="You're registered!"
              sub={
                role === "rider"
                  ? "Upload your documents to start accepting rides."
                  : "Upload business documents to go live on Porter."
              }
            />
            <Button onClick={() => navigate(role === "rider" ? "/rider/documents" : "/merchant/documents")}>
              Upload documents →
            </Button>
            <button
              onClick={() => navigate("/login")}
              className="w-full mt-3 bg-transparent border-none text-zinc-600 hover:text-zinc-400 text-sm cursor-pointer py-2 transition-colors"
            >
              Skip for now — sign in
            </button>
          </>
        )}

        <ErrorAlert message={error} />
      </Card>
    </PageShell>
  );
}