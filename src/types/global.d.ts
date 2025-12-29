import { RecaptchaVerifier } from 'firebase/auth';
import { ConfirmationResult } from 'firebase/auth';

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | null;
    confirmationResult: ConfirmationResult | null;
    __preventSearchClear?: boolean;
  }
}

export {};