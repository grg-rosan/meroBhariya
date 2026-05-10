// src/modules/merchant/hooks/useFarePreview.js
import { useState, useRef, useCallback, useEffect } from "react";
import { apiPost } from "../../../shared/hooks/useApi.js";

// getFarePreview response shape (from shipment.controller.js):
// { distanceKm, zone, baseFare, distanceFare, weightFare,
//   fragileCharge, zoneSurcharge, codFee, totalFare }

export function useFarePreview(form, fromDistrictId) {
  const [fareData, setFareData] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const timerRef                = useRef(null);

  const getFare = useCallback(async () => {
    const {
      deliveryLat, deliveryLng,
      weight, vehicleTypeId,
      isFragile, codAmount,
      paymentType, orderValue,
      toDistrictId,
    } = form;

    // Need all required fields before calling
    if (
      !deliveryLat || !deliveryLng     ||
      !weight      || Number(weight) <= 0 ||
      !fromDistrictId || !toDistrictId ||
      !orderValue  || Number(orderValue) <= 0
    ) {
      setFareData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiPost("/api/merchant/shipments/fare-preview", {
        vehicleTypeId:  Number(vehicleTypeId),
        weight:         parseFloat(weight),
        isFragile:      isFragile ?? false,
        orderValue:     parseFloat(orderValue),
        codAmount:      paymentType === "COD" ? parseFloat(codAmount || 0) : 0,
        paymentType,
        deliveryLat:    parseFloat(deliveryLat),
        deliveryLng:    parseFloat(deliveryLng),
        fromDistrictId: Number(fromDistrictId),
        toDistrictId:   Number(toDistrictId),
      });
      setFareData(res.data);
    } catch (e) {
      setError(e.message);
      setFareData(null);
    } finally {
      setLoading(false);
    }
  }, [form, fromDistrictId]);

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(getFare, 800);
    return () => clearTimeout(timerRef.current);
  }, [getFare]);

  return { fareData, loading, error };
}