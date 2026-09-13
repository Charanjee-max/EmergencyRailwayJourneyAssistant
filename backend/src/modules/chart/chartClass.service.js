const chartService = require("./chart.service");

const CLASS_INFO = {
    "1A": {
        name: "First AC",
        coaches: ["H"],
    },

    "2A": {
        name: "AC 2 Tier",
        coaches: ["A"],
    },

    "3A": {
        name: "AC 3 Tier",
        coaches: ["B"],
    },

    "3E": {
        name: "AC 3 Economy",
        coaches: ["M"],
    },

    SL: {
        name: "Sleeper",
        coaches: ["S"],
    },

    "2S": {
        name: "Second Sitting",
        coaches: ["D"],
    },

    CC: {
        name: "Chair Car",
        coaches: ["C"],
    },

    EC: {
        name: "Executive Chair Car",
        coaches: ["E"],
    },
};

// ---------------------------------------------------------
// Extract coach codes from IRCTC cdd
// ---------------------------------------------------------

const extractCoachCodes = (cdd = []) => {
    const coachCodes = new Set();

    const addCoach = (value) => {
        if (!value) return;

        const text = String(value)
            .trim()
            .toUpperCase();

        /*
         * Examples:
         * A1
         * B1
         * M1
         * S1
         * D1
         * C1
         * E1
         * H1
         */

        const matches = text.match(
            /\b(?:H|A|B|M|S|D|C|E)\d{1,2}\b/g
        );

        if (!matches) return;

        matches.forEach((coach) => {
            coachCodes.add(coach);
        });
    };

    const scan = (item) => {
        if (!item) return;

        if (typeof item === "string") {
            addCoach(item);
            return;
        }

        if (typeof item !== "object") {
            return;
        }

        const possibleFields = [
            "coachName",
            "coach",
            "coachCode",
            "code",
            "name",
            "coachNumber",
        ];

        for (const field of possibleFields) {
            if (item[field]) {
                addCoach(item[field]);
            }
        }
    };

    if (Array.isArray(cdd)) {
        cdd.forEach(scan);
    }

    return Array.from(coachCodes);
};

// ---------------------------------------------------------
// Convert coaches → classes
// ---------------------------------------------------------

const getClassesFromCoaches = (coachCodes) => {
    const availableClasses = new Set();

    for (const coach of coachCodes) {
        const prefix = coach.charAt(0);

        for (const [classCode, info] of Object.entries(CLASS_INFO)) {
            if (info.coaches.includes(prefix)) {
                availableClasses.add(classCode);
            }
        }
    }

    return Object.keys(CLASS_INFO)
        .filter((classCode) =>
            availableClasses.has(classCode)
        )
        .map((classCode) => ({
            code: classCode,
            name: CLASS_INFO[classCode].name,
        }));
};

// ---------------------------------------------------------
// Main
// ---------------------------------------------------------

const getAvailableTrainClasses = async ({
    trainNumber,
    journeyDate,
    boardingStation,
}) => {
    if (!trainNumber) {
        throw new Error("Train number is required.");
    }

    if (!journeyDate) {
        throw new Error("Journey date is required.");
    }

    if (!boardingStation) {
        throw new Error(
            "Boarding station is required to check train composition."
        );
    }

    const chart = await chartService.fetchAndCacheChart(
        trainNumber,
        journeyDate,
        boardingStation
    );

    const cdd = Array.isArray(chart?.cdd)
        ? chart.cdd
        : [];

    const coachCodes = extractCoachCodes(cdd);

    const classes = getClassesFromCoaches(
        coachCodes
    );

    return {
        trainNumber: String(trainNumber),
        journeyDate,
        boardingStation,
        chartPrepared:
            chart?.chartPrepared === true,
        classes,
        coachCodes,
        compositionAvailable:
            coachCodes.length > 0,
    };
};

module.exports = {
    getAvailableTrainClasses,
};