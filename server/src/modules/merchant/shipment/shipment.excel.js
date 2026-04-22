import * as XLSX from "xlsx";
import AppError from "../../../utils/error/appError.js";

export function parseExcelBuffer(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  if (!rows.length) throw new AppError("Excel file is empty.", 400);

  return rows.map((row, i) => {
    const get = (...keys) => {
      for (const k of keys) {
        const found = Object.keys(row).find((rk) => rk.trim().toLowerCase() === k.toLowerCase());
        if (found !== undefined) return row[found];
      }
      return "";
    };

    return {
      _rowIndex: i + 2,
      receiverName: String(get("receiverName", "receiver_name", "name")).trim(),
      receiverPhone: String(get("receiverPhone", "receiver_phone", "phone")).trim(),
      deliveryAddress: String(get("deliveryAddress", "delivery_address", "address")).trim(),
      vehicleTypeId: Number(get("vehicleTypeId", "vehicle_type_id", "vehicleType")),
      weight: Number(get("weight")),
      isFragile: ["true", "1", "yes"].includes(String(get("isFragile", "is_fragile")).toLowerCase()),
      orderValue: Number(get("orderValue", "order_value")),
      codAmount: Number(get("codAmount", "cod_amount")) || 0,
      paymentType: String(get("paymentType", "payment_type")).trim().toUpperCase(),
    };
  });
}

export function validateRow(row) {
  const errors = [];
  if (!row.receiverName) errors.push("receiverName is required");
  if (!row.receiverPhone) errors.push("receiverPhone is required");
  if (!row.deliveryAddress) errors.push("deliveryAddress is required");
  if (!row.vehicleTypeId) errors.push("vehicleTypeId is required");
  if (!row.weight || isNaN(row.weight)) errors.push("weight must be a number");
  if (!row.orderValue || isNaN(row.orderValue)) errors.push("orderValue must be a number");
  if (!["COD", "PREPAID"].includes(row.paymentType)) errors.push("paymentType must be COD or PREPAID");
  return errors;
}