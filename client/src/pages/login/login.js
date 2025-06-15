import { useState } from "react";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import "./login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [globalError, setGlobalError] = useState("");

  function handleLogin(e) {
    e.preventDefault();

    axios({
      method: "post",
      url: `${process.env.REACT_APP_API_URL}api/user/login`,
      withCredentials: true,
      data: {
        email,
        password,
      },
    })
      .then(() => {
        window.location = "/home";
      })
      .catch((err) => {
        setGlobalError("Les identifiants sont erronés. Veuillez réessayer.");
      });
  }

  return (
    <div className="login-ctn">
      <div className="login-welcome">
        <h1>Gestion de stock</h1>
        <h2>ANAMARCOL</h2>
      </div>
      <form className="login-logs" onSubmit={handleLogin} id="sign-up-form">
        <label htmlFor="email">E-mail</label>
        <input
          type="email"
          id="email"
          name="email"
          onChange={(e) => setEmail(e.target.value)}
          value={email}
          placeholder="exemple@gmail.com"
          required
        />

        <label htmlFor="password">Mot de passe</label>
        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            placeholder="*******"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className="toggle-password"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {globalError && <div className="error">{globalError}</div>}

        <input type="submit" value="Se connecter" className="form-btn" />
      </form>
    </div>
  );
}
