// =========================================================
// RECOMMENDATION GENERATOR
// =========================================================

class RecommendationGenerator {

    generate(
        strategies = [],
        metadata = {}
    ) {

        const vacancySummary =
            Array.isArray(
                metadata.vacancySummary
            )
                ? metadata.vacancySummary
                : [];

        return strategies.map(
            (strategy, index) => ({

                rank:
                    index + 1,

                strategy:
                    strategy.strategy,

                score:
                    strategy.score,

                tickets:
                    Array.isArray(
                        strategy.tickets
                    )
                        ? strategy.tickets
                        : [],

                reason:
                    strategy.reason || "",

                vacancySummary:
                    vacancySummary,
            })
        );
    }
}

// =========================================================
// EXPORT
// =========================================================

module.exports =
    new RecommendationGenerator();