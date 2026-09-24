import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    checkPNR,
    getPNRs,
    deletePNR,
} from "../../api/pnrAPI";

import "./PNR.css";


function PNR() {
    const navigate = useNavigate();

    const [pnr, setPnr] = useState("");
    const [pnrData, setPnrData] = useState(null);
    const [savedPNRs, setSavedPNRs] = useState([]);

    const [loading, setLoading] = useState(false);
    const [loadingList, setLoadingList] = useState(true);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");


    // =========================================================
    // LOAD SAVED PNRS
    // =========================================================

    const loadPNRs = async () => {
        try {
            setLoadingList(true);

            const response = await getPNRs();

            setSavedPNRs(
                response?.data?.data || []
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


    // =========================================================
    // CHECK PNR
    // =========================================================

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

            const response = await checkPNR(cleanPNR);
            const data = response?.data?.data;

            if (!data) {
                setError(
                    "No PNR information available."
                );
                return;
            }

            setPnrData(data);
            setPnr(data.pnr || cleanPNR);

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


    // =========================================================
    // REFRESH
    // =========================================================

    const handleRefresh = async () => {
        if (!pnrData?.pnr) {
            return;
        }

        setPnr(pnrData.pnr);
        await handleCheckPNR();
    };


    // =========================================================
    // DELETE PNR
    // =========================================================

    const handleDelete = async (id) => {
        if (!id) {
            return;
        }

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


    // =========================================================
    // OPEN SAVED PNR
    // =========================================================

    const openSavedPNR = (item) => {
        setPnrData(item);
        setPnr(item?.pnr || "");
        setError("");
        setSuccess("");
    };


    // =========================================================
    // PASSENGER STATUS
    // =========================================================

    const getPassengerStatus = (passenger) => (
        passenger?.current?.status ||
        passenger?.booking?.status ||
        "—"
    );


    // =========================================================
    // OVERALL STATUS
    // =========================================================

    const getOverallStatus = () => {
        if (
            !pnrData ||
            !Array.isArray(pnrData.passengers) ||
            pnrData.passengers.length === 0
        ) {
            return "UNKNOWN";
        }

        const statuses = pnrData.passengers.map(
            getPassengerStatus
        );

        if (statuses.some((status) => status === "CNF")) {
            return "CONFIRMED";
        }

        if (statuses.some((status) => status === "RAC")) {
            return "RAC";
        }

        if (
            statuses.some((status) =>
                String(status).includes("WL")
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


    const overallStatus = getOverallStatus();


    // =========================================================
    // SUMMARY
    // =========================================================

    const summary = useMemo(() => {
        const total = savedPNRs.length;

        const monitoring = savedPNRs.filter(
            (item) =>
                item?.isMonitoring === true ||
                item?.monitoringEnabled === true ||
                item?.status === "MONITORING"
        ).length;

        const confirmed = savedPNRs.filter((item) => {
            const status =
                item?.passengers?.[0]?.current?.status ||
                item?.passengers?.[0]?.booking?.status ||
                "";

            return (
                status === "CNF" ||
                status === "CONFIRMED"
            );
        }).length;

        return {
            total,
            monitoring,
            confirmed,
        };
    }, [savedPNRs]);


    // =========================================================
    // FORMAT DATE
    // =========================================================

    const formatDate = (value) => {
        if (!value) {
            return "—";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return String(value);
        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };


    // =========================================================
    // FORMAT DATETIME
    // =========================================================

    const formatDateTime = (value) => {
        if (!value) {
            return "—";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return String(value);
        }

        return date.toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            }
        );
    };


    // =========================================================
    // TRAIN DETAILS
    // =========================================================

    const trainNumber =
        pnrData?.train?.number ||
        pnrData?.train?.trainNumber ||
        pnrData?.trainNumber ||
        "—";

    const trainName =
        pnrData?.train?.name ||
        pnrData?.train?.trainName ||
        pnrData?.trainName ||
        "Railway Journey";

    const boarding =
        pnrData?.journey?.boardingPoint?.code ||
        pnrData?.journey?.boardingPoint?.name ||
        pnrData?.boardingStation ||
        "—";

    const destination =
        pnrData?.journey?.destinationPoint?.code ||
        pnrData?.journey?.destinationPoint?.name ||
        pnrData?.destinationStation ||
        "—";

    const journeyDate =
        pnrData?.journey?.date ||
        pnrData?.journeyDate ||
        pnrData?.dateOfJourney ||
        null;


    // =========================================================
    // STATUS LABEL
    // =========================================================

    const getStatusLabel = (status) => {
        switch (String(status).toUpperCase()) {
            case "CNF":
                return "Confirmed";

            case "RAC":
                return "RAC";

            case "CAN":
                return "Cancelled";

            case "CANCELLED":
                return "Cancelled";

            default:
                if (
                    String(status)
                        .toUpperCase()
                        .includes("WL")
                ) {
                    return "Waitlist";
                }

                return status || "Unknown";
        }
    };


    // =========================================================
    // STATUS CLASS
    // =========================================================

    const getStatusClass = (status) => {
        const normalized = String(status || "unknown")
            .toLowerCase()
            .replace(/\s+/g, "-");

        if (
            normalized === "cnf" ||
            normalized === "confirmed"
        ) {
            return "confirmed";
        }

        if (normalized === "rac") {
            return "rac";
        }

        if (
            normalized.includes("wl") ||
            normalized === "waitlist"
        ) {
            return "waitlist";
        }

        if (
            normalized === "can" ||
            normalized === "cancelled"
        ) {
            return "cancelled";
        }

        return "unknown";
    };


    return (
        <div className="pnr-page">

            <div className="pnr-page-background" />

            <main className="pnr-container">

                {/* PAGE HEADER */}

                <section className="pnr-header">

                    <div className="pnr-header-content">

                        <div className="pnr-eyebrow">
                            <span className="pnr-live-dot" />
                            ERJA PNR MONITOR
                        </div>

                        <h1>
                            Track your
                            <span>
                                PNR
                            </span>
                        </h1>

                        <p>
                            Add and monitor your railway
                            reservation status, passenger
                            details and booking information
                            in one place.
                        </p>

                    </div>

                    <div className="pnr-header-actions">

                        <button
                            type="button"
                            className="pnr-refresh-top"
                            onClick={() =>
                                navigate("/dashboard")
                            }
                        >
                            ← Dashboard
                        </button>

                        <button
                            type="button"
                            className="pnr-refresh-top"
                            onClick={loadPNRs}
                            disabled={loadingList}
                        >
                            ↻ Refresh
                        </button>

                        <button
                            type="button"
                            className="pnr-primary-button"
                            onClick={() => {
                                document
                                    .getElementById("pnr-input")
                                    ?.focus();
                            }}
                        >
                            + Add PNR
                        </button>

                    </div>

                </section>


                {/* SUMMARY */}

                <section className="pnr-summary-grid">

                    <div className="pnr-summary-card pnr-summary-blue">

                        <div className="pnr-summary-icon">
                            🎫
                        </div>

                        <div className="pnr-summary-content">
                            <span>TOTAL PNRS</span>
                            <strong>{summary.total}</strong>
                            <small>Saved reservations</small>
                        </div>

                    </div>

                    <div className="pnr-summary-card pnr-summary-green">

                        <div className="pnr-summary-icon">
                            ◉
                        </div>

                        <div className="pnr-summary-content">
                            <span>MONITORING</span>
                            <strong>{summary.monitoring}</strong>
                            <small>Currently tracked</small>
                        </div>

                    </div>

                    <div className="pnr-summary-card pnr-summary-purple">

                        <div className="pnr-summary-icon">
                            ✓
                        </div>

                        <div className="pnr-summary-content">
                            <span>CONFIRMED</span>
                            <strong>{summary.confirmed}</strong>
                            <small>Current confirmed status</small>
                        </div>

                    </div>

                    <div className="pnr-summary-card pnr-summary-orange">

                        <div className="pnr-summary-icon">
                            ★
                        </div>

                        <div className="pnr-summary-content">
                            <span>SELECTED PNR</span>
                            <strong>{pnrData ? "1" : "0"}</strong>
                            <small>Ready to view</small>
                        </div>

                    </div>

                </section>


                {/* ADD PNR */}

                <section className="pnr-search-card">

                    <div className="pnr-section-heading">

                        <div>
                            <span className="pnr-section-label">
                                ADD PNR
                            </span>

                            <h2>
                                Start PNR Monitoring
                            </h2>

                            <p>
                                Enter your 10-digit PNR number
                                to check the latest railway
                                reservation status.
                            </p>
                        </div>

                        <div className="pnr-ticket-icon">
                            🎫
                        </div>

                    </div>

                    <form
                        className="pnr-search-form"
                        onSubmit={handleCheckPNR}
                    >

                        <div className="pnr-input-group">

                            <label htmlFor="pnr-input">
                                PNR NUMBER
                            </label>

                            <div className="pnr-input-wrapper">

                                <span className="pnr-input-icon">
                                    #
                                </span>

                                <input
                                    id="pnr-input"
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={10}
                                    value={pnr}
                                    onChange={(event) =>
                                        setPnr(
                                            event.target.value
                                                .replace(/\D/g, "")
                                                .slice(0, 10)
                                        )
                                    }
                                    placeholder="Enter 10-digit PNR"
                                />

                                <span className="pnr-character-count">
                                    {pnr.length}/10
                                </span>

                            </div>

                        </div>

                        <button
                            type="submit"
                            className="pnr-search-button"
                            disabled={loading}
                        >
                            {loading
                                ? "Checking..."
                                : "+ Monitor PNR"}
                        </button>

                    </form>

                    {error && (
                        <div className="pnr-message pnr-error">
                            <span>⚠</span>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="pnr-message pnr-success">
                            <span>✓</span>
                            {success}
                        </div>
                    )}

                </section>


                {/* SELECTED PNR */}

                {pnrData && (
                    <section className="pnr-details-card">

                        <div className="pnr-details-header">

                            <div>
                                <span className="pnr-section-label">
                                    SELECTED RESERVATION
                                </span>

                                <h2>
                                    PNR {pnrData.pnr || pnr}
                                </h2>

                                <p>
                                    Latest reservation
                                    information available
                                    for this PNR.
                                </p>
                            </div>

                            <div
                                className={`pnr-status-badge ${getStatusClass(
                                    overallStatus
                                )}`}
                            >
                                <span />
                                {getStatusLabel(overallStatus)}
                            </div>

                        </div>


                        {/* TRAIN ROUTE */}

                        <div className="pnr-route-card">

                            <div className="pnr-route-station">
                                <span>TRAIN</span>
                                <strong>{trainNumber}</strong>
                                <small>{trainName}</small>
                            </div>

                            <div className="pnr-route-line">
                                <span className="pnr-route-dot" />

                                <div className="pnr-route-track">
                                    <span />
                                </div>

                                <span className="pnr-route-train">
                                    🚆
                                </span>

                                <div className="pnr-route-track">
                                    <span />
                                </div>

                                <span className="pnr-route-dot" />
                            </div>

                            <div className="pnr-route-station pnr-route-destination">
                                <span>JOURNEY DATE</span>
                                <strong>
                                    {formatDate(journeyDate)}
                                </strong>
                                <small>Railway reservation</small>
                            </div>

                        </div>


                        {/* RESERVATION META */}

                        <div className="pnr-meta-grid">

                            <div className="pnr-meta-item">
                                <span>BOARDING</span>
                                <strong>{boarding}</strong>
                            </div>

                            <div className="pnr-meta-item">
                                <span>DESTINATION</span>
                                <strong>{destination}</strong>
                            </div>

                            <div className="pnr-meta-item">
                                <span>CLASS</span>
                                <strong>
                                    {pnrData.booking?.class ||
                                        pnrData.travelClass ||
                                        "—"}
                                </strong>
                            </div>

                            <div className="pnr-meta-item">
                                <span>FARE</span>
                                <strong>
                                    {pnrData.booking?.fare != null
                                        ? `₹${pnrData.booking.fare}`
                                        : "—"}
                                </strong>
                            </div>

                        </div>


                        {/* PASSENGERS */}

                        <div className="pnr-passengers-section">

                            <div className="pnr-subsection-header">

                                <div>
                                    <span>PASSENGERS</span>
                                    <h3>Passenger Status</h3>
                                </div>

                                <small>
                                    {Array.isArray(pnrData.passengers)
                                        ? pnrData.passengers.length
                                        : 0}{" "}
                                    passenger(s)
                                </small>

                            </div>

                            {Array.isArray(pnrData.passengers) &&
                            pnrData.passengers.length > 0 ? (
                                <div className="pnr-passenger-list">

                                    {pnrData.passengers.map(
                                        (passenger, index) => {
                                            const status =
                                                getPassengerStatus(passenger);

                                            const statusType =
                                                getStatusClass(status);

                                            return (
                                                <div
                                                    className="pnr-passenger-card"
                                                    key={
                                                        passenger._id ||
                                                        passenger.passengerNumber ||
                                                        index
                                                    }
                                                >

                                                    <div className="pnr-passenger-number">
                                                        {index + 1}
                                                    </div>

                                                    <div className="pnr-passenger-main">

                                                        <span>
                                                            PASSENGER
                                                        </span>

                                                        <strong>
                                                            {passenger.name ||
                                                                `Passenger ${index + 1}`}
                                                        </strong>

                                                        <div
                                                            className={`pnr-passenger-status ${statusType}`}
                                                        >
                                                            {getStatusLabel(status)}
                                                        </div>

                                                    </div>

                                                    <div className="pnr-passenger-info">

                                                        <div>
                                                            <span>BOOKING</span>
                                                            <strong>
                                                                {passenger.booking
                                                                    ?.status ||
                                                                    "—"}
                                                            </strong>
                                                        </div>

                                                        <div>
                                                            <span>CURRENT</span>
                                                            <strong>
                                                                {passenger.current
                                                                    ?.status ||
                                                                    "—"}
                                                            </strong>
                                                        </div>

                                                        <div>
                                                            <span>BERTH</span>
                                                            <strong>
                                                                {passenger.current
                                                                    ?.berth ||
                                                                    passenger.booking
                                                                        ?.berth ||
                                                                    "—"}
                                                            </strong>
                                                        </div>

                                                    </div>

                                                </div>
                                            );
                                        }
                                    )}

                                </div>
                            ) : (
                                <div className="pnr-empty-passengers">

                                    <span>🎫</span>

                                    <strong>
                                        No passenger details available
                                    </strong>

                                    <p>
                                        Passenger information
                                        was not returned for
                                        this PNR.
                                    </p>

                                </div>
                            )}

                        </div>


                        {/* ADDITIONAL INFORMATION */}

                        <div className="pnr-info-grid">

                            <div className="pnr-info-card">
                                <span>OVERALL STATUS</span>
                                <strong>
                                    {getStatusLabel(overallStatus)}
                                </strong>
                            </div>

                            <div className="pnr-info-card">
                                <span>TRAIN</span>
                                <strong>{trainNumber}</strong>
                            </div>

                            <div className="pnr-info-card">
                                <span>LAST CHECKED</span>
                                <strong>
                                    {formatDateTime(
                                        pnrData.lastCheckedAt
                                    )}
                                </strong>
                            </div>

                            <div className="pnr-info-card">
                                <span>PNR</span>
                                <strong>
                                    {pnrData.pnr || pnr}
                                </strong>
                            </div>

                        </div>


                        {/* ACTIONS */}

                        <div className="pnr-actions">

                            <button
                                type="button"
                                className="pnr-refresh-button"
                                onClick={handleRefresh}
                                disabled={loading}
                            >
                                ↻{" "}
                                {loading
                                    ? "Checking..."
                                    : "Refresh Status"}
                            </button>

                            <button
                                type="button"
                                className="pnr-delete-button"
                                onClick={() =>
                                    handleDelete(pnrData._id)
                                }
                            >
                                🗑 Delete PNR
                            </button>

                        </div>

                    </section>
                )}


                {/* SAVED PNRS */}

                <section className="pnr-saved-section">

                    <div className="pnr-section-heading pnr-saved-heading">

                        <div>
                            <span className="pnr-section-label">
                                YOUR RESERVATIONS
                            </span>

                            <h2>Saved PNRs</h2>

                            <p>
                                Select a saved PNR to view
                                its latest reservation details.
                            </p>
                        </div>

                        <div className="pnr-count-box">
                            <strong>{savedPNRs.length}</strong>
                            <span>PNRS</span>
                        </div>

                    </div>

                    {loadingList ? (
                        <div className="pnr-empty-state">

                            <div className="pnr-loading-ring" />

                            <h3>Loading PNRs...</h3>

                            <p>
                                Fetching your saved
                                reservations.
                            </p>

                        </div>
                    ) : savedPNRs.length === 0 ? (
                        <div className="pnr-empty-state">

                            <div className="pnr-empty-icon">
                                🎫
                            </div>

                            <h3>No saved PNRs yet</h3>

                            <p>
                                Enter a 10-digit PNR above
                                to start building your
                                monitored reservation list.
                            </p>

                        </div>
                    ) : (
                        <div className="pnr-saved-grid">

                            {savedPNRs.map((item) => {
                                const savedStatus =
                                    item?.passengers?.[0]?.current?.status ||
                                    item?.passengers?.[0]?.booking?.status ||
                                    "—";

                                const isSelected =
                                    pnrData?._id === item._id;

                                return (
                                    <button
                                        type="button"
                                        className={`pnr-saved-card ${
                                            isSelected
                                                ? "selected"
                                                : ""
                                        }`}
                                        key={item._id}
                                        onClick={() =>
                                            openSavedPNR(item)
                                        }
                                    >

                                        <div className="pnr-saved-icon">
                                            🎫
                                        </div>

                                        <div className="pnr-saved-main">
                                            <span>PNR</span>
                                            <strong>{item.pnr}</strong>
                                        </div>

                                        <div className="pnr-saved-train">
                                            <span>TRAIN</span>
                                            <strong>
                                                {item?.train?.number ||
                                                    item?.trainNumber ||
                                                    "—"}
                                            </strong>
                                        </div>

                                        <div
                                            className={`pnr-saved-status ${getStatusClass(
                                                savedStatus
                                            )}`}
                                        >
                                            {getStatusLabel(savedStatus)}
                                        </div>

                                    </button>
                                );
                            })}

                        </div>
                    )}

                </section>


                {/* INFORMATION NOTE */}

                <section className="pnr-note">

                    <div className="pnr-note-icon">
                        ⚠
                    </div>

                    <div>
                        <strong>
                            PNR information can change
                        </strong>

                        <p>
                            Railway reservation status may
                            change after chart preparation.
                            Always verify the latest status
                            before travelling.
                        </p>
                    </div>

                </section>

            </main>

        </div>
    );
}


export default PNR;