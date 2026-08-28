import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";

function App() {
    const token = localStorage.getItem("token");

    return (
        <BrowserRouter>
            <Routes>

                <Route
                    path="/"
                    element={
                        token ? (
                            <Navigate to="/dashboard" />
                        ) : (
                            <Navigate to="/login" />
                        )
                    }
                />

                <Route path="/login" element={<Login />} />

                <Route path="/dashboard" element={<Dashboard />} />

            </Routes>
        </BrowserRouter>
    );
}

export default App;