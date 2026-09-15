import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import "./AddJourney.css";

import {
    createJourney,
} from "../../api/journeyAPI";

import {
    searchStation,
    searchTrain,
    getTrainClasses,
} from "../../api/trainAPI";

// =========================================================
// CLASS INFORMATION
// =========================================================

const FALLBACK_CLASSES = [
    {
        code: "1A",
        name: "First AC",
    },
    {
        code: "2A",
        name: "AC 2 Tier",
    },
    {
        code: "3A",
        name: "AC 3 Tier",
    },
    {
        code: "3E",
        name: "AC 3 Economy",
    },
    {
        code: "SL",
        name: "Sleeper",
    },
    {
        code: "2S",
        name: "Second Sitting",
    },
    {
        code: "CC",
        name: "Chair Car",
    },
    {
        code: "EC",
        name: "Executive Chair Car",
    },
];

// =========================================================
// CLASS NAME
// =========================================================

const CLASS_NAMES = {
    "1A": "First AC",
    "2A": "AC 2 Tier",
    "3A": "AC 3 Tier",
    "3E": "AC 3 Economy",
    SL: "Sleeper",
    "2S": "Second Sitting",
    CC: "Chair Car",
    EC: "Executive Chair Car",
};

// =========================================================
// TODAY
// =========================================================

