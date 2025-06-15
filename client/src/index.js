import { configureStore } from "@reduxjs/toolkit";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App";
import { AuthProvider } from "./components/AppContext";
import "./index.css";
import rootReducer from "./reducers";

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
  </Provider>
);
