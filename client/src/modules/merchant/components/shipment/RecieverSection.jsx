// src/modules/merchant/components/shipment/components/RecieverSection.jsx
import AddressAutocomplete from "../AddressAutocomplete";
import { MapPin } from "lucide-react";

const inputCls = (hasError) =>
  `w-full px-3 py-2.5 text-sm rounded-lg border focus:outline-none transition-colors
   bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100
   placeholder-gray-400 dark:placeholder-zinc-500
   ${
     hasError
       ? "border-red-400 dark:border-red-500"
       : "border-gray-300 dark:border-zinc-600 focus:border-gray-500 dark:focus:border-zinc-400"
   }`;

const FieldLabel = ({ children, required }) => (
  <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">
    {children}
    {required && <span className="text-rose-400 ml-0.5">*</span>}
  </label>
);

const FieldError = ({ msg }) =>
  msg ? <p className="text-xs text-red-400 mt-1">{msg}</p> : null;

/**
 * @param {{
 *   receiverName: string,
 *   receiverPhone: string,
 *   deliveryAddress: string,
 *   districts: Array,
 *   errors: Record<string, string>,
 *   toDistrictName: string | null,
 *   onChange: (key: string, value: any) => void,
 *   onAddressChange: (addr: string, latLng: {lat,lng}|null, districtId: number|null) => void,
 * }} props
 */
export default function ReceiverSection({
  receiverName,
  receiverPhone,
  deliveryAddress,
  districts,
  errors,
  toDistrictName,
  onChange,
  onAddressChange,
}) {
  return (
    <div className="space-y-3">
      <div>
        <FieldLabel required>Full name</FieldLabel>
        <input
          value={receiverName}
          onChange={(e) => onChange("receiverName", e.target.value)}
          className={inputCls(errors.receiverName)}
          placeholder="Aarav Shah"
        />
        <FieldError msg={errors.receiverName} />
      </div>

      <div>
        <FieldLabel required>Phone</FieldLabel>
        <input
          value={receiverPhone}
          onChange={(e) => onChange("receiverPhone", e.target.value)}
          className={inputCls(errors.receiverPhone)}
          placeholder="98XXXXXXXX"
        />
        <FieldError msg={errors.receiverPhone} />
      </div>

      <AddressAutocomplete
        label="Delivery address"
        value={deliveryAddress}
        districts={districts}
        onChange={onAddressChange}
        error={errors.deliveryAddress}
        required
      />

      {toDistrictName && (
        <p className="text-xs text-gray-400 dark:text-zinc-600 flex items-center gap-1 -mt-1">
          <MapPin size={10} /> Delivery district: {toDistrictName}
        </p>
      )}
    </div>
  );
}
