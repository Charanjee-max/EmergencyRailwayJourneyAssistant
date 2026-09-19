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
    getTrainMetadata,
} from "../../api/trainAPI";

import trainList from "../../data/train_data.js";


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

    const now =
        new Date();

    const year =
        now.getFullYear();

    const month =
        String(
            now.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            now.getDate()
        ).padStart(
            2,
            "0"
        );

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

    if (
        !code ||
        !name
    ) {
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

    if (
        !number &&
        !name
    ) {
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
// LOCAL TRAIN LIST
// =========================================================

const LOCAL_TRAINS =
    trainList
        .map(
            (item) => {

                const value =
                    String(
                        item ||
                        ""
                    ).trim();

                const separatorIndex =
                    value.indexOf(
                        "-"
                    );

                if (
                    separatorIndex ===
                    -1
                ) {
                    return null;
                }

                const trainNumber =
                    value
                        .slice(
                            0,
                            separatorIndex
                        )
                        .trim();

                const trainName =
                    value
                        .slice(
                            separatorIndex + 1
                        )
                        .trim();

                if (
                    !/^\d{1,5}$/.test(
                        trainNumber
                    ) ||
                    !trainName
                ) {
                    return null;
                }

                return {
                    trainNumber,
                    trainName,
                };
            }
        )
        .filter(Boolean);


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

        trainNumber:
            "",

        journeyDate:
            "",

        boardingStation:
            "",

        destinationStation:
            "",

        preferredClass:
            "",

        allowMixedClass:
            false,
    });


    // =====================================================
    // UI STATE
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
        trainSuggestions,
        setTrainSuggestions,
    ] = useState([]);

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
    // TIMETABLE STATE
    // =====================================================

    const [
        timetableStations,
        setTimetableStations,
    ] = useState([]);

    const [
        showTimetable,
        setShowTimetable,
    ] = useState(false);


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

    const handleChange = (
        e
    ) => {

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
                    .replace(
                        /\D/g,
                        ""
                    )
                    .slice(
                        0,
                        5
                    );

            setTrainInfo(
                null
            );

            setTrainError(
                ""
            );

            setTrainSuggestionVisible(
                updatedValue.length >=
                    4
            );

            setAvailableClasses(
                []
            );

            setTimetableStations(
                []
            );

            setShowTimetable(
                false
            );

            setFormData(
                (prev) => ({
                    ...prev,

                    preferredClass:
                        "",
                })
            );
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
                    .slice(
                        0,
                        10
                    );
        }


        // -------------------------------------------------
        // DATE
        // -------------------------------------------------

        if (
            name ===
            "journeyDate"
        ) {

            setAvailableClasses(
                []
            );

            setClassError(
                ""
            );

            setTimetableStations(
                []
            );

            setShowTimetable(
                false
            );

            setFormData(
                (prev) => ({
                    ...prev,

                    preferredClass:
                        "",
                })
            );
        }


        setFormData(
            (prev) => ({
                ...prev,

                [name]:
                    updatedValue,
            })
        );

        setError(
            ""
        );
    };


    // =====================================================
    // TRAIN AUTOCOMPLETE + API VERIFICATION
    // =====================================================

    useEffect(
        () => {

            const value =
                formData.trainNumber
                    .trim();

            trainRequestId.current += 1;

            const requestId =
                trainRequestId.current;


            if (
                trainAbortController.current
            ) {

                trainAbortController.current
                    .abort();
            }


            // -------------------------------------------------
            // EMPTY INPUT
            // -------------------------------------------------

            if (!value) {

                setTrainSuggestions(
                    []
                );

                setTrainInfo(
                    null
                );

                setTrainLoading(
                    false
                );

                setTrainError(
                    ""
                );

                setTrainSuggestionVisible(
                    false
                );

                setTimetableStations(
                    []
                );

                return;
            }


            // -------------------------------------------------
            // LOCAL TRAIN MATCHES
            // -------------------------------------------------

            const matches =
                LOCAL_TRAINS
                    .filter(
                        (train) =>
                            train.trainNumber
                                .startsWith(
                                    value
                                )
                    )
                    .slice(
                        0,
                        8
                    );

            setTrainSuggestions(
                matches
            );

            setTrainSuggestionVisible(
                matches.length >
                    0
            );


            // -------------------------------------------------
            // LESS THAN 5 DIGITS
            // -------------------------------------------------

            if (
                value.length <
                5
            ) {

                setTrainInfo(
                    null
                );

                setTrainLoading(
                    false
                );

                setTrainError(
                    ""
                );

                return;
            }


            // -------------------------------------------------
            // INVALID TRAIN NUMBER
            // -------------------------------------------------

            if (
                !/^\d{5}$/.test(
                    value
                )
            ) {

                setTrainInfo(
                    null
                );

                setTrainLoading(
                    false
                );

                return;
            }


            // -------------------------------------------------
            // FIND LOCAL TRAIN
            // -------------------------------------------------

            const localTrain =
                LOCAL_TRAINS.find(
                    (train) =>
                        train.trainNumber ===
                        value
                );


            if (!localTrain) {

                setTrainInfo(
                    null
                );

                setTrainLoading(
                    false
                );

                setTrainError(
                    "Train not found."
                );

                return;
            }


            // -------------------------------------------------
            // API VERIFICATION
            // -------------------------------------------------

            const controller =
                new AbortController();

            trainAbortController.current =
                controller;


            const timer =
                setTimeout(
                    async () => {

                        setTrainLoading(
                            true
                        );

                        setTrainError(
                            ""
                        );


                        try {

                            const response =
                                await searchTrain(
                                    value,
                                    {
                                        signal:
                                            controller.signal,
                                    }
                                );


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

                                setTrainInfo(
                                    localTrain
                                );

                                setTrainError(
                                    ""
                                );

                                return;
                            }


                            if (
                                normalized.trainNumber &&
                                normalized.trainNumber !==
                                    value
                            ) {

                                setTrainInfo(
                                    null
                                );

                                setTrainError(
                                    "Train number could not be verified."
                                );

                                return;
                            }


                            setTrainInfo({

                                trainNumber:
                                    value,

                                trainName:
                                    normalized.trainName &&
                                    normalized.trainName !==
                                        "Train name unavailable."
                                        ? normalized.trainName
                                        : localTrain.trainName,
                            });


                        } catch (
                            searchError
                        ) {

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


                            setTrainInfo(
                                localTrain
                            );

                            setTrainError(
                                ""
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
                    300
                );


            return () => {

                clearTimeout(
                    timer
                );

                controller.abort();
            };

        },
        [
            formData.trainNumber,
        ]
    );


    // =====================================================
    // SELECT TRAIN
    // =====================================================

    const selectTrain = (
        train
    ) => {

        if (!train) {
            return;
        }


        setFormData(
            (prev) => ({
                ...prev,

                trainNumber:
                    train.trainNumber,
            })
        );


        setTrainInfo({

            trainNumber:
                train.trainNumber,

            trainName:
                train.trainName,
        });


        setTrainSuggestions(
            []
        );

        setTrainSuggestionVisible(
            false
        );

        setTrainError(
            ""
        );

        setError(
            ""
        );


        // Metadata effect will now
        // load timetable + classes.
    };


    // =====================================================
    // PART 1 END
    // =====================================================
        // =====================================================
    // LOAD TRAIN METADATA / CLASSES / TIMETABLE
    //
    // IMPORTANT:
    // Uses the pre-chart /train/metadata endpoint.
    // This does NOT depend on chart preparation.
    // =====================================================

    useEffect(() => {

        const trainNumber =
            String(
                formData.trainNumber || ""
            ).trim();

        const journeyDate =
            String(
                formData.journeyDate || ""
            ).trim();

        classRequestId.current += 1;

        const requestId =
            classRequestId.current;


        // -------------------------------------------------
        // ABORT PREVIOUS REQUEST
        // -------------------------------------------------

        if (
            classAbortController.current
        ) {
            classAbortController.current.abort();
        }


        // -------------------------------------------------
        // INVALID TRAIN / DATE
        // -------------------------------------------------

        if (
            !/^\d{4,5}$/.test(
                trainNumber
            ) ||
            !/^\d{4}-\d{2}-\d{2}$/.test(
                journeyDate
            )
        ) {

            setAvailableClasses([]);

            setTimetableStations([]);

            setClassLoading(false);

            setClassError("");

            setShowTimetable(false);

            return;
        }


        // -------------------------------------------------
        // CREATE REQUEST
        // -------------------------------------------------

        const controller =
            new AbortController();

        classAbortController.current =
            controller;


        setClassLoading(
            true
        );

        setClassError("");


        // -------------------------------------------------
        // LOAD METADATA
        // -------------------------------------------------

        const timer =
            setTimeout(
                async () => {

                    try {

                        console.log(
                            "🚆 Loading train metadata:",
                            {
                                trainNumber,
                                journeyDate,
                            }
                        );


                        const response =
                            await getTrainMetadata({
                                trainNumber,
                                journeyDate,
                                signal:
                                    controller.signal,
                            });


                        // -----------------------------------------
                        // REQUEST NO LONGER VALID
                        // -----------------------------------------

                        if (
                            controller.signal.aborted ||
                            requestId !==
                                classRequestId.current
                        ) {
                            return;
                        }


                        console.log(
                            "📦 TRAIN METADATA RESPONSE:",
                            response
                        );


                        // =================================================
                        // RESPONSE STRUCTURE
                        //
                        // response.data
                        //      ↓
                        // {
                        //     success: true,
                        //     message: "...",
                        //     data: {
                        //         trainNumber,
                        //         trainName,
                        //         classes,
                        //         coaches,
                        //         stations
                        //     }
                        // }
                        // =================================================

                        const payload =
                            response?.data ??
                            response;


                        const metadata =
                            payload?.data ??
                            payload;


                        // =================================================
                        // TRAIN TIMETABLE
                        // =================================================

                        const rawStations =
                            Array.isArray(
                                metadata?.stations
                            )
                                ? metadata.stations
                                : [];


                        console.log(
                            "🚉 RAW TRAIN TIMETABLE:",
                            rawStations
                        );


                        // -------------------------------------------------
                        // NORMALIZE TIMETABLE
                        // -------------------------------------------------

                        const normalizedStations =
                            rawStations
                                .map(
                                    (
                                        station,
                                        index
                                    ) => {

                                        if (
                                            !station ||
                                            typeof station !==
                                                "object"
                                        ) {
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


                                        const arrival =
                                            station.arrival ||
                                            station.arrivalTime ||
                                            station.arr ||
                                            "—";


                                        const departure =
                                            station.departure ||
                                            station.departureTime ||
                                            station.dep ||
                                            "—";


                                        const day =
                                            station.day ??
                                            station.dayOfJourney ??
                                            station.journeyDay ??
                                            "—";


                                        const distance =
                                            station.distance ??
                                            station.distanceKm ??
                                            station.km ??
                                            "—";


                                        const halt =
                                            station.halt ??
                                            station.haltTime ??
                                            "—";


                                        const platform =
                                            station.platform ??
                                            "—";


                                        return {

                                            index:
                                                index + 1,

                                            code,

                                            name,

                                            arrival,

                                            departure,

                                            day,

                                            distance,

                                            halt,

                                            platform,

                                        };
                                    }
                                )
                                .filter(Boolean);


                        console.log(
                            "✅ NORMALIZED TRAIN TIMETABLE:",
                            normalizedStations
                        );


                        // -------------------------------------------------
                        // STORE TIMETABLE
                        // -------------------------------------------------

                        setTimetableStations(
                            normalizedStations
                        );


                        // =================================================
                        // TRAIN CLASSES
                        // =================================================

                        const classes =
                            Array.isArray(
                                metadata?.classes
                            )
                                ? metadata.classes
                                : [];


                        console.log(
                            "🎟️ RAW TRAIN CLASSES:",
                            classes
                        );


                        // -------------------------------------------------
                        // NORMALIZE CLASSES
                        // -------------------------------------------------

                        const normalizedClasses =
                            classes
                                .map(
                                    (
                                        item
                                    ) => {

                                        let code =
                                            "";

                                        let name =
                                            "";


                                        // ---------------------------------
                                        // STRING CLASS
                                        // ---------------------------------

                                        if (
                                            typeof item ===
                                            "string"
                                        ) {

                                            code =
                                                item
                                                    .trim()
                                                    .toUpperCase();

                                            name =
                                                CLASS_NAMES[
                                                    code
                                                ] ||
                                                code;
                                        }


                                        // ---------------------------------
                                        // OBJECT CLASS
                                        // ---------------------------------

                                        else if (
                                            item &&
                                            typeof item ===
                                                "object"
                                        ) {

                                            code =
                                                String(
                                                    item.code ||
                                                    item.classCode ||
                                                    item.class ||
                                                    ""
                                                )
                                                    .trim()
                                                    .toUpperCase();


                                            name =
                                                String(
                                                    item.name ||
                                                    CLASS_NAMES[
                                                        code
                                                    ] ||
                                                    code
                                                ).trim();
                                        }


                                        if (!code) {
                                            return null;
                                        }


                                        return {

                                            code,

                                            name:
                                                name ||
                                                CLASS_NAMES[
                                                    code
                                                ] ||
                                                code,
                                        };
                                    }
                                )
                                .filter(Boolean);


                        // -------------------------------------------------
                        // REMOVE DUPLICATE CLASSES
                        // -------------------------------------------------

                        const uniqueClasses =
                            Array.from(
                                new Map(
                                    normalizedClasses.map(
                                        (
                                            item
                                        ) => [
                                            item.code,
                                            item,
                                        ]
                                    )
                                ).values()
                            );


                        console.log(
                            "✅ NORMALIZED TRAIN CLASSES:",
                            uniqueClasses
                        );


                        // =================================================
                        // NO CLASS INFORMATION
                        // =================================================

                        if (
                            uniqueClasses.length ===
                            0
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
                                "No class information was found for this train."
                            );


                            return;
                        }


                        // =================================================
                        // STORE CLASSES
                        // =================================================

                        setAvailableClasses(
                            uniqueClasses
                        );

                        setClassError("");


                        // =================================================
                        // KEEP CURRENT CLASS IF VALID
                        // OTHERWISE SELECT FIRST CLASS
                        // =================================================

                        setFormData(
                            (prev) => {

                                const current =
                                    String(
                                        prev.preferredClass ||
                                        ""
                                    )
                                        .trim()
                                        .toUpperCase();


                                const exists =
                                    uniqueClasses.some(
                                        (
                                            item
                                        ) =>
                                            item.code ===
                                            current
                                    );


                                return {

                                    ...prev,

                                    preferredClass:
                                        exists
                                            ? current
                                            : uniqueClasses[0]
                                                  .code,
                                };
                            }
                        );


                    } catch (
                        classLoadError
                    ) {

                        // ---------------------------------------------
                        // REQUEST CANCELLED
                        // ---------------------------------------------

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
                            "❌ TRAIN METADATA ERROR:",
                            classLoadError
                        );


                        setAvailableClasses(
                            []
                        );

                        setTimetableStations(
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
                            classLoadError?.response?.data?.message ||
                            classLoadError?.message ||
                            "Unable to load train information."
                        );


                    } finally {

                        if (
                            requestId ===
                                classRequestId.current &&
                            !controller.signal.aborted
                        ) {

                            setClassLoading(
                                false
                            );
                        }
                    }

                },
                250
            );


        // -------------------------------------------------
        // CLEANUP
        // -------------------------------------------------

        return () => {

            clearTimeout(
                timer
            );

            controller.abort();
        };

    }, [
        formData.trainNumber,
        formData.journeyDate,
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
            String(
                value || ""
            )
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


        // -------------------------------------------------
        // SHORT SEARCH
        // -------------------------------------------------

        if (
            search.length <
            2
        ) {

            if (
                field ===
                "boardingStation"
            ) {

                setBoardingSuggestions(
                    []
                );

            } else {

                setDestinationSuggestions(
                    []
                );
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


        } catch (
            searchError
        ) {

            console.error(
                "STATION SEARCH ERROR:",
                searchError
            );


            if (
                field ===
                "boardingStation"
            ) {

                setBoardingSuggestions(
                    []
                );

            } else {

                setDestinationSuggestions(
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


    // =====================================================
    // BOARDING STATION AUTOCOMPLETE
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
            setTimeout(
                () => {

                    searchStations(
                        "boardingStation",
                        value,
                        requestId
                    );

                },
                350
            );


        return () =>
            clearTimeout(
                timer
            );

    }, [
        formData.boardingStation,
    ]);


    // =====================================================
    // DESTINATION STATION AUTOCOMPLETE
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
            setTimeout(
                () => {

                    searchStations(
                        "destinationStation",
                        value,
                        requestId
                    );

                },
                350
            );


        return () =>
            clearTimeout(
                timer
            );

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


        setFormData(
            (prev) => ({
                ...prev,

                [field]:
                    normalized.code,
            })
        );


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

        setError(
            ""
        );
    };


    // =====================================================
    // CLOSE STATION DROPDOWN
    // =====================================================

    const closeStationSuggestions =
        () => {

            setTimeout(
                () => {

                    setActiveStationField(
                        null
                    );

                },
                150
            );
        };


    // =====================================================
    // PART 2 END
    // =====================================================
        // =====================================================
    // SUBMIT JOURNEY
    // =====================================================

    const handleSubmit = async (
        e
    ) => {

        e.preventDefault();


        if (loading) {
            return;
        }


        setError("");


        // -------------------------------------------------
        // CLEAN VALUES
        // -------------------------------------------------

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
        // VALIDATE DATE
        // =================================================

        if (!journeyDate) {

            setError(
                "Please select a journey date."
            );

            return;
        }


        if (
            journeyDate <
            today
        ) {

            setError(
                "Journey date cannot be in the past."
            );

            return;
        }


        // =================================================
        // VALIDATE SOURCE
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


        // =================================================
        // VALIDATE DESTINATION
        // =================================================

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
        // VALIDATE CLASS
        // =================================================

        if (!preferredClass) {

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
        // CREATE PAYLOAD
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


        // =================================================
        // CREATE JOURNEY
        // =================================================

        try {

            setLoading(
                true
            );


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


        } catch (
            submitError
        ) {

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

            setLoading(
                false
            );
        }
    };


    // =====================================================
    // RENDER
    // =====================================================

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
                                    seats and berths.
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
                                    Receive the available
                                    journey strategy.
                                </span>

                            </div>

                        </div>


                    </div>

                </div>


                {/* =================================================
                    FORM CARD
                ================================================= */}

                <div className="journeyCard">


                    {/* =================================================
                        CARD HEADER
                    ================================================= */}

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


                            <label
                                htmlFor="trainNumber"
                            >
                                Train Number
                            </label>


                            <div className="trainAutocompleteWrapper">


                                <div
                                    className={
                                        "inputWrapper trainInputWrapper"
                                    }
                                >


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

                                            const value =
                                                formData
                                                    .trainNumber
                                                    .trim();


                                            const matches =
                                                LOCAL_TRAINS
                                                    .filter(
                                                        (
                                                            train
                                                        ) =>
                                                            train.trainNumber
                                                                .startsWith(
                                                                    value
                                                                )
                                                    )
                                                    .slice(
                                                        0,
                                                        8
                                                    );


                                            setTrainSuggestions(
                                                matches
                                            );


                                            setTrainSuggestionVisible(
                                                matches.length >
                                                    0
                                            );

                                        }}
                                        placeholder="Enter train number"
                                        inputMode="numeric"
                                        maxLength="5"
                                        autoComplete="off"
                                        required
                                    />


                                    {trainLoading && (

                                        <span className="trainSearchSpinner">
                                            ⟳
                                        </span>

                                    )}


                                </div>


                                {/* =================================================
                                    TRAIN SUGGESTIONS
                                ================================================= */}

                                {trainSuggestionVisible &&
                                    trainSuggestions.length >
                                        0 && (

                                    <div className="trainSuggestionsDropdown">

                                        {trainSuggestions.map(
                                            (
                                                train
                                            ) => (

                                                <button
                                                    type="button"
                                                    key={
                                                        train.trainNumber
                                                    }
                                                    className="trainSuggestion"
                                                    onMouseDown={(
                                                        event
                                                    ) =>
                                                        event.preventDefault()
                                                    }
                                                    onClick={() =>
                                                        selectTrain(
                                                            train
                                                        )
                                                    }
                                                >

                                                    <div className="trainSuggestionIcon">
                                                        🚆
                                                    </div>


                                                    <div className="trainSuggestionContent">

                                                        <strong>
                                                            {
                                                                train.trainNumber
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                train.trainName
                                                            }
                                                        </span>

                                                    </div>


                                                    <span className="trainSuggestionArrow">
                                                        →
                                                    </span>

                                                </button>

                                            )
                                        )}

                                    </div>

                                )}

                            </div>


                            {/* =================================================
                                VERIFIED TRAIN
                            ================================================= */}

                            {trainInfo &&
                                !trainLoading &&
                                trainInfo.trainName && (

                                <div className="trainVerifiedCard">


                                    <div className="trainVerifiedIcon">
                                        ✓
                                    </div>


                                    <div className="trainVerifiedInfo">

                                        <strong>
                                            Train verified
                                        </strong>

                                        <span>
                                            {
                                                trainInfo.trainNumber
                                            }
                                            {" — "}
                                            {
                                                trainInfo.trainName
                                            }
                                        </span>

                                    </div>


                                    {timetableStations.length >
                                        0 && (

                                        <button
                                            type="button"
                                            className="viewTimetableButton"
                                            onClick={() =>
                                                setShowTimetable(
                                                    true
                                                )
                                            }
                                        >
                                            🗺️ View Timetable
                                        </button>

                                    )}

                                </div>

                            )}


                            {trainError && (

                                <small className="fieldError">
                                    {trainError}
                                </small>

                            )}


                            {!trainError &&
                                trainInfo &&
                                !trainLoading && (

                                <small className="fieldSuccess">

                                    ✓ Train verified successfully.

                                </small>

                            )}

                        </div>


                        {/* =================================================
                            JOURNEY DATE
                        ================================================= */}

                        <div className="formGroup">


                            <label
                                htmlFor="journeyDate"
                            >
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
                                    min={
                                        today
                                    }
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


                                <label
                                    htmlFor="boardingStation"
                                >
                                    Boarding Station
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
                                            placeholder="Enter boarding station"
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
                                                            event
                                                        ) =>
                                                            event.preventDefault()
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
                                    Type the station name or code.
                                </small>

                            </div>


                            {/* ROUTE ARROW */}

                            <div className="routeArrow">
                                →
                            </div>


                            {/* DESTINATION */}

                            <div className="formGroup">


                                <label
                                    htmlFor="destinationStation"
                                >
                                    Destination Station
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
                                                            event
                                                        ) =>
                                                            event.preventDefault()
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
                                    Type the station name or code.
                                </small>

                            </div>

                        </div>


                        {/* =================================================
                            PREFERRED CLASS
                        ================================================= */}

                        <div className="formGroup">


                            <label
                                htmlFor="preferredClass"
                            >
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
                                        !formData.journeyDate ? (

                                        <option value="">
                                            Select train and journey date
                                        </option>

                                    ) : classLoading ? (

                                        <option value="">
                                            Loading available classes...
                                        </option>

                                    ) : availableClasses.length ===
                                        0 ? (

                                        <option value="">
                                            No class information available
                                        </option>

                                    ) : (

                                        availableClasses.map(
                                            (
                                                item
                                            ) => (

                                                <option
                                                    key={
                                                        item.code
                                                    }
                                                    value={
                                                        item.code
                                                    }
                                                >
                                                    {
                                                        item.code
                                                    }
                                                    {" — "}
                                                    {
                                                        item.name
                                                    }
                                                </option>

                                            )
                                        )

                                    )}

                                </select>

                            </div>


                            {classLoading && (

                                <small className="classLoadingText">

                                    Loading classes from train metadata...

                                </small>

                            )}


                            {classError &&
                                !classLoading && (

                                <small className="fieldError">

                                    {classError}

                                </small>

                            )}


                            {!classLoading &&
                                !classError &&
                                availableClasses.length >
                                    0 && (

                                <small className="classVerified">

                                    ✓ Classes verified from train metadata

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
                            SUBMIT BUTTON
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


                    {/* =================================================
                        SECURITY NOTE
                    ================================================= */}

                    <div className="secureNote">

                        🔒 Your journey information is securely
                        stored and used only for monitoring.

                    </div>


                </div>

            </div>


            {/* =================================================
                CLOSE TRAIN SUGGESTIONS
            ================================================= */}

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


                {/* =================================================
                TRAIN TIMETABLE MODAL
            ================================================= */}

            {showTimetable && (

                <div
                    className="timetableModalOverlay"
                    onMouseDown={() =>
                        setShowTimetable(
                            false
                        )
                    }
                >

                    <div
                        className="timetableModal"
                        onMouseDown={(
                            event
                        ) =>
                            event.stopPropagation()
                        }
                    >


                        {/* =================================================
                            MODAL HEADER
                        ================================================= */}

                        <div className="timetableModalHeader">


                            <div>

                                <span className="timetableEyebrow">
                                    TRAIN TIMETABLE
                                </span>


                                <h2>

                                    {trainInfo?.trainNumber ||
                                        formData.trainNumber}

                                    {" — "}

                                    {trainInfo?.trainName ||
                                        "Train Timetable"}

                                </h2>


                                <p>
                                    Complete route and scheduled
                                    timings for this train.
                                </p>

                            </div>


                            <button
                                type="button"
                                className="timetableCloseButton"
                                onClick={() =>
                                    setShowTimetable(
                                        false
                                    )
                                }
                                aria-label="Close timetable"
                            >
                                ×
                            </button>

                        </div>


                        {/* =================================================
                            ROUTE SUMMARY
                        ================================================= */}

                        <div className="timetableRouteSummary">


                            <div>

                                <span>
                                    BOARDING
                                </span>


                                <strong>

                                    {formData.boardingStation ||
                                        "Not selected"}

                                </strong>

                            </div>


                            <div className="timetableRouteArrow">
                                →
                            </div>


                            <div>

                                <span>
                                    DESTINATION
                                </span>


                                <strong>

                                    {formData.destinationStation ||
                                        "Not selected"}

                                </strong>

                            </div>

                        </div>


                        {/* =================================================
                            TIMETABLE TABLE
                        ================================================= */}

                        <div className="timetableTableWrapper">


                            {timetableStations.length >
                            0 ? (

                                <table className="timetableTable">


                                    <thead>

                                        <tr>

                                            <th>
                                                #
                                            </th>

                                            <th>
                                                Station
                                            </th>

                                            <th>
                                                Arrival
                                            </th>

                                            <th>
                                                Departure
                                            </th>

                                            <th>
                                                Day
                                            </th>

                                            <th>
                                                Distance
                                            </th>

                                        </tr>

                                    </thead>


                                    <tbody>

                                        {timetableStations.map(
                                            (
                                                station,
                                                index
                                            ) => {


                                                const code =
                                                    String(
                                                        station?.code ||
                                                        station?.stationCode ||
                                                        ""
                                                    )
                                                        .trim()
                                                        .toUpperCase();


                                                const name =
                                                    String(
                                                        station?.name ||
                                                        station?.stationName ||
                                                        "Unknown Station"
                                                    ).trim();


                                                const arrival =
                                                    station?.arrival ||
                                                    "—";


                                                const departure =
                                                    station?.departure ||
                                                    "—";


                                                const day =
                                                    station?.day ??
                                                    "—";


                                                const distance =
                                                    station?.distance ??
                                                    "—";


                                                const isSource =
                                                    code ===
                                                    String(
                                                        formData
                                                            .boardingStation ||
                                                        ""
                                                    )
                                                        .trim()
                                                        .toUpperCase();


                                                const isDestination =
                                                    code ===
                                                    String(
                                                        formData
                                                            .destinationStation ||
                                                        ""
                                                    )
                                                        .trim()
                                                        .toUpperCase();


                                                let rowClass =
                                                    "";


                                                if (
                                                    isSource
                                                ) {

                                                    rowClass =
                                                        "timetableSourceRow";

                                                } else if (
                                                    isDestination
                                                ) {

                                                    rowClass =
                                                        "timetableDestinationRow";
                                                }


                                                return (

                                                    <tr
                                                        key={
                                                            `${code}-${index}`
                                                        }
                                                        className={
                                                            rowClass
                                                        }
                                                    >


                                                        {/* NUMBER */}

                                                        <td className="stationNumber">

                                                            {index + 1}

                                                        </td>


                                                        {/* STATION */}

                                                        <td className="timetableStationCell">


                                                            <div className="stationCode">

                                                                {code ||
                                                                    "—"}

                                                            </div>


                                                            <div className="stationName">

                                                                {name}

                                                            </div>


                                                            {isSource && (

                                                                <span className="stationMarker sourceMarker">

                                                                    BOARDING

                                                                </span>

                                                            )}


                                                            {isDestination && (

                                                                <span className="stationMarker destinationMarker">

                                                                    DESTINATION

                                                                </span>

                                                            )}

                                                        </td>


                                                        {/* ARRIVAL */}

                                                        <td>

                                                            {arrival}

                                                        </td>


                                                        {/* DEPARTURE */}

                                                        <td>

                                                            {departure}

                                                        </td>


                                                        {/* DAY */}

                                                        <td>

                                                            {day}

                                                        </td>


                                                        {/* DISTANCE */}

                                                        <td>

                                                            {distance ===
                                                                "—"
                                                                ? "—"
                                                                : `${distance} km`}

                                                        </td>

                                                    </tr>

                                                );
                                            }
                                        )}

                                    </tbody>

                                </table>

                            ) : (

                                <div className="timetableEmptyState">

                                    <div className="timetableEmptyIcon">
                                        🚆
                                    </div>

                                    <strong>
                                        Timetable unavailable
                                    </strong>

                                    <span>
                                        Train timetable information
                                        could not be loaded.
                                    </span>

                                </div>

                            )}

                        </div>


                        {/* =================================================
                            MODAL FOOTER
                        ================================================= */}

                        <div className="timetableModalFooter">


                            <span>

                                🕐 Timings are based on the
                                selected train and journey date.

                            </span>


                            <button
                                type="button"
                                onClick={() =>
                                    setShowTimetable(
                                        false
                                    )
                                }
                            >

                                Done

                            </button>

                        </div>


                    </div>

                </div>

            )}


        </div>

    );
}