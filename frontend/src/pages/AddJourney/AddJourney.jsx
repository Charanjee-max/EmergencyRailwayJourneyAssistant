import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "./AddJourney.css";
import { createJourney } from "../../api/journeyAPI";

export default function AddJourney() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        trainNumber: "",
        journeyDate: "",
        boardingStation: "",
        destinationStation: "",
        preferredClass: "3A",
        allowMixedClass: false,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Today's date in local time
    const getTodayDate = () => {
        const now = new Date();

        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    const today = getTodayDate();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        let updatedValue =
            type === "checkbox"
                ? checked
                : value;

        // Keep railway station codes uppercase
        if (
            name === "boardingStation" ||
            name === "destinationStation"
        ) {
            updatedValue = value
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, "");
        }

        // Keep train number numeric
        if (name === "trainNumber") {
            updatedValue = value.replace(/\D/g, "");
        }

        setFormData((prev) => ({
            ...prev,
            [name]: updatedValue,
        }));

        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        const trainNumber = formData.trainNumber.trim();

        const source = formData.boardingStation
            .trim()
            .toUpperCase();

        const destination = formData.destinationStation
            .trim()
            .toUpperCase();

        const journeyDate = formData.journeyDate;

        /*
        ========================================
        VALIDATION
        ========================================
        */

        // Train number
        if (!/^\d{4,6}$/.test(trainNumber)) {
            setError(
                "Please enter a valid train number (4–6 digits)."
            );
            return;
        }

        // Railway station codes
        //
        // Indian Railway station codes used by ERJA:
        // minimum 2 characters
        // maximum 5 characters
        //
        // Examples:
        // SC
        // BZA
        // BDCR
        // MUGR
        //
        const stationCodeRegex = /^[A-Z0-9]{2,5}$/;

        if (!stationCodeRegex.test(source)) {
            setError(
                "Please enter a valid source railway station code."
            );
            return;
        }

        if (!stationCodeRegex.test(destination)) {
            setError(
                "Please enter a valid destination railway station code."
            );
            return;
        }

        // Same station
        if (source === destination) {
            setError(
                "Source and destination cannot be the same."
            );
            return;
        }

        // Journey date
        if (!journeyDate) {
            setError(
                "Please select a journey date."
            );
            return;
        }

        // Journey must not be in the past
        if (journeyDate < today) {
            setError(
                "Journey date cannot be in the past."
            );
            return;
        }

        /*
        ========================================
        CREATE JOURNEY PAYLOAD
        ========================================
        */

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

        /*
        ========================================
        SEND TO BACKEND
        ========================================
        */

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

            /*
            ========================================
            REDIRECT TO DASHBOARD
            ========================================
            */

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

            /*
            ========================================
            BACKEND ERROR HANDLING
            ========================================
            */

            const backendData =
                error?.response?.data;

            // Validation errors from backend
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

            // Normal backend message
            if (backendData?.message) {
                setError(
                    backendData.message
                );

                return;
            }

            // Generic error
            setError(
                "Unable to save journey. Please try again."
            );

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="addJourneyPage">

            {/* ========================================
                BACK BUTTON
            ======================================== */}

            <button
                type="button"
                className="backButton"
                onClick={() =>
                    navigate("/dashboard")
                }
            >
                ← Back to Dashboard
            </button>

            <div className="addJourneyLayout">

                {/* ========================================
                    LEFT INFORMATION PANEL
                ======================================== */}

                <div className="journeyInfo">

                    <div className="infoBadge">
                        ERJA JOURNEY MONITOR
                    </div>

                    <h1>
                        Add New
                        <span> Journey</span>
                    </h1>

                    <p className="infoDescription">
                        Tell ERJA about your railway journey
                        and we'll monitor availability, analyze
                        vacant berths and find possible booking
                        strategies.
                    </p>

                    <div className="journeySteps">

                        <div className="journeyStep">
                            <div className="stepIcon">
                                🚆
                            </div>

                            <div>
                                <strong>
                                    Enter Journey
                                </strong>

                                <span>
                                    Provide your train and
                                    route details.
                                </span>
                            </div>
                        </div>

                        <div className="journeyStep">
                            <div className="stepIcon">
                                🔍
                            </div>

                            <div>
                                <strong>
                                    Monitor Availability
                                </strong>

                                <span>
                                    ERJA tracks available seats.
                                </span>
                            </div>
                        </div>

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

                        <div className="journeyStep">
                            <div className="stepIcon">
                                🎯
                            </div>

                            <div>
                                <strong>
                                    Get Recommendation
                                </strong>

                                <span>
                                    Receive the best available
                                    strategy.
                                </span>
                            </div>
                        </div>

                    </div>

                </div>

                {/* ========================================
                    FORM CARD
                ======================================== */}

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

                    {/* ========================================
                        ERROR
                    ======================================== */}

                    {error && (
                        <div className="formError">
                            ⚠️ {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>

                        {/* ========================================
                            TRAIN NUMBER
                        ======================================== */}

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
                                    placeholder="e.g. 12746"
                                    inputMode="numeric"
                                    maxLength="6"
                                    required
                                />

                            </div>

                            <small>
                                Enter the Indian Railways
                                train number.
                            </small>

                        </div>

                        {/* ========================================
                            JOURNEY DATE
                        ======================================== */}

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
                                    onChange={
                                        handleChange
                                    }
                                    min={today}
                                    required
                                />

                            </div>

                        </div>

                        {/* ========================================
                            ROUTE
                        ======================================== */}

                        <div className="routeRow">

                            {/* SOURCE */}

                            <div className="formGroup">

                                <label htmlFor="boardingStation">
                                    Source
                                </label>

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
                                        placeholder="SC"
                                        maxLength="5"
                                        minLength="2"
                                        required
                                    />

                                </div>

                                <small>
                                    Railway station code
                                </small>

                            </div>

                            {/* ARROW */}

                            <div className="routeArrow">
                                →
                            </div>

                            {/* DESTINATION */}

                            <div className="formGroup">

                                <label htmlFor="destinationStation">
                                    Destination
                                </label>

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
                                        placeholder="BZA"
                                        maxLength="5"
                                        minLength="2"
                                        required
                                    />

                                </div>

                                <small>
                                    Railway station code
                                </small>

                            </div>

                        </div>

                        {/* ========================================
                            PREFERRED CLASS
                        ======================================== */}

                        <div className="formGroup">

                            <label htmlFor="preferredClass">
                                Preferred Class
                            </label>

                            <div className="inputWrapper">

                                <span>
                                    💺
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

                        {/* ========================================
                            MIXED CLASS
                        ======================================== */}

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

                        {/* ========================================
                            SUBMIT
                        ======================================== */}

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

                    {/* ========================================
                        SECURITY NOTE
                    ======================================== */}

                    <div className="secureNote">
                        🔒 Your journey information is securely
                        stored and used only for monitoring.
                    </div>

                </div>

            </div>

        </div>
    );
}