const recommendationService = require("./recommendation.service");

class RecommendationController {

    async getRecommendations(req, res) {

        try {

            const { journeyId } = req.params;

            const recommendations =
                await recommendationService.getRecommendations(journeyId);

            return res.status(200).json({

                success: true,

                count: recommendations.length,

                data: recommendations

            });

        } catch (error) {

            return res.status(500).json({

                success: false,

                message: error.message

            });

        }

    }

}

module.exports = new RecommendationController();