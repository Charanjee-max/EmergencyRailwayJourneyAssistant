import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../services/authService";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (loading) return;

    try {
      setLoading(true);

      const response = await loginUser(email, password);

      console.log("LOGIN RESPONSE", response.data);

      const token = response.data.data.token;
      const user = response.data.data.user;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      navigate("/dashboard");
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message || "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      <div className="login-container">

        {/* Left side */}
        <div className="login-info">

          <div className="login-brand">
            🚆 <span>ERJA</span>
          </div>

          <h1>
            Emergency Railway
            <span> Journey Assistant</span>
          </h1>

          <p>
            Monitor your railway journey, analyze availability,
            and discover alternative booking possibilities.
          </p>

          <div className="login-features">

            <div>
              <span>🔍</span>
              <div>
                <strong>Monitor</strong>
                <small>Track journey availability</small>
              </div>
            </div>

            <div>
              <span>🧠</span>
              <div>
                <strong>Analyze</strong>
                <small>Analyze available berths</small>
              </div>
            </div>

            <div>
              <span>🎯</span>
              <div>
                <strong>Recommend</strong>
                <small>Find possible booking strategies</small>
              </div>
            </div>

          </div>

        </div>


        {/* Login card */}
        <div className="login-card">

          <button
            type="button"
            className="back-home"
            onClick={() => navigate("/")}
          >
            ← Home
          </button>

          <div className="login-heading">

            <div className="login-icon">
              🔐
            </div>

            <h2>Welcome Back</h2>

            <p>
              Login to continue to ERJA
            </p>

          </div>


          <form onSubmit={handleLogin}>

            <div className="login-form-group">

              <label htmlFor="email">
                Email
              </label>

              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />

            </div>


            <div className="login-form-group">

              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />

            </div>


            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login →"}
            </button>

          </form>

        </div>

      </div>

    </div>
  );
}