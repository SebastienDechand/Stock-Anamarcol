import { Routes, Route } from "react-router-dom";
import Login from "../pages/login/login";
import Home from "../pages/home/home";
import Profil from "../pages/profil/profil";
import Articles from "../pages/articles/articles";
import Membres from "../pages/membres/membres";
import Contacts from "../pages/contacts/contacts";
import HistoryPage from "../pages/history/history";
import Envois from "../pages/envois/envois";
import FichesClients from "../pages/fiches-clients/fichesClients";
import RapportsIntervention from "../pages/rapports-intervention/rapportsIntervention";
import AdminRoles from "../pages/admin-roles/adminRoles";
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
        <Route path="/fiches-clients" element={<FichesClients />} />
        <Route
          path="/rapports-intervention"
          element={<RapportsIntervention />}
        />
        <Route path="/admin/roles" element={<AdminRoles />} />
      </Route>
    </Routes>
  );
}
