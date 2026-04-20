import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../../shared/services/authService";
import ForgotPasswordForm from "../../shared/components/ForgotPasswordForm";
import VerifyOtpForm from "../../shared/components/VerifyOtpForm";
import ResetPasswordForm from "../../shared/components/ResetPasswordForm";
import { useToast } from "../../shared/context/ToastContext";

export default function ForgotPasswordFlow() {
  const [step, setStep] = useState("forgot"); // "forgot" | "verify" | "reset"
  const [email, setEmail] = useState(null);
  const [resetCode, setResetCode] = useState(null);
  const navigate = useNavigate();
  const toast  = useToast()

  const handleForgotSubmit = async (email) => {
    await authAPI.forgotPassword(email); // sends the 6-digit code
    setEmail(email);
    setStep("verify");
  };

  const handleVerify = async (otp) => {
    await authAPI.verifyOtp(email, otp); // validates code
    setResetCode(otp);
    setStep("reset");
  };

  const handleResend = async () => {
    await authAPI.forgotPassword(email); // resend code
    toast({message:"Code Resent To Your Email", type:"success"})
  };

  const handleReset = async (password) => {
    await authAPI.resetPassword( email, resetCode, password );
    toast({message:"Password Change Sucessfully",type:"success"})
    navigate("/login", { replace: true });
  };

  if (step === "forgot")
    return (
      <ForgotPasswordForm onSubmit={handleForgotSubmit} />
    );

  if (step === "verify")
    return (
      <VerifyOtpForm
        email={email}
        onVerify={handleVerify}
        onResend={handleResend}
      />
    );

  if (step === "reset")
    return (
      <ResetPasswordForm onSubmit={handleReset} />
    );
}