import axios from "axios";
import AppError from "../error/appError.js";
import logger from "./logger.js";
import { deflateRaw } from "node:zlib";
import { khaltiConfig } from "../../config/khalti.config.js";


const khaltiApi = axios.create({
  baseURL: khaltiConfig.KHALTI_BASE_URL,
  headers: {
    Authorization: `Key ${khaltiConfig.KHALTI_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

export async function requestKhaltiInitiate(payload) {
  try {
    const { data } = await khaltiApi.post("/epayment/initiate/", {
      
    });
    return data;
  } catch (error) {
    const errorDetail = error.response?.data || error.message;
    logger.error({error: error, detail: errorDetail()});
    throw AppError(errorDetail?.detail || errorDetail?.message ||"Khalti Payment Initiation Failed",  error.response?.status || 502) ;
  }
}

export async function requestKhaltiLookup(pidx) {
  try {
    const { data } = await khaltiApi.post("/epayment/lookup/", { pidx });
    return data;
  } catch (error) {
    const errorDetail = error.response?.data || error.message;
    logger.error({ err: error, detail: errorDetail }, "Khalti lookup failed");
    throw new AppError(
      errorDetail?.detail || errorDetail?.message || "Khalti payment lookup failed",
      error.response?.status || 502
    );
  }
}

export const checkPaymentStatus = async (pidx) => {
  return await requestKhaltiLookup(pidx);
};