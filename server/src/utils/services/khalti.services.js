// server/src/services/khalti.service.js

import axios from "axios";

const khaltiApi = axios.create({
  baseURL: process.env.KHALTI_BASE_URL,
  headers: {
    Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

export const initiateKhaltiPayment = async ({
  amount,        // in NPR
  orderId,
  orderName,
  returnUrl,
  customerInfo,
}) => {
  const { data } = await khaltiApi.post("/epayment/initiate/", {
    return_url: returnUrl,
    website_url: process.env.FRONTEND_URL,
    amount: amount * 100,           // convert NPR → paisa
    purchase_order_id: orderId,
    purchase_order_name: orderName,
    customer_info: customerInfo,
    amount_breakdown: [
      { label: "Wallet Top-up", amount: amount * 100 },
    ],
  });
  return data; // { pidx, payment_url, expires_at }
};

export const verifyKhaltiPayment = async (pidx) => {
  const { data } = await khaltiApi.post("/epayment/lookup/", { pidx });
  return data; // { pidx, status, transaction_id, amount, ... }
};