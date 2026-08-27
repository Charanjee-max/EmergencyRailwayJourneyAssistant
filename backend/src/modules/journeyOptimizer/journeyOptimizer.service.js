const dataAnalyzer = require("./analyzer/dataAnalyzer");
const reservationGraphBuilder = require("./graph/reservationGraphBuilder");
const reservationStrategyEngine = require("./engine/reservationStrategyEngine");
const strategyRanker = require("./ranker/strategyRanker");
const recommendationGenerator = require("./recommendation/recommendationGenerator");

const recommendationService = require("../recommendation/recommendation.service");

class JourneyOptimizerService {

    async optimize({

        journey,
        route,
        chart,
        vacancies

    }) {

        // Step 1
        const analyzedData = dataAnalyzer.analyze({

            journey,
            route,
            chart,
            vacancies

        });

        // Step 2
        const graph =
            reservationGraphBuilder.build(analyzedData);

        // Step 3
        const strategies =
            reservationStrategyEngine.execute(

                graph,
                analyzedData.journey

            );

        // Step 4
        const rankedStrategies =
            strategyRanker.rank(strategies);

        // Step 5
        const recommendations =
            recommendationGenerator.generate(
                rankedStrategies
            );

        // Step 6
        await recommendationService.saveRecommendations(

            journey._id,

            recommendations

        );

        return recommendations;

    }

}

module.exports = new JourneyOptimizerService();