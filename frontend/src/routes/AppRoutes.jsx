import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import AddJourney from "../pages/AddJourney/AddJourney";
import Recommendation from "../pages/Recommendation/Recommendation";

function AppRoutes() {
    return (
        <BrowserRouter>

            <Routes>

                <Route
                    path="/"
                    element={<Navigate to="/login" replace />}
                />

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/dashboard"
                    element={<Dashboard />}
                />

                <Route
                    path="/add-journey"
                    element={<AddJourney />}
                />

                <Route
                    path="/recommendation/:id"
                    element={<Recommendation />}
                />

                <Route
                    path="*"
                    element={<Navigate to="/login" replace />}
                />

            </Routes>

        </BrowserRouter>
    );
}

export default AppRoutes;