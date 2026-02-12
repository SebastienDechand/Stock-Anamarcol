import { configureStore } from "@reduxjs/toolkit";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import axios from "axios";
import App from "./App";
import { AuthProvider } from "./components/AppContext";
import "./index.css";
import rootReducer from "./reducers";

axios.defaults.withCredentials = true;

const store = configureStore({
  reducer: rootReducer,
  devTools: false,
});

const root = createRoot(document.getElementById("root"));

root.render(
  <Provider store={store}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </Provider>,
);
