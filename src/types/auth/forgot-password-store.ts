export type ForgotPasswordStore = {
  open: boolean;
  sent: boolean;
  setOpen: (open: boolean) => void;
  setSent: (sent: boolean) => void;
  close: () => void;
};
