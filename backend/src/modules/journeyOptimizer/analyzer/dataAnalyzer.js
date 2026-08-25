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

                source: journey.source,

                destination: journey.destination,

                journeyDate: journey.journeyDate,

                preferredClasses: journey.preferredClasses,

                allowMixedClass: journey.allowMixedClass

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

            vacancies: vacancies?.vbd || [],

            analyzedAt: new Date()

        };

    }

}

module.exports = new DataAnalyzer();