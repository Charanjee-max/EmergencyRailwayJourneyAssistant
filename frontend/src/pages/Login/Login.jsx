import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { loginUser } from "../../services/authService";

import "./Login.css";


export default function Login() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);


    // =========================================================
    // LOGIN
    // =========================================================

    const handleLogin = async (e) => {

        e.preventDefault();

        if (loading) {
            return;
        }

        try {

            setLoading(true);

            const response =
                await loginUser(
                    email.trim().toLowerCase(),
                    password
                );

            console.log(
                "LOGIN RESPONSE",
                response.data
            );


            // =====================================================
            // GET LOGIN DATA
            // =====================================================

            const token =
                response?.data?.data?.token;

            const user =
                response?.data?.data?.user;


            if (!token) {

                throw new Error(
                    "Login succeeded but no authentication token was received."
                );
            }


            // =====================================================
            // SAVE AUTH DATA
            // =====================================================

            localStorage.setItem(
                "token",
                token
            );

            if (user) {

                localStorage.setItem(
                    "user",
                    JSON.stringify(user)
                );

            }


            // =====================================================
            // GO TO DASHBOARD
            // =====================================================

            navigate(
                "/dashboard",
                {
                    replace: true,
                }
            );

        } catch (error) {

            console.error(
                "LOGIN ERROR:",
                error
            );


            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Login failed. Please try again.";


            alert(message);

        } finally {

            setLoading(false);

        }
    };


    // =========================================================
    // GO TO SIGNUP
    // =========================================================

    const handleCreateAccount = () => {

        navigate("/signup");

    };


    // =========================================================
    // UI
    // =========================================================

    return (

        <div className="login-page">

            <div className="login-container">


                {/* =================================================
                    LEFT INFORMATION
                ================================================= */}

                <div className="login-info">

                    <div className="login-brand">

                        🚆

                        <span>
                            ERJA
                        </span>

                    </div>


                    <h1>

                        Emergency Railway

                        <span>
                            Journey Assistant
                        </span>

                    </h1>


                    <p>

                        Monitor your railway journey,
                        analyze availability, and
                        discover alternative booking
                        possibilities.

                    </p>


                    {/* =================================================
                        FEATURES
                    ================================================= */}

                    <div className="login-features">


                        {/* Monitor */}

                        <div>

                            <span>
                                🔍
                            </span>

                            <div>

                                <strong>
                                    Monitor
                                </strong>

                                <small>
                                    Track journey availability
                                </small>

                            </div>

                        </div>


                        {/* Analyze */}

                        <div>

                            <span>
                                🧠
                            </span>

                            <div>

                                <strong>
                                    Analyze
                                </strong>

                                <small>
                                    Analyze available berths
                                </small>

                            </div>

                        </div>


                        {/* Recommend */}

                        <div>

                            <span>
                                🎯
                            </span>

                            <div>

                                <strong>
                                    Recommend
                                </strong>

                                <small>
                                    Find possible booking strategies
                                </small>

                            </div>

                        </div>


                    </div>

                </div>



                {/* =================================================
                    LOGIN CARD
                ================================================= */}

                <div className="login-card">


                    {/* =================================================
                        HOME BUTTON
                    ================================================= */}

                    <button
                        type="button"
                        className="back-home"
                        onClick={() => navigate("/")}
                    >
                        ← Home
                    </button>



                    {/* =================================================
                        HEADING
                    ================================================= */}

                    <div className="login-heading">

                        <div className="login-icon">
                            🔐
                        </div>

                        <h2>
                            Welcome Back
                        </h2>

                        <p>
                            Login to continue to ERJA
                        </p>

                    </div>



                    {/* =================================================
                        LOGIN FORM
                    ================================================= */}

                    <form
                        onSubmit={handleLogin}
                    >


                        {/* =================================================
                            EMAIL
                        ================================================= */}

                        <div className="login-form-group">

                            <label htmlFor="email">
                                Email
                            </label>

                            <input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                                autoComplete="email"
                                required
                            />

                        </div>



                        {/* =================================================
                            PASSWORD
                        ================================================= */}

                        <div className="login-form-group">

                            <label htmlFor="password">
                                Password
                            </label>

                            <input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                autoComplete="current-password"
                                required
                            />

                        </div>



                        {/* =================================================
                            LOGIN BUTTON
                        ================================================= */}

                        <button
                            type="submit"
                            className="login-submit"
                            disabled={loading}
                        >

                            {loading
                                ? "Logging in..."
                                : "Login →"
                            }

                        </button>


                    </form>



                    {/* =================================================
                        CREATE ACCOUNT
                    ================================================= */}

                    <div className="login-register">

                        <span>
                            Don't have an account?
                        </span>

                        <button
                            type="button"
                            onClick={handleCreateAccount}
                        >
                            Create Account
                        </button>

                    </div>


                </div>

            </div>

        </div>

    );
}