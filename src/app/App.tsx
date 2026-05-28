import React from "react";
import { Provider } from "react-redux";
import { store } from "./store"
import AppRouter from "../routes/AppRouter";
import ToastConfig from "../services/ToastConfig";

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <div className="app-container">
        <AppRouter />
        <ToastConfig />
      </div>
    </Provider>
  );
};

export default App;