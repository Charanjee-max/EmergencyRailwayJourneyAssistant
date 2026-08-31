import { useEffect, useState } from "react";
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
    // STATION AUTOCOMPLETE STATE
    // =========================================================

    const [boardingSuggestions, setBoardingSuggestions] =
        useState([]);

    const [destinationSuggestions, setDestinationSuggestions] =
        useState([]);


    const [activeStationField, setActiveStationField] =
        useState(null);


    const [stationLoading, setStationLoading] =
        useState(false);


    // =========================================================
    // TODAY DATE
    // =========================================================

    const getTodayDate = () => {

        const now = new Date();

        const year =
            now.getFullYear();

        const month =
            String(now.getMonth() + 1)
                .padStart(2, "0");

        const day =
            String(now.getDate())
                .padStart(2, "0");

        return `${year}-${month}-${day}`;
    };


    const today = getTodayDate();


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
        // Train number
        // -----------------------------------------------------

        if (name === "trainNumber") {

            updatedValue =
                value.replace(/\D/g, "");

        }


        // -----------------------------------------------------
        // Station fields
        //
        // IMPORTANT:
        // Do NOT remove spaces here.
        //
        // User should be able to type:
        //
        // Secunderabad
        // Vijayawada
        // Secunderabad Junction
        //
        // -----------------------------------------------------

        if (
            name === "boardingStation" ||
            name === "destinationStation"
        ) {

            updatedValue =
                value
                    .toUpperCase();

        }


        setFormData((prev) => ({
            ...prev,
            [name]: updatedValue,
        }));


        setError("");
    };


    // =========================================================
    // STATION SEARCH
    // =========================================================

    const searchStations = async (
        field,
        value
    ) => {

        const search =
            value.trim();


        // Clear suggestions for short input

        if (search.length < 2) {

            if (
                field ===
                "boardingStation"
            ) {

                setBoardingSuggestions([]);

            }


            if (
                field ===
                "destinationStation"
            ) {

                setDestinationSuggestions([]);

            }


            return;
        }


        try {

            setStationLoading(true);


            const response =
                await searchStation(search);


            const results =
                response?.data?.data || [];


            if (
                field ===
                "boardingStation"
            ) {

                setBoardingSuggestions(
                    results
                );

            }


            if (
                field ===
                "destinationStation"
            ) {

                setDestinationSuggestions(
                    results
                );

            }

        } catch (searchError) {

            console.error(
                "STATION SEARCH ERROR =",
                searchError
            );


            if (
                field ===
                "boardingStation"
            ) {

                setBoardingSuggestions([]);

            }


            if (
                field ===
                "destinationStation"
            ) {

                setDestinationSuggestions([]);

            }

        } finally {

            setStationLoading(false);

        }
    };


    // =========================================================
    // DEBOUNCED BOARDING STATION SEARCH
    // =========================================================

    useEffect(() => {

        const value =
            formData.boardingStation;


        if (!value.trim()) {

            setBoardingSuggestions([]);

            return;
        }


        const timer =
            setTimeout(() => {

                searchStations(
                    "boardingStation",
                    value
                );

            }, 350);


        return () => {
            clearTimeout(timer);
        };

    }, [
        formData.boardingStation
    ]);


    // =========================================================
    // DEBOUNCED DESTINATION STATION SEARCH
    // =========================================================

    useEffect(() => {

        const value =
            formData.destinationStation;


        if (!value.trim()) {

            setDestinationSuggestions([]);

            return;
        }


        const timer =
            setTimeout(() => {

                searchStations(
                    "destinationStation",
                    value
                );

            }, 350);


        return () => {
            clearTimeout(timer);
        };

    }, [
        formData.destinationStation
    ]);


    // =========================================================
    // SELECT STATION
    // =========================================================

    const selectStation = (
        field,
        station
    ) => {

        setFormData((prev) => ({
            ...prev,
            [field]: station.code,
        }));


        if (
            field ===
            "boardingStation"
        ) {

            setBoardingSuggestions([]);

        }


        if (
            field ===
            "destinationStation"
        ) {

            setDestinationSuggestions([]);

        }


        setActiveStationField(null);

        setError("");
    };


    // =========================================================
    // CLOSE AUTOCOMPLETE
    // =========================================================

    const closeStationSuggestions = () => {

        // Small delay allows click on suggestion
        // before dropdown disappears.

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


        // Train number

        if (!/^\d{4,6}$/.test(trainNumber)) {

            setError(
                "Please enter a valid train number (4–6 digits)."
            );

            return;
        }


        // Station code

        const stationCodeRegex =
            /^[A-Z0-9]{2,5}$/;


        if (
            !stationCodeRegex.test(source)
        ) {

            setError(
                "Please select a valid source railway station from the suggestions."
            );

            return;
        }


        if (
            !stationCodeRegex.test(destination)
        ) {

            setError(
                "Please select a valid destination railway station from the suggestions."
            );

            return;
        }


        // Same station

        if (
            source === destination
        ) {

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


        // Past date

        if (
            journeyDate < today
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


            // Validation errors

            if (
                backendData?.errors &&
                Array.isArray(
                    backendData.errors
                ) &&
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

            if (
                backendData?.message
            ) {

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
                                    placeholder="12746"
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
                                BOARDING STATION
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
                                            placeholder="SC or Secunderabad"
                                            maxLength="60"
                                            autoComplete="off"
                                            required
                                        />


                                        {stationLoading &&
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
                                DESTINATION STATION
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
                                            placeholder="BZA or Vijayawada"
                                            maxLength="60"
                                            autoComplete="off"
                                            required
                                        />


                                        {stationLoading &&
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