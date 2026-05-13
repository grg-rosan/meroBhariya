// src/shared/utils/navigation.js

/**
 * Returns the destination coords + label based on shipment status.
 * AWAITING_PICKUP → merchant pickup location
 * PICKED_UP → no map pin (rider takes parcel to hub; hub coords not on shipment)
 * OUT_FOR_DELIVERY → receiver delivery location
 */
export function getShipmentDestination(stop) {
  if (!stop) return { lat: null, lng: null, label: "" };

  if (stop.status === "AWAITING_PICKUP") {
    return {
      lat:   stop.merchant?.pickupLat  ?? null,
      lng:   stop.merchant?.pickupLng  ?? null,
      label: stop.merchant?.pickupAddress ?? "Merchant pickup",
    };
  }

  if (stop.status === "PICKED_UP") {
    return {
      lat:   null,
      lng:   null,
      label: "Take parcel to the hub — dispatcher will scan it in.",
    };
  }

  return {
    lat:   stop.deliveryLat  ?? null,
    lng:   stop.deliveryLng  ?? null,
    label: stop.deliveryAddress ?? "Delivery address",
  };
}

/**
 * Opens the destination in Google Maps (Android/desktop) or
 * Apple Maps (iOS) via universal deep-link.
 */
export function openNavigation({ lat, lng, label = "" }) {
  if (!lat || !lng) return;

  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  const url = isIOS
    ? `maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`
    : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

  window.open(url, "_blank");
}