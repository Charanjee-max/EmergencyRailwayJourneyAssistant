class StrategyRanker {

    rank(strategies = []) {

        if (!strategies.length) {
            return [];
        }

        // Remove duplicate strategies
        const uniqueStrategies = [];

        const seen = new Set();

        strategies.forEach(strategy => {

            const key = JSON.stringify(strategy.tickets);

            if (!seen.has(key)) {

                seen.add(key);

                uniqueStrategies.push(strategy);

            }

        });

        // Highest score first
        uniqueStrategies.sort((a, b) => b.score - a.score);

        // Return Top 5
        return uniqueStrategies.slice(0, 5);

    }

}

module.exports = new StrategyRanker();