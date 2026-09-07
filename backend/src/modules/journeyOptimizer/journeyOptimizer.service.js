const dataAnalyzer =
    require("./analyzer/dataAnalyzer");

const reservationGraphBuilder =
    require("./engine/graph/reservationGraphBuilder");

const reservationStrategyEngine =
    require("./engine/reservationStrategyEngine");

const strategyRanker =
    require("./ranker/strategyRanker");

const recommendationGenerator =
    require("./recommendation/recommendationGenerator");

const recommendationService =
    require("../recommendation/recommendation.service");

// =========================================================
// JOURNEY OPTIMIZER SERVICE
// =========================================================

class JourneyOptimizerService {

    async optimize({

        journey,

        route,

        chart,

        vacancies,

        vacancySummary = [],

    }) {

        // =====================================================
        // STEP 1 - ANALYZE DATA
        // =====================================================

        const analyzedData =
            dataAnalyzer.analyze({

                journey,

                route,

                chart,

                vacancies,
            });

        console.log(
            "\n================ ANALYZED DATA ================"
        );

        console.dir(
            analyzedData,
            {
                depth: null,
            }
        );

        // =====================================================
        // STEP 2 - BUILD GRAPH
        // =====================================================

        const graph =
            reservationGraphBuilder.build(
                analyzedData
            );

        console.log(
            "\n================ GRAPH ================"
        );

        console.dir(
            graph,
            {
                depth: null,
            }
        );

        // =====================================================
        // STEP 3 - STRATEGIES
        // =====================================================

        const strategies =
            reservationStrategyEngine.execute(
                graph,
                analyzedData.journey
            );

        console.log(
            "\n================ STRATEGIES ================"
        );

        console.dir(
            strategies,
            {
                depth: null,
            }
        );

        // =====================================================
        // STEP 4 - RANK
        // =====================================================

        const rankedStrategies =
            strategyRanker.rank(
                strategies
            );

        console.log(
            "\n================ RANKED STRATEGIES ================"
        );

        console.dir(
            rankedStrategies,
            {
                depth: null,
            }
        );

        // =====================================================
        // STEP 5 - GENERATE RECOMMENDATIONS
        // =====================================================

        const recommendations =
            recommendationGenerator.generate(
                rankedStrategies,
                {
                    vacancySummary,
                }
            );

        console.log(
            "\n================ RECOMMENDATIONS ================"
        );

        console.dir(
            recommendations,
            {
                depth: null,
            }
        );

        // =====================================================
        // STEP 6 - SAVE
        // =====================================================

        await recommendationService
            .saveRecommendations(
                journey._id,
                recommendations
            );

        console.log(
            "✅ Recommendations Saved"
        );

        return recommendations;
    }
}

// =========================================================
// EXPORT
// =========================================================

module.exports =
    new JourneyOptimizerService();