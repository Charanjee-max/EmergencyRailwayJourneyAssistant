class StrategyRanker {

    rank(strategies = []) {

        if (!Array.isArray(strategies) || strategies.length === 0) {
            return [];
        }

        // Strategy priority is used when scores are equal.
        const priority = {
            DIRECT_SEAT: 1,
            SPLIT_SAME_CLASS: 2,
            SPLIT_MIXED_CLASS: 3,
            MULTI_HOP: 4,
            WAIT_FOR_CHART: 5,
            TTE_RECOMMENDATION: 6,
            TTE: 6
        };

        // Remove exact duplicate ticket combinations.
        const uniqueStrategies = [];
        const seen = new Set();

        for (const strategy of strategies) {

            if (!strategy || strategy.success === false) {
                continue;
            }

            const tickets = Array.isArray(strategy.tickets)
                ? strategy.tickets
                : [];

            const key = JSON.stringify({
                strategy: strategy.strategy,
                tickets
            });

            if (!seen.has(key)) {
                seen.add(key);
                uniqueStrategies.push(strategy);
            }
        }

        // Highest score first.
        // If scores are equal, use strategy priority.
        // If still equal, prefer fewer tickets.
        uniqueStrategies.sort((a, b) => {

            const scoreDifference =
                (b.score || 0) - (a.score || 0);

            if (scoreDifference !== 0) {
                return scoreDifference;
            }

            const priorityDifference =
                (priority[a.strategy] || 99) -
                (priority[b.strategy] || 99);

            if (priorityDifference !== 0) {
                return priorityDifference;
            }

            const aTickets =
                Array.isArray(a.tickets)
                    ? a.tickets.length
                    : 0;

            const bTickets =
                Array.isArray(b.tickets)
                    ? b.tickets.length
                    : 0;

            return aTickets - bTickets;
        });

        // Keep the best five recommendations.
        return uniqueStrategies.slice(0, 5);
    }
}

module.exports = new StrategyRanker();