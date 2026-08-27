const Recommendation = require("./recommendation.model");
const recommendationFormatter = require("./formatter/recommendationFormatter");

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

        const recommendations = await Recommendation.find({

            journey: journeyId,

            status: "ACTIVE"

        }).sort({

            score: -1

        });

        return recommendationFormatter.format(recommendations);

    }

}

module.exports = new RecommendationService();