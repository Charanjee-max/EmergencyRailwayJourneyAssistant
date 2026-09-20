import {
    useEffect,
    useState,
} from "react";

import {
    NavLink,
    useNavigate,
} from "react-router-dom";

import "./Navbar.css";

import {
    getNotifications,
} from "../../api/notificationAPI";


function Navbar() {

    const navigate = useNavigate();


    // =========================================================
    // NOTIFICATION STATE
    // =========================================================

    const [
        unreadCount,
        setUnreadCount,
    ] = useState(0);


    const [
        notificationLoading,
        setNotificationLoading,
    ] = useState(false);


    // =========================================================
    // LOAD UNREAD NOTIFICATIONS
    // =========================================================

    const loadUnreadNotifications = async () => {

        const token =
            localStorage.getItem("token");


        // -----------------------------------------------------
        // USER NOT LOGGED IN
        // -----------------------------------------------------

        if (!token) {

            setUnreadCount(0);

            return;
        }


        try {

            setNotificationLoading(true);


            const response =
                await getNotifications(50);


            const responseData =
                response?.data || {};


            // -------------------------------------------------
            // BACKEND DIRECT unreadCount
            // -------------------------------------------------

            if (
                Number.isFinite(
                    Number(
                        responseData.unreadCount
                    )
                )
            ) {

                setUnreadCount(
                    Math.max(
                        0,
                        Number(
                            responseData.unreadCount
                        )
                    )
                );

                return;
            }


            // -------------------------------------------------
            // FALLBACK
            //
            // If backend does not provide unreadCount,
            // calculate it from the notification list.
            // -------------------------------------------------

            const notifications =
                Array.isArray(
                    responseData.data
                )
                    ? responseData.data
                    : [];


            const count =
                notifications.filter(
                    (notification) =>
                        notification &&
                        notification.isRead !== true
                ).length;


            setUnreadCount(
                count
            );

        } catch (error) {

            // -------------------------------------------------
            // AUTH FAILURE
            // -------------------------------------------------

            if (
                error?.response?.status ===
                401
            ) {

                setUnreadCount(0);

                return;
            }


            console.error(
                "NAVBAR NOTIFICATION ERROR:",
                error
            );

        } finally {

            setNotificationLoading(
                false
            );

        }

    };


    // =========================================================
    // INITIAL LOAD + AUTO REFRESH
    // =========================================================

    useEffect(() => {

        loadUnreadNotifications();


        const interval =
            setInterval(
                () => {

                    loadUnreadNotifications();

                },
                30000
            );


        return () => {

            clearInterval(
                interval
            );

        };

    }, []);


    // =========================================================
    // LOGOUT
    // =========================================================

    const handleLogout = () => {

        localStorage.removeItem(
            "token"
        );

        setUnreadCount(0);

        navigate(
            "/login"
        );

    };


    // =========================================================
    // NOTIFICATION BADGE
    // =========================================================

    const getNotificationBadge =
        () => {

            if (
                notificationLoading &&
                unreadCount === 0
            ) {
                return null;
            }


            if (
                unreadCount <= 0
            ) {
                return null;
            }


            if (
                unreadCount > 99
            ) {

                return "99+";

            }


            return unreadCount;

        };


    const notificationBadge =
        getNotificationBadge();


    // =========================================================
    // NAVBAR
    // =========================================================

    return (

        <nav className="navbar">

            {/* =================================================
                BRAND
            ================================================= */}

            <button
                className="logo"
                onClick={() =>
                    navigate("/dashboard")
                }
                type="button"
            >

                <span className="logo-train">
                    🚆
                </span>

                <span className="logo-text">
                    ERJA
                </span>

            </button>


            {/* =================================================
                NAVIGATION
            ================================================= */}

            <div className="nav-links">

                <NavLink
                    to="/dashboard"
                    className={({ isActive }) =>
                        `nav-link ${
                            isActive
                                ? "active"
                                : ""
                        }`
                    }
                >

                    <span>
                        ⌂
                    </span>

                    Dashboard

                </NavLink>


                <NavLink
                    to="/journeys"
                    className={({ isActive }) =>
                        `nav-link ${
                            isActive
                                ? "active"
                                : ""
                        }`
                    }
                >

                    <span>
                        🚆
                    </span>

                    Journeys

                </NavLink>


                {/* =================================================
                    NOTIFICATIONS
                ================================================= */}

                <NavLink
                    to="/notifications"
                    className={({ isActive }) =>
                        `nav-link notification-nav-link ${
                            isActive
                                ? "active"
                                : ""
                        }`
                    }
                >

                    <span className="notification-icon-wrapper">

                        <span>
                            🔔
                        </span>


                        {notificationBadge !== null && (

                            <span
                                className="notification-badge"
                                aria-label={`${unreadCount} unread notifications`}
                            >
                                {notificationBadge}
                            </span>

                        )}

                    </span>

                    Notifications

                </NavLink>


                <NavLink
                    to="/pnr"
                    className={({ isActive }) =>
                        `nav-link ${
                            isActive
                                ? "active"
                                : ""
                        }`
                    }
                >

                    <span>
                        🎫
                    </span>

                    PNR

                </NavLink>


                <NavLink
                    to="/help"
                    className={({ isActive }) =>
                        `nav-link ${
                            isActive
                                ? "active"
                                : ""
                        }`
                    }
                >

                    <span>
                        ?
                    </span>

                    Help

                </NavLink>


                <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                        `nav-link ${
                            isActive
                                ? "active"
                                : ""
                        }`
                    }
                >

                    <span>
                        ◉
                    </span>

                    Profile

                </NavLink>

            </div>


            {/* =================================================
                RIGHT SIDE
            ================================================= */}

            <div className="nav-right">

                <div className="nav-status">

                    <span className="status-dot" />

                    <span>
                        System Ready
                    </span>

                </div>


                <span className="username">
                    Welcome, Charan
                </span>


                <button
                    className="logout-btn"
                    onClick={handleLogout}
                    type="button"
                >

                    Logout

                </button>

            </div>

        </nav>

    );

}


export default Navbar;