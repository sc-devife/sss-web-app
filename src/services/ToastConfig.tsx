import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ToastConfig = () => {
  return (
    <ToastContainer
      position="top-right"       
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      toastStyle={{
        minHeight: "35px",     
        maxWidth: "300px",      
        padding: "10px 15px",    
        fontSize: "14px",    
      }}
    />
  );
};

export default ToastConfig;
