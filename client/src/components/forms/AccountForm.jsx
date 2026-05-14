import { useState } from "react";
import { Heading, Field, Input, Button } from "../../shared/ui/porter-ui";

function validate(form) {
  const e = {};
  if (!form.name.trim())          e.name     = "Full name is required";
  if (!form.email.includes("@"))  e.email    = "Valid email required";
  if (form.phone.length < 10)     e.phone    = "Valid phone required";
  if (form.password.length < 8)   e.password = "Min. 8 characters";
  if (form.password !== form.confirm) e.confirm = "Passwords don't match";
  return e;
}

export default function AccountForm({ role, onNext }) {
  const [form, setForm]     = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const clr = (k)    => setErrors((p) => ({ ...p, [k]: null }));

  const bind = (k) => ({
    value:    form[k],
    onChange: (e) => { set(k, e.target.value); clr(k); },
  });

  function handleNext(e) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onNext({ name: form.name, email: form.email, phone: form.phone, password: form.password });
  }

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