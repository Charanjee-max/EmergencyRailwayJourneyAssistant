import {
    useEffect,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import Navbar from "../../components/Navbar/Navbar";

import {
    checkPNR,
    getPNRs,
    deletePNR,
} from "../../api/pnrAPI";

import "./PNR.css";


// =========================================================
// HELPERS
// =========================================================

const getValue = (
    object,
    paths = [],
    fallback = "—"
) => {

    for (const path of paths) {

        const parts =
            path.split(".");

        let current =
            object;

        for (const part of parts) {

            if (
                current === null ||
                current === undefined
            ) {
                break;
            }

            current =
                current[part];
        }

        if (
            current !== undefined &&
            current !== null &&
            String(current).trim() !== ""
        ) {
            return current;
        }
    }

    return fallback;
};


const normalizeStatus = (
    status
) => {

    return String(
        status || "UNKNOWN"
    )
        .trim()
        .toUpperCase();
};


const getStatusClass = (
    status
) => {

    const normalized =
        normalizeStatus(status);

    if (
        normalized === "CNF" ||
        normalized === "CONFIRMED"
    ) {
        return "confirmed";
    }

    if (
        normalized === "RAC"
    ) {
        return "rac";
    }

    if (
        normalized.includes("WL") ||
        normalized.includes("WAIT")
    ) {
        return "waitlist";
    }

    if (
        normalized === "CAN" ||
        normalized === "CANCELLED"
    ) {
        return "cancelled";
    }

    return "unknown";
};


const formatDate = (
    value
) => {

    if (!value) {
        return "—";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
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
// COMPONENT
// =========================================================

function PNR() {

    const navigate =
        useNavigate();


    // =====================================================
    // STATE
    // =====================================================

    const [
        pnr,
        setPnr,
    ] = useState("");


    const [
        pnrData,
        setPnrData,
    ] = useState(null);


    const [
        savedPNRs,
        setSavedPNRs,
    ] = useState([]);


    const [
        loading,
        setLoading,
    ] = useState(false);


    const [
        listLoading,
        setListLoading,
    ] = useState(true);


    const [
        error,
        setError,
    ] = useState("");


    const [
        success,
        setSuccess,
    ] = useState("");


    // =====================================================
    // LOAD SAVED PNRS
    // =====================================================

    const loadSavedPNRs =
        async () => {

            try {

                setListLoading(
                    true
                );

                const response =
                    await getPNRs();

                const list =
                    response?.data?.data ||
                    response?.data?.pnrs ||
                    response?.data ||
                    [];

                setSavedPNRs(
                    Array.isArray(list)
                        ? list
                        : []
                );

            } catch (err) {

                console.error(
                    "PNR LIST ERROR:",
                    err
                );

            } finally {

                setListLoading(
                    false
                );
            }
        };


    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        loadSavedPNRs();

    }, []);


    // =====================================================
    // CHECK PNR
    // =====================================================

    const handleCheckPNR =
        async (
            event
        ) => {

            if (event) {
                event.preventDefault();
            }


            const cleanPNR =
                String(pnr)
                    .replace(
                        /\D/g,
                        ""
                    )
                    .slice(
                        0,
                        10
                    );


            setPnr(
                cleanPNR
            );


            if (
                cleanPNR.length !== 10
            ) {

                setError(
                    "Please enter a valid 10-digit PNR."
                );

                setSuccess("");

                return;
            }


            try {

                setLoading(
                    true
                );

                setError("");

                setSuccess("");


                const response =
                    await checkPNR(
                        cleanPNR
                    );


                const data =
                    response?.data?.data ||
                    response?.data;


                if (!data) {

                    setError(
                        "No PNR information was returned."
                    );

                    return;
                }


                setPnrData(
                    data
                );


                setSuccess(
                    "PNR status updated successfully."
                );


                await loadSavedPNRs();

            } catch (err) {

                console.error(
                    "PNR CHECK ERROR:",
                    err
                );


                setError(
                    err?.response?.data?.message ||
                    "Unable to fetch PNR status."
                );

                setSuccess("");

            } finally {

                setLoading(
                    false
                );
            }
        };


    // =====================================================
    // REFRESH
    // =====================================================

    const handleRefresh =
        async () => {

            const currentPNR =
                pnrData?.pnr ||
                pnrData?.pnrNumber ||
                pnr;


            if (
                !currentPNR
            ) {
                return;
            }


            setPnr(
                String(
                    currentPNR
                )
            );


            await handleCheckPNR();
        };


    // =====================================================
    // DELETE
    // =====================================================

    const handleDelete =
        async (
            id
        ) => {

            if (!id) {
                return;
            }


            const confirmed =
                window.confirm(
                    "Are you sure you want to delete this saved PNR?"
                );


            if (!confirmed) {
                return;
            }


            try {

                setError("");

                setSuccess("");


                await deletePNR(
                    id
                );


                if (
                    pnrData?._id === id ||
                    pnrData?.id === id
                ) {

                    setPnrData(
                        null
                    );

                    setPnr("");
                }


                await loadSavedPNRs();


                setSuccess(
                    "PNR deleted successfully."
                );

            } catch (err) {

                console.error(
                    "PNR DELETE ERROR:",
                    err
                );


                setError(
                    err?.response?.data?.message ||
                    "Unable to delete PNR."
                );
            }
        };


    // =====================================================
    // OPEN SAVED PNR
    // =====================================================

    const openSavedPNR =
        (
            item
        ) => {

            const value =
                item?.pnr ||
                item?.pnrNumber ||
                "";


            setPnr(
                String(value)
            );


            setPnrData(
                item
            );


            setError("");

            setSuccess("");
        };


    // =====================================================
    // EXTRACT DATA
    // =====================================================

    const currentPNR =
        getValue(
            pnrData,
            [
                "pnr",
                "pnrNumber",
            ],
            pnr || "—"
        );


    const trainNumber =
        getValue(
            pnrData,
            [
                "train.number",
                "train.trainNumber",
                "trainNo",
                "trainNumber",
            ]
        );


    const trainName =
        getValue(
            pnrData,
            [
                "train.name",
                "train.trainName",
                "trainName",
            ],
            "Railway Journey"
        );


    const source =
        getValue(
            pnrData,
            [
                "journey.boardingPoint.name",
                "journey.boardingPoint.code",
                "boardingStation",
                "source",
            ]
        );


    const destination =
        getValue(
            pnrData,
            [
                "journey.destinationPoint.name",
                "journey.destinationPoint.code",
                "destinationStation",
                "destination",
            ]
        );


    const journeyDate =
        getValue(
            pnrData,
            [
                "journey.date",
                "journeyDate",
                "dateOfJourney",
            ]
        );


    const travelClass =
        getValue(
            pnrData,
            [
                "booking.class",
                "train.class",
                "classCode",
            ]
        );


    const quota =
        getValue(
            pnrData,
            [
                "booking.quota",
                "quota",
            ]
        );


    const fare =
        getValue(
            pnrData,
            [
                "booking.fare",
                "fare",
            ]
        );


    const passengers =
        Array.isArray(
            pnrData?.passengers
        )
            ? pnrData.passengers
            : [];


    const passengerStatuses =
        passengers.map(
            (passenger) =>
                normalizeStatus(
                    getValue(
                        passenger,
                        [
                            "current.status",
                            "booking.status",
                            "status",
                        ],
                        "UNKNOWN"
                    )
                )
        );


    const overallStatus =
        passengerStatuses.includes(
            "CNF"
        )
            ? "CONFIRMED"
            : passengerStatuses.includes(
                  "CONFIRMED"
              )
              ? "CONFIRMED"
              : passengerStatuses.includes(
                    "RAC"
                )
                ? "RAC"
                : passengerStatuses.some(
                      (status) =>
                          status.includes(
                              "WL"
                          )
                  )
                  ? "WAITLIST"
                  : passengerStatuses.includes(
                        "CAN"
                    )
                    ? "CANCELLED"
                    : passengerStatuses[0] ||
                      "UNKNOWN";


    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="pnr-page">

            <Navbar />


            <main className="pnr-main">


                {/* =========================================
                    BACKGROUND
                ========================================= */}

                <div className="pnr-glow pnr-glow-one" />

                <div className="pnr-glow pnr-glow-two" />


                {/* =========================================
                    HERO
                ========================================= */}

                <section className="pnr-hero">

                    <div className="pnr-hero-left">

                        <button
                            type="button"
                            className="pnr-back-button"
                            onClick={() =>
                                navigate(
                                    "/dashboard"
                                )
                            }
                        >
                            ← Dashboard
                        </button>


                        <div className="pnr-eyebrow">

                            <span className="pnr-eyebrow-dot" />

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


                    <div className="pnr-hero-visual">

                        <div className="pnr-ring ring-one" />

                        <div className="pnr-ring ring-two" />


                        <div className="pnr-train-card">

                            <div className="pnr-train-icon">
                                🚆
                            </div>


                            <div className="pnr-track">

                                <span />

                                <div />

                                <span />

                            </div>


                            <strong>
                                ERJA
                            </strong>


                            <small>
                                Reservation Intelligence
                            </small>

                        </div>

                    </div>

                </section>


                {/* =========================================
                    SEARCH
                ========================================= */}

                <section className="pnr-search-card">

                    <div className="pnr-search-header">

                        <div className="pnr-search-icon">
                            🎫
                        </div>


                        <div className="pnr-search-title">

                            <span>
                                CHECK RESERVATION
                            </span>

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


                        <div className="pnr-secure">
                            🔒 Secure
                        </div>

                    </div>


                    <form
                        className="pnr-form"
                        onSubmit={
                            handleCheckPNR
                        }
                    >

                        <div className="pnr-input-box">

                            <input
                                type="text"
                                inputMode="numeric"
                                autoComplete="off"
                                maxLength={10}
                                value={pnr}
                                placeholder="Enter 10 digit PNR"
                                onChange={(event) => {

                                    setPnr(
                                        event.target.value
                                            .replace(
                                                /\D/g,
                                                ""
                                            )
                                            .slice(
                                                0,
                                                10
                                            )
                                    );

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
                            className="pnr-check-button"
                            disabled={
                                loading
                            }
                        >

                            {loading ? (
                                <>
                                    <span className="pnr-spinner" />
                                    Checking...
                                </>
                            ) : (
                                <>
                                    Check PNR
                                    <b>→</b>
                                </>
                            )}

                        </button>

                    </form>


                    {error && (
                        <div className="pnr-alert pnr-alert-error">

                            <strong>
                                !
                            </strong>

                            <span>
                                {error}
                            </span>

                        </div>
                    )}


                    {success && (
                        <div className="pnr-alert pnr-alert-success">

                            <strong>
                                ✓
                            </strong>

                            <span>
                                {success}
                            </span>

                        </div>
                    )}

                </section>


                {/* =========================================
                    RESULT
                ========================================= */}

                {pnrData && (

                    <section className="pnr-result-card">

                        <div className="pnr-result-top">

                            <div>

                                <span className="pnr-section-label">
                                    CURRENT RESERVATION
                                </span>

                                <h2>
                                    PNR {currentPNR}
                                </h2>

                                <p>
                                    {trainName}
                                    {" · "}
                                    Train {trainNumber}
                                </p>

                            </div>


                            <div
                                className={`pnr-overall-status ${getStatusClass(
                                    overallStatus
                                )}`}
                            >

                                <span />

                                {overallStatus}

                            </div>

                        </div>


                        <div className="pnr-details-grid">

                            <div className="pnr-detail">

                                <span>
                                    TRAIN
                                </span>

                                <strong>
                                    {trainNumber}
                                </strong>

                                <small>
                                    {trainName}
                                </small>

                            </div>


                            <div className="pnr-detail">

                                <span>
                                    JOURNEY
                                </span>

                                <strong>
                                    {source}
                                </strong>

                                <small>
                                    → {destination}
                                </small>

                            </div>


                            <div className="pnr-detail">

                                <span>
                                    JOURNEY DATE
                                </span>

                                <strong>
                                    {formatDate(
                                        journeyDate
                                    )}
                                </strong>

                                <small>
                                    {travelClass}
                                    {" · "}
                                    {quota}
                                </small>

                            </div>


                            <div className="pnr-detail">

                                <span>
                                    FARE
                                </span>

                                <strong>
                                    {fare === "—"
                                        ? "—"
                                        : `₹${fare}`}
                                </strong>

                                <small>
                                    Reservation details
                                </small>

                            </div>

                        </div>


                        {/* PASSENGERS */}

                        <div className="pnr-passengers-section">

                            <div className="pnr-passengers-heading">

                                <div>

                                    <span>
                                        PASSENGERS
                                    </span>

                                    <h3>
                                        Passenger Status
                                    </h3>

                                </div>


                                <strong>
                                    {passengers.length}
                                </strong>

                            </div>


                            {passengers.length === 0 ? (

                                <div className="pnr-no-passengers">

                                    <span>
                                        ℹ
                                    </span>

                                    <p>
                                        Passenger details
                                        are not available
                                        in the current
                                        PNR response.
                                    </p>

                                </div>

                            ) : (

                                <div className="pnr-passenger-list">

                                    {passengers.map(
                                        (
                                            passenger,
                                            index
                                        ) => {

                                            const status =
                                                getValue(
                                                    passenger,
                                                    [
                                                        "current.status",
                                                        "booking.status",
                                                        "status",
                                                    ],
                                                    "UNKNOWN"
                                                );


                                            const coach =
                                                getValue(
                                                    passenger,
                                                    [
                                                        "current.coach",
                                                        "booking.coach",
                                                        "coach",
                                                    ],
                                                    ""
                                                );


                                            const berth =
                                                getValue(
                                                    passenger,
                                                    [
                                                        "current.berth",
                                                        "booking.berth",
                                                        "berth",
                                                    ],
                                                    ""
                                                );


                                            const bookingStatus =
                                                getValue(
                                                    passenger,
                                                    [
                                                        "booking.status",
                                                    ],
                                                    "—"
                                                );


                                            const currentStatus =
                                                getValue(
                                                    passenger,
                                                    [
                                                        "current.status",
                                                    ],
                                                    "—"
                                                );


                                            return (

                                                <div
                                                    className="pnr-passenger"
                                                    key={
                                                        passenger?._id ||
                                                        passenger?.id ||
                                                        index
                                                    }
                                                >

                                                    <div className="pnr-passenger-number">
                                                        {index + 1}
                                                    </div>


                                                    <div className="pnr-passenger-info">

                                                        <strong>
                                                            {
                                                                passenger?.name ||
                                                                `Passenger ${
                                                                    index + 1
                                                                }`
                                                            }
                                                        </strong>


                                                        <div>

                                                            <span>
                                                                Booking:{" "}
                                                                {
                                                                    bookingStatus
                                                                }
                                                            </span>

                                                            <span>
                                                                Current:{" "}
                                                                {
                                                                    currentStatus
                                                                }
                                                            </span>

                                                        </div>

                                                    </div>


                                                    <div className="pnr-berth">

                                                        <span>
                                                            BERTH
                                                        </span>

                                                        <strong>
                                                            {coach || berth
                                                                ? `${coach} ${berth}`.trim()
                                                                : "—"}
                                                        </strong>

                                                    </div>


                                                    <div
                                                        className={`pnr-passenger-status ${getStatusClass(
                                                            status
                                                        )}`}
                                                    >
                                                        {status}
                                                    </div>

                                                </div>

                                            );
                                        }
                                    )}

                                </div>

                            )}

                        </div>


                        <div className="pnr-result-actions">

                            <button
                                type="button"
                                className="pnr-refresh"
                                onClick={
                                    handleRefresh
                                }
                                disabled={
                                    loading
                                }
                            >
                                ↻ Refresh Status
                            </button>


                            <button
                                type="button"
                                className="pnr-delete"
                                onClick={() =>
                                    handleDelete(
                                        pnrData?._id ||
                                        pnrData?.id
                                    )
                                }
                            >
                                🗑 Delete PNR
                            </button>

                        </div>

                    </section>

                )}


                {/* =========================================
                    SAVED PNRS
                ========================================= */}

                <section className="pnr-saved-section">

                    <div className="pnr-section-heading">

                        <div>

                            <span>
                                YOUR RESERVATIONS
                            </span>

                            <h2>
                                Saved PNRs
                            </h2>

                        </div>


                        <div className="pnr-count">
                            {savedPNRs.length}
                        </div>

                    </div>


                    {listLoading ? (

                        <div className="pnr-loading">

                            <span className="pnr-spinner dark" />

                            <p>
                                Loading your reservations...
                            </p>

                        </div>

                    ) : savedPNRs.length === 0 ? (

                        <div className="pnr-empty">

                            <div className="pnr-empty-icon">
                                🎫
                            </div>

                            <h3>
                                No saved PNRs
                            </h3>

                            <p>
                                Check a PNR and it
                                will appear here.
                            </p>

                        </div>

                    ) : (

                        <div className="pnr-saved-grid">

                            {savedPNRs.map(
                                (
                                    item
                                ) => {

                                    const itemStatus =
                                        getValue(
                                            item,
                                            [
                                                "passengers.0.current.status",
                                                "passengers.0.booking.status",
                                                "status",
                                            ],
                                            "—"
                                        );


                                    const itemTrain =
                                        getValue(
                                            item,
                                            [
                                                "train.number",
                                                "train.trainNumber",
                                                "trainNumber",
                                            ],
                                            "—"
                                        );


                                    const itemPNR =
                                        getValue(
                                            item,
                                            [
                                                "pnr",
                                                "pnrNumber",
                                            ],
                                            "—"
                                        );


                                    return (

                                        <button
                                            type="button"
                                            className="pnr-saved-card"
                                            key={
                                                item?._id ||
                                                item?.id ||
                                                itemPNR
                                            }
                                            onClick={() =>
                                                openSavedPNR(
                                                    item
                                                )
                                            }
                                        >

                                            <div className="pnr-saved-icon">
                                                🎫
                                            </div>


                                            <div className="pnr-saved-info">

                                                <span>
                                                    PNR
                                                </span>

                                                <strong>
                                                    {itemPNR}
                                                </strong>

                                            </div>


                                            <div className="pnr-saved-info">

                                                <span>
                                                    TRAIN
                                                </span>

                                                <strong>
                                                    {itemTrain}
                                                </strong>

                                            </div>


                                            <div
                                                className={`pnr-saved-status ${getStatusClass(
                                                    itemStatus
                                                )}`}
                                            >
                                                {itemStatus}
                                            </div>


                                            <span className="pnr-saved-arrow">
                                                →
                                            </span>

                                        </button>

                                    );
                                }
                            )}

                        </div>

                    )}

                </section>


                {/* =========================================
                    INFORMATION
                ========================================= */}

                <section className="pnr-information">

                    <div className="pnr-information-icon">
                        !
                    </div>


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

                </section>


            </main>

        </div>
    );
}


export default PNR;