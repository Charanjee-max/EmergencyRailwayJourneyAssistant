import { useEffect, useState } from "react";
import {
    checkPNR,
    getPNRs,
    deletePNR,
} from "../../api/pnrAPI";

import "./PNR.css";

function PNR() {
    const [pnr, setPnr] = useState("");
    const [pnrData, setPnrData] = useState(null);
    const [savedPNRs, setSavedPNRs] = useState([]);

    const [loading, setLoading] = useState(false);
    const [loadingList, setLoadingList] = useState(true);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // =========================================
    // LOAD SAVED PNRS
    // =========================================

    const loadPNRs = async () => {
        try {
            setLoadingList(true);

            const response = await getPNRs();

            setSavedPNRs(
                response.data?.data || []
            );
        } catch (err) {
            console.error(
                "PNR LIST ERROR:",
                err
            );
        } finally {
            setLoadingList(false);
        }
    };

    useEffect(() => {
        loadPNRs();
    }, []);

    // =========================================
    // CHECK PNR
    // =========================================

    const handleCheckPNR = async (event) => {
        if (event) {
            event.preventDefault();
        }

        const cleanPNR = pnr
            .replace(/\D/g, "")
            .slice(0, 10);

        if (cleanPNR.length !== 10) {
            setError(
                "Please enter a valid 10-digit PNR."
            );
            setSuccess("");
            return;
        }

        try {
            setLoading(true);
            setError("");
            setSuccess("");

            const response =
                await checkPNR(cleanPNR);

            const data =
                response.data?.data;

            if (!data) {
                setError(
                    "No PNR information available."
                );
                return;
            }

            setPnrData(data);

            setSuccess(
                "PNR status updated successfully."
            );

            await loadPNRs();
        } catch (err) {
            console.error(
                "PNR CHECK ERROR:",
                err
            );

            const message =
                err.response?.data?.message ||
                "Unable to fetch PNR status.";

            setError(message);
            setSuccess("");
        } finally {
            setLoading(false);
        }
    };

    // =========================================
    // REFRESH PNR
    // =========================================

    const handleRefresh = async () => {
        if (!pnrData?.pnr) {
            return;
        }

        setPnr(pnrData.pnr);

        await handleCheckPNR();
    };

    // =========================================
    // DELETE PNR
    // =========================================

    const handleDelete = async (id) => {
        if (!id) return;

        const confirmed = window.confirm(
            "Are you sure you want to delete this PNR?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setError("");
            setSuccess("");

            await deletePNR(id);

            if (pnrData?._id === id) {
                setPnrData(null);
                setPnr("");
            }

            await loadPNRs();

            setSuccess(
                "PNR deleted successfully."
            );
        } catch (err) {
            console.error(
                "PNR DELETE ERROR:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to delete PNR."
            );
        }
    };

    // =========================================
    // OPEN SAVED PNR
    // =========================================

    const openSavedPNR = (item) => {
        setPnrData(item);
        setPnr(item.pnr || "");

        setError("");
        setSuccess("");
    };

    // =========================================
    // OVERALL STATUS
    // =========================================

    const getOverallStatus = () => {
        if (
            !pnrData ||
            !Array.isArray(
                pnrData.passengers
            ) ||
            pnrData.passengers.length === 0
        ) {
            return "UNKNOWN";
        }

        const statuses =
            pnrData.passengers.map(
                (passenger) =>
                    passenger.current
                        ?.status ||
                    passenger.booking
                        ?.status ||
                    ""
            );

        if (
            statuses.some(
                (status) =>
                    status === "CNF"
            )
        ) {
            return "CONFIRMED";
        }

        if (
            statuses.some(
                (status) =>
                    status === "RAC"
            )
        ) {
            return "RAC";
        }

        if (
            statuses.some(
                (status) =>
                    status.includes("WL")
            )
        ) {
            return "WAITLIST";
        }

        if (
            statuses.some(
                (status) =>
                    status === "CAN" ||
                    status === "CANCELLED"
            )
        ) {
            return "CANCELLED";
        }

        return statuses[0] || "UNKNOWN";
    };

    const overallStatus =
        getOverallStatus();

    const statusClass =
        overallStatus
            .toLowerCase()
            .replace(/\s+/g, "-");

    return (
        <div className="pnr-page">

            {/* =================================
                BACKGROUND
            ================================= */}

            <div className="pnr-grid-bg" />

            <div className="pnr-orb orb-one" />
            <div className="pnr-orb orb-two" />

            <div className="pnr-container">

                {/* =================================
                    HEADER
                ================================= */}

                <section className="pnr-header">

                    <div className="pnr-header-content">

                        <div className="pnr-eyebrow">
                            <span className="live-dot" />
                            ERJA · PNR INTELLIGENCE
                        </div>

                        <h1>
                            Check your
                            <span>
                                PNR Status
                            </span>
                        </h1>

                        <p>
                            Track your railway
                            reservation, passenger
                            status and berth details
                            in one intelligent
                            dashboard.
                        </p>

                    </div>

                    {/* =================================
                        3D TRAIN
                    ================================= */}

                    <div className="railway-3d">

                        <div className="train-shadow" />

                        <div className="train-body">

                            <div className="train-roof" />

                            <div className="train-window">
                                <span />
                            </div>

                            <div className="train-window">
                                <span />
                            </div>

                            <div className="train-window">
                                <span />
                            </div>

                            <div className="train-door" />

                            <div className="train-front">

                                <div className="headlight" />

                                <div className="front-window" />

                            </div>

                        </div>

                        <div className="train-wheel wheel-one" />
                        <div className="train-wheel wheel-two" />

                        <div className="rail rail-one" />
                        <div className="rail rail-two" />

                    </div>

                </section>

                {/* =================================
                    SEARCH CARD
                ================================= */}

                <section className="pnr-search-card">

                    <div className="search-icon">
                        🚆
                    </div>

                    <div className="search-content">

                        <div className="search-heading">

                            <div>
                                <h2>
                                    Enter PNR Number
                                </h2>

                                <p>
                                    Enter your 10-digit
                                    PNR to check the
                                    latest reservation
                                    status.
                                </p>
                            </div>

                            <div className="secure-badge">
                                🔒 Secure
                            </div>

                        </div>

                        <form
                            onSubmit={
                                handleCheckPNR
                            }
                        >

                            <div className="pnr-input-wrapper">

                                <input
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="off"
                                    maxLength={10}
                                    placeholder="Enter 10 digit PNR"
                                    value={pnr}
                                    onChange={(event) => {

                                        const value =
                                            event.target.value
                                                .replace(
                                                    /\D/g,
                                                    ""
                                                )
                                                .slice(
                                                    0,
                                                    10
                                                );

                                        setPnr(value);
                                        setError("");
                                        setSuccess("");
                                    }}
                                />

                                <span>
                                    {pnr.length}/10
                                </span>

                            </div>

                            <button
                                type="submit"
                                disabled={
                                    loading ||
                                    pnr.length !== 10
                                }
                            >

                                {loading ? (
                                    <>
                                        <span className="button-spinner" />
                                        Checking...
                                    </>
                                ) : (
                                    <>
                                        Check PNR
                                        <span className="button-arrow">
                                            →
                                        </span>
                                    </>
                                )}

                            </button>

                        </form>

                        {error && (
                            <div className="pnr-error">
                                <span>⚠</span>
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="pnr-success">
                                <span>✓</span>
                                {success}
                            </div>
                        )}

                    </div>

                </section>

                {/* =================================
                    PNR RESULT
                ================================= */}

                {pnrData && (
                    <section className="pnr-result">

                        {/* =================================
                            3D TICKET
                        ================================= */}

                        <div className="ticket-wrapper">

                            <div className="ticket-3d">

                                <div className="ticket-glow" />

                                <div className="ticket-top">

                                    <div>

                                        <small>
                                            ERJA RAILWAY PASS
                                        </small>

                                        <h2>
                                            {
                                                pnrData
                                                    .train
                                                    ?.name ||
                                                "Train"
                                            }
                                        </h2>

                                        <span>
                                            Train No.{" "}
                                            {
                                                pnrData
                                                    .train
                                                    ?.number ||
                                                "—"
                                            }
                                        </span>

                                    </div>

                                    <div
                                        className={`status-badge status-${statusClass}`}
                                    >
                                        <span className="status-pulse" />
                                        {overallStatus}
                                    </div>

                                </div>

                                {/* ROUTE */}

                                <div className="ticket-route">

                                    <div className="station">

                                        <strong>
                                            {
                                                pnrData
                                                    .journey
                                                    ?.source
                                                    ?.code ||
                                                "—"
                                            }
                                        </strong>

                                        <span>
                                            {
                                                pnrData
                                                    .journey
                                                    ?.source
                                                    ?.name ||
                                                "Source"
                                            }
                                        </span>

                                    </div>

                                    <div className="route-line">

                                        <span className="route-dot" />

                                        <div className="route-track">
                                            <span />
                                        </div>

                                        <div className="route-train">
                                            🚆
                                        </div>

                                        <div className="route-track">
                                            <span />
                                        </div>

                                        <span className="route-dot" />

                                    </div>

                                    <div className="station destination">

                                        <strong>
                                            {
                                                pnrData
                                                    .journey
                                                    ?.destination
                                                    ?.code ||
                                                "—"
                                            }
                                        </strong>

                                        <span>
                                            {
                                                pnrData
                                                    .journey
                                                    ?.destination
                                                    ?.name ||
                                                "Destination"
                                            }
                                        </span>

                                    </div>

                                </div>

                                {/* META */}

                                <div className="ticket-meta">

                                    <div>
                                        <small>
                                            PNR
                                        </small>

                                        <strong>
                                            {
                                                pnrData.pnr
                                            }
                                        </strong>
                                    </div>

                                    <div>
                                        <small>
                                            CLASS
                                        </small>

                                        <strong>
                                            {
                                                pnrData
                                                    .journey
                                                    ?.class ||
                                                "—"
                                            }
                                        </strong>
                                    </div>

                                    <div>
                                        <small>
                                            QUOTA
                                        </small>

                                        <strong>
                                            {
                                                pnrData
                                                    .journey
                                                    ?.quota ||
                                                "—"
                                            }
                                        </strong>
                                    </div>

                                    <div>
                                        <small>
                                            JOURNEY
                                        </small>

                                        <strong>
                                            {
                                                pnrData
                                                    .journey
                                                    ?.dateOfJourney ||
                                                "—"
                                            }
                                        </strong>
                                    </div>

                                </div>

                                {/* CUTOUTS */}

                                <div className="ticket-cut cut-left" />
                                <div className="ticket-cut cut-right" />

                            </div>

                        </div>

                        {/* =================================
                            PASSENGERS
                        ================================= */}

                        <div className="passengers-section">

                            <div className="section-title">

                                <div>
                                    <small>
                                        RESERVATION DETAILS
                                    </small>

                                    <h2>
                                        Passengers
                                    </h2>
                                </div>

                                <span>
                                    {
                                        pnrData
                                            .passengers
                                            ?.length || 0
                                    }{" "}
                                    Passenger
                                    {
                                        pnrData
                                            .passengers
                                            ?.length !== 1
                                            ? "s"
                                            : ""
                                    }
                                </span>

                            </div>

                            <div className="passenger-grid">

                                {pnrData.passengers?.map(
                                    (
                                        passenger,
                                        index
                                    ) => {

                                        const current =
                                            passenger.current ||
                                            {};

                                        const booking =
                                            passenger.booking ||
                                            {};

                                        const passengerStatus =
                                            current.status ||
                                            booking.status ||
                                            "UNKNOWN";

                                        return (
                                            <div
                                                className="passenger-card"
                                                key={
                                                    passenger
                                                        .serialNumber ||
                                                    index
                                                }
                                            >

                                                <div className="passenger-number">
                                                    {index + 1}
                                                </div>

                                                <div className="passenger-info">

                                                    <small>
                                                        PASSENGER{" "}
                                                        {index + 1}
                                                    </small>

                                                    <div
                                                        className={`passenger-status status-${passengerStatus
                                                            .toLowerCase()
                                                            .replace(
                                                                /\s+/g,
                                                                "-"
                                                            )}`}
                                                    >
                                                        {
                                                            passengerStatus
                                                        }
                                                    </div>

                                                </div>

                                                <div className="berth-info">

                                                    <div>
                                                        <small>
                                                            COACH
                                                        </small>

                                                        <strong>
                                                            {
                                                                current.coach ||
                                                                booking.coach ||
                                                                "—"
                                                            }
                                                        </strong>
                                                    </div>

                                                    <div>
                                                        <small>
                                                            BERTH
                                                        </small>

                                                        <strong>
                                                            {
                                                                current.berthNo ||
                                                                booking.berthNo ||
                                                                "—"
                                                            }
                                                        </strong>
                                                    </div>

                                                    <div>
                                                        <small>
                                                            TYPE
                                                        </small>

                                                        <strong>
                                                            {
                                                                current.berthCode ||
                                                                booking.berthCode ||
                                                                "—"
                                                            }
                                                        </strong>
                                                    </div>

                                                </div>

                                            </div>
                                        );
                                    }
                                )}

                            </div>

                        </div>

                        {/* =================================
                            EXTRA INFORMATION
                        ================================= */}

                        <div className="info-grid">

                            <div className="info-card">

                                <span>
                                    CHART STATUS
                                </span>

                                <strong>
                                    {
                                        pnrData.chart
                                            ?.status ||
                                        "—"
                                    }
                                </strong>

                            </div>

                            <div className="info-card">

                                <span>
                                    BOARDING
                                </span>

                                <strong>
                                    {
                                        pnrData
                                            .journey
                                            ?.boardingPoint
                                            ?.name ||
                                        pnrData
                                            .journey
                                            ?.boardingPoint
                                            ?.code ||
                                        "—"
                                    }
                                </strong>

                            </div>

                            <div className="info-card">

                                <span>
                                    FARE
                                </span>

                                <strong>
                                    {
                                        pnrData.booking
                                            ?.fare !=
                                        null
                                            ? `₹${pnrData.booking.fare}`
                                            : "—"
                                    }
                                </strong>

                            </div>

                            <div className="info-card">

                                <span>
                                    LAST CHECKED
                                </span>

                                <strong>
                                    {
                                        pnrData
                                            .lastCheckedAt
                                            ? new Date(
                                                pnrData.lastCheckedAt
                                            ).toLocaleString()
                                            : "—"
                                    }
                                </strong>

                            </div>

                        </div>

                        {/* =================================
                            ACTIONS
                        ================================= */}

                        <div className="pnr-actions">

                            <button
                                className="refresh-button"
                                onClick={
                                    handleRefresh
                                }
                                disabled={loading}
                            >
                                {loading
                                    ? "Checking..."
                                    : "↻ Refresh Status"}
                            </button>

                            <button
                                className="delete-button"
                                onClick={() =>
                                    handleDelete(
                                        pnrData._id
                                    )
                                }
                            >
                                🗑 Delete PNR
                            </button>

                        </div>

                    </section>
                )}

                {/* =================================
                    SAVED PNRS
                ================================= */}

                <section className="saved-section">

                    <div className="section-title">

                        <div>
                            <small>
                                YOUR RESERVATIONS
                            </small>

                            <h2>
                                Saved PNRs
                            </h2>
                        </div>

                    </div>

                    {loadingList ? (

                        <div className="empty-state loading-state">
                            <div className="loading-ring" />
                            <p>
                                Loading your reservations...
                            </p>
                        </div>

                    ) : savedPNRs.length === 0 ? (

                        <div className="empty-state">

                            <div className="empty-ticket">
                                🎫
                            </div>

                            <h3>
                                No saved PNRs
                            </h3>

                            <p>
                                Check a PNR and it will
                                appear here automatically.
                            </p>

                        </div>

                    ) : (

                        <div className="saved-grid">

                            {savedPNRs.map(
                                (item) => {

                                    const savedStatus =
                                        item
                                            .passengers?.[0]
                                            ?.current
                                            ?.status ||
                                        item
                                            .passengers?.[0]
                                            ?.booking
                                            ?.status ||
                                        "—";

                                    return (
                                        <div
                                            className="saved-pnr-card"
                                            key={
                                                item._id
                                            }
                                            onClick={() =>
                                                openSavedPNR(
                                                    item
                                                )
                                            }
                                        >

                                            <div className="saved-pnr-icon">
                                                🎫
                                            </div>

                                            <div>
                                                <small>
                                                    PNR
                                                </small>

                                                <strong>
                                                    {
                                                        item.pnr
                                                    }
                                                </strong>
                                            </div>

                                            <div>
                                                <small>
                                                    TRAIN
                                                </small>

                                                <strong>
                                                    {
                                                        item
                                                            .train
                                                            ?.number ||
                                                        "—"
                                                    }
                                                </strong>
                                            </div>

                                            <div
                                                className={`saved-status status-${savedStatus
                                                    .toLowerCase()
                                                    .replace(
                                                        /\s+/g,
                                                        "-"
                                                    )}`}
                                            >
                                                {
                                                    savedStatus
                                                }
                                            </div>

                                        </div>
                                    );
                                }
                            )}

                        </div>

                    )}

                </section>

                {/* =================================
                    WARNING
                ================================= */}

                <div className="pnr-note">

                    <span>⚠️</span>

                    <div>
                        <strong>
                            PNR information can change
                        </strong>

                        <p>
                            Railway reservation status
                            may change after chart
                            preparation. Always verify
                            the latest status before
                            travelling.
                        </p>
                    </div>

                </div>

            </div>
        </div>
    );
}

export default PNR;