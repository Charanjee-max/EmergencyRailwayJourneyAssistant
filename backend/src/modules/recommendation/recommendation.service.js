const Recommendation =
    require("./recommendation.model");

const Journey =
    require("../journey/journey.model");

const recommendationFormatter =
    require(
        "./formatter/recommendationFormatter"
    );

// =========================================================
// RECOMMENDATION SERVICE
// =========================================================

class RecommendationService {

    // =====================================================
    // SAVE RECOMMENDATIONS
    // =====================================================

    async saveRecommendations(
        journeyId,
        recommendations = []
    ) {

        // -------------------------------------------------
        // Remove old recommendations
        // -------------------------------------------------

        await Recommendation.deleteMany({

            journey:
                journeyId,
        });

        // -------------------------------------------------
        // Nothing to save
        // -------------------------------------------------

        if (
            !Array.isArray(
                recommendations
            ) ||
            recommendations.length === 0
        ) {

            return [];
        }

        // -------------------------------------------------
        // Prepare MongoDB documents
        // -------------------------------------------------

        const documents =
            recommendations.map(
                (rec) => ({

                    journey:
                        journeyId,

                    strategy:
                        rec.strategy,

                    score:
                        rec.score,

                    reason:
                        rec.reason || "",

                    tickets:
                        Array.isArray(
                            rec.tickets
                        )
                            ? rec.tickets
                            : [],

                    vacancySummary:
                        Array.isArray(
                            rec.vacancySummary
                        )
                            ? rec.vacancySummary
                            : [],
                })
            );

        // -------------------------------------------------
        // Save
        // -------------------------------------------------

        return await Recommendation
            .insertMany(
                documents
            );
    }

    // =====================================================
    // GET RECOMMENDATIONS
    // =====================================================

    async getRecommendations(
        journeyId,
        userId
    ) {

        // -------------------------------------------------
        // Verify ownership
        // -------------------------------------------------

        const journey =
            await Journey.findOne({

                _id:
                    journeyId,

                userId:
                    userId,
            });

        if (!journey) {

            const error =
                new Error(
                    "Journey not found or access denied."
                );

            error.statusCode =
                404;

            throw error;
        }

        // -------------------------------------------------
        // Get active recommendations
        // -------------------------------------------------

        const recommendations =
            await Recommendation.find({

                journey:
                    journeyId,

                status:
                    "ACTIVE",

            }).sort({

                score:
                    -1,
            });

        // -------------------------------------------------
        // Format
        // -------------------------------------------------

        return recommendationFormatter
            .format(
                recommendations
            );
    }
}

// =========================================================
// EXPORT
// =========================================================

module.exports =
    new RecommendationService();