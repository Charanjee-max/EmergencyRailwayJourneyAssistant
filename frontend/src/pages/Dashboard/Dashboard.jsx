import "./Dashboard.css";

import Navbar from "../../components/Navbar/Navbar";
import SummaryCard from "../../components/SummaryCard/SummaryCard";

function Dashboard() {
    return (
        <>
            <Navbar />

            <div className="dashboard">

                <h1>Emergency Railway Journey Assistant</h1>

                <p className="subtitle">
                    Welcome back! Manage your monitored journeys and recommendations.
                </p>

                <div className="summary-grid">

                    <SummaryCard
                        title="Total Journeys"
                        value="2"
                        color="#1565C0"
                    />

                    <SummaryCard
                        title="Monitoring"
                        value="2"
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

                    <button className="add-btn">
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
                                </tr>

                            </thead>

                            <tbody>

                                <tr>
                                    <td>12746</td>
                                    <td>BDCR → SC</td>
                                    <td>15 Sep 2026</td>
                                    <td>
                                        <span className="status active">
                                            Monitoring
                                        </span>
                                    </td>
                                </tr>

                                <tr>
                                    <td>12746</td>
                                    <td>BDCR → SC</td>
                                    <td>18 Sep 2026</td>
                                    <td>
                                        <span className="status active">
                                            Monitoring
                                        </span>
                                    </td>
                                </tr>

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

                            <button className="view-btn">

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