const directSeatStrategy = require("./strategies/DirectSeatStrategy");
const splitSameClassStrategy = require("./strategies/SplitSameClassStrategy");
const splitMixedClassStrategy = require("./strategies/SplitMixedClassStrategy");
const waitChartStrategy = require("./strategies/WaitChartStrategy");
const tteStrategy = require("./strategies/TteStrategy");
const multiHopStrategy = require("./strategies/MultiHopStrategy");

class ReservationStrategyEngine {

    execute(graph, journey) {

        let strategies = [];

        console.log("Calling DirectSeatStrategy");
        strategies.push(
            ...directSeatStrategy.execute(graph, journey)
        );

        console.log("Calling SplitSameClassStrategy");
        strategies.push(
            ...splitSameClassStrategy.execute(graph, journey)
        );

        console.log("Calling SplitMixedClassStrategy");
        strategies.push(
            ...splitMixedClassStrategy.execute(graph, journey)
        );

        console.log("Calling MultiHopStrategy");
        strategies.push(
            ...multiHopStrategy.execute(graph, journey)
        );

        console.log("Calling WaitChartStrategy");
        strategies.push(
            ...waitChartStrategy.execute(graph, journey)
        );

        console.log("Calling TteStrategy");
        strategies.push(
            ...tteStrategy.execute(graph, journey)
        );

        return strategies;
    }

}

module.exports = new ReservationStrategyEngine();