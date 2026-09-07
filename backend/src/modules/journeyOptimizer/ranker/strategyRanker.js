class StrategyRanker {

    rank(strategies = []) {

        if (
            !Array.isArray(strategies) ||
            strategies.length === 0
        ) {
            return [];
        }

        const priority = {

            DIRECT_SEAT: 1,

            SPLIT_SAME_CLASS: 2,

            SPLIT_MIXED_CLASS: 3,

            MULTI_HOP: 4,

            WAIT_FOR_CHART: 5,

            TTE_RECOMMENDATION: 6,

            TTE: 6

        };

        const bestByStrategy =
            new Map();

        for (
            const strategy
            of strategies
        ) {

            if (
                !strategy ||
                strategy.success === false
            ) {
                continue;
            }

            const strategyName =
                strategy.strategy ||
                "UNKNOWN";

            const existing =
                bestByStrategy.get(
                    strategyName
                );

            if (!existing) {

                bestByStrategy.set(
                    strategyName,
                    strategy
                );

                continue;
            }

            /*
             * Keep the highest scoring version
             * of the same strategy.
             */
            const newScore =
                Number(strategy.score || 0);

            const oldScore =
                Number(existing.score || 0);

            if (newScore > oldScore) {

                bestByStrategy.set(
                    strategyName,
                    strategy
                );
            }
        }

        const uniqueStrategies =
            Array.from(
                bestByStrategy.values()
            );

        uniqueStrategies.sort(
            (a, b) => {

                const scoreDifference =
                    Number(b.score || 0) -
                    Number(a.score || 0);

                if (scoreDifference !== 0) {
                    return scoreDifference;
                }

                return (
                    (priority[a.strategy] || 99) -
                    (priority[b.strategy] || 99)
                );
            }
        );

        /*
         * Maximum five DISTINCT strategies.
         */
        return uniqueStrategies.slice(0, 5);
    }
}

module.exports =
    new StrategyRanker();