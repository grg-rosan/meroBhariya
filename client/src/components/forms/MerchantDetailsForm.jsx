import { useState } from "react";
import { Heading, Field, Input, Button } from "../../shared/ui/porter-ui";

function validate(form) {
  const errors = {};
  if (!form.businessName.trim())
    errors.businessName = "Business name is required";
  if (!form.address.trim()) errors.address = "Pickup address is required";
  return errors;
}

export default function MerchantDetailsForm({ onNext, loading = false }) {
  const [form, setForm] = useState({
    businessName: "",
    address: "",
    panNumber: "",
  });
  const [errors, setErrors] = useState({});

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const clear = (key) => setErrors((prev) => ({ ...prev, [key]: null }));

  function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = validate(form);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    onNext({
      businessName: form.businessName.trim(),
      address: form.address.trim(),
      panNumber: form.panNumber.trim() || null,
    });
  }

  return (
    <>
      <Heading
        title="Merchant details"
        sub="Tell us about your business and pickup location."
      />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Business name" error={errors.businessName}>
          <Input
            type="text"
            placeholder="Porter Mart Pvt. Ltd."
            required
            value={form.businessName}
            onChange={(e) => {
              set("businessName", e.target.value);
              clear("businessName");
            }}
          />
        </Field>
        <Field label="Pickup address" error={errors.address}>
          <Input
            type="text"
            placeholder="New Road, Kathmandu"
            required
            value={form.address}
            onChange={(e) => {
              set("address", e.target.value);
              clear("address");
            }}
          />
        </Field>
        <Field label="PAN number" error={errors.panNumber}>
          <Input
            type="text"
            placeholder="Optional"
            value={form.panNumber}
            onChange={(e) => {
              set("panNumber", e.target.value);
              clear("panNumber");
            }}
          />
        </Field>
        <Button loading={loading} className="mt-1">
          Continue →
        </Button>
      </form>
    </>
  );
}
