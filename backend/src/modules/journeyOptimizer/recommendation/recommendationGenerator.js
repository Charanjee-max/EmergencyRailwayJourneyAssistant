class RecommendationGenerator {

    generate(strategies = []) {

        return strategies.map((strategy, index) => ({

            rank: index + 1,

            strategy: strategy.strategy,

            score: strategy.score,

            tickets: strategy.tickets,

            reason: strategy.reason

        }));

    }

}

module.exports = new RecommendationGenerator();