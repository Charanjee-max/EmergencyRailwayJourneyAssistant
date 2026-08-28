import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Dashboard.css";

import Navbar from "../../components/Navbar/Navbar";
import SummaryCard from "../../components/SummaryCard/SummaryCard";
import { getJourneys } from "../../api/journeyAPI";

function Dashboard() {
    const navigate = useNavigate();

    const [journeys, setJourneys] = useState([]);

    useEffect(() => {
        loadJourneys();
    }, []);

    const loadJourneys = async () => {
        try {
            const response = await getJourneys();

            console.log("Journey Response:", response.data);

            setJourneys(response.data.data || []);
        } catch (error) {
            console.error("Failed to load journeys:", error);
        }
    };

    return (
        <>
            <Navbar />

            <div className="dashboard">

                <h1>Emergency Railway Journey Assistant</h1>

                <p className="subtitle">
                    Welcome back! Manage your monitored journeys.
                </p>

                <div className="summary-grid">

                    <SummaryCard
                        title="Total Journeys"
                        value={journeys.length}
                        color="#1565C0"
                    />

                    <SummaryCard
                        title="Monitoring"
                        value={journeys.length}
                        color="#43A047"
                    />

                    <SummaryCard
                        title="Recommendations"
                        value="5"
                        color="#FB8C00"
                    />

                    <SummaryCard
                        title="Alerts"
                        value="1"
                        color="#E53935"
                    />

                </div>

                <div className="actions">

                    <button
                        className="add-btn"
                        onClick={() => navigate("/add-journey")}
                    >
                        + Add New Journey
                    </button>

                </div>

                <div className="content-grid">

                    <div className="card">

                        <h2>My Journeys</h2>

                        <table>

                            <thead>

                                <tr>
                                    <th>Train</th>
                                    <th>Route</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>

                            </thead>

                            <tbody>

                                {journeys.length === 0 ? (

                                    <tr>
                                        <td
                                            colSpan="5"
                                            style={{ textAlign: "center" }}
                                        >
                                            No journeys found.
                                        </td>
                                    </tr>

                                ) : (

                                    journeys.map((journey) => (

                                        <tr key={journey._id}>

                                            <td>{journey.trainNumber}</td>

                                            <td>
                                                {journey.boardingStation} → {journey.destinationStation}
                                            </td>

                                            <td>
                                                {new Date(
                                                    journey.journeyDate
                                                ).toLocaleDateString("en-GB")}
                                            </td>

                                            <td>
                                                <span className="status active">
                                                    {journey.status}
                                                </span>
                                            </td>

                                            <td>

                                                <button
                                                    className="view-btn"
                                                    onClick={() =>
                                                        navigate(
                                                            `/recommendation/${journey._id}`
                                                        )
                                                    }
                                                >
                                                    View
                                                </button>

                                            </td>

                                        </tr>

                                    ))

                                )}

                            </tbody>

                        </table>

                    </div>

                    <div className="card">

                        <h2>Latest Recommendation</h2>

                        <div className="recommendation">

                            <h3>✅ Split Same Class</h3>

                            <p>
                                Coach:
                                <strong> B1</strong>
                            </p>

                            <p>
                                Score:
                                <strong> 100</strong>
                            </p>

                            <button
                                className="view-btn"
                                onClick={() => {
                                    if (journeys.length > 0) {
                                        navigate(
                                            `/recommendation/${journeys[0]._id}`
                                        );
                                    } else {
                                        alert("No journeys available.");
                                    }
                                }}
                            >
                                View Recommendation
                            </button>

                        </div>

                    </div>

                </div>

            </div>

        </>
    );
}

export default Dashboard;