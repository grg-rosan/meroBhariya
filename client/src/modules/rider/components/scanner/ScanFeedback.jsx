import { CheckCircle, XCircle } from "lucide-react";

function Banner({ color, icon: Icon, message, action }) {
  return (
    <div className={`${color} rounded-xl p-4 mb-4 flex flex-col gap-2`}>
      <div className="flex items-center gap-2">
        <Icon size={16} className={color.includes("green") ? "text-green-400" : "text-red-400"} />
        <span className={`text-sm font-medium ${color.includes("green") ? "text-green-300" : "text-red-300"}`}>
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

export default function ScanFeedback({ pickupSuccess, deliverSuccess, scanError, geofenceError, onScanAnother }) {
  if (pickupSuccess) return (
    <Banner
      color="bg-green-500/10 border border-green-700/50"
      icon={CheckCircle}
      message="Pickup recorded — take parcel to the hub for dispatcher scan."
      action={{ label: "Scan another package", onClick: onScanAnother }}
    />
  );

  if (deliverSuccess) return (
    <Banner
      color="bg-green-500/10 border border-green-700/50"
      icon={CheckCircle}
      message="Delivery confirmed successfully!"
      action={{ label: "Scan another package", onClick: onScanAnother }}
    />
  );

  if (geofenceError) return (
    <Banner
      color="bg-red-500/10 border border-red-700/50"
      icon={XCircle}
      message={`Too far from delivery address (${geofenceError.distanceMeters}m away). Move closer and try again.`}
    />
  );

  if (scanError) return (
    <Banner
      color="bg-red-500/10 border border-red-700/50"
      icon={XCircle}
      message={scanError}
    />
  );

  return null;
}