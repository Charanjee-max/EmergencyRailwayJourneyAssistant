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
    travelClass,
    coach,
    berth
) => {
    return {
        from,
        to,
        class: travelClass,
        coach,
        berth
    };
};

const generateVacancies = ({
    source,
    destination,
    travelClass = "3A",
    allowMixedClass = false
}) => {

    console.log("\n========== GENERATING MOCK VACANCIES ==========");
    console.log("Source:", source);
    console.log("Destination:", destination);
    console.log("Requested Class:", travelClass);
    console.log("Allow Mixed Class:", allowMixedClass);

    const vacancies = [];

    // ==================================================
    // BDCR -> SC TEST DATA
    // ==================================================

    if (
        source === "BDCR" &&
        destination === "SC"
    ) {

        // ==================================================
        // MIXED CLASS TEST
        // ==================================================
        if (allowMixedClass) {

            console.log("\n🧪 GENERATING MIXED CLASS TEST");

            vacancies.push(
                createVacancy(
                    "BDCR",
                    "KRA",
                    "3A",
                    "B1",
                    21
                )
            );

            vacancies.push(
                createVacancy(
                    "KRA",
                    "SC",
                    "SL",
                    "S1",
                    20
                )
            );

        }

        // ==================================================
        // SAME CLASS TEST
        // ==================================================
        else {

            console.log("\n🧪 GENERATING SAME CLASS TEST");

            vacancies.push(
                createVacancy(
                    "BDCR",
                    "KRA",
                    travelClass,
                    "B1",
                    21
                )
            );

            vacancies.push(
                createVacancy(
                    "KRA",
                    "SC",
                    travelClass,
                    "B1",
                    20
                )
            );
        }

    }

    // ==================================================
    // GENERIC FALLBACK
    // ==================================================

    else {

        const sourceOrder = stationOrder[source];
        const destinationOrder = stationOrder[destination];

        if (sourceOrder && destinationOrder) {

            // Forward journey
            if (sourceOrder < destinationOrder) {

                for (
                    let order = sourceOrder;
                    order < destinationOrder;
                    order++
                ) {

                    const from = Object.keys(stationOrder).find(
                        code => stationOrder[code] === order
                    );

                    const to = Object.keys(stationOrder).find(
                        code => stationOrder[code] === order + 1
                    );

                    if (from && to) {

                        vacancies.push(
                            createVacancy(
                                from,
                                to,
                                travelClass,
                                "B1",
                                21 - vacancies.length
                            )
                        );
                    }
                }
            }

            // Reverse journey
            else if (sourceOrder > destinationOrder) {

                for (
                    let order = sourceOrder;
                    order > destinationOrder;
                    order--
                ) {

                    const from = Object.keys(stationOrder).find(
                        code => stationOrder[code] === order
                    );

                    const to = Object.keys(stationOrder).find(
                        code => stationOrder[code] === order - 1
                    );

                    if (from && to) {

                        vacancies.push(
                            createVacancy(
                                from,
                                to,
                                travelClass,
                                "B1",
                                21 - vacancies.length
                            )
                        );
                    }
                }
            }
        }
    }

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