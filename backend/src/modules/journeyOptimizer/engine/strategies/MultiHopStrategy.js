const scoreEngine = require("../../scoring/ScoreEngine");

class MultiHopStrategy {

    execute(graph, journey) {

        console.log("\n========== MULTI HOP STRATEGY ==========");
        console.log("Source:", journey.source);
        console.log("Destination:", journey.destination);
        console.log("Preferred Classes:", journey.preferredClasses);

        const solutions = [];

        this.findPaths(
            graph,
            journey.source,
            journey.destination,
            [],
            new Set(),
            solutions,
            journey.preferredClasses || []
        );

        console.log(
            "\nTOTAL MULTI HOP SOLUTIONS:",
            solutions.length
        );

        return solutions;
    }

    findPaths(
        graph,
        current,
        destination,
        path,
        visited,
        solutions,
        preferredClasses
    ) {

        // Prevent circular routes.
        if (visited.has(current)) {
            return;
        }

        visited.add(current);

        // Destination reached.
        if (current === destination) {

            // Direct and two-ticket journeys are handled
            // by DirectSeatStrategy / SplitSameClassStrategy /
            // SplitMixedClassStrategy.
            if (path.length <= 2) {
                visited.delete(current);
                return;
            }

            console.log("✅ Multi-hop path found");
            console.dir(path, { depth: null });

            const classes = [
                ...new Set(path.map(ticket => ticket.class))
            ];

            const sameClass = classes.length === 1;

            const sameCoach =
                path.length > 1 &&
                path.every(ticket => ticket.coach === path[0].coach);

            solutions.push({
                success: true,

                strategy: "MULTI_HOP",

                score: scoreEngine.calculate({
                    strategy: "MULTI_HOP",
                    tickets: path,
                    sameCoach,
                    sameClass
                }),

                tickets: [...path],

                reason:
                    sameClass
                        ? `Journey completed using ${path.length} split tickets in ${classes[0]}.`
                        : `Journey completed using ${path.length} split tickets across multiple classes.`
            });

            visited.delete(current);
            return;
        }

        // Only use the user's preferred classes.
        const outgoing = graph.edges.filter(edge =>
            edge.from === current &&
            preferredClasses.includes(edge.class)
        );

        outgoing.forEach(edge => {

            if (!edge.opportunities) {
                return;
            }

            edge.opportunities.forEach(opportunity => {

                if (!opportunity.berths) {
                    return;
                }

                opportunity.berths.forEach(berth => {

                    path.push({
                        from: edge.from,
                        to: edge.to,
                        class: edge.class,
                        coach: opportunity.coach,
                        berth
                    });

                    this.findPaths(
                        graph,
                        edge.to,
                        destination,
                        path,
                        visited,
                        solutions,
                        preferredClasses
                    );

                    path.pop();
                });

            });

        });

        visited.delete(current);
    }
}

module.exports = new MultiHopStrategy();