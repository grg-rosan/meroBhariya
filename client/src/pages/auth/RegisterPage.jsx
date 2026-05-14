import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  PageShell,
  Card,
  Brand,
  StepBar,
  Heading,
  Button,
} from "../../shared/ui/porter-ui";
import { authAPI } from "../../shared/services/authService";
import { useToast } from "../../context/ToastContext";
import RolePicker from "../../modules/auth/RolePicker";
import AccountForm from "../../components/forms/AccountForm";
import RiderDetailsForm from "../../components/forms/RiderDetailsForm";
import MerchantDetailsForm from "../../components/forms/MerchantDetailsForm";
import VerifyOtpForm from "../../components/forms/VerifyOtpForm";

const STEPS = ["Role", "Account", "Details", "Verify", "Done"];

export default function RegisterPage() {
  const { role: urlRole } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(urlRole ? 1 : 0);
  const [role, setRole] = useState(urlRole ?? null);
  const [basicInfo, setBasicInfo] = useState(null);
  const [registeredEmail, setRegisteredEmail] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function handleRolePick(r) {
    setRole(r);
    setStep(1);
  }
  function handleAccountNext(data) {
    setBasicInfo(data);
    setStep(2);
  }

  async function handleDetailsNext(details) {
    setSubmitting(true);
    try {
      await authAPI.initiateRegistration(role, { ...basicInfo, ...details });
      setRegisteredEmail(basicInfo.email);
      setStep(3);
    } catch {
      toast({
        message: "Registration failed. Please try again.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(otp) {
    await authAPI.completeRegistration(registeredEmail, otp);
    setStep(4);
  }

  return (
    <PageShell>
      <Card>
        <Brand />
        {role && <StepBar steps={STEPS} current={step} />}

        {step === 0 && <RolePicker onSelect={handleRolePick} />}
        {step === 1 && <AccountForm role={role} onNext={handleAccountNext} />}
        {step === 2 && role === "rider" && (
          <RiderDetailsForm onNext={handleDetailsNext} loading={submitting} />
        )}
        {step === 2 && role === "merchant" && (
          <MerchantDetailsForm
            onNext={handleDetailsNext}
            loading={submitting}
          />
        )}
        {step === 3 && (
          <VerifyOtpForm
            email={registeredEmail}
            onVerify={handleVerify}
            onResend={() => authAPI.resendRegistrationOtp(registeredEmail)}
          />
        )}
        {step === 4 && (
          <>
            <div className="text-4xl mb-4">🎉</div>
            <Heading
              title="Email verified!"
              sub="Your account is ready. Sign in to continue."
            />
            <Button onClick={() => navigate("/login")}>Go to login →</Button>
          </>
        )}
      </Card>
    </PageShell>
  );
}
