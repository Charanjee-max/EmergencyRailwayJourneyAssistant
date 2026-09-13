const Recommendation =
    require("./recommendation.model");

const Journey =
    require("../journey/journey.model");

const recommendationFormatter =
    require("./formatter/recommendationFormatter");

// =========================================================
// RECOMMENDATION SERVICE
// =========================================================

class RecommendationService {

    // =====================================================
    // NORMALIZE BERTH
    // =====================================================

    normalizeBerth(berth) {

        // Already a simple string/number
        if (
            typeof berth === "string" ||
            typeof berth === "number"
        ) {
            return String(berth);
        }

        // No berth information
        if (!berth || typeof berth !== "object") {
            return null;
        }

        // IRCTC berth object
        if (berth.berthNumber !== undefined &&
            berth.berthNumber !== null) {

            return String(berth.berthNumber);
        }

        // Alternative possible field names
        if (berth.number !== undefined &&
            berth.number !== null) {

            return String(berth.number);
        }

        if (berth.berth !== undefined &&
            berth.berth !== null) {

            return String(berth.berth);
        }

        return null;
    }


    // =====================================================
    // NORMALIZE TICKET
    // =====================================================

    normalizeTicket(ticket = {}) {

        if (!ticket || typeof ticket !== "object") {
            return null;
        }

        return {

            from:
                ticket.from
                    ? String(ticket.from).trim().toUpperCase()
                    : "",

            to:
                ticket.to
                    ? String(ticket.to).trim().toUpperCase()
                    : "",

            class:
                ticket.class
                    ? String(ticket.class).trim().toUpperCase()
                    : "",

            coach:
                ticket.coach
                    ? String(ticket.coach).trim().toUpperCase()
                    : null,

            berth:
                this.normalizeBerth(ticket.berth),

        };
    }


    // =====================================================
    // NORMALIZE REASON
    // =====================================================

    normalizeReason(reason, tickets = []) {

        let normalizedReason =
            typeof reason === "string"
                ? reason
                : "";

        // -------------------------------------------------
        // Fix accidental "[object Object]"
        // -------------------------------------------------

        if (
            normalizedReason.includes("[object Object]") &&
            Array.isArray(tickets) &&
            tickets.length > 0
        ) {

            const firstTicket =
                tickets[0];

            const coach =
                firstTicket.coach || "";

            const berth =
                this.normalizeBerth(
                    firstTicket.berth
                );

            const replacement =
                berth
                    ? `${coach}/${berth}`
                    : coach;

            normalizedReason =
                normalizedReason.replace(
                    /[A-Za-z0-9]+\/\[object Object\]/g,
                    replacement
                );

            // Fallback in case the pattern was different
            normalizedReason =
                normalizedReason.replace(
                    /\[object Object\]/g,
                    berth || ""
                );
        }

        return normalizedReason.trim();
    }


    // =====================================================
    // NORMALIZE VACANCY SUMMARY
    // =====================================================

    normalizeVacancySummary(
        vacancySummary = []
    ) {

        if (
            !Array.isArray(
                vacancySummary
            )
        ) {
            return [];
        }

        return vacancySummary.map(
            (summary) => ({

                class:
                    summary.class
                        ? String(summary.class)
                            .trim()
                            .toUpperCase()
                        : "",

                count:
                    Number.isFinite(
                        Number(summary.count)
                    )
                        ? Number(summary.count)
                        : 0,

                status:
                    summary.status === "ERROR"
                        ? "ERROR"
                        : "AVAILABLE",

                error:
                    summary.error
                        ? String(summary.error)
                        : "",

            })
        );
    }


    // =====================================================
    // NORMALIZE RECOMMENDATION
    // =====================================================

    normalizeRecommendation(
        rec = {},
        journeyId
    ) {

        const tickets =
            Array.isArray(rec.tickets)
                ? rec.tickets
                    .map(
                        (ticket) =>
                            this.normalizeTicket(
                                ticket
                            )
                    )
                    .filter(Boolean)
                : [];

        return {

            journey:
                journeyId,

            strategy:
                rec.strategy
                    ? String(rec.strategy).trim()
                    : "UNKNOWN",

            score:
                Number.isFinite(
                    Number(rec.score)
                )
                    ? Number(rec.score)
                    : 0,

            reason:
                this.normalizeReason(
                    rec.reason,
                    tickets
                ),

            tickets,

            vacancySummary:
                this.normalizeVacancySummary(
                    rec.vacancySummary
                ),

        };
    }


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
            recommendations
                .map(
                    (rec) =>
                        this.normalizeRecommendation(
                            rec,
                            journeyId
                        )
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