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

const formatRunningDays = (value) => {
    const weekdays = [
        { full: "Monday", short: "Mon" },
        { full: "Tuesday", short: "Tue" },
        { full: "Wednesday", short: "Wed" },
        { full: "Thursday", short: "Thu" },
        { full: "Friday", short: "Fri" },
        { full: "Saturday", short: "Sat" },
        { full: "Sunday", short: "Sun" },
    ];

    const dayAliases = new Map();
    weekdays.forEach(({ full, short }) => {
        dayAliases.set(full.toLowerCase(), short);
        dayAliases.set(short.toLowerCase(), short);
        dayAliases.set(short.slice(0, 2).toLowerCase(), short);
    });

    const isRunning = (status) =>
        status === true ||
        status === 1 ||
        ["1", "y", "yes", "true", "runs", "running"].includes(
            String(status ?? "").trim().toLowerCase()
        );

    const dayFrom = (item) => {
        if (typeof item === "string" || typeof item === "number") {
            const normalized = String(item).trim().toLowerCase();
            return dayAliases.get(normalized) || "";
        }

        if (item && typeof item === "object") {
            const day =
                item.day ||
                item.dayName ||
                item.dayOfWeek ||
                item.weekday ||
                item.name ||
                item.label ||
                "";
            const status =
                item.runs ??
                item.running ??
                item.isRunning ??
                item.operates ??
                item.active ??
                true;
            return isRunning(status) ? dayFrom(day) : "";
        }

        return "";
    };

    if (value == null || value === "") return "";

    if (Array.isArray(value)) {
        const days = [...new Set(value.map(dayFrom).filter(Boolean))];
        return days.length ? days.join(", ") : "";
    }

    if (typeof value === "object") {
        const nested =
            value.days ||
            value.weekdays ||
            value.runningDays ||
            value.daysOfRun ||
            value.DaysOfRun;

        if (nested != null && nested !== value) {
            return formatRunningDays(nested);
        }

        const days = weekdays
            .filter(({ full, short }) => {
                const status =
                    value[full] ??
                    value[full.toLowerCase()] ??
                    value[short] ??
                    value[short.toLowerCase()] ??
                    value[short.slice(0, 2).toLowerCase()];
                return isRunning(status);
            })
            .map(({ short }) => short);

        return days.length ? days.join(", ") : "";
    }

    const text = String(value).trim();
    if (!text) return "";

    if (/^[01]{7}$/.test(text)) {
        const days = [...text]
            .map((runs, index) => (runs === "1" ? weekdays[index].short : ""))
            .filter(Boolean);
        return days.length ? days.join(", ") : "Does not run";
    }

    const lower = text.toLowerCase();
    if (["daily", "all days", "every day"].includes(lower)) {
        return "Daily";
    }

    const matchedDays = weekdays
        .filter(({ full, short }) =>
            new RegExp(`\\b(?:${full}|${short})\\b`, "i").test(text)
        )
        .map(({ short }) => short);

    if (matchedDays.length) {
        return [...new Set(matchedDays)].join(", ");
    }

    return text;
};

const getRunningWeekdayIndexes = (value) => {
    const text = String(value || "").trim();
    if (!text) return null;
    if (["daily", "all days", "every day"].includes(text.toLowerCase())) return [0, 1, 2, 3, 4, 5, 6];
    if (/^[01]{7}$/.test(text)) {
        return [...text].map((runs, index) => (runs === "1" ? (index + 1) % 7 : null)).filter((day) => day !== null);
    }
    const dayTokens = [
        { names: ["sun", "sunday"], index: 0 },
        { names: ["mon", "monday"], index: 1 },
        { names: ["tue", "tues", "tuesday"], index: 2 },
        { names: ["wed", "wednesday"], index: 3 },
        { names: ["thu", "thur", "thurs", "thursday"], index: 4 },
        { names: ["fri", "friday"], index: 5 },
        { names: ["sat", "saturday"], index: 6 },
    ];
    const matched = dayTokens
        .filter(({ names }) => names.some((name) => new RegExp('\\b' + name + '\\b', 'i').test(text)))
        .map(({ index }) => index);
    return matched.length ? [...new Set(matched)] : null;
};

const toLocalDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
};

const parseLocalDate = (value) => {
    if (!value) return new Date();
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
};

const formatJourneyDate = (value) => {
    if (!value) return "";
    return parseLocalDate(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};


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
        runningDays,
        setRunningDays,
    ] = useState("");

    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(() => new Date());

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

    const visibleMonthDate = formData.journeyDate
        ? parseLocalDate(formData.journeyDate)
        : calendarMonth;
    const monthStart = new Date(visibleMonthDate.getFullYear(), visibleMonthDate.getMonth(), 1);
    const calendarGridStart = new Date(
        monthStart.getFullYear(),
        monthStart.getMonth(),
        1 - monthStart.getDay()
    );
    const calendarDays = Array.from({ length: 42 }, (_, index) =>
        new Date(
            calendarGridStart.getFullYear(),
            calendarGridStart.getMonth(),
            calendarGridStart.getDate() + index,
            12, 0, 0
        )
    );
    const calendarMonthLabel = visibleMonthDate.toLocaleDateString("en-IN", {
        month: "long", year: "numeric",
    });
    const runningWeekdays = getRunningWeekdayIndexes(runningDays);
    const boardingTimetableStation = timetableStations.find(
        (station) => String(station?.code || "").trim().toUpperCase() ===
            String(formData.boardingStation || "").trim().toUpperCase()
    );
    const boardingStationDay = Number.parseInt(String(boardingTimetableStation?.day ?? ""), 10);
    const hasBoardingStationDay = Boolean(boardingTimetableStation) &&
        Number.isFinite(boardingStationDay) && boardingStationDay >= 1;
    const getDateRunStatus = (date) => {
        if (!runningWeekdays || !hasBoardingStationDay) return null;
        const originWeekday = (date.getDay() - (boardingStationDay - 1) + 7) % 7;
        return runningWeekdays.includes(originWeekday);
    };
    const canOpenDatePicker = Boolean(trainInfo) && Boolean(formData.boardingStation.trim());


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

            setRunningDays("");

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
                ...(name === "boardingStation"
                    ? { journeyDate: "", preferredClass: "" }
                    : {}),
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

        const metadataJourneyDate =
            /^\d{4}-\d{2}-\d{2}$/.test(journeyDate)
                ? journeyDate
                : today;

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
            )
        ) {

            setAvailableClasses([]);

            setTimetableStations([]);

            setRunningDays("");

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
                                journeyDate: metadataJourneyDate,
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
                        // TRAIN RUNNING DAYS
                        // =================================================

                        setRunningDays(
                            formatRunningDays(
                                metadata?.sourceDetails?.daysOfRun ??
                                metadata?.daysOfRun
                            )
                        );


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

                        setRunningDays("");


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

    const selectJourneyDate = (dateKey) => {
        setFormData((previous) => ({ ...previous, journeyDate: dateKey, preferredClass: "" }));
        setAvailableClasses([]);
        setClassError("");
        setDatePickerOpen(false);
        setError("");
    };


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
                ...(field === "boardingStation"
                    ? { journeyDate: "", preferredClass: "" }
                    : {}),
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
                            JOURNEY DATE
                        ================================================= */}

                        <div className="formGroup">


                            <label
                                htmlFor="journeyDate"
                            >
                                Journey Date
                            </label>


                            <div className="journeyDatePicker" style={{ position: "relative" }}>
                                <div className="inputWrapper">
                                    <span>📅</span>
                                    <input
                                        id="journeyDate"
                                        type="text"
                                        name="journeyDate"
                                        value={formatJourneyDate(formData.journeyDate)}
                                        placeholder="Choose a running date"
                                        readOnly
                                        required
                                        disabled={!canOpenDatePicker}
                                        aria-haspopup="dialog"
                                        aria-expanded={datePickerOpen}
                                        onClick={() => {
                                            if (!canOpenDatePicker) return;
                                            setCalendarMonth(formData.journeyDate ? parseLocalDate(formData.journeyDate) : new Date());
                                            setDatePickerOpen((open) => !open);
                                        }}
                                    />
                                </div>

                                {datePickerOpen && (
                                    <div className="journeyCalendar" role="dialog" aria-label="Choose journey date" style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 50, width: "min(360px, calc(100vw - 48px))", padding: "16px", border: "1px solid #d8e2f0", borderRadius: "16px", background: "#ffffff", boxShadow: "0 18px 44px rgba(30, 55, 90, 0.2)" }}>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "14px" }}>
                                            <button type="button" aria-label="Previous month" disabled={visibleMonthDate.getFullYear() === parseLocalDate(today).getFullYear() && visibleMonthDate.getMonth() <= parseLocalDate(today).getMonth()} onClick={() => setCalendarMonth(new Date(visibleMonthDate.getFullYear(), visibleMonthDate.getMonth() - 1, 1))} style={{ border: "1px solid #d8e2f0", borderRadius: "8px", background: "#f8fbff", padding: "6px 10px", cursor: "pointer" }}>‹</button>
                                            <strong style={{ color: "#1b2940" }}>{calendarMonthLabel}</strong>
                                            <button type="button" aria-label="Next month" onClick={() => setCalendarMonth(new Date(visibleMonthDate.getFullYear(), visibleMonthDate.getMonth() + 1, 1))} style={{ border: "1px solid #d8e2f0", borderRadius: "8px", background: "#f8fbff", padding: "6px 10px", cursor: "pointer" }}>›</button>
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "5px", textAlign: "center", marginBottom: "6px" }}>
                                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day} style={{ padding: "4px 0", fontSize: "12px", fontWeight: 700, color: "#70809a" }}>{day}</span>)}
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "5px" }}>
                                            {calendarDays.map((date) => {
                                                const dateKey = toLocalDateKey(date);
                                                const isCurrentMonth = date.getMonth() === visibleMonthDate.getMonth();
                                                const isPastDate = dateKey < today;
                                                const runStatus = getDateRunStatus(date);
                                                const isSelected = dateKey === formData.journeyDate;
                                                const isDisabled = !isCurrentMonth || isPastDate || runStatus === false;
                                                if (!isCurrentMonth) return <span key={dateKey} />;
                                                return (
                                                    <button key={dateKey} type="button" disabled={isDisabled} aria-pressed={isSelected} aria-label={date.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) + (runStatus === true ? ", train runs" : runStatus === false ? ", train does not run" : "")} onClick={() => selectJourneyDate(dateKey)} style={{ minHeight: "38px", border: isSelected ? "2px solid #1d4ed8" : runStatus === true ? "1px solid #86d6a2" : "1px solid transparent", borderRadius: "9px", background: isSelected ? "#2563eb" : runStatus === true ? "#dcfce7" : "#f1f4f8", color: isSelected ? "#ffffff" : runStatus === true ? "#166534" : "#8390a4", fontWeight: isSelected || runStatus === true ? 700 : 500, cursor: isDisabled ? "not-allowed" : "pointer", opacity: isDisabled && runStatus !== false ? 0.45 : 1 }}>
                                                        {date.getDate()}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {runningWeekdays && hasBoardingStationDay ? (
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "14px", fontSize: "12px", color: "#64748b" }}>
                                                <span><span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "3px", background: "#dcfce7", border: "1px solid #86d6a2", marginRight: "5px" }} />Train runs at {formData.boardingStation}</span>
                                                <span><span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "3px", background: "#f1f4f8", marginRight: "5px" }} />No service</span>
                                            </div>
                                        ) : (
                                            <small style={{ display: "block", marginTop: "12px", color: "#64748b" }}>
                                                {classLoading ? "Loading train operating days and timetable..." : "Running-day details are not available for this train or boarding station yet."}
                                            </small>
                                        )}
                                    </div>
                                )}
                            </div>

                            <small>
                                Choose a green date when the train operates at your boarding station.
                            </small>

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

                                    {!formData.trainNumber ? (

                                        <option value="">
                                            Select a train
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


                        {runningDays && (
                            <div
                                className="timetableRunningDays"
                                style={{
                                    margin: "0 24px 18px",
                                    padding: "12px 16px",
                                    borderRadius: "12px",
                                    background: "rgba(37, 99, 235, 0.08)",
                                    color: "#2456a6",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    flexWrap: "wrap",
                                }}
                            >
                                <strong>Runs on:</strong>
                                <span>{runningDays}</span>
                            </div>
                        )}


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
