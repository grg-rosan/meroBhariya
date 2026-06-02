import { CheckCircle, XCircle } from "lucide-react";

function Banner({ color, icon: Icon, message, action }) {
  const isGreen = color.includes("green");
  return (
    <div className={`${color} rounded-xl p-4 mb-4 flex flex-col gap-2`}>
      <div className="flex items-center gap-2">
        <Icon size={16} className={isGreen ? "text-green-400" : "text-red-400"} />
        <span className={`text-sm font-medium ${isGreen ? "text-green-300" : "text-red-300"}`}>
          {message}
        </span>
      </div>
      {action && (
        <button type="button" onClick={action.onClick} className="text-xs text-sky-400 hover:underline self-start">
          {action.label}
        </button>
      )}
    </div>
  );
}

const GREEN = "bg-green-500/10 border border-green-700/50";
const RED   = "bg-red-500/10 border border-red-700/50";

export default function ScanFeedback({
  pickupSuccess,
  hubSuccess,
  deliverSuccess,
  scanError,
  geofenceError,
  onScanAnother,
}) {
  if (pickupSuccess)
    return (
      <Banner
        color={GREEN}
        icon={CheckCircle}
        message="Pickup recorded — take parcel to the hub for dispatcher scan."
        action={{ label: "Scan another package", onClick: onScanAnother }}
      />
    );

  if (hubSuccess)
    return (
      <Banner
        color={GREEN}
        icon={CheckCircle}
        message="Package dispatched from hub — you're out for delivery!"
        action={{ label: "Scan another package", onClick: onScanAnother }}
      />
    );

  if (deliverSuccess)
    return (
      <Banner
        color={GREEN}
        icon={CheckCircle}
        message="Delivery confirmed successfully!"
        action={{ label: "Scan another package", onClick: onScanAnother }}
      />
    );

  if (geofenceError)
    return (
      <Banner
        color={RED}
        icon={XCircle}
        message={`Too far from delivery address (${geofenceError.distanceMeters}m away). Move closer and try again.`}
      />
    );

  if (scanError)
    return <Banner color={RED} icon={XCircle} message={scanError} />;

  return null;
}