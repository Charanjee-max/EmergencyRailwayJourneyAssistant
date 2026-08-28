class TteStrategy {

    execute(graph, journey) {

        const solutions = [];

        if (!graph.chartPrepared) {
            return solutions;
        }

        if (graph.edges.length > 0) {
            return solutions;
        }

        console.log("\n🟢 TTE STRATEGY");

        solutions.push({

            success: true,

            strategy: "TTE_RECOMMENDATION",

            score: 60,

            tickets: [],

            reason:
                "No online reservation found. After chart preparation, you may board with a valid ticket and request the TTE for any vacant berth."

        });

        return solutions;

    }

}

module.exports = new TteStrategy();