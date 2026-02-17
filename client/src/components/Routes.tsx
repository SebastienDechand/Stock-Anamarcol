import { Routes, Route } from "react-router-dom";
import Login from "../pages/login/login";
import Home from "../pages/home/home";
import Profil from "../pages/profil/profil";
import Articles from "../pages/articles/articles";
import Membres from "../pages/membres/membres";
import Contacts from "../pages/contacts/contacts";
import HistoryPage from "../pages/history/history";
import Envois from "../pages/envois/envois";
import Layout from "./Layout";
import ProtectedRoute from "./ProtectedRoute";

export default function Router() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/home" element={<Home />} />
        <Route path="/profil" element={<Profil />} />
        <Route path="/articles" element={<Articles />} />
        <Route path="/membres" element={<Membres />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/envois" element={<Envois />} />
        <Route path="/history" element={<HistoryPage />} />
      </Route>
    </Routes>
  );
}
