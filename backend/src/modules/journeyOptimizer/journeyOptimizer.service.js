const dataAnalyzer = require("./analyzer/dataAnalyzer");
const reservationGraphBuilder = require("./graph/reservationGraphBuilder");
const reservationStrategyEngine = require("./engine/reservationStrategyEngine");
const strategyRanker = require("./ranker/strategyRanker");
const recommendationGenerator = require("./recommendation/recommendationGenerator");

class JourneyOptimizerService {

    optimize({

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
        const graph = reservationGraphBuilder.build(analyzedData);

        // Step 3
        const strategies = reservationStrategyEngine.execute(

            graph,
            analyzedData.journey

        );

        // Step 4
        const rankedStrategies = strategyRanker.rank(strategies);

        // Step 5
        const recommendations =
            recommendationGenerator.generate(rankedStrategies);

        return {

            analyzedData,

            graph,

            strategies,

            rankedStrategies,

            recommendations

        };

    }

}

module.exports = new JourneyOptimizerService();