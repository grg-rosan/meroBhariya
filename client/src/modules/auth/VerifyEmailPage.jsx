// src/pages/auth/VerifyEmailPage.jsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../modules/auth/AuthContext";
import { authAPI } from "../../shared/services/authService";
import { useToast } from "../../shared/context/ToastContext";
import VerifyOtpForm from "../../shared/components/VerifyOtpForm";
import { ROLE_HOME } from "../../shared/constants/roles";

export default function VerifyEmailPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleVerify = async (otp) => {
    await authAPI.verifyOtp(user.email, otp);
    setUser((prev) => ({ ...prev, isEmailVerified: true }));
    toast({ message: "Email verified successfully.", type: "success" });
    navigate(ROLE_HOME[user.role] ?? "/");
  };

  const handleResend = async () => {
    await authAPI.sendOtp(user.email);
    toast({ message: "Code resent to your email.", type: "success" });
  };

  return (
    <VerifyOtpForm
      email={user.email}
      onVerify={handleVerify}
      onResend={handleResend}
    />
  );
}