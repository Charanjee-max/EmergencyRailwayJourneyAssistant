import {
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import Journeys from "../pages/Journeys/Journeys";
import AddJourney from "../pages/AddJourney/AddJourney";
import Recommendation from "../pages/Recommendation/Recommendation";

import Profile from "../pages/Profile/Profile";
import Notifications from "../pages/Notifications/Notifications";


function AppRoutes() {

    return (

        <Routes>

            {/* ================================
                DEFAULT
            ================================= */}

            <Route
                path="/"
                element={
                    <Navigate
                        to="/login"
                        replace
                    />
                }
            />


            {/* ================================
                LOGIN
            ================================= */}

            <Route
                path="/login"
                element={<Login />}
            />


            {/* ================================
                DASHBOARD
            ================================= */}

            <Route
                path="/dashboard"
                element={<Dashboard />}
            />


            {/* ================================
                ALL JOURNEYS
            ================================= */}

            <Route
                path="/journeys"
                element={<Journeys />}
            />


            {/* ================================
                ADD JOURNEY
            ================================= */}

            <Route
                path="/add-journey"
                element={<AddJourney />}
            />


            {/* ================================
                RECOMMENDATION
            ================================= */}

            <Route
                path="/recommendation/:id"
                element={<Recommendation />}
            />


            {/* ================================
                PROFILE
            ================================= */}

            <Route
                path="/profile"
                element={<Profile />}
            />


            {/* ================================
                NOTIFICATIONS
            ================================= */}

            <Route
                path="/notifications"
                element={<Notifications />}
            />


            {/* ================================
                UNKNOWN ROUTE
            ================================= */}

            <Route
                path="*"
                element={
                    <Navigate
                        to="/dashboard"
                        replace
                    />
                }
            />

        </Routes>

    );
}


export default AppRoutes;