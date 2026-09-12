import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../../services/authService";
import "./Signup.css";

export default function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (loading) return;

    const fullName = formData.fullName.trim();
    const email = formData.email.trim().toLowerCase();
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!fullName) {
      setError("Please enter your full name.");
      return;
    }

    if (fullName.length < 2) {
      setError("Full name must contain at least 2 characters.");
      return;
    }

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // ==========================================
    // REGISTER
    // ==========================================

    try {
      setLoading(true);
      setError("");

      const response = await registerUser({
        fullName,
        email,
        password,
      });

      console.log(
        "REGISTRATION RESPONSE",
        response.data
      );

      // ========================================
      // SUCCESS
      // ========================================

      alert(
        response.data?.message ||
        "Account created successfully."
      );

      navigate("/login");

    } catch (error) {

      console.error(
        "REGISTRATION ERROR",
        error
      );

      const backendData =
        error?.response?.data;

      // Validation errors
      if (
        backendData?.errors &&
        Array.isArray(backendData.errors) &&
        backendData.errors.length > 0
      ) {
        setError(
          backendData.errors[0].message ||
          "Please check your account details."
        );

        return;
      }

      // Normal backend message
      if (backendData?.message) {
        setError(
          backendData.message
        );

        return;
      }

      setError(
        "Unable to create account. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">

      <div className="signup-container">

        {/* =====================================
            LEFT INFORMATION
        ====================================== */}

        <div className="signup-info">

          <div className="signup-brand">
            🚆 <span>ERJA</span>
          </div>

          <h1>
            Start Your
            <span> Railway Journey</span>
          </h1>

          <p>
            Create your ERJA account and let us
            monitor your journey, analyze railway
            availability, and discover possible
            booking strategies.
          </p>

          <div className="signup-features">

            <div>
              <span>🚆</span>

              <div>
                <strong>
                  Track Your Journey
                </strong>

                <small>
                  Keep all your railway journeys
                  in one place.
                </small>
              </div>
            </div>

            <div>
              <span>🔍</span>

              <div>
                <strong>
                  Monitor Availability
                </strong>

                <small>
                  ERJA checks chart and berth
                  availability.
                </small>
              </div>
            </div>

            <div>
              <span>🎯</span>

              <div>
                <strong>
                  Get Recommendations
                </strong>

                <small>
                  Discover possible booking
                  strategies.
                </small>
              </div>
            </div>

          </div>

        </div>


        {/* =====================================
            SIGNUP CARD
        ====================================== */}

        <div className="signup-card">

          <button
            type="button"
            className="signup-back"
            onClick={() => navigate("/")}
          >
            ← Home
          </button>


          <div className="signup-heading">

            <div className="signup-icon">
              👤
            </div>

            <h2>
              Create Account
            </h2>

            <p>
              Join ERJA to start monitoring
              your railway journeys
            </p>

          </div>


          {/* ===================================
              ERROR
          ==================================== */}

          {error && (
            <div className="signup-error">
              ⚠️ {error}
            </div>
          )}


          {/* ===================================
              FORM
          ==================================== */}

          <form onSubmit={handleSignup}>

            {/* Full Name */}

            <div className="signup-form-group">

              <label htmlFor="fullName">
                Full Name
              </label>

              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
                autoComplete="name"
                maxLength={100}
                required
              />

            </div>


            {/* Email */}

            <div className="signup-form-group">

              <label htmlFor="signup-email">
                Email
              </label>

              <input
                id="signup-email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />

            </div>


            {/* Password */}

            <div className="signup-form-group">

              <label htmlFor="signup-password">
                Password
              </label>

              <input
                id="signup-password"
                name="password"
                type="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                minLength={6}
                required
              />

              <small className="signup-help">
                Minimum 6 characters
              </small>

            </div>


            {/* Confirm Password */}

            <div className="signup-form-group">

              <label htmlFor="confirmPassword">
                Confirm Password
              </label>

              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                minLength={6}
                required
              />

            </div>


            {/* Submit */}

            <button
              type="submit"
              className="signup-submit"
              disabled={loading}
            >
              {loading
                ? "Creating Account..."
                : "Create Account →"}
            </button>

          </form>


          {/* ===================================
              LOGIN LINK
          ==================================== */}

          <div className="signup-login">

            <span>
              Already have an account?
            </span>

            <button
              type="button"
              onClick={() => navigate("/login")}
            >
              Login
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}