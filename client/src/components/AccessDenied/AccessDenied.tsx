import { Link } from "react-router-dom";
import { AlertCircle, Home } from "lucide-react";

interface AccessDeniedProps {
  title?: string;
  message?: string;
  icon?: "access" | "notfound";
}

export default function AccessDenied({
  title = "Accès refusé",
  message = "Vous n'avez pas l'autorisation d'accéder à cette page.",
  icon = "access",
}: AccessDeniedProps) {
  const isNotFound = icon === "notfound";

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50 overflow-hidden">
      <div className="text-center px-6 max-w-md">
        <AlertCircle
          className={`w-16 h-16 mx-auto mb-4 ${
            isNotFound ? "text-gray-400" : "text-red-500"
          }`}
        />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600 mb-8">{message}</p>
        <Link
          to="/home"
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          <Home size={18} />
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
