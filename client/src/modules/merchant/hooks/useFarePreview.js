import { useState, useRef, useCallback, useEffect } from "react";
import { apiPost } from "../../../shared/hooks/useApi";

export function useFarePreview(form) {
  const [fareData, setFareData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fareTimerRef = useRef(null);

  const getFare = useCallback(async () => {
    const { deliveryLatLng, weightKg, deliveryAddress, vehicleTypeId, isFragile, codAmount } = form;
    
    // Validation: Don't call API if essential data is missing
    if (!deliveryLatLng || !weightKg || weightKg <= 0) {
      setFareData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await apiPost("/api/merchant/shipments/fare-preview", {
        pickupAddress: "Merchant pickup address", // Replace with actual merchant location if available
        deliveryAddress,
        weightKg: parseFloat(weightKg),
        isFragile,
        codAmount: parseFloat(codAmount || 0),
        vehicleTypeId,
      });
      setFareData(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [form]);

  // Debounce effect
  useEffect(() => {
    clearTimeout(fareTimerRef.current);
    fareTimerRef.current = setTimeout(getFare, 800);
    
    return () => clearTimeout(fareTimerRef.current);
  }, [getFare]);

  return { fareData, loading, error, setFareData };
}