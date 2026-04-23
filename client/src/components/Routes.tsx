import { Routes, Route } from "react-router-dom";
import Login from "../pages/login/login";
import Home from "../pages/home/home";
import Profil from "../pages/profil/profil";
import Articles from "../pages/articles/articles";
import Membres from "../pages/membres/membres";
import Contacts from "../pages/contacts/contacts";
import HistoryPage from "../pages/history/history";
import Envois from "../pages/envois/envois";
import Flotte from "../pages/flotte/flotte";
import FichesClients from "../pages/fiches-clients/fichesClients";
import DossierClient from "../pages/fiches-clients/DossierClient";
import AdminRoles from "../pages/admin-roles/adminRoles";
import Surveillance from "../pages/surveillance/surveillance";
import NotFound from "../pages/not-found/NotFound";
import Layout from "./Layout";
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";

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
        <Route path="/flotte" element={<AdminRoute><Flotte /></AdminRoute>} />
        <Route path="/history" element={<AdminRoute><HistoryPage /></AdminRoute>} />
        <Route path="/fiches-clients" element={<FichesClients />} />
        <Route path="/fiches-clients/:id" element={<DossierClient />} />
        <Route path="/admin/roles" element={<AdminRoute superAdminOnly><AdminRoles /></AdminRoute>} />
        <Route path="/surveillance" element={<AdminRoute><Surveillance /></AdminRoute>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
