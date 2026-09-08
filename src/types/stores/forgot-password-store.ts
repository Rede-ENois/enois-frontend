export type ForgotPasswordStore = {
  open: boolean;
  sent: boolean;
  loading: boolean;
  formError: unknown;
  setOpen: (open: boolean) => void;
  close: () => void;
  submit: (email: string) => Promise<void>;
};
