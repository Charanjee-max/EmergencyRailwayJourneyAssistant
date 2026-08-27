class DataAnalyzer {

    analyze({
        journey,
        route,
        chart,
        vacancies
    }) {

        return {

            journey: {

    trainNumber: journey.trainNumber,

    source: journey.boardingStation,

    destination: journey.destinationStation,

    journeyDate: journey.journeyDate,

    preferredClasses: journey.allowedClasses
        .filter(c => c.enabled)
        .map(c => c.class),

    allowMixedClass: journey.allowMixedClass || false

},

            route: {

                stations: route?.stations || []

            },

            chart: {

                prepared: chart?.chartPrepared || false,

                chartOneTime: chart?.chartOneDate || null,

                chartTwoTime: chart?.chartTwoDate || null,

                coaches: chart?.cdd || []

            },

            vacancies: Array.isArray(vacancies)
    ? vacancies
    : (vacancies?.vbd || []),

            analyzedAt: new Date()

        };

    }

}

module.exports = new DataAnalyzer();