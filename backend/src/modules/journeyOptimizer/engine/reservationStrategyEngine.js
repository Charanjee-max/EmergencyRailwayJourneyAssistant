const directStrategy = require("./directStrategy");
const splitSameClassStrategy = require("./splitSameClassStrategy");
const splitMixedClassStrategy = require("./splitMixedClassStrategy");
const waitChartStrategy = require("./waitChartStrategy");
const tteStrategy = require("./tteStrategy");

class ReservationStrategyEngine {

    execute(graph, journey) {

        const results = [];

        const strategies = [

            directStrategy,
            splitSameClassStrategy,
            splitMixedClassStrategy,
            waitChartStrategy,
            tteStrategy

        ];

        for (const strategy of strategies) {

            const result = strategy.execute(graph, journey);

            if (result) {
                results.push(result);
            }

        }

        return results;

    }

}

module.exports = new ReservationStrategyEngine();