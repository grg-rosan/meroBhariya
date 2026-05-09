import axios from "axios";

/**
 * Khalti API Client
 * This file is responsible ONLY for external HTTP communication.
 */

const khaltiApi = axios.create({
  baseURL: process.env.KHALTI_BASE_URL,
  headers: {
    Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

/**
 * Initiate a payment session with Khalti
 * @param {Object} payload - The payment details (amount, order_id, etc.)
 * @returns {Promise<Object>} Khalti response (pidx, payment_url)
 */
export async function requestKhaltiInitiate(payload) {
  try {
    const { data } = await khaltiApi.post("/epayment/initiate/", payload);
    return data;
  } catch (error) {
    // Extracts Khalti's specific error message if available
    const errorDetail = error.response?.data || error.message;
    console.error("Khalti Initiate Error:", errorDetail);
    throw errorDetail;
  }
}

/**
 * Verify/Lookup a payment using the pidx
 * @param {string} pidx - The unique payment identifier from Khalti
 * @returns {Promise<Object>} Status details (Completed, Pending, etc.)
 */
export async function requestKhaltiLookup(pidx) {
  try {
    const { data } = await khaltiApi.post("/epayment/lookup/", { pidx });
    return data;
  } catch (error) {
    const errorDetail = error.response?.data || error.message;
    console.error("Khalti Lookup Error:", errorDetail);
    throw errorDetail;
  }
}

/**
 * Optional: Check status (Alias for lookup, often used for background sync)
 */
export const checkPaymentStatus = async (pidx) => {
  return await requestKhaltiLookup(pidx);
};