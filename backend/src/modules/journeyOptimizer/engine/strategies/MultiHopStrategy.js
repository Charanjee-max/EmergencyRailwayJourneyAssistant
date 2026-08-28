class MultiHopStrategy {

    execute(graph, journey) {

        console.log("\n========== MULTI HOP STRATEGY ==========");
        console.log("Source:", journey.source);
        console.log("Destination:", journey.destination);

        const solutions = [];

        this.findPaths(
            graph,
            journey.source,
            journey.destination,
            [],
            new Set(),
            solutions
        );

        console.log("\nTOTAL MULTI HOP SOLUTIONS:", solutions.length);

        return solutions;
    }

    findPaths(graph, current, destination, path, visited, solutions) {

        // Stop infinite loops
        if (visited.has(current)) {
            return;
        }

        visited.add(current);

        // Destination reached
        if (current === destination) {
            // Skip 2-ticket journeys.
// They are already handled by SplitSameClassStrategy.
if (path.length <= 2) {
    visited.delete(current);
    return;
}

            console.log("✅ Path Found");
            console.dir(path, { depth: null });

            solutions.push({
                success: true,
                strategy: "MULTI_HOP",
                score: 85,
                tickets: [...path],
                reason: `Journey completed using ${path.length} split tickets.`
            });

            visited.delete(current);
            return;
        }

        // Outgoing edges
        const outgoing = graph.edges.filter(
            edge => edge.from === current
        );

        outgoing.forEach(edge => {

            edge.opportunities.forEach(coach => {

                coach.berths.forEach(berth => {

                    path.push({
                        from: edge.from,
                        to: edge.to,
                        class: edge.class,
                        coach: coach.coach,
                        berth
                    });

                    this.findPaths(
                        graph,
                        edge.to,
                        destination,
                        path,
                        visited,
                        solutions
                    );

                    path.pop();

                });

            });

        });

        visited.delete(current);
    }

}

module.exports = new MultiHopStrategy();