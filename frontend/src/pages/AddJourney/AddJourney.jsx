import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./AddJourney.css";

import { createJourney } from "../../api/journeyAPI";
import { searchStation } from "../../api/trainAPI";


// =========================================================
// COMPONENT
// =========================================================

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
    // STATION AUTOCOMPLETE STATE
    // =========================================================

    const [boardingSuggestions, setBoardingSuggestions] =
        useState([]);

    const [destinationSuggestions, setDestinationSuggestions] =
        useState([]);

    const [activeStationField, setActiveStationField] =
        useState(null);

    /*
     * Which station field is currently loading.
     *
     * null
     * "boardingStation"
     * "destinationStation"
     */
    const [stationLoadingField, setStationLoadingField] =
        useState(null);

    // =========================================================
    // SEARCH REQUEST IDS
    // =========================================================
    //
    // IMPORTANT:
    // Each field has its own request ID.
    //
    // If user types:
    //
    // B
    // BZ
    // BZA
    //
    // and the B request finishes after BZA,
    // the old B result will be ignored.
    //
    // This prevents old results such as BZA/CSMT from
    // overwriting the latest search.
    // =========================================================

    const boardingSearchId = useRef(0);
    const destinationSearchId = useRef(0);

    // =========================================================
    // TODAY DATE
    // =========================================================

    const getTodayDate = () => {
        const now = new Date();

        const year = now.getFullYear();

        const month = String(
            now.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
            now.getDate()
        ).padStart(2, "0");

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
    // NORMAL INPUT CHANGE
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

        // -----------------------------------------------------
        // TRAIN NUMBER
        // -----------------------------------------------------

        if (name === "trainNumber") {
            updatedValue =
                value.replace(/\D/g, "");
        }

        // -----------------------------------------------------
        // STATION FIELDS
        // -----------------------------------------------------

        if (
            name === "boardingStation" ||
            name === "destinationStation"
        ) {
            updatedValue =
                value.toUpperCase();
        }

        setFormData((prev) => ({
            ...prev,
            [name]: updatedValue,
        }));

        setError("");

        // -----------------------------------------------------
        // CLEAR SUGGESTIONS WHEN FIELD IS EMPTY
        // -----------------------------------------------------

        if (
            name === "boardingStation" &&
            !String(updatedValue).trim()
        ) {
            setBoardingSuggestions([]);

            boardingSearchId.current += 1;

            if (
                activeStationField ===
                "boardingStation"
            ) {
                setStationLoadingField(null);
            }
        }

        if (
            name === "destinationStation" &&
            !String(updatedValue).trim()
        ) {
            setDestinationSuggestions([]);

            destinationSearchId.current += 1;

            if (
                activeStationField ===
                "destinationStation"
            ) {
                setStationLoadingField(null);
            }
        }
    };

    // =========================================================
    // SET SUGGESTIONS
    // =========================================================

    const setSuggestionsForField = (
        field,
        results
    ) => {
        if (
            field ===
            "boardingStation"
        ) {
            setBoardingSuggestions(
                results
            );

            return;
        }

        if (
            field ===
            "destinationStation"
        ) {
            setDestinationSuggestions(
                results
            );
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
        const search =
            String(value || "").trim();

        // -----------------------------------------------------
        // CURRENT REQUEST ID
        // -----------------------------------------------------

        const currentRequestId =
            field === "boardingStation"
                ? boardingSearchId.current
                : destinationSearchId.current;

        // -----------------------------------------------------
        // IGNORE OLD REQUEST
        // -----------------------------------------------------

        if (
            requestId !==
            currentRequestId
        ) {
            return;
        }

        // -----------------------------------------------------
        // LESS THAN 2 CHARACTERS
        // -----------------------------------------------------

        if (search.length < 2) {
            setSuggestionsForField(
                field,
                []
            );

            if (
                field ===
                "boardingStation"
            ) {
                if (
                    requestId ===
                    boardingSearchId.current
                ) {
                    setStationLoadingField(
                        null
                    );
                }
            } else {
                if (
                    requestId ===
                    destinationSearchId.current
                ) {
                    setStationLoadingField(
                        null
                    );
                }
            }

            return;
        }

        // -----------------------------------------------------
        // START LOADING
        // -----------------------------------------------------

        setStationLoadingField(field);

        try {
            const response =
                await searchStation(
                    search
                );

            // -------------------------------------------------
            // CHECK AGAIN AFTER API RESPONSE
            // -------------------------------------------------
            //
            // The user may have typed another character while
            // the API request was running.
            // -------------------------------------------------

            const latestRequestId =
                field ===
                "boardingStation"
                    ? boardingSearchId.current
                    : destinationSearchId.current;

            if (
                requestId !==
                latestRequestId
            ) {
                return;
            }

            const backendResults =
                Array.isArray(
                    response?.data?.data
                )
                    ? response.data.data
                    : [];

            const normalizedResults =
                backendResults
                    .map(
                        normalizeStation
                    )
                    .filter(Boolean);

            // -------------------------------------------------
            // SHOW ONLY CURRENT SEARCH RESULTS
            // -------------------------------------------------

            setSuggestionsForField(
                field,
                normalizedResults
            );

        } catch (searchError) {
            console.error(
                "STATION SEARCH ERROR =",
                searchError
            );

            // -------------------------------------------------
            // Only clear if this is still the latest request.
            // -------------------------------------------------

            const latestRequestId =
                field ===
                "boardingStation"
                    ? boardingSearchId.current
                    : destinationSearchId.current;

            if (
                requestId ===
                latestRequestId
            ) {
                setSuggestionsForField(
                    field,
                    []
                );
            }

        } finally {
            const latestRequestId =
                field ===
                "boardingStation"
                    ? boardingSearchId.current
                    : destinationSearchId.current;

            if (
                requestId ===
                latestRequestId
            ) {
                setStationLoadingField(
                    null
                );
            }
        }
    };

    // =========================================================
    // BOARDING STATION SEARCH
    // =========================================================

    useEffect(() => {
        const value =
            formData.boardingStation;

        // -----------------------------------------------------
        // Every new value invalidates the previous request.
        // -----------------------------------------------------

        boardingSearchId.current += 1;

        const requestId =
            boardingSearchId.current;

        // -----------------------------------------------------
        // EMPTY
        // -----------------------------------------------------

        if (!value.trim()) {
            setBoardingSuggestions([]);

            if (
                activeStationField ===
                "boardingStation"
            ) {
                setStationLoadingField(
                    null
                );
            }

            return;
        }

        // -----------------------------------------------------
        // DEBOUNCE
        // -----------------------------------------------------

        const timer =
            setTimeout(() => {
                searchStations(
                    "boardingStation",
                    value,
                    requestId
                );
            }, 350);

        return () => {
            clearTimeout(timer);
        };

    }, [
        formData.boardingStation,
    ]);

    // =========================================================
    // DESTINATION STATION SEARCH
    // =========================================================

    useEffect(() => {
        const value =
            formData.destinationStation;

        // -----------------------------------------------------
        // Every new value invalidates previous request.
        // -----------------------------------------------------

        destinationSearchId.current += 1;

        const requestId =
            destinationSearchId.current;

        // -----------------------------------------------------
        // EMPTY
        // -----------------------------------------------------

        if (!value.trim()) {
            setDestinationSuggestions([]);

            if (
                activeStationField ===
                "destinationStation"
            ) {
                setStationLoadingField(
                    null
                );
            }

            return;
        }

        // -----------------------------------------------------
        // DEBOUNCE
        // -----------------------------------------------------

        const timer =
            setTimeout(() => {
                searchStations(
                    "destinationStation",
                    value,
                    requestId
                );
            }, 350);

        return () => {
            clearTimeout(timer);
        };

    }, [
        formData.destinationStation,
    ]);

    // =========================================================
    // SELECT STATION
    // =========================================================

    const selectStation = (
        field,
        station
    ) => {
        const normalized =
            normalizeStation(
                station
            );

        if (!normalized) {
            return;
        }

        // -----------------------------------------------------
        // Update selected station code
        // -----------------------------------------------------

        setFormData((prev) => ({
            ...prev,
            [field]:
                normalized.code,
        }));

        // -----------------------------------------------------
        // Clear dropdown
        // -----------------------------------------------------

        if (
            field ===
            "boardingStation"
        ) {
            setBoardingSuggestions([]);

            boardingSearchId.current += 1;
        }

        if (
            field ===
            "destinationStation"
        ) {
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
        // Small delay allows clicking a suggestion
        // before the dropdown disappears.

        setTimeout(() => {
            setActiveStationField(
                null
            );
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

        // -----------------------------------------------------
        // Train number
        // -----------------------------------------------------

        if (
            !/^\d{4,6}$/.test(
                trainNumber
            )
        ) {
            setError(
                "Please enter a valid train number (4–6 digits)."
            );

            return;
        }

        // -----------------------------------------------------
        // Station code
        // -----------------------------------------------------

        const stationCodeRegex =
            /^[A-Z0-9]{2,5}$/;

        if (
            !stationCodeRegex.test(
                source
            )
        ) {
            setError(
                "Please select a valid source railway station from the suggestions."
            );

            return;
        }

        if (
            !stationCodeRegex.test(
                destination
            )
        ) {
            setError(
                "Please select a valid destination railway station from the suggestions."
            );

            return;
        }

        // -----------------------------------------------------
        // Same station
        // -----------------------------------------------------

        if (
            source ===
            destination
        ) {
            setError(
                "Source and destination cannot be the same."
            );

            return;
        }

        // -----------------------------------------------------
        // Journey date
        // -----------------------------------------------------

        if (!journeyDate) {
            setError(
                "Please select a journey date."
            );

            return;
        }

        // -----------------------------------------------------
        // Today is allowed.
        // Only past dates are rejected.
        // -----------------------------------------------------

        if (
            journeyDate <
            today
        ) {
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

            boardingStation:
                source,

            destinationStation:
                destination,

            allowedClasses: [
                {
                    class:
                        formData.preferredClass,

                    enabled: true,
                },
            ],

            allowMixedClass:
                formData.allowMixedClass,

            preferredStrategy:
                "SINGLE_TICKET",
        };

        // =====================================================
        // DEBUG
        // =====================================================

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
                await createJourney(
                    payload
                );

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

            navigate(
                "/dashboard"
            );

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

            // -------------------------------------------------
            // Validation errors
            // -------------------------------------------------

            if (
                backendData?.errors &&
                Array.isArray(
                    backendData.errors
                ) &&
                backendData.errors
                    .length > 0
            ) {
                const firstError =
                    backendData.errors[0];

                setError(
                    firstError.message ||
                    "Please check the journey details."
                );

                return;
            }

            // -------------------------------------------------
            // Backend message
            // -------------------------------------------------

            if (
                backendData?.message
            ) {
                setError(
                    backendData.message
                );

                return;
            }

            // -------------------------------------------------
            // Generic error
            // -------------------------------------------------

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
                BACK BUTTON
            ================================================= */}

            <button
                type="button"
                className="backButton"
                onClick={() =>
                    navigate(
                        "/dashboard"
                    )
                }
            >
                ← Back to Dashboard
            </button>


            <div className="addJourneyLayout">

                {/* =================================================
                    LEFT INFORMATION PANEL
                ================================================= */}

                <div className="journeyInfo">

                    <div className="infoBadge">
                        ERJA JOURNEY MONITOR
                    </div>

                    <h1>
                        Add New
                        <span>
                            Journey
                        </span>
                    </h1>

                    <p className="infoDescription">
                        Tell ERJA about your railway
                        journey and we'll monitor
                        availability, analyze vacant
                        berths and find possible
                        booking strategies.
                    </p>

                    <div className="journeySteps">

                        {/* STEP 1 */}

                        <div className="journeyStep">

                            <div className="stepIcon">
                                🚆
                            </div>

                            <div>
                                <strong>
                                    Enter Journey
                                </strong>

                                <span>
                                    Provide your train
                                    and route details.
                                </span>
                            </div>

                        </div>


                        {/* STEP 2 */}

                        <div className="journeyStep">

                            <div className="stepIcon">
                                🔍
                            </div>

                            <div>
                                <strong>
                                    Monitor Availability
                                </strong>

                                <span>
                                    ERJA tracks available
                                    seats.
                                </span>
                            </div>

                        </div>


                        {/* STEP 3 */}

                        <div className="journeyStep">

                            <div className="stepIcon">
                                🧠
                            </div>

                            <div>
                                <strong>
                                    Analyze & Optimize
                                </strong>

                                <span>
                                    Find practical booking
                                    possibilities.
                                </span>
                            </div>

                        </div>


                        {/* STEP 4 */}

                        <div className="journeyStep">

                            <div className="stepIcon">
                                🎯
                            </div>

                            <div>
                                <strong>
                                    Get Recommendation
                                </strong>

                                <span>
                                    Receive the best
                                    available strategy.
                                </span>
                            </div>

                        </div>

                    </div>

                </div>


                {/* =================================================
                    FORM CARD
                ================================================= */}

                <div className="journeyCard">

                    <div className="cardHeader">

                        <div>

                            <span className="cardLabel">
                                JOURNEY REQUEST
                            </span>

                            <h2>
                                Journey Details
                            </h2>

                            <p>
                                Enter the details you want
                                ERJA to monitor.
                            </p>

                        </div>

                        <div className="cardTrainIcon">
                            🚆
                        </div>

                    </div>


                    {/* =================================================
                        ERROR
                    ================================================= */}

                    {error && (
                        <div className="formError">
                            ⚠️ {error}
                        </div>
                    )}


                    <form
                        onSubmit={
                            handleSubmit
                        }
                    >

                        {/* =================================================
                            TRAIN NUMBER
                        ================================================= */}

                        <div className="formGroup">

                            <label htmlFor="trainNumber">
                                Train Number
                            </label>

                            <div className="inputWrapper">

                                <span>
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
                                    placeholder="Enter train number"
                                    inputMode="numeric"
                                    maxLength="6"
                                    required
                                />

                            </div>

                            <small>
                                Enter the Indian Railways train number.
                            </small>

                        </div>


                        {/* =================================================
                            JOURNEY DATE
                        ================================================= */}

                        <div className="formGroup">

                            <label htmlFor="journeyDate">
                                Journey Date
                            </label>

                            <div className="inputWrapper">

                                <span>
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
                                Select the date of your journey.
                            </small>

                        </div>


                        {/* =================================================
                            ROUTE
                        ================================================= */}

                        <div className="routeRow">

                            {/* =================================================
                                SOURCE
                            ================================================= */}

                            <div className="formGroup">

                                <label htmlFor="boardingStation">
                                    Source
                                </label>

                                <div className="autocompleteWrapper">

                                    <div className="inputWrapper">

                                        <span>
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
                                            placeholder="Enter source station"
                                            maxLength="60"
                                            autoComplete="off"
                                            required
                                        />

                                        {stationLoadingField ===
                                            "boardingStation" &&
                                            activeStationField ===
                                                "boardingStation" && (
                                                <span className="stationSearchSpinner">
                                                    ⟳
                                                </span>
                                            )}

                                    </div>


                                    {activeStationField ===
                                        "boardingStation" &&
                                        boardingSuggestions.length >
                                            0 && (

                                        <div className="autocompleteDropdown">

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

                                                        <strong>
                                                            {
                                                                station.code
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                station.name
                                                            }
                                                        </span>

                                                    </button>

                                                )
                                            )}

                                        </div>
                                    )}

                                </div>

                                <small>
                                    Type station name or code.
                                </small>

                            </div>


                            {/* =================================================
                                ARROW
                            ================================================= */}

                            <div className="routeArrow">
                                →
                            </div>


                            {/* =================================================
                                DESTINATION
                            ================================================= */}

                            <div className="formGroup">

                                <label htmlFor="destinationStation">
                                    Destination
                                </label>

                                <div className="autocompleteWrapper">

                                    <div className="inputWrapper">

                                        <span>
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
                                            placeholder="Enter destination station"
                                            maxLength="60"
                                            autoComplete="off"
                                            required
                                        />

                                        {stationLoadingField ===
                                            "destinationStation" &&
                                            activeStationField ===
                                                "destinationStation" && (
                                                <span className="stationSearchSpinner">
                                                    ⟳
                                                </span>
                                            )}

                                    </div>


                                    {activeStationField ===
                                        "destinationStation" &&
                                        destinationSuggestions.length >
                                            0 && (

                                        <div className="autocompleteDropdown">

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

                                                        <strong>
                                                            {
                                                                station.code
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                station.name
                                                            }
                                                        </span>

                                                    </button>

                                                )
                                            )}

                                        </div>
                                    )}

                                </div>

                                <small>
                                    Type station name or code.
                                </small>

                            </div>

                        </div>


                        {/* =================================================
                            PREFERRED CLASS
                        ================================================= */}

                        <div className="formGroup">

                            <label htmlFor="preferredClass">
                                Preferred Class
                            </label>

                            <div className="inputWrapper">

                                <span>
                                    🛏️
                                </span>

                                <select
                                    id="preferredClass"
                                    name="preferredClass"
                                    value={
                                        formData.preferredClass
                                    }
                                    onChange={
                                        handleChange
                                    }
                                >

                                    <option value="1A">
                                        1A — First AC
                                    </option>

                                    <option value="2A">
                                        2A — AC 2 Tier
                                    </option>

                                    <option value="3A">
                                        3A — AC 3 Tier
                                    </option>

                                    <option value="3E">
                                        3E — AC 3 Economy
                                    </option>

                                    <option value="SL">
                                        SL — Sleeper
                                    </option>

                                </select>

                            </div>

                        </div>


                        {/* =================================================
                            MIXED CLASS
                        ================================================= */}

                        <label
                            className={
                                `mixedClassOption ${
                                    formData.allowMixedClass
                                        ? "selected"
                                        : ""
                                }`
                            }
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

                            <div className="customCheckbox">

                                {formData.allowMixedClass &&
                                    "✓"}

                            </div>

                            <div className="mixedClassText">

                                <strong>
                                    Allow Mixed Class
                                </strong>

                                <span>
                                    Allow ERJA to recommend
                                    different classes for
                                    different journey segments.
                                </span>

                            </div>

                        </label>


                        {/* =================================================
                            SUBMIT
                        ================================================= */}

                        <button
                            type="submit"
                            className="saveJourneyButton"
                            disabled={loading}
                        >

                            {loading ? (
                                <>
                                    <span className="spinner" />
                                    Saving Journey...
                                </>
                            ) : (
                                <>
                                    Start Monitoring →
                                </>
                            )}

                        </button>

                    </form>


                    {/* =================================================
                        SECURITY NOTE
                    ================================================= */}

                    <div className="secureNote">

                        🔒 Your journey information is securely
                        stored and used only for monitoring.

                    </div>

                </div>

            </div>

        </div>
    );
}