const getTodayDate = () => {
    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            now.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

// =========================================================
// NORMALIZE STATION
// =========================================================

const normalizeStation = (
    station
) => {

    if (!station) {
        return null;
    }

    const code =
        String(
            station.code ||
            station.stationCode ||
            station.station_code ||
            ""
        )
            .trim()
            .toUpperCase();

    const name =
        String(
            station.name ||
            station.stationName ||
            station.station_name ||
            ""
        ).trim();

    if (!code || !name) {
        return null;
    }

    return {
        code,
        name,
        city:
            station.city ||
            "",
    };
};

// =========================================================
// NORMALIZE TRAIN RESPONSE
// =========================================================

const normalizeTrain = (
    response
) => {

    const root =
        response?.data ||
        response ||
        {};

    /*
     * Different train APIs may put train information
     * at different levels.
     *
     * Try the most common structures safely.
     */

    const candidates = [
        root,
        root.data,
        root.train,
        root.trainData,
        root.result,
        root.data?.train,
        root.data?.trainData,
        root.data?.result,
    ].filter(Boolean);

    let train =
        candidates.find(
            (item) =>
                typeof item ===
                    "object" &&
                (
                    item.trainNumber ||
                    item.trainNo ||
                    item.number ||
                    item.train_name ||
                    item.trainName ||
                    item.name
                )
        );

    if (!train) {
        train = root;
    }

    const number =
        String(
            train.trainNumber ||
            train.trainNo ||
            train.number ||
            train.train_number ||
            ""
        )
            .trim();

    const name =
        String(
            train.trainName ||
            train.train_name ||
            train.name ||
            train.train ||
            ""
        ).trim();

    if (!number && !name) {
        return null;
    }

    return {
        trainNumber:
            number,

        trainName:
            name ||
            "Train name unavailable.",
    };
};

// =========================================================
// COMPONENT
// =========================================================

export default function AddJourney() {

    const navigate =
        useNavigate();

    // =====================================================
    // FORM
    // =====================================================

    const [
        formData,
        setFormData,
    ] = useState({
        trainNumber: "",
        journeyDate: "",
        boardingStation: "",
        destinationStation: "",
        preferredClass: "",
        allowMixedClass: false,
    });

    // =====================================================
    // UI
    // =====================================================

    const [
        loading,
        setLoading,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    // =====================================================
    // TRAIN STATE
    // =====================================================

    const [
        trainInfo,
        setTrainInfo,
    ] = useState(null);

    const [
        trainLoading,
        setTrainLoading,
    ] = useState(false);

    const [
        trainSuggestionVisible,
        setTrainSuggestionVisible,
    ] = useState(false);

    const [
        trainError,
        setTrainError,
    ] = useState("");

    // =====================================================
    // CLASS STATE
    // =====================================================

    const [
        availableClasses,
        setAvailableClasses,
    ] = useState([]);

    const [
        classLoading,
        setClassLoading,
    ] = useState(false);

    const [
        classError,
        setClassError,
    ] = useState("");

    // =====================================================
    // STATION STATE
    // =====================================================

    const [
        boardingSuggestions,
        setBoardingSuggestions,
    ] = useState([]);

    const [
        destinationSuggestions,
        setDestinationSuggestions,
    ] = useState([]);

    const [
        activeStationField,
        setActiveStationField,
    ] = useState(null);

    const [
        stationLoadingField,
        setStationLoadingField,
    ] = useState(null);

    // =====================================================
    // REQUEST IDS
    // =====================================================

    const trainRequestId =
        useRef(0);

    const classRequestId =
        useRef(0);

    const boardingSearchId =
        useRef(0);

    const destinationSearchId =
        useRef(0);

    // =====================================================
    // ABORT CONTROLLERS
    // =====================================================

    const trainAbortController =
        useRef(null);

    const classAbortController =
        useRef(null);

    // =====================================================
    // TODAY
    // =====================================================

    const today =
        getTodayDate();

    // =====================================================
    // FORM CHANGE
    // =====================================================

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

        // -------------------------------------------------
        // TRAIN NUMBER
        // -------------------------------------------------

        if (
            name ===
            "trainNumber"
        ) {
            updatedValue =
                value
                    .replace(/\D/g, "")
                    .slice(0, 5);

            setTrainInfo(null);
            setTrainError("");
            setTrainSuggestionVisible(
                updatedValue.length >= 4
            );

            /*
             * Changing train invalidates classes.
             */
            setAvailableClasses([]);
            setFormData((prev) => ({
                ...prev,
                preferredClass: "",
            }));
        }

        // -------------------------------------------------
        // STATIONS
        // -------------------------------------------------

        if (
            name ===
                "boardingStation" ||
            name ===
                "destinationStation"
        ) {
            updatedValue =
                value
                    .toUpperCase()
                    .slice(0, 10);

            /*
             * Changing boarding station changes
             * the IRCTC composition request.
             */
            if (
                name ===
                "boardingStation"
            ) {
                setAvailableClasses([]);
                setClassError("");

                setFormData((prev) => ({
                    ...prev,
                    preferredClass: "",
                }));
            }
        }

        // -------------------------------------------------
        // DATE
        // -------------------------------------------------

        if (
            name ===
            "journeyDate"
        ) {
            setAvailableClasses([]);
            setClassError("");

            setFormData((prev) => ({
                ...prev,
                preferredClass: "",
            }));
        }

        setFormData((prev) => ({
            ...prev,
            [name]: updatedValue,
        }));

        setError("");
    };

    // =====================================================
    // TRAIN SEARCH
    // =====================================================

    useEffect(() => {

        const value =
            formData.trainNumber.trim();

        trainRequestId.current += 1;

        const requestId =
            trainRequestId.current;

        /*
         * Cancel previous request.
         */
        if (
            trainAbortController.current
        ) {
            trainAbortController.current.abort();
        }

        /*
         * Reset.
         */
        if (
            value.length < 4
        ) {
            setTrainInfo(null);
            setTrainLoading(false);
            setTrainError("");
            setTrainSuggestionVisible(false);
            return;
        }

        /*
         * Only valid train number lengths.
         */
        if (
            !/^\d{4,5}$/.test(value)
        ) {
            return;
        }

        const controller =
            new AbortController();

        trainAbortController.current =
            controller;

        /*
         * Small debounce prevents API spam.
         */
        const timer =
            setTimeout(
                async () => {

                    setTrainLoading(true);
                    setTrainError("");

                    try {

                        const response =
                            await searchTrain(
                                value,
                                {
                                    signal:
                                        controller.signal,
                                }
                            );

                        /*
                         * Ignore stale response.
                         */
                        if (
                            requestId !==
                            trainRequestId.current
                        ) {
                            return;
                        }

                        const normalized =
                            normalizeTrain(
                                response
                            );

                        if (!normalized) {

                            setTrainInfo(null);

                            setTrainError(
                                "Train not found."
                            );

                            return;
                        }

                        /*
                         * Make sure returned train number
                         * matches what the user typed.
                         */
                        if (
                            normalized.trainNumber &&
                            normalized.trainNumber !==
                                value
                        ) {
                            /*
                             * If API returned another train,
                             * do not silently select it.
                             */
                            setTrainInfo(null);

                            setTrainError(
                                "Train number could not be verified."
                            );

                            return;
                        }

                        setTrainInfo(
                            normalized
                        );

                        setTrainSuggestionVisible(
                            true
                        );

                    } catch (searchError) {

                        /*
                         * Abort is expected when user
                         * continues typing.
                         */
                        if (
                            searchError?.code ===
                                "ERR_CANCELED" ||
                            searchError?.name ===
                                "CanceledError" ||
                            controller.signal.aborted
                        ) {
                            return;
                        }

                        if (
                            requestId !==
                            trainRequestId.current
                        ) {
                            return;
                        }

                        console.error(
                            "TRAIN SEARCH ERROR:",
                            searchError
                        );

                        setTrainInfo(null);

                        setTrainError(
                            "Unable to verify train number."
                        );

                    } finally {

                        if (
                            requestId ===
                            trainRequestId.current
                        ) {
                            setTrainLoading(
                                false
                            );
                        }
                    }
                },
                500
            );

        return () => {
            clearTimeout(timer);
            controller.abort();
        };

    }, [
        formData.trainNumber,
    ]);

    // =====================================================
    // SELECT TRAIN
    // =====================================================

    const selectTrain = () => {

        if (!trainInfo) {
            return;
        }

        setFormData((prev) => ({
            ...prev,
            trainNumber:
                trainInfo.trainNumber,
        }));

        setTrainSuggestionVisible(
            false
        );

        setTrainError("");
        setError("");
    };

    // =====================================================
    // LOAD ACTUAL TRAIN CLASSES
    // =====================================================

    useEffect(() => {

        const trainNumber =
            formData.trainNumber.trim();

        const journeyDate =
            formData.journeyDate.trim();

        const boardingStation =
            formData.boardingStation
                .trim()
                .toUpperCase();

        /*
         * Every new dependency invalidates
         * previous request.
         */
        classRequestId.current += 1;

        const requestId =
            classRequestId.current;

        /*
         * Cancel previous class request.
         */
        if (
            classAbortController.current
        ) {
            classAbortController.current.abort();
        }

        /*
         * Clear when incomplete.
         */
        if (
            !/^\d{4,5}$/.test(
                trainNumber
            ) ||
            !/^\d{4}-\d{2}-\d{2}$/.test(
                journeyDate
            ) ||
            !/^[A-Z0-9]{2,10}$/.test(
                boardingStation
            )
        ) {

            setAvailableClasses([]);
            setClassLoading(false);
            setClassError("");

            return;
        }

        /*
         * Do not load classes until the train
         * itself has been verified.
         */
        if (
            !trainInfo ||
            trainInfo.trainNumber !==
                trainNumber
        ) {
            setAvailableClasses([]);
            setClassLoading(false);
            return;
        }

        const controller =
            new AbortController();

        classAbortController.current =
            controller;

        setClassLoading(true);
        setClassError("");

        const timer =
            setTimeout(
                async () => {

                    try {

                        const response =
                            await getTrainClasses({
                                trainNumber,
                                journeyDate,
                                boardingStation,
                                signal:
                                    controller.signal,
                            });

                        if (
                            requestId !==
                            classRequestId.current
                        ) {
                            return;
                        }

                        const result =
                            response?.data?.data;

                        const classes =
                            Array.isArray(
                                result?.classes
                            )
                                ? result.classes
                                : [];

                        const normalized =
                            classes
                                .map((item) => {

                                    const code =
                                        String(
                                            item?.code ||
                                            item?.classCode ||
                                            ""
                                        )
                                            .trim()
                                            .toUpperCase();

                                    if (
                                        !code ||
                                        !CLASS_NAMES[code]
                                    ) {
                                        return null;
                                    }

                                    return {
                                        code,
                                        name:
                                            item?.name ||
                                            CLASS_NAMES[
                                                code
                                            ],
                                    };
                                })
                                .filter(Boolean);

                        /*
                         * Remove duplicates.
                         */
                        const unique =
                            Array.from(
                                new Map(
                                    normalized.map(
                                        (item) => [
                                            item.code,
                                            item,
                                        ]
                                    )
                                ).values()
                            );

                        if (
                            unique.length === 0
                        ) {

                            setAvailableClasses(
                                []
                            );

                            setFormData(
                                (prev) => ({
                                    ...prev,
                                    preferredClass:
                                        "",
                                })
                            );

                            setClassError(
                                "No bookable class was found for this train."
                            );

                            return;
                        }

                        setAvailableClasses(
                            unique
                        );

                        /*
                         * Automatically choose the first
                         * actual class.
                         */
                        setFormData(
                            (prev) => {

                                const current =
                                    prev.preferredClass;

                                const exists =
                                    unique.some(
                                        (item) =>
                                            item.code ===
                                            current
                                    );

                                return {
                                    ...prev,

                                    preferredClass:
                                        exists
                                            ? current
                                            : unique[0]
                                                  .code,
                                };
                            }
                        );

                    } catch (
                        classLoadError
                    ) {

                        if (
                            classLoadError?.code ===
                                "ERR_CANCELED" ||
                            classLoadError?.name ===
                                "CanceledError" ||
                            controller.signal.aborted
                        ) {
                            return;
                        }

                        if (
                            requestId !==
                            classRequestId.current
                        ) {
                            return;
                        }

                        console.error(
                            "TRAIN CLASS ERROR:",
                            classLoadError
                        );

                        setAvailableClasses(
                            []
                        );

                        setFormData(
                            (prev) => ({
                                ...prev,
                                preferredClass:
                                    "",
                            })
                        );

                        setClassError(
                            "Unable to load actual train classes."
                        );

                    } finally {

                        if (
                            requestId ===
                            classRequestId.current
                        ) {
                            setClassLoading(
                                false
                            );
                        }
                    }
                },
                250
            );

        return () => {
            clearTimeout(timer);
            controller.abort();
        };

    }, [
        formData.trainNumber,
        formData.journeyDate,
        formData.boardingStation,
        trainInfo,
    ]);

    // =====================================================
    // STATION SEARCH
    // =====================================================

    const searchStations = async (
        field,
        value,
        requestId
    ) => {

        const search =
            String(value || "")
                .trim();

        const currentRequestId =
            field ===
                "boardingStation"
                ? boardingSearchId.current
                : destinationSearchId.current;

        if (
            requestId !==
            currentRequestId
        ) {
            return;
        }

        if (
            search.length < 2
        ) {

            if (
                field ===
                "boardingStation"
            ) {
                setBoardingSuggestions([]);
            } else {
                setDestinationSuggestions([]);
            }

            setStationLoadingField(
                null
            );

            return;
        }

        setStationLoadingField(
            field
        );

        try {

            const response =
                await searchStation(
                    search
                );

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

            const results =
                Array.isArray(
                    response?.data?.data
                )
                    ? response.data.data
                    : [];

            const normalized =
                results
                    .map(
                        normalizeStation
                    )
                    .filter(Boolean);

            if (
                field ===
                "boardingStation"
            ) {
                setBoardingSuggestions(
                    normalized
                );
            } else {
                setDestinationSuggestions(
                    normalized
                );
            }

        } catch (searchError) {

            console.error(
                "STATION SEARCH ERROR:",
                searchError
            );

            if (
                field ===
                "boardingStation"
            ) {
                setBoardingSuggestions([]);
            } else {
                setDestinationSuggestions([]);
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

    // =====================================================
    // BOARDING AUTOCOMPLETE
    // =====================================================

    useEffect(() => {

        const value =
            formData.boardingStation;

        boardingSearchId.current += 1;

        const requestId =
            boardingSearchId.current;

        if (
            !value.trim()
        ) {

            setBoardingSuggestions(
                []
            );

            return;
        }

        const timer =
            setTimeout(() => {

                searchStations(
                    "boardingStation",
                    value,
                    requestId
                );

            }, 350);

        return () =>
            clearTimeout(timer);

    }, [
        formData.boardingStation,
    ]);

    // =====================================================
    // DESTINATION AUTOCOMPLETE
    // =====================================================

    useEffect(() => {

        const value =
            formData.destinationStation;

        destinationSearchId.current += 1;

        const requestId =
            destinationSearchId.current;

        if (
            !value.trim()
        ) {

            setDestinationSuggestions(
                []
            );

            return;
        }

        const timer =
            setTimeout(() => {

                searchStations(
                    "destinationStation",
                    value,
                    requestId
                );

            }, 350);

        return () =>
            clearTimeout(timer);

    }, [
        formData.destinationStation,
    ]);

    // =====================================================
    // SELECT STATION
    // =====================================================

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

        setFormData((prev) => ({
            ...prev,
            [field]:
                normalized.code,
        }));

        if (
            field ===
            "boardingStation"
        ) {

            setBoardingSuggestions(
                []
            );

            boardingSearchId.current += 1;

        } else {

            setDestinationSuggestions(
                []
            );

            destinationSearchId.current += 1;
        }

        setActiveStationField(
            null
        );

        setError("");
    };

    // =====================================================
    // CLOSE STATION DROPDOWN
    // =====================================================

    const closeStationSuggestions =
        () => {

            setTimeout(() => {

                setActiveStationField(
                    null
                );

            }, 150);
        };

    // =====================================================
    // SUBMIT
    // =====================================================

    const handleSubmit = async (
        e
    ) => {

        e.preventDefault();

        if (loading) {
            return;
        }

        setError("");

        const trainNumber =
            formData.trainNumber
                .trim();

        const journeyDate =
            formData.journeyDate
                .trim();

        const source =
            formData.boardingStation
                .trim()
                .toUpperCase();

        const destination =
            formData.destinationStation
                .trim()
                .toUpperCase();

        const preferredClass =
            formData.preferredClass
                .trim()
                .toUpperCase();

        // =================================================
        // VALIDATE TRAIN
        // =================================================

        if (
            !/^\d{4,5}$/.test(
                trainNumber
            )
        ) {

            setError(
                "Please enter a valid train number."
            );

            return;
        }

        if (
            !trainInfo ||
            trainInfo.trainNumber !==
                trainNumber
        ) {

            setError(
                "Please select a verified train."
            );

            return;
        }

        // =================================================
        // DATE
        // =================================================

        if (!journeyDate) {

            setError(
                "Please select a journey date."
            );

            return;
        }

        if (
            journeyDate < today
        ) {

            setError(
                "Journey date cannot be in the past."
            );

            return;
        }

        // =================================================
        // STATIONS
        // =================================================

        if (
            !/^[A-Z0-9]{2,10}$/.test(
                source
            )
        ) {

            setError(
                "Please select a valid source station."
            );

            return;
        }

        if (
            !/^[A-Z0-9]{2,10}$/.test(
                destination
            )
        ) {

            setError(
                "Please select a valid destination station."
            );

            return;
        }

        if (
            source ===
            destination
        ) {

            setError(
                "Source and destination cannot be the same."
            );

            return;
        }

        // =================================================
        // CLASS
        // =================================================

        if (
            !preferredClass
        ) {

            setError(
                "Please select an available train class."
            );

            return;
        }

        const classExists =
            availableClasses.some(
                (item) =>
                    item.code ===
                    preferredClass
            );

        if (!classExists) {

            setError(
                "Selected class is not available on this train."
            );

            return;
        }

        // =================================================
        // PAYLOAD
        // =================================================

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
                        preferredClass,

                    enabled:
                        true,
                },
            ],

            allowMixedClass:
                Boolean(
                    formData.allowMixedClass
                ),

            preferredStrategy:
                "SINGLE_TICKET",
        };

        console.log(
            "🚆 CREATE JOURNEY PAYLOAD:",
            payload
        );

        try {

            setLoading(true);

            const response =
                await createJourney(
                    payload
                );

            console.log(
                "✅ JOURNEY CREATED:",
                response
            );

            navigate(
                "/dashboard"
            );

        } catch (submitError) {

            console.error(
                "❌ CREATE JOURNEY ERROR:",
                submitError
            );

            const backendData =
                submitError?.response?.data;

            if (
                Array.isArray(
                    backendData?.errors
                ) &&
                backendData.errors.length
            ) {

                setError(
                    backendData.errors[0]
                        ?.message ||
                    "Validation failed."
                );

                return;
            }

            setError(
                backendData?.message ||
                "Unable to save journey. Please try again."
            );

        } finally {

            setLoading(false);
        }
    };

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="addJourneyPage">

            {/* BACK */}

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
                    LEFT INFORMATION
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

                            <div className="trainAutocompleteWrapper">

                                <div className="inputWrapper trainInputWrapper">

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
                                        onFocus={() => {
                                            if (
                                                formData
                                                    .trainNumber
                                                    .length >=
                                                4
                                            ) {
                                                setTrainSuggestionVisible(
                                                    true
                                                );
                                            }
                                        }}
                                        placeholder="Enter train number"
                                        inputMode="numeric"
                                        maxLength="5"
                                        autoComplete="off"
                                        required
                                    />

                                    {trainInfo &&
                                        !trainLoading &&
                                        trainInfo.trainName && (
                                            <span
                                                className="trainInlineName"
                                                title={
                                                    trainInfo.trainName
                                                }
                                            >
                                                {trainInfo.trainName}
                                            </span>
                                        )}

                                    {trainLoading && (
                                        <span className="trainSearchSpinner">
                                            ⟳
                                        </span>
                                    )}

                                </div>

                                {/* TRAIN SUGGESTION */}

                                {trainSuggestionVisible &&
                                    trainInfo && (
                                        <button
                                            type="button"
                                            className="trainSuggestion"
                                            onMouseDown={(e) =>
                                                e.preventDefault()
                                            }
                                            onClick={
                                                selectTrain
                                            }
                                        >

                                            <div className="trainSuggestionIcon">
                                                🚆
                                            </div>

                                            <div className="trainSuggestionContent">

                                                <strong>
                                                    {
                                                        trainInfo.trainNumber
                                                    }
                                                </strong>

                                                <span>
                                                    {
                                                        trainInfo.trainName
                                                    }
                                                </span>

                                            </div>

                                            <span className="trainSuggestionArrow">
                                                →
                                            </span>

                                        </button>
                                    )}

                            </div>

                            {trainError ? (
                                <small className="fieldError">
                                    {trainError}
                                </small>
                            ) : trainInfo ? (
                                <small className="trainVerified">
                                    ✓ Train verified
                                </small>
                            ) : (
                                <small>
                                    Enter the Indian Railways
                                    train number.
                                </small>
                            )}

                        </div>

                        {/* =================================================
                            DATE
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

                            {/* SOURCE */}

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
                                            maxLength="10"
                                            autoComplete="off"
                                            required
                                        />

                                        {stationLoadingField ===
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
                                                        station
                                                    ) => (
                                                        <button
                                                            type="button"
                                                            key={
                                                                station.code
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

                            {/* ARROW */}

                            <div className="routeArrow">
                                →
                            </div>

                            {/* DESTINATION */}

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
                                            maxLength="10"
                                            autoComplete="off"
                                            required
                                        />

                                        {stationLoadingField ===
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
                                                        station
                                                    ) => (
                                                        <button
                                                            type="button"
                                                            key={
                                                                station.code
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
                                    disabled={
                                        classLoading ||
                                        availableClasses.length ===
                                            0
                                    }
                                >

                                    {!formData.trainNumber ||
                                    !formData.journeyDate ||
                                    !formData.boardingStation ? (
                                        <option value="">
                                            Select train, date & source
                                        </option>
                                    ) : classLoading ? (
                                        <option value="">
                                            Loading actual classes...
                                        </option>
                                    ) : availableClasses.length ===
                                      0 ? (
                                        <option value="">
                                            No class available
                                        </option>
                                    ) : (
                                        availableClasses.map(
                                            (item) => (
                                                <option
                                                    key={
                                                        item.code
                                                    }
                                                    value={
                                                        item.code
                                                    }
                                                >
                                                    {item.code} — {item.name}
                                                </option>
                                            )
                                        )
                                    )}

                                </select>

                            </div>

                            {classLoading && (
                                <small className="classLoadingText">
                                    Loading actual classes from
                                    train composition...
                                </small>
                            )}

                            {classError && !classLoading && (
                                <small className="fieldError">
                                    {classError}
                                </small>
                            )}

                            {!classLoading &&
                                !classError &&
                                availableClasses.length >
                                    0 && (
                                    <small className="classVerified">
                                        ✓ Actual classes available on
                                        this train
                                    </small>
                                )}

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
                            disabled={
                                loading ||
                                classLoading ||
                                !trainInfo ||
                                availableClasses.length ===
                                    0
                            }
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

                    {/* SECURITY */}

                    <div className="secureNote">
                        🔒 Your journey information is securely
                        stored and used only for monitoring.
                    </div>

                </div>

            </div>

            {/* CLOSE TRAIN DROPDOWN WHEN CLICKING OUTSIDE */}

            {trainSuggestionVisible &&
                trainInfo && (
                    <div
                        className="trainOverlay"
                        onMouseDown={() =>
                            setTrainSuggestionVisible(
                                false
                            )
                        }
                    />
                )}

        </div>
    );
}