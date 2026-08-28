import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRecommendations } from "../../api/recommendationAPI";
import "./Recommendation.css";

function Recommendation() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRecommendations();
    }, []);

    const loadRecommendations = async () => {
        try {
            const response = await getRecommendations(id);

            console.log(response.data);

            setRecommendations(response.data.data || []);
        } catch (error) {
            console.error(error);
            alert("Failed to load recommendations");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="recommendation-container">
                <h2>Loading recommendations...</h2>
            </div>
        );
    }

    return (
        <div className="recommendation-container">

            <button
                className="back-btn"
                onClick={() => navigate("/dashboard")}
            >
                ← Back
            </button>

            <h1>Journey Recommendations</h1>

            {recommendations.length === 0 ? (

                <div className="empty-card">
                    <h2>No Recommendations Found</h2>
                    <p>
                        Recommendations haven't been generated for this
                        journey yet.
                    </p>
                </div>

            ) : (

                recommendations.map((rec, index) => (

                    <div className="recommendation-card" key={index}>

                        <h2>{rec.strategy}</h2>

                        <p>
                            <strong>Score :</strong> {rec.score}
                        </p>

                        <p>
                            <strong>Reason :</strong> {rec.reason}
                        </p>

                        <h3>Tickets</h3>

                        <table>

                            <thead>
                                <tr>
                                    <th>Train</th>
                                    <th>From</th>
                                    <th>To</th>
                                    <th>Class</th>
                                </tr>
                            </thead>

                            <tbody>

                                {rec.tickets?.map((ticket, i) => (

                                    <tr key={i}>
                                        <td>{ticket.trainNumber}</td>
                                        <td>{ticket.from}</td>
                                        <td>{ticket.to}</td>
                                        <td>{ticket.class}</td>
                                    </tr>

                                ))}

                            </tbody>

                        </table>

                        <button className="accept-btn">
                            Accept Recommendation
                        </button>

                    </div>

                ))

            )}

        </div>
    );
}

export default Recommendation;