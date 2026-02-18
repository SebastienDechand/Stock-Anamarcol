import { useState, useContext } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff, Package } from "lucide-react";
import { UidContext } from "../../components/AppContext";

export default function Login() {
  const { uid, isAuthLoading } = useContext(UidContext);

  if (!isAuthLoading && uid) {
    return <Navigate to="/home" replace />;
  }
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setGlobalError("");

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}api/user/login`,
        { email, password },
        { withCredentials: true },
      );
      window.location.href = "/home";
    } catch (err: unknown) {
      // Show rate-limit or server message if available, otherwise generic error
      if (
        axios.isAxiosError(err) &&
        err.response?.status === 429 &&
        err.response.data?.message
      ) {
        setGlobalError(err.response.data.message);
      } else {
        setGlobalError("Les identifiants sont erronés. Veuillez réessayer.");
      }
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-100 via-white to-brand-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gray-900 px-8 py-10 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-500 mb-4">
              <Package size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Gestion de Stock</h1>
            <p className="text-gray-400 mt-1 text-sm font-medium tracking-wide">
              ANAMARCOL
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="px-8 py-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Adresse e-mail
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemple@gmail.com"
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-2.5 pr-11 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {globalError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-lg">
                {globalError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 text-white font-semibold rounded-lg transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2"
            >
              {isLoading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          &copy; {new Date().getFullYear()} AnaMarCol - Stock Manager
        </p>
      </div>
    </div>
  );
}
