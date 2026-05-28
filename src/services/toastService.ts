import { toast, type ToastPosition} from "react-toastify";

const AppToast = {
  showSuccess: (message: string, position: ToastPosition = "top-right") =>
    toast.success(message, { position }),

  showError: (message: string, position: ToastPosition = "top-right") =>
    toast.error(message, { position }),

  showInfo: (message: string, position: ToastPosition = "top-right") =>
    toast.info(message, { position }),
};

export default AppToast;