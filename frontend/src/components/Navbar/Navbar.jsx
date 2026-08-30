import { NavLink, useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar() {

    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    return (
        <nav className="navbar">

            {/* ================================
                LOGO
            ================================= */}

            <div
                className="logo"
                onClick={() => navigate("/dashboard")}
            >
                🚆 <span>ERJA</span>
            </div>


            {/* ================================
                NAVIGATION
            ================================= */}

            <div className="nav-links">

                <NavLink
                    to="/dashboard"
                    className={({ isActive }) =>
                        `nav-link ${
                            isActive ? "active" : ""
                        }`
                    }
                >
                    🏠 Dashboard
                </NavLink>

                <NavLink
                    to="/journeys"
                    className={({ isActive }) =>
                        `nav-link ${
                            isActive ? "active" : ""
                        }`
                    }
                >
                    🚆 Journeys
                </NavLink>

                <NavLink
                    to="/notifications"
                    className={({ isActive }) =>
                        `nav-link ${
                            isActive ? "active" : ""
                        }`
                    }
                >
                    🔔 Notifications
                </NavLink>

                <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                        `nav-link ${
                            isActive ? "active" : ""
                        }`
                    }
                >
                    👤 Profile
                </NavLink>

            </div>


            {/* ================================
                RIGHT SIDE
            ================================= */}

            <div className="nav-right">

                <span className="username">
                    Welcome, Charan
                </span>

                <button
                    className="logout-btn"
                    onClick={handleLogout}
                >
                    Logout
                </button>

            </div>

        </nav>
    );
}

export default Navbar;