class ScoreEngine {

    calculate({
        strategy,
        tickets = [],
        sameCoach = false,
        sameClass = false
    }) {

        let score = 100;

        // Base deduction for number of tickets
        score -= (tickets.length - 1) * 5;

        // Strategy bonuses
        switch (strategy) {

            case "DIRECT_SEAT":
                score += 5;
                break;

            case "SPLIT_SAME_CLASS":
                score += 2;
                break;

            case "SPLIT_MIXED_CLASS":
                score -= 5;
                break;

            case "MULTI_HOP":
                score -= 8;
                break;

            case "WAIT_FOR_CHART":
                score = 80;
                break;

            case "TTE":
                score = 60;
                break;

        }

        // Bonus for same coach
        if (sameCoach)
            score += 3;

        // Bonus for same class
        if (sameClass)
            score += 2;

        // Clamp score
        score = Math.max(0, Math.min(score, 100));

        return score;
    }

}

module.exports = new ScoreEngine();