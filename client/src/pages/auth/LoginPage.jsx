import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../modules/auth/AuthContext";
import { ROLE_HOME } from "../../shared/constants/roles";
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
import { useToast } from "../../context/ToastContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const user = await login(email, password);
      if (!user.isEmailVerified) {
        navigate("/verify-email");
      } else {
        navigate(ROLE_HOME[user.role] ?? "/");
      }
    } catch {
      toast({ message: "Invalid Email or Password", type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell>
      <Card>
        <Brand subtitle="Ride & delivery · Kathmandu" />
        <Heading
          title="Welcome back"
          sub="Sign in to continue to your dashboard."
        />

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
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="flex justify-end mt-1">
              <Link
                to="/password/forgot"
                className="text-xs text-gray-400 dark:text-zinc-500 hover:text-indigo-400 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </Field>

          <Button loading={submitting} className="mt-1">
            Sign in
          </Button>
        </form>

        <Divider label="new to porter?" />

        <div className="flex flex-col gap-2.5">
          <Link to="/register/rider" className="no-underline">
            <button className="w-full bg-transparent border border-gray-200  hover:border-gray-400 dark:border-zinc-600 rounded-xl py-3 text-sm text-gray-500  hover:text-gray-800 dark:text-zinc-200 transition-colors">
              Register as Rider
            </button>
          </Link>
          <Link to="/register/merchant" className="no-underline">
            <button className="w-full bg-transparent border border-gray-200 dark:border-zinc-800 hover:border-gray-400 dark:border-zinc-600 rounded-xl py-3 text-sm text-gray-500  hover:text-gray-800 dark:text-zinc-200 transition-colors">
              Register as Merchant
            </button>
          </Link>
        </div>
      </Card>
    </PageShell>
  );
}
