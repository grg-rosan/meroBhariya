// src/modules/auth/ForgotPassword.jsx
import { useState } from "react";
import SendOtpForm from "./components/SendOtpForm";
import VerifyOtpForm from "./components/VerifyOtpForm";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const [step, setStep] = useState("send");   // "send" | "verify"
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleOtpSent = (email) => {
    setEmail(email);
    setStep("verify");
  };

  const handleVerified = (result) => {
    // result.verified === true, or result.token if your server returns one
    navigate("/reset-password");
  };

  return (
    <div>
      {step === "send" && (
        <SendOtpForm onSuccess={handleOtpSent} />
      )}
      {step === "verify" && (
        <VerifyOtpForm
          email={email}
          onSuccess={handleVerified}
          onResend={() => console.log("OTP resent")}
        />
      )}
    </div>
  );
}