const Journey =
    require("./journey.model");

const Chart =
    require("../chart/chart.model");

const Recommendation =
    require("../recommendation/recommendation.model");

const {
    getStopsBetweenService,
    getTrainStopsService,
} = require("../train/train.service");

const {
    calculateChartTiming,
} = require("../chart/chartTiming.service");

// =========================================================
// INDIA TIMEZONE
// =========================================================

const INDIA_TIME_ZONE =
    "Asia/Kolkata";

// =========================================================
// CURRENT INDIA DATE + TIME
// =========================================================

const getIndiaDateTime = () => {
    const parts =
        new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone:
                    INDIA_TIME_ZONE,

                year: "numeric",
                month: "2-digit",
                day: "2-digit",

                hour: "2-digit",
                minute: "2-digit",

                hourCycle: "h23",
            }
        ).formatToParts(
            new Date()
        );

    const values = {};

    for (const part of parts) {
        if (
            part.type !==
            "literal"
        ) {
            values[part.type] =
                part.value;
        }
    }

    return {
        date:
            `${values.year}-${values.month}-${values.day}`,

        minutes:
            Number(values.hour) *
                60 +
            Number(values.minute),
    };
};

// =========================================================
// NORMALIZE DATE
// =========================================================

const normalizeJourneyDate = (
    journeyDate
) => {
    if (
        typeof journeyDate ===
        "string"
    ) {
        return journeyDate.slice(
            0,
            10
        );
    }

    const date =
        new Date(journeyDate);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return null;
    }

    return new Intl.DateTimeFormat(
        "en-CA",
        {
            timeZone:
                INDIA_TIME_ZONE,

            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }
    ).format(date);
};

// =========================================================
// PARSE HH:mm
// =========================================================

const parseTimeToMinutes = (
    time
) => {
    const value =
        String(time || "")
            .trim();

    const match =
        value.match(
            /^(\d{1,2}):(\d{2})$/
        );

    if (!match) {
        return null;
    }

    const hours =
        Number(match[1]);

    const minutes =
        Number(match[2]);

    if (
        hours < 0 ||
        hours > 23 ||
        minutes < 0 ||
        minutes > 59
    ) {
        return null;
    }

    return (
        hours * 60 +
        minutes
    );
};

// =========================================================
// GET FINAL STATION
// =========================================================

const getTrainFinalStation =
    async (
        trainNumber
    ) => {
        const stops =
            await getTrainStopsService(
                {
                    trainNumber,
                }
            );

        if (
            !Array.isArray(
                stops
            ) ||
            stops.length === 0
        ) {
            const error =
                new Error(
                    `Unable to determine final station for train ${trainNumber}.`
                );

            error.statusCode =
                400;

            throw error;
        }

        const sortedStops =
            [...stops].sort(
                (a, b) =>
                    Number(
                        a.no || 0
                    ) -
                    Number(
                        b.no || 0
                    )
            );

        const finalStop =
            sortedStops[
                sortedStops.length -
                    1
            ];

        if (!finalStop) {
            const error =
                new Error(
                    `Unable to determine final station for train ${trainNumber}.`
                );

            error.statusCode =
                400;

            throw error;
        }

        return {
            code:
                String(
                    finalStop.code ||
                        ""
                )
                    .trim()
                    .toUpperCase(),

            name:
                String(
                    finalStop.station ||
                        finalStop.name ||
                        ""
                ).trim(),

            arrival:
                finalStop.arrival ||
                "",

            departure:
                finalStop.departure ||
                "",

            day:
                finalStop.day ||
                "",

            no:
                finalStop.no ||
                "",
        };
    };

// =========================================================
// CHECK FINAL STATION
// =========================================================

const hasTrainReachedFinalStation =
    async (
        journey
    ) => {
        if (!journey) {
            return false;
        }

        if (
            journey.status ===
            "COMPLETED"
        ) {
            return true;
        }

        const finalStation =
            await getTrainFinalStation(
                journey.trainNumber
            );

        if (
            !finalStation.code
        ) {
            return false;
        }

        const journeyDate =
            normalizeJourneyDate(
                journey.journeyDate
            );

        const indiaNow =
            getIndiaDateTime();

        if (!journeyDate) {
            return false;
        }

        if (
            journeyDate >
            indiaNow.date
        ) {
            return false;
        }

        if (
            journeyDate <
            indiaNow.date
        ) {
            return true;
        }

        const finalArrivalMinutes =
            parseTimeToMinutes(
                finalStation.arrival
            );

        if (
            finalArrivalMinutes ===
            null
        ) {
            return false;
        }

        return (
            finalArrivalMinutes <=
            indiaNow.minutes
        );
    };

// =========================================================
// COMPLETE JOURNEY
// =========================================================

const completeJourney =
    async (
        journeyId
    ) => {
        const journey =
            await Journey.findById(
                journeyId
            );

        if (!journey) {
            const error =
                new Error(
                    "Journey not found."
                );

            error.statusCode =
                404;

            throw error;
        }

        if (
            journey.status ===
            "COMPLETED"
        ) {
            return journey;
        }

        const finalStation =
            await getTrainFinalStation(
                journey.trainNumber
            );

        journey.status =
            "COMPLETED";

        journey.completedAt =
            new Date();

        journey.completedReason =
            "Train reached its final station.";

        journey.finalStationCode =
            finalStation.code;

        journey.finalStationName =
            finalStation.name;

        await journey.save();

        console.log(
            "========================================"
        );

        console.log(
            "🏁 JOURNEY COMPLETED"
        );

        console.log(
            "Journey ID:",
            journey._id
        );

        console.log(
            "Train:",
            journey.trainNumber
        );

        console.log(
            "Final Station:",
            `${finalStation.code} - ${finalStation.name}`
        );

        console.log(
            "Completed At:",
            journey.completedAt
        );

        console.log(
            "========================================"
        );

        return journey;
    };

// =========================================================
// CHECK + COMPLETE
// =========================================================

const checkAndCompleteJourney =
    async (
        journey
    ) => {
        if (!journey) {
            return {
                completed: false,
                journey: null,
            };
        }

        if (
            journey.status ===
            "COMPLETED"
        ) {
            return {
                completed: true,
                journey,
            };
        }

        const reachedFinalStation =
            await hasTrainReachedFinalStation(
                journey
            );

        if (
            !reachedFinalStation
        ) {
            return {
                completed: false,
                journey,
            };
        }

        const completedJourney =
            await completeJourney(
                journey._id
            );

        return {
            completed: true,
            journey:
                completedJourney,
        };
    };

// =========================================================
// VALIDATE JOURNEY DATE
// =========================================================

const validateJourneyDate = (
    journeyDate,
    routeStops
) => {
    const selectedDate =
        normalizeJourneyDate(
            journeyDate
        );

    if (!selectedDate) {
        const error =
            new Error(
                "Journey date must be a valid date."
            );

        error.statusCode =
            400;

        throw error;
    }

    const indiaNow =
        getIndiaDateTime();

    if (
        selectedDate <
        indiaNow.date
    ) {
        const error =
            new Error(
                "Journey date cannot be in the past."
            );

        error.statusCode =
            400;

        throw error;
    }

    if (
        selectedDate >
        indiaNow.date
    ) {
        return;
    }

    if (
        !Array.isArray(
            routeStops
        ) ||
        routeStops.length === 0
    ) {
        const error =
            new Error(
                "Unable to determine the train timetable for today's journey."
            );

        error.statusCode =
            400;

        throw error;
    }

    const boardingStop =
        routeStops[0];

    const boardingStation =
        String(
            boardingStop.code ||
                ""
        )
            .trim()
            .toUpperCase();

    const departure =
        String(
            boardingStop.departure ||
                ""
        ).trim();

    if (
        !departure ||
        departure ===
            "DSTN" ||
        departure ===
            "DSTN."
    ) {
        const error =
            new Error(
                `Unable to determine today's departure time from ${boardingStation}.`
            );

        error.statusCode =
            400;

        throw error;
    }

    const departureMinutes =
        parseTimeToMinutes(
            departure
        );

    if (
        departureMinutes ===
        null
    ) {
        const error =
            new Error(
                `Unable to determine today's departure time from ${boardingStation}.`
            );

        error.statusCode =
            400;

        throw error;
    }

    if (
        departureMinutes <=
        indiaNow.minutes
    ) {
        const error =
            new Error(
                `Train ${boardingStation} has already departed today at ${departure}. Please select a future journey date.`
            );

        error.statusCode =
            400;

        throw error;
    }
};

// =========================================================
// CREATE JOURNEY
// =========================================================

const createJourney =
    async (
        journeyData,
        userId
    ) => {
        const trainNumber =
            String(
                journeyData.trainNumber ||
                    ""
            ).trim();

        const boardingStation =
            String(
                journeyData.boardingStation ||
                    ""
            )
                .trim()
                .toUpperCase();

        const destinationStation =
            String(
                journeyData.destinationStation ||
                    ""
            )
                .trim()
                .toUpperCase();

        if (
            !trainNumber ||
            !boardingStation ||
            !destinationStation
        ) {
            const error =
                new Error(
                    "Train number, source station and destination station are required."
                );

            error.statusCode =
                400;

            throw error;
        }

        if (
            boardingStation ===
            destinationStation
        ) {
            const error =
                new Error(
                    "Boarding and destination stations cannot be the same."
                );

            error.statusCode =
                400;

            throw error;
        }

        // =====================================================
        // ROUTE VALIDATION
        // =====================================================

        let routeValidation;

        try {
            routeValidation =
                await getStopsBetweenService(
                    {
                        trainNumber,
                        from:
                            boardingStation,
                        to:
                            destinationStation,
                    }
                );
        } catch (error) {
            const routeError =
                new Error(
                    error.message ||
                        `Unable to validate route for train ${trainNumber}.`
                );

            routeError.statusCode =
                400;

            throw routeError;
        }

        if (
            !routeValidation ||
            routeValidation.found !==
                true
        ) {
            const error =
                new Error(
                    routeValidation?.message ||
                        `Train ${trainNumber} does not operate from ${boardingStation} to ${destinationStation}.`
                );

            error.statusCode =
                400;

            throw error;
        }

        // =====================================================
        // DATE VALIDATION
        // =====================================================

        validateJourneyDate(
            journeyData.journeyDate,
            routeValidation.stops
        );

        // =====================================================
        // CREATE
        // =====================================================

        const journey =
            await Journey.create(
                {
                    userId,

                    trainNumber,

                    journeyDate:
                        journeyData.journeyDate,

                    boardingStation,

                    destinationStation,

                    allowedClasses:
                        journeyData.allowedClasses,

                    allowMixedClass:
                        journeyData.allowMixedClass,

                    preferredStrategy:
                        journeyData.preferredStrategy,
                }
            );

        console.log(
            "✅ JOURNEY CREATED:",
            journey._id
        );

        return journey;
    };

// =========================================================
// GET CHART + EXPECTED CHART TIMING
// =========================================================

const getJourneyChartInformation =
    async (
        journey
    ) => {
        const journeyDate =
            normalizeJourneyDate(
                journey.journeyDate
            );

        const chart =
            await Chart.findOne(
                {
                    trainNumber:
                        journey.trainNumber,

                    journeyDate:
                        journeyDate,

                    boardingStation:
                        journey.boardingStation,
                }
            )
                .sort({
                    fetchedAt: -1,
                })
                .lean();

        // =====================================================
        // LOAD TRAIN ROUTE
        // =====================================================

        let routeStops = [];

        try {
            routeStops =
                await getTrainStopsService(
                    {
                        trainNumber:
                            journey.trainNumber,
                    }
                );
        } catch (error) {
            console.log(
                "⚠️ Unable to load timetable for chart timing:",
                error.message
            );
        }

        let originStop = null;

        if (
            Array.isArray(
                routeStops
            ) &&
            routeStops.length
        ) {
            const sorted =
                [...routeStops].sort(
                    (a, b) =>
                        Number(
                            a.no || 0
                        ) -
                        Number(
                            b.no || 0
                        )
                );

            originStop =
                sorted[0] || null;
        }

        // =====================================================
        // EXPECTED CHART TIMING
        // =====================================================

        let expectedFirstChartTime =
            null;

        let expectedFinalChartTime =
            null;

        if (
            originStop?.departure
        ) {
            try {
                const timing =
                    calculateChartTiming(
                        {
                            journeyDate,
                            originDeparture:
                                originStop.departure,
                        }
                    );

                expectedFirstChartTime =
                    timing.firstChartTime;

                expectedFinalChartTime =
                    timing.finalChartTime;
            } catch (error) {
                console.log(
                    "⚠️ Expected chart timing unavailable:",
                    error.message
                );
            }
        }

        // =====================================================
        // RETURN
        // =====================================================

        return {
            prepared:
                chart?.chartPrepared ===
                true,

            chartPrepared:
                chart?.chartPrepared ===
                true,

            chartOneDate:
                chart?.chartOneDate ||
                null,

            chartTwoDate:
                chart?.chartTwoDate ||
                null,

            expectedFirstChartTime,

            expectedFinalChartTime,

            fetchedAt:
                chart?.fetchedAt ||
                null,

            finalChartPrepared:
                Boolean(
                    chart?.chartTwoDate
                ),
        };
    };

// =========================================================
// ATTACH CHART INFORMATION
// =========================================================

const attachChartInformation =
    async (
        journeys
    ) => {
        return await Promise.all(
            journeys.map(
                async (
                    journey
                ) => {
                    const chart =
                        await getJourneyChartInformation(
                            journey
                        );

                    return {
                        ...journey,

                        chart,
                    };
                }
            )
        );
    };

// =========================================================
// GET ACTIVE JOURNEYS
// =========================================================

const getUserJourneys =
    async (
        userId
    ) => {
        const journeys =
            await Journey.find(
                {
                    userId,

                    status: {
                        $nin: [
                            "COMPLETED",
                            "CANCELLED",
                        ],
                    },
                }
            )
                .sort({
                    createdAt: -1,
                })
                .lean();

        return attachChartInformation(
            journeys
        );
    };

// =========================================================
// GET HISTORY
// =========================================================

const getJourneyHistory =
    async (
        userId
    ) => {
        const journeys =
            await Journey.find(
                {
                    userId,

                    status: {
                        $in: [
                            "COMPLETED",
                            "CANCELLED",
                        ],
                    },
                }
            )
                .sort({
                    completedAt: -1,
                    updatedAt: -1,
                })
                .lean();

        return attachChartInformation(
            journeys
        );
    };

// =========================================================
// GET SINGLE JOURNEY
// =========================================================

const getJourneyById =
    async (
        journeyId,
        userId
    ) => {
        const journey =
            await Journey.findOne(
                {
                    _id: journeyId,
                    userId,
                }
            ).lean();

        if (!journey) {
            const error =
                new Error(
                    "Journey request not found."
                );

            error.statusCode =
                404;

            throw error;
        }

        const result =
            await attachChartInformation(
                [journey]
            );

        return result[0];
    };

// =========================================================
// DELETE JOURNEY
// =========================================================

const deleteJourney =
    async (
        journeyId,
        userId
    ) => {
        const journey =
            await Journey.findOne(
                {
                    _id: journeyId,
                    userId,
                }
            );

        if (!journey) {
            const error =
                new Error(
                    "Journey request not found or access denied."
                );

            error.statusCode =
                404;

            throw error;
        }

        await Recommendation.deleteMany(
            {
                journey:
                    journeyId,
            }
        );

        await Journey.deleteOne(
            {
                _id: journeyId,
                userId,
            }
        );

        return journey;
    };

// =========================================================
// EXPORT
// =========================================================

module.exports = {
    createJourney,

    getUserJourneys,

    getJourneyHistory,

    getJourneyById,

    deleteJourney,

    getTrainFinalStation,

    hasTrainReachedFinalStation,

    completeJourney,

    checkAndCompleteJourney,
};