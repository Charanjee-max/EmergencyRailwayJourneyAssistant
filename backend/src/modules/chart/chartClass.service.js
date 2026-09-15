"use strict";

const chartService =
    require("./chart.service");

// =========================================================
// CLASS INFORMATION
// =========================================================

const CLASS_INFO = {
    "1A": {
        name: "First AC",
    },

    "2A": {
        name: "AC 2 Tier",
    },

    "3A": {
        name: "AC 3 Tier",
    },

    "3E": {
        name: "AC 3 Economy",
    },

    SL: {
        name: "Sleeper",
    },

    "2S": {
        name: "Second Sitting",
    },

    CC: {
        name: "Chair Car",
    },

    EC: {
        name: "Executive Chair Car",
    },
};

// =========================================================
// NORMALIZE CLASS
// =========================================================

const normalizeClass =
    (value) => {

        const code =
            String(
                value || ""
            )
                .trim()
                .toUpperCase();

        return CLASS_INFO[code]
            ? code
            : null;
    };

// =========================================================
// EXTRACT FROM COACH OBJECTS
// =========================================================

const extractFromCoaches = (
    coaches
) => {

    const classes =
        new Set();

    const coachCodes =
        new Set();

    if (
        !Array.isArray(
            coaches
        )
    ) {
        return {
            classes,
            coachCodes,
        };
    }

    for (
        const coach of coaches
    ) {

        if (!coach) {
            continue;
        }

        const coachName =
            String(
                coach.coachName ||
                coach.coach ||
                coach.coachCode ||
                coach.code ||
                ""
            )
                .trim()
                .toUpperCase();

        if (coachName) {
            coachCodes.add(
                coachName
            );
        }

        /*
         * BEST SOURCE:
         *
         * IRCTC composition provides classCode.
         */
        const explicitClass =
            normalizeClass(
                coach.classCode ||
                coach.class ||
                coach.classCodeName
            );

        if (explicitClass) {
            classes.add(
                explicitClass
            );

            continue;
        }

        /*
         * Fallback coach-prefix mapping.
         */
        const prefix =
            coachName.charAt(0);

        const prefixMap = {
            H: "1A",
            A: "2A",
            B: "3A",
            M: "3E",
            S: "SL",
            D: "2S",
            C: "CC",
            E: "EC",
        };

        const inferred =
            prefixMap[prefix];

        if (inferred) {
            classes.add(
                inferred
            );
        }
    }

    return {
        classes,
        coachCodes,
    };
};

// =========================================================
// EXTRACT FROM CDD
// =========================================================

const extractFromCDD = (
    cdd
) => {

    const classes =
        new Set();

    const coachCodes =
        new Set();

    if (
        !Array.isArray(
            cdd
        )
    ) {
        return {
            classes,
            coachCodes,
        };
    }

    const scan =
        (item) => {

            if (!item) {
                return;
            }

            if (
                typeof item ===
                "string"
            ) {

                const text =
                    item
                        .trim()
                        .toUpperCase();

                const matches =
                    text.match(
                        /\b(?:H|A|B|M|S|D|C|E)\d{1,2}\b/g
                    );

                if (matches) {

                    matches.forEach(
                        (coach) => {

                            coachCodes.add(
                                coach
                            );

                            const prefix =
                                coach.charAt(0);

                            const prefixMap = {
                                H: "1A",
                                A: "2A",
                                B: "3A",
                                M: "3E",
                                S: "SL",
                                D: "2S",
                                C: "CC",
                                E: "EC",
                            };

                            if (
                                prefixMap[prefix]
                            ) {
                                classes.add(
                                    prefixMap[prefix]
                                );
                            }
                        }
                    );
                }

                return;
            }

            if (
                typeof item !==
                "object"
            ) {
                return;
            }

            const explicitClass =
                normalizeClass(
                    item.classCode ||
                    item.class ||
                    item.className
                );

            if (
                explicitClass
            ) {
                classes.add(
                    explicitClass
                );
            }

            const coachName =
                String(
                    item.coachName ||
                    item.coach ||
                    item.coachCode ||
                    item.code ||
                    ""
                )
                    .trim()
                    .toUpperCase();

            if (
                coachName
            ) {

                const matches =
                    coachName.match(
                        /\b(?:H|A|B|M|S|D|C|E)\d{1,2}\b/g
                    );

                if (
                    matches
                ) {

                    matches.forEach(
                        (coach) =>
                            coachCodes.add(
                                coach
                            )
                    );
                }
            }
        };

    cdd.forEach(scan);

    return {
        classes,
        coachCodes,
    };
};

// =========================================================
// ORDER CLASSES
// =========================================================

const CLASS_ORDER = [
    "1A",
    "2A",
    "3A",
    "3E",
    "SL",
    "2S",
    "CC",
    "EC",
];

// =========================================================
// GET AVAILABLE CLASSES
// =========================================================

const getAvailableTrainClasses =
    async ({
        trainNumber,
        journeyDate,
        boardingStation,
    }) => {

        if (!trainNumber) {
            throw new Error(
                "Train number is required."
            );
        }

        if (!journeyDate) {
            throw new Error(
                "Journey date is required."
            );
        }

        if (!boardingStation) {
            throw new Error(
                "Boarding station is required."
            );
        }

        // =====================================================
        // FETCH REAL IRCTC COMPOSITION
        // =====================================================

        const chart =
            await chartService.fetchAndCacheChart(
                trainNumber,
                journeyDate,
                boardingStation
            );

        // =====================================================
        // EXTRACT
        // =====================================================

        const coachResult =
            extractFromCoaches(
                chart?.coaches
            );

        const cddResult =
            extractFromCDD(
                chart?.cdd
            );

        // =====================================================
        // MERGE
        // =====================================================

        const classSet =
            new Set([
                ...coachResult.classes,
                ...cddResult.classes,
            ]);

        const coachCodes =
            new Set([
                ...coachResult.coachCodes,
                ...cddResult.coachCodes,
            ]);

        // =====================================================
        // BUILD RESULT
        // =====================================================

        const classes =
            CLASS_ORDER
                .filter(
                    (code) =>
                        classSet.has(code)
                )
                .map(
                    (code) => ({
                        code,

                        name:
                            CLASS_INFO[
                                code
                            ].name,
                    })
                );

        return {
            trainNumber:
                String(
                    trainNumber
                ),

            journeyDate,

            boardingStation:
                String(
                    boardingStation
                )
                    .trim()
                    .toUpperCase(),

            chartPrepared:
                chart?.chartPrepared ===
                true,

            classes,

            coachCodes:
                Array.from(
                    coachCodes
                ),

            compositionAvailable:
                classes.length > 0,
        };
    };

// =========================================================
// EXPORT
// =========================================================

module.exports = {
    getAvailableTrainClasses,
};