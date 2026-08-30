const stationOrder = {
    MUGR: 1,
    BDCR: 2,
    KRA: 3,
    DKJ: 4,
    WL: 5,
    SC: 6
};

const createVacancy = (
    from,
    to,
    travelClass = "3A",
    coach = "B1",
    berth = 21
) => {
    return {
        from,
        to,
        class: travelClass,
        coach,
        berth
    };
};

const getIntermediateSegments = (source, destination) => {
    const sourceOrder = stationOrder[source];
    const destinationOrder = stationOrder[destination];

    if (!sourceOrder || !destinationOrder) {
        return [];
    }

    const segments = [];

    if (sourceOrder < destinationOrder) {
        for (let order = sourceOrder; order < destinationOrder; order++) {

            const from = Object.keys(stationOrder).find(
                code => stationOrder[code] === order
            );

            const to = Object.keys(stationOrder).find(
                code => stationOrder[code] === order + 1
            );

            if (from && to) {
                segments.push({ from, to });
            }
        }
    } else if (sourceOrder > destinationOrder) {
        for (let order = sourceOrder; order > destinationOrder; order--) {

            const from = Object.keys(stationOrder).find(
                code => stationOrder[code] === order
            );

            const to = Object.keys(stationOrder).find(
                code => stationOrder[code] === order - 1
            );

            if (from && to) {
                segments.push({ from, to });
            }
        }
    }

    return segments;
};

const generateVacancies = ({
    source,
    destination,
    travelClass = "3A"
}) => {

    console.log("\n========== GENERATING TEST VACANCIES ==========");
    console.log("Source:", source);
    console.log("Destination:", destination);
    console.log("Class:", travelClass);

    const vacancies = [];

    // ==========================================
    // DIRECT SEAT TEST
    // ==========================================
    //
    // Always create one direct seat for the
    // requested journey.
    //
    // This lets us verify that DIRECT_SEAT
    // beats MULTI_HOP.
    // ==========================================

    vacancies.push(
        createVacancy(
            source,
            destination,
            travelClass,
            "B1",
            10
        )
    );

    // ==========================================
    // Also create the normal intermediate legs
    // ==========================================

    const segments = getIntermediateSegments(
        source,
        destination
    );

    segments.forEach((segment, index) => {

        vacancies.push(
            createVacancy(
                segment.from,
                segment.to,
                travelClass,
                "B1",
                21 - index
            )
        );

    });

    console.log(
        "\n========== GENERATED VACANCIES =========="
    );

    console.dir(
        vacancies,
        { depth: null }
    );

    return vacancies;
};

module.exports = {
    generateVacancies
};