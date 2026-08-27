const directStrategy = require("./directStrategy");
const splitSameClassStrategy = require("./splitSameClassStrategy");
const splitMixedClassStrategy = require("./splitMixedClassStrategy");
const waitChartStrategy = require("./waitChartStrategy");
const tteStrategy = require("./tteStrategy");

class ReservationStrategyEngine {

    execute(graph, journey) {

        const strategies = [

            directStrategy,
            splitSameClassStrategy,
            splitMixedClassStrategy,
            waitChartStrategy,
            tteStrategy

        ];

        let results = [];

        strategies.forEach(strategy => {

            const strategyResults = strategy.execute(graph, journey);

            if (Array.isArray(strategyResults)) {

                results.push(...strategyResults);

            }

        });

        return results;

    }

}

module.exports = new ReservationStrategyEngine();