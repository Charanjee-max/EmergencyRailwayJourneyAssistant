const Recommendation = require("./recommendation.model");

class RecommendationService {

    async saveRecommendations(journeyId, recommendations = []) {

        // Remove previous recommendations
        await Recommendation.deleteMany({
            journey: journeyId
        });

        if (!recommendations.length) {
            return [];
        }

        const documents = recommendations.map(rec => ({

            journey: journeyId,

            strategy: rec.strategy,

            score: rec.score,

            reason: rec.reason,

            tickets: rec.tickets

        }));

        return await Recommendation.insertMany(documents);

    }

    async getRecommendations(journeyId) {

        return await Recommendation.find({

            journey: journeyId,

            status: "ACTIVE"

        }).sort({

            score: -1

        });

    }

}

module.exports = new RecommendationService();