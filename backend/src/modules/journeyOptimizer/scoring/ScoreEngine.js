class ScoreEngine {

    calculate({
        strategy,
        tickets = [],
        sameCoach = false,
        sameClass = false
    }) {

        let score;

        switch (strategy) {

            case "DIRECT_SEAT":
                score = 100;
                break;

            case "SPLIT_SAME_CLASS":
                score = 92;
                break;

            case "SPLIT_MIXED_CLASS":
                score = 84;
                break;

            case "MULTI_HOP":
                score = 75;
                break;

            case "WAIT_FOR_CHART":
                score = 65;
                break;

            case "TTE_RECOMMENDATION":
            case "TTE":
                score = 55;
                break;

            default:
                score = 50;
        }

        // Same coach is preferable for split reservations.
        if (
            sameCoach &&
            strategy !== "DIRECT_SEAT"
        ) {
            score += 3;
        }

        // Same class is preferable to mixed class.
        if (
            sameClass &&
            strategy === "SPLIT_SAME_CLASS"
        ) {
            score += 2;
        }

        // More tickets means more booking complexity.
        if (
            tickets.length > 2 &&
            strategy === "MULTI_HOP"
        ) {
            score -= (tickets.length - 2) * 2;
        }

        return Math.max(0, Math.min(score, 100));
    }
}

module.exports = new ScoreEngine();