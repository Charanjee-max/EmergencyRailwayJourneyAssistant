const Recommendation = require("./recommendation.model");
const Journey = require("../journey/journey.model");

const recommendationFormatter = require(
  "./formatter/recommendationFormatter"
);


class RecommendationService {


  // =========================================
  // SAVE RECOMMENDATIONS
  // =========================================

  async saveRecommendations(
    journeyId,
    recommendations = []
  ) {

    // Remove previous recommendations
    await Recommendation.deleteMany({
      journey: journeyId,
    });


    // Nothing to save
    if (!recommendations.length) {
      return [];
    }


    // Prepare documents
    const documents =
      recommendations.map((rec) => ({

        journey: journeyId,

        strategy: rec.strategy,

        score: rec.score,

        reason: rec.reason,

        tickets: rec.tickets,

      }));


    // Save recommendations
    return await Recommendation.insertMany(
      documents
    );
  }



  // =========================================
  // GET RECOMMENDATIONS
  // =========================================

  async getRecommendations(
    journeyId,
    userId
  ) {


    // ========================================
    // Verify Journey Ownership
    // ========================================

    const journey =
      await Journey.findOne({

        _id: journeyId,

        userId: userId,

      });


    if (!journey) {

      const error = new Error(
        "Journey not found or access denied."
      );

      error.statusCode = 404;

      throw error;
    }



    // ========================================
    // Get Active Recommendations
    // ========================================

    const recommendations =
      await Recommendation.find({

        journey: journeyId,

        status: "ACTIVE",

      }).sort({

        score: -1,

      });



    // ========================================
    // Format Response
    // ========================================

    return recommendationFormatter.format(
      recommendations
    );
  }
}


// =========================================
// Export
// =========================================

module.exports =
  new RecommendationService();