import "./SummaryCard.css";

function SummaryCard({ title, value, color }) {

    return (

        <div
            className="summary-card"
            style={{ borderTop: `6px solid ${color}` }}
        >

            <h2>{value}</h2>

            <p>{title}</p>

        </div>

    );

}

export default SummaryCard;