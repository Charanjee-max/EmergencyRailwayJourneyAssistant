import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import Journeys from "../pages/Journeys/Journeys";
import JourneyDetails from "../pages/JourneyDetails/JourneyDetails";
import Profile from "../pages/Profile/Profile";
import AddJourney from "../pages/AddJourney/AddJourney";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/journeys" element={<Journeys />} />
        <Route path="/journey/:id" element={<JourneyDetails />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/add-journey" element={<AddJourney />} />
      </Routes>
    </BrowserRouter>
  );
}