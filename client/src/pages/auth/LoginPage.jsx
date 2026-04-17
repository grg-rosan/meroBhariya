// src/pages/auth/LoginPage.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../modules/auth/AuthContext";
import {
  PageShell,
  Card,
  Brand,
  Heading,
  Field,
  Input,
  Button,
  ErrorAlert,
  Divider,
} from "../../shared/ui/porter-ui";

export default function LoginPage() {
  const { login } = useAuth();
  console.log("rednering login page")
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password); // AuthContext navigates on success
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell>
      <Card>
        <Brand subtitle="Ride & delivery Â· Kathmandu" />
        <Heading
          title="Welcome back"
          sub="Sign in to continue to your dashboard."
        />

        <ErrorAlert message={error} />

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Email">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </Field>

          <Field label="Password">
            <Input
              type="password"
              placeholder="Enter your Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="flex justify-end mt-1">
              <Link 
                to="/forgot-password" 
                className="text-xs text-zinc-500 hover:text-indigo-400 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </Field>

          <Button loading={submitting} className="mt-1">
            Sign in â†’
          </Button>
        </form>

        <Divider label="new to porter?" />

        <div className="flex flex-col gap-2.5">
          <Link to="/register/rider" className="no-underline">
            <button className="w-full bg-transparent border border-zinc-800 hover:border-zinc-600 rounded-xl py-3 text-sm text-zinc-400 hover:text-zinc-200 transition-colors flex items-center justify-center gap-2">
              Register as Rider
            </button>
          </Link>
          <Link to="/register/merchant" className="no-underline">
            <button className="w-full bg-transparent border border-zinc-800 hover:border-zinc-600 rounded-xl py-3 text-sm text-zinc-400 hover:text-zinc-200 transition-colors flex items-center justify-center gap-2">
              Register as Merchant
            </button>
          </Link>
        </div>
      </Card>
    </PageShell>
  );
}
