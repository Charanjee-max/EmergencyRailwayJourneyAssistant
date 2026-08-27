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

        console.log("\n================ ANALYZED DATA ================");
        console.dir(analyzedData, { depth: null });

        // Step 2
        const graph = reservationGraphBuilder.build(analyzedData);

        console.log("\n================ GRAPH ================");
        console.dir(graph, { depth: null });

        // Step 3
        const strategies = reservationStrategyEngine.execute(

            graph,
            analyzedData.journey

        );

        console.log("\n================ STRATEGIES ================");
        console.dir(strategies, { depth: null });

        // Step 4
        const rankedStrategies = strategyRanker.rank(strategies);

        console.log("\n================ RANKED STRATEGIES ================");
        console.dir(rankedStrategies, { depth: null });

        // Step 5
        const recommendations = recommendationGenerator.generate(
            rankedStrategies
        );

        console.log("\n================ RECOMMENDATIONS ================");
        console.dir(recommendations, { depth: null });

        // Step 6
        await recommendationService.saveRecommendations(

            journey._id,

            recommendations

        );

        console.log("✅ Recommendations Saved");

        return recommendations;

    }

}

module.exports = new JourneyOptimizerService();