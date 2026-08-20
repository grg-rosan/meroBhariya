import { useState, useEffect } from "react";
import { Heading, Field, Input, Select, Button } from "../../shared/ui/porter-ui";
import { apiGet } from "../../shared/hooks/useApi.js";
import AddressAutocomplete from "../../modules/merchant/components/AddressAutocomplete";

function validate(form) {
  const errors = {};
  if (!form.businessName.trim())
    errors.businessName = "Business name is required";
  if (!form.address.trim()) {
    errors.address = "Pickup address is required";
  } else if (!form.latitude || !form.longitude) {
    errors.address = "Please select a pickup address from the suggestions";
  }
  if (!form.districtId) errors.districtId = "Pickup district is required";
  return errors;
}

export default function MerchantDetailsForm({ onNext, loading = false }) {
  const [form, setForm] = useState({
    businessName: "",
    address: "",
    districtId: "",
    panNumber: "",
    latitude: null,
    longitude: null,
  });
  const [errors, setErrors] = useState({});
  const [districts, setDistricts] = useState([]);
  const [fetchingDistricts, setFetchingDistricts] = useState(true);

  useEffect(() => {
    apiGet("/api/districts")
      .then((res) => {
        setDistricts(res.data ?? []);
      })
      .catch((err) => {
        console.error("Failed to load districts", err);
      })
      .finally(() => {
        setFetchingDistricts(false);
      });
  }, []);

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
      districtId: Number(form.districtId),
      panNumber: form.panNumber.trim() || null,
      latitude: form.latitude,
      longitude: form.longitude,
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

        <AddressAutocomplete
          label="Pickup address"
          value={form.address}
          districts={districts}
          onChange={(addr, latLng, resolvedDistrictId) => {
            setForm((prev) => {
              const updated = {
                ...prev,
                address: addr,
                latitude: latLng?.lat ?? null,
                longitude: latLng?.lng ?? null,
              };
              if (resolvedDistrictId) {
                updated.districtId = resolvedDistrictId;
                clear("districtId");
              }
              return updated;
            });
            clear("address");
          }}
          error={errors.address}
          required
        />

        <Field label="Pickup district" error={errors.districtId}>
          <Select
            value={form.districtId}
            required
            disabled={fetchingDistricts}
            onChange={(e) => {
              set("districtId", e.target.value);
              clear("districtId");
            }}
          >
            <option value="">Select a district...</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.province})
              </option>
            ))}
          </Select>
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
