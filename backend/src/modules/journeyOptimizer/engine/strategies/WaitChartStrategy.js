class WaitChartStrategy {

    execute(graph, journey) {

        const solutions = [];

        if (graph.chartPrepared) {
            return solutions;
        }

        console.log("\n🟡 WAIT CHART STRATEGY");

        solutions.push({

            success: true,

            strategy: "WAIT_FOR_CHART",

            score: 80,

            tickets: [],

            reason:
                "Chart is not prepared yet. Wait until chart preparation. Additional seats may become available."

        });

        return solutions;

    }

}

module.exports = new WaitChartStrategy();