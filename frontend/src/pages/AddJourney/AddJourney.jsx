import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./AddJourney.css";

import { createJourney } from "../../api/journeyAPI";
import { searchStation } from "../../api/trainAPI";

export default function AddJourney() {
    const navigate = useNavigate();

    // =========================================================
    // FORM DATA
    // =========================================================

    const [formData, setFormData] = useState({
        trainNumber: "",
        journeyDate: "",
        boardingStation: "",
        destinationStation: "",
        preferredClass: "3A",
        allowMixedClass: false,
    });

    // =========================================================
    // UI STATE
    // =========================================================

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // =========================================================
    // STATION AUTOCOMPLETE
    // =========================================================

    const [boardingSuggestions, setBoardingSuggestions] = useState([]);
    const [destinationSuggestions, setDestinationSuggestions] = useState([]);

    const [activeStationField, setActiveStationField] = useState(null);
    const [stationLoadingField, setStationLoadingField] = useState(null);

    /*
     * Separate request IDs prevent an older API response from
     * overwriting a newer search.
     */
    const boardingSearchId = useRef(0);
    const destinationSearchId = useRef(0);

    // =========================================================
    // TODAY
    // =========================================================

    const getTodayDate = () => {
        const now = new Date();

        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    const today = getTodayDate();

    // =========================================================
    // NORMALIZE STATION
    // =========================================================

    const normalizeStation = (station) => {
        if (!station) {
            return null;
        }

        const code = String(
            station.code ||
            station.stationCode ||
            ""
        )
            .trim()
            .toUpperCase();

        const name = String(
            station.name ||
            station.stationName ||
            ""
        ).trim();

        if (!code || !name) {
            return null;
        }

        return {
            code,
            name,
            city: station.city || "",
        };
    };

    // =========================================================
    // INPUT CHANGE
    // =========================================================

    const handleChange = (e) => {
        const {
            name,
            value,
            type,
            checked,
        } = e.target;

        let updatedValue =
            type === "checkbox"
                ? checked
                : value;

        // Train number: numbers only
        if (name === "trainNumber") {
            updatedValue = value.replace(/\D/g, "");
        }

        // Station fields: uppercase
        if (
            name === "boardingStation" ||
            name === "destinationStation"
        ) {
            updatedValue = value.toUpperCase();
        }

        setFormData((prev) => ({
            ...prev,
            [name]: updatedValue,
        }));

        setError("");

        // Clear boarding suggestions
        if (
            name === "boardingStation" &&
            !String(updatedValue).trim()
        ) {
            setBoardingSuggestions([]);
            boardingSearchId.current += 1;

            if (activeStationField === "boardingStation") {
                setStationLoadingField(null);
            }
        }

        // Clear destination suggestions
        if (
            name === "destinationStation" &&
            !String(updatedValue).trim()
        ) {
            setDestinationSuggestions([]);
            destinationSearchId.current += 1;

            if (activeStationField === "destinationStation") {
                setStationLoadingField(null);
            }
        }
    };

    // =========================================================
    // SET SUGGESTIONS
    // =========================================================

    const setSuggestionsForField = (field, results) => {
        if (field === "boardingStation") {
            setBoardingSuggestions(results);
            return;
        }

        if (field === "destinationStation") {
            setDestinationSuggestions(results);
        }
    };

    // =========================================================
    // STATION SEARCH
    // =========================================================

    const searchStations = async (
        field,
        value,
        requestId
    ) => {
        const search = String(value || "").trim();

        const currentRequestId =
            field === "boardingStation"
                ? boardingSearchId.current
                : destinationSearchId.current;

        // Ignore stale request
        if (requestId !== currentRequestId) {
            return;
        }

        // Minimum search length
        if (search.length < 2) {
            setSuggestionsForField(field, []);

            if (
                requestId ===
                (
                    field === "boardingStation"
                        ? boardingSearchId.current
                        : destinationSearchId.current
                )
            ) {
                setStationLoadingField(null);
            }

            return;
        }

        setStationLoadingField(field);

        try {
            const response = await searchStation(search);

            const latestRequestId =
                field === "boardingStation"
                    ? boardingSearchId.current
                    : destinationSearchId.current;

            // Ignore old API response
            if (requestId !== latestRequestId) {
                return;
            }

            const backendResults =
                Array.isArray(response?.data?.data)
                    ? response.data.data
                    : [];

            const normalizedResults =
                backendResults
                    .map(normalizeStation)
                    .filter(Boolean);

            setSuggestionsForField(
                field,
                normalizedResults
            );
        } catch (searchError) {
            console.error(
                "STATION SEARCH ERROR =",
                searchError
            );

            const latestRequestId =
                field === "boardingStation"
                    ? boardingSearchId.current
                    : destinationSearchId.current;

            if (requestId === latestRequestId) {
                setSuggestionsForField(field, []);
            }
        } finally {
            const latestRequestId =
                field === "boardingStation"
                    ? boardingSearchId.current
                    : destinationSearchId.current;

            if (requestId === latestRequestId) {
                setStationLoadingField(null);
            }
        }
    };

    // =========================================================
    // BOARDING AUTOCOMPLETE
    // =========================================================

    useEffect(() => {
        const value = formData.boardingStation;

        boardingSearchId.current += 1;

        const requestId =
            boardingSearchId.current;

        if (!value.trim()) {
            setBoardingSuggestions([]);

            if (activeStationField === "boardingStation") {
                setStationLoadingField(null);
            }

            return;
        }

        const timer = setTimeout(() => {
            searchStations(
                "boardingStation",
                value,
                requestId
            );
        }, 350);

        return () => {
            clearTimeout(timer);
        };
    }, [formData.boardingStation]);

    // =========================================================
    // DESTINATION AUTOCOMPLETE
    // =========================================================

    useEffect(() => {
        const value = formData.destinationStation;

        destinationSearchId.current += 1;

        const requestId =
            destinationSearchId.current;

        if (!value.trim()) {
            setDestinationSuggestions([]);

            if (activeStationField === "destinationStation") {
                setStationLoadingField(null);
            }

            return;
        }

        const timer = setTimeout(() => {
            searchStations(
                "destinationStation",
                value,
                requestId
            );
        }, 350);

        return () => {
            clearTimeout(timer);
        };
    }, [formData.destinationStation]);

    // =========================================================
    // SELECT STATION
    // =========================================================

    const selectStation = (field, station) => {
        const normalized = normalizeStation(station);

        if (!normalized) {
            return;
        }

        setFormData((prev) => ({
            ...prev,
            [field]: normalized.code,
        }));

        if (field === "boardingStation") {
            setBoardingSuggestions([]);
            boardingSearchId.current += 1;
        }

        if (field === "destinationStation") {
            setDestinationSuggestions([]);
            destinationSearchId.current += 1;
        }

        setStationLoadingField(null);
        setActiveStationField(null);
        setError("");
    };

    // =========================================================
    // CLOSE AUTOCOMPLETE
    // =========================================================

    const closeStationSuggestions = () => {
        setTimeout(() => {
            setActiveStationField(null);
        }, 150);
    };

    // =========================================================
    // SUBMIT
    // =========================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        const trainNumber =
            formData.trainNumber.trim();

        const source =
            formData.boardingStation
                .trim()
                .toUpperCase();

        const destination =
            formData.destinationStation
                .trim()
                .toUpperCase();

        const journeyDate =
            formData.journeyDate;

        // =====================================================
        // VALIDATION
        // =====================================================

        if (!/^\d{4,6}$/.test(trainNumber)) {
            setError(
                "Please enter a valid train number (4–6 digits)."
            );
            return;
        }

        const stationCodeRegex =
            /^[A-Z0-9]{2,5}$/;

        if (!stationCodeRegex.test(source)) {
            setError(
                "Please select a valid source railway station from the suggestions."
            );
            return;
        }

        if (!stationCodeRegex.test(destination)) {
            setError(
                "Please select a valid destination railway station from the suggestions."
            );
            return;
        }

        if (source === destination) {
            setError(
                "Source and destination cannot be the same."
            );
            return;
        }

        if (!journeyDate) {
            setError(
                "Please select a journey date."
            );
            return;
        }

        if (journeyDate < today) {
            setError(
                "Journey date cannot be in the past."
            );
            return;
        }

        // =====================================================
        // PAYLOAD
        // =====================================================

        const payload = {
            trainNumber,
            journeyDate,
            boardingStation: source,
            destinationStation: destination,

            allowedClasses: [
                {
                    class: formData.preferredClass,
                    enabled: true,
                },
            ],

            allowMixedClass:
                formData.allowMixedClass,

            preferredStrategy:
                "SINGLE_TICKET",
        };

        console.log(
            "========================================"
        );

        console.log(
            "🚆 CREATE JOURNEY PAYLOAD"
        );

        console.log(
            "========================================"
        );

        console.log(payload);

        // =====================================================
        // CREATE JOURNEY
        // =====================================================

        try {
            setLoading(true);

            const response =
                await createJourney(payload);

            console.log(
                "========================================"
            );

            console.log(
                "✅ JOURNEY CREATED SUCCESSFULLY"
            );

            console.log(
                "========================================"
            );

            console.log(response);

            navigate("/dashboard");
        } catch (error) {
            console.error(
                "========================================"
            );

            console.error(
                "❌ CREATE JOURNEY ERROR"
            );

            console.error(
                "========================================"
            );

            console.error(error);

            const backendData =
                error?.response?.data;

            if (
                backendData?.errors &&
                Array.isArray(backendData.errors) &&
                backendData.errors.length > 0
            ) {
                const firstError =
                    backendData.errors[0];

                setError(
                    firstError.message ||
                    "Please check the journey details."
                );

                return;
            }

            if (backendData?.message) {
                setError(
                    backendData.message
                );

                return;
            }

            setError(
                "Unable to save journey. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="addJourneyPage">

            {/* =================================================
                TOP BAR
            ================================================= */}

            <div className="addJourneyTopBar">
                <button
                    type="button"
                    className="backButton"
                    onClick={() =>
                        navigate("/dashboard")
                    }
                >
                    <span>←</span>
                    Dashboard
                </button>

                <div className="pageSecureBadge">
                    <span>●</span>
                    Secure Journey Monitoring
                </div>
            </div>

            {/* =================================================
                MAIN
            ================================================= */}

            <div className="addJourneyLayout">

                {/* =================================================
                    LEFT PANEL
                ================================================= */}

                <section className="journeyInfo">

                    <div className="infoEyebrow">
                        <span className="eyebrowDot" />
                        ERJA CONTROL CENTER
                    </div>

                    <h1>
                        Plan your
                        <span>journey smarter.</span>
                    </h1>

                    <p className="infoDescription">
                        Add your railway journey and let ERJA
                        monitor chart preparation, analyze
                        available berths and identify possible
                        booking strategies.
                    </p>

                    {/* ROUTE VISUAL */}

                    <div className="routeVisual">

                        <div className="routePoint">
                            <div className="routeCircle">
                                <span />
                            </div>

                            <div>
                                <strong>
                                    Your Source
                                </strong>

                                <small>
                                    Boarding station
                                </small>
                            </div>
                        </div>

                        <div className="routeLine">
                            <i />
                            <i />
                            <i />
                            <i />
                            <i />
                        </div>

                        <div className="routePoint">
                            <div className="routeCircle destination">
                                <span />
                            </div>

                            <div>
                                <strong>
                                    Your Destination
                                </strong>

                                <small>
                                    Final journey station
                                </small>
                            </div>
                        </div>

                    </div>

                    {/* STEPS */}

                    <div className="journeySteps">

                        <div className="journeyStep active">
                            <div className="stepNumber">
                                01
                            </div>

                            <div>
                                <strong>
                                    Add journey
                                </strong>

                                <span>
                                    Enter your train and route.
                                </span>
                            </div>
                        </div>

                        <div className="journeyStep">
                            <div className="stepNumber">
                                02
                            </div>

                            <div>
                                <strong>
                                    Monitor
                                </strong>

                                <span>
                                    ERJA watches the journey.
                                </span>
                            </div>
                        </div>

                        <div className="journeyStep">
                            <div className="stepNumber">
                                03
                            </div>

                            <div>
                                <strong>
                                    Analyze
                                </strong>

                                <span>
                                    Vacancy is analyzed by route.
                                </span>
                            </div>
                        </div>

                        <div className="journeyStep">
                            <div className="stepNumber">
                                04
                            </div>

                            <div>
                                <strong>
                                    Recommend
                                </strong>

                                <span>
                                    Get practical booking options.
                                </span>
                            </div>
                        </div>

                    </div>

                </section>

                {/* =================================================
                    FORM CARD
                ================================================= */}

                <section className="journeyCard">

                    <div className="cardTopGlow" />

                    <div className="cardHeader">

                        <div>
                            <span className="cardLabel">
                                NEW MONITORING REQUEST
                            </span>

                            <h2>
                                Journey Details
                            </h2>

                            <p>
                                Tell ERJA what journey you want to monitor.
                            </p>
                        </div>

                        <div className="cardTrainIcon">
                            <span>🚆</span>
                        </div>

                    </div>

                    {/* WARNING */}

                    <div className="availabilityNotice">
                        <span className="noticeIcon">
                            ⚠
                        </span>

                        <div>
                            <strong>
                                Availability can change
                            </strong>

                            <p>
                                Recommended berths may be booked
                                before you complete your booking.
                            </p>
                        </div>
                    </div>

                    {/* ERROR */}

                    {error && (
                        <div
                            className="formError"
                            role="alert"
                        >
                            <span>!</span>
                            <div>
                                <strong>
                                    Unable to continue
                                </strong>

                                <p>
                                    {error}
                                </p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>

                        {/* TRAIN + DATE */}

                        <div className="formGrid">

                            <div className="formGroup">

                                <label htmlFor="trainNumber">
                                    Train Number
                                </label>

                                <div className="inputWrapper">

                                    <span className="inputIcon">
                                        🚆
                                    </span>

                                    <input
                                        id="trainNumber"
                                        type="text"
                                        name="trainNumber"
                                        value={
                                            formData.trainNumber
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="e.g. 12764"
                                        inputMode="numeric"
                                        maxLength="6"
                                        required
                                    />

                                </div>

                                <small>
                                    Enter a 4–6 digit Indian Railways train number.
                                </small>

                            </div>

                            <div className="formGroup">

                                <label htmlFor="journeyDate">
                                    Journey Date
                                </label>

                                <div className="inputWrapper">

                                    <span className="inputIcon">
                                        📅
                                    </span>

                                    <input
                                        id="journeyDate"
                                        type="date"
                                        name="journeyDate"
                                        value={
                                            formData.journeyDate
                                        }
                                        min={today}
                                        onChange={
                                            handleChange
                                        }
                                        required
                                    />

                                </div>

                                <small>
                                    Today and future dates are allowed.
                                </small>

                            </div>

                        </div>

                        {/* ROUTE */}

                        <div className="routeSection">

                            <div className="sectionHeading">
                                <span className="sectionLine" />

                                <div>
                                    <strong>
                                        Travel Route
                                    </strong>

                                    <small>
                                        Select stations from the suggestions.
                                    </small>
                                </div>
                            </div>

                            <div className="routeRow">

                                {/* SOURCE */}

                                <div className="formGroup">

                                    <label htmlFor="boardingStation">
                                        Source
                                    </label>

                                    <div className="autocompleteWrapper">

                                        <div className="inputWrapper stationInput">

                                            <span className="inputIcon">
                                                📍
                                            </span>

                                            <input
                                                id="boardingStation"
                                                type="text"
                                                name="boardingStation"
                                                value={
                                                    formData.boardingStation
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                onFocus={() =>
                                                    setActiveStationField(
                                                        "boardingStation"
                                                    )
                                                }
                                                onBlur={
                                                    closeStationSuggestions
                                                }
                                                placeholder="Station code or name"
                                                maxLength="60"
                                                autoComplete="off"
                                                required
                                            />

                                            {stationLoadingField ===
                                                "boardingStation" &&
                                                activeStationField ===
                                                    "boardingStation" && (
                                                    <span className="stationSearchSpinner" />
                                                )}

                                        </div>

                                        {activeStationField ===
                                            "boardingStation" &&
                                            boardingSuggestions.length >
                                                0 && (

                                            <div className="autocompleteDropdown">

                                                <div className="dropdownHeader">
                                                    SELECT STATION
                                                </div>

                                                {boardingSuggestions.map(
                                                    (
                                                        station,
                                                        index
                                                    ) => (
                                                        <button
                                                            type="button"
                                                            key={
                                                                station.code ||
                                                                index
                                                            }
                                                            className="stationSuggestion"
                                                            onMouseDown={(
                                                                e
                                                            ) =>
                                                                e.preventDefault()
                                                            }
                                                            onClick={() =>
                                                                selectStation(
                                                                    "boardingStation",
                                                                    station
                                                                )
                                                            }
                                                        >
                                                            <span className="stationCode">
                                                                {
                                                                    station.code
                                                                }
                                                            </span>

                                                            <span className="stationName">
                                                                {
                                                                    station.name
                                                                }
                                                            </span>

                                                            <span className="suggestionArrow">
                                                                →
                                                            </span>
                                                        </button>
                                                    )
                                                )}

                                            </div>
                                        )}

                                    </div>

                                    <small>
                                        Type at least 2 characters.
                                    </small>

                                </div>

                                {/* ROUTE CONNECTOR */}

                                <div className="routeConnector">

                                    <div className="connectorLine" />

                                    <div className="connectorArrow">
                                        →
                                    </div>

                                </div>

                                {/* DESTINATION */}

                                <div className="formGroup">

                                    <label htmlFor="destinationStation">
                                        Destination
                                    </label>

                                    <div className="autocompleteWrapper">

                                        <div className="inputWrapper stationInput">

                                            <span className="inputIcon">
                                                📍
                                            </span>

                                            <input
                                                id="destinationStation"
                                                type="text"
                                                name="destinationStation"
                                                value={
                                                    formData.destinationStation
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                onFocus={() =>
                                                    setActiveStationField(
                                                        "destinationStation"
                                                    )
                                                }
                                                onBlur={
                                                    closeStationSuggestions
                                                }
                                                placeholder="Station code or name"
                                                maxLength="60"
                                                autoComplete="off"
                                                required
                                            />

                                            {stationLoadingField ===
                                                "destinationStation" &&
                                                activeStationField ===
                                                    "destinationStation" && (
                                                    <span className="stationSearchSpinner" />
                                                )}

                                        </div>

                                        {activeStationField ===
                                            "destinationStation" &&
                                            destinationSuggestions.length >
                                                0 && (

                                            <div className="autocompleteDropdown">

                                                <div className="dropdownHeader">
                                                    SELECT STATION
                                                </div>

                                                {destinationSuggestions.map(
                                                    (
                                                        station,
                                                        index
                                                    ) => (
                                                        <button
                                                            type="button"
                                                            key={
                                                                station.code ||
                                                                index
                                                            }
                                                            className="stationSuggestion"
                                                            onMouseDown={(
                                                                e
                                                            ) =>
                                                                e.preventDefault()
                                                            }
                                                            onClick={() =>
                                                                selectStation(
                                                                    "destinationStation",
                                                                    station
                                                                )
                                                            }
                                                        >
                                                            <span className="stationCode">
                                                                {
                                                                    station.code
                                                                }
                                                            </span>

                                                            <span className="stationName">
                                                                {
                                                                    station.name
                                                                }
                                                            </span>

                                                            <span className="suggestionArrow">
                                                                →
                                                            </span>
                                                        </button>
                                                    )
                                                )}

                                            </div>
                                        )}

                                    </div>

                                    <small>
                                        Type at least 2 characters.
                                    </small>

                                </div>

                            </div>

                        </div>

                        {/* CLASS */}

                        <div className="formGroup">

                            <label htmlFor="preferredClass">
                                Preferred Travel Class
                            </label>

                            <div className="classGrid">

                                {[
                                    {
                                        value: "1A",
                                        name: "First AC",
                                        icon: "◆",
                                    },
                                    {
                                        value: "2A",
                                        name: "AC 2 Tier",
                                        icon: "◇",
                                    },
                                    {
                                        value: "3A",
                                        name: "AC 3 Tier",
                                        icon: "◇",
                                    },
                                    {
                                        value: "3E",
                                        name: "AC 3 Economy",
                                        icon: "◇",
                                    },
                                    {
                                        value: "SL",
                                        name: "Sleeper",
                                        icon: "▤",
                                    },
                                ].map((item) => (
                                    <label
                                        key={item.value}
                                        className={`classOption ${
                                            formData.preferredClass ===
                                            item.value
                                                ? "selected"
                                                : ""
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="preferredClass"
                                            value={item.value}
                                            checked={
                                                formData.preferredClass ===
                                                item.value
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        />

                                        <span className="classIcon">
                                            {item.icon}
                                        </span>

                                        <span className="classContent">
                                            <strong>
                                                {item.value}
                                            </strong>

                                            <small>
                                                {item.name}
                                            </small>
                                        </span>

                                        <span className="classCheck">
                                            ✓
                                        </span>
                                    </label>
                                ))}

                            </div>

                        </div>

                        {/* MIXED CLASS */}

                        <label
                            className={`mixedClassOption ${
                                formData.allowMixedClass
                                    ? "selected"
                                    : ""
                            }`}
                        >
                            <input
                                type="checkbox"
                                name="allowMixedClass"
                                checked={
                                    formData.allowMixedClass
                                }
                                onChange={
                                    handleChange
                                }
                            />

                            <span className="customCheckbox">
                                {formData.allowMixedClass &&
                                    "✓"}
                            </span>

                            <span className="mixedClassText">

                                <strong>
                                    Allow Mixed Class Recommendations
                                </strong>

                                <span>
                                    Let ERJA consider different
                                    classes for different journey
                                    segments when useful.
                                </span>

                            </span>

                        </label>

                        {/* SUBMIT */}

                        <button
                            type="submit"
                            className="saveJourneyButton"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner" />
                                    Starting Monitoring...
                                </>
                            ) : (
                                <>
                                    Start Journey Monitoring
                                    <span className="buttonArrow">
                                        →
                                    </span>
                                </>
                            )}
                        </button>

                    </form>

                    <div className="secureNote">
                        <span>🔒</span>
                        Your journey information is securely
                        stored and used for ERJA monitoring.
                    </div>

                </section>

            </div>

        </div>
    );
}