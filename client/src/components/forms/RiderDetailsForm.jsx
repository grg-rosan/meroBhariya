import { useState } from "react";
import {
  Heading,
  Field,
  Input,
  Select,
  Button,
} from "../../shared/ui/porter-ui";

const VEHICLE_TYPES = ["Bike", "Mini Truck", "Covered Van"];

function validate(form) {
  const errors = {};
  if (!form.vehicleType) errors.vehicleType = "Vehicle type is required";
  if (!form.plateNumber.trim())
    errors.plateNumber = "Vehicle number is required";
  return errors;
}

export default function RiderDetailsForm({ onNext, loading = false }) {
  const [form, setForm] = useState({
    vehicleType: VEHICLE_TYPES[0],
    plateNumber: "",
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
      vehicleType: form.vehicleType,
      plateNumber: form.plateNumber.trim(),
    });
  }

  return (
    <>
      <Heading
        title="Rider details"
        sub="Add the vehicle details for your rider profile."
      />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Vehicle type" error={errors.vehicleType}>
          <Select
            value={form.vehicleType}
            onChange={(e) => {
              set("vehicleType", e.target.value);
              clear("vehicleType");
            }}
          >
            {VEHICLE_TYPES.map((vehicle) => (
              <option key={vehicle} value={vehicle}>
                {vehicle}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Vehicle number" error={errors.plateNumber}>
          <Input
            type="text"
            placeholder="Ba 1 Pa 1234"
            required
            value={form.plateNumber}
            onChange={(e) => {
              set("plateNumber", e.target.value);
              clear("plateNumber");
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
