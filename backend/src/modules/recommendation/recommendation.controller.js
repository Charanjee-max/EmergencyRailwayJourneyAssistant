const recommendationService = require("./recommendation.service");

class RecommendationController {

    async getRecommendations(req, res) {

        try {

            const { journeyId } = req.params;

            // User is provided by authentication middleware
            const userId = req.user.id;

            const recommendations =
                await recommendationService.getRecommendations(
                    journeyId,
                    userId
                );

            return res.status(200).json({

                success: true,

                count: recommendations.length,

                data: recommendations

            });

        } catch (error) {

            console.error(
                "Get Recommendations Error:",
                error
            );

            return res.status(
                error.statusCode || 500
            ).json({

                success: false,

                message:
                    error.message ||
                    "Failed to get recommendations"

            });
        }

    }

}

module.exports = new RecommendationController();