const {
    configure,
    checkPNRStatus,
} = require("railkit");

const PNR =
    require("./pnr.model");

const Journey =
    require("../journey/journey.model");


// =========================================================
// RAILKIT CONFIGURATION
// =========================================================

let railKitConfigured = false;


const configureRailKit = () => {

    if (railKitConfigured) {
        return;
    }


    const apiKey =
        process.env.RAILKIT_API_KEY;


    if (!apiKey) {

        const error =
            new Error(
                "RAILKIT_API_KEY is not configured."
            );

        error.statusCode = 500;

        throw error;
    }


    configure(apiKey);

    railKitConfigured = true;
};


// =========================================================
// PNR NORMALIZATION
// =========================================================

const normalizePNR = (pnr) => {

    if (
        typeof pnr !== "string" &&
        typeof pnr !== "number"
    ) {
        return "";
    }

    return String(pnr).trim();
};


// =========================================================
// CHECK PNR
// =========================================================

const checkPNRService = async (
    pnr,
    userId,
    journeyId = null
) => {

    // -------------------------------------------------------
    // USER VALIDATION
    // -------------------------------------------------------

    if (!userId) {

        const error =
            new Error(
                "User authentication is required."
            );

        error.statusCode = 401;

        throw error;
    }


    // -------------------------------------------------------
    // NORMALIZE PNR
    // -------------------------------------------------------

    const normalizedPNR =
        normalizePNR(pnr);


    // -------------------------------------------------------
    // PNR VALIDATION
    // -------------------------------------------------------

    if (!/^\d{10}$/.test(normalizedPNR)) {

        const error =
            new Error(
                "PNR must contain exactly 10 digits."
            );

        error.statusCode = 400;

        throw error;
    }


    // =======================================================
    // VALIDATE LINKED JOURNEY BEFORE RAILKIT
    // =======================================================

    let linkedJourney = null;

    let linkedJourneyId = null;


    if (journeyId) {

        linkedJourney =
            await Journey.findOne({
                _id: journeyId,
                userId,
            })
                .select(
                    "_id trainNumber journeyDate boardingStation destinationStation"
                )
                .lean();


        if (!linkedJourney) {

            const error =
                new Error(
                    "Journey not found or access denied."
                );

            error.statusCode = 404;

            throw error;
        }


        linkedJourneyId =
            linkedJourney._id;
    }


    // =======================================================
    // CONFIGURE RAILKIT
    // =======================================================

    configureRailKit();


    // =======================================================
    // CALL RAILKIT
    // =======================================================

    let result;


    try {

        result =
            await checkPNRStatus(
                normalizedPNR
            );

    } catch (error) {

        console.error(
            "❌ RAILKIT PNR ERROR:",
            error.message
        );


        const serviceError =
            new Error(
                error.message ||
                "Unable to fetch PNR status from RailKit."
            );


        // Preserve known HTTP status.
        if (error.statusCode) {

            serviceError.statusCode =
                error.statusCode;

        } else {

            const message =
                String(
                    error.message || ""
                ).toLowerCase();


            // RailKit quota / billing protection.
            if (
                message.includes(
                    "usage limit"
                ) ||
                message.includes(
                    "quota"
                ) ||
                message.includes(
                    "billing cycle"
                )
            ) {

                serviceError.statusCode = 429;

            } else {

                serviceError.statusCode = 502;
            }
        }


        throw serviceError;
    }


    // =======================================================
    // VALIDATE RAILKIT RESPONSE
    // =======================================================

    if (
        !result ||
        result.success !== true ||
        !result.data
    ) {

        const error =
            new Error(
                result?.error ||
                "No PNR data found or invalid PNR number."
            );

        error.statusCode = 404;

        throw error;
    }


    const data =
        result.data;


    // =======================================================
    // VERIFY PNR AGAINST LINKED JOURNEY
    // =======================================================

    if (linkedJourney) {

        const pnrTrain =
            String(
                data.train?.number || ""
            ).trim();


        const journeyTrain =
            String(
                linkedJourney.trainNumber || ""
            ).trim();


        if (
            pnrTrain &&
            journeyTrain &&
            pnrTrain !== journeyTrain
        ) {

            const error =
                new Error(
                    "PNR train does not match the selected journey."
                );

            error.statusCode = 400;

            throw error;
        }
    }


    // =======================================================
    // PREPARE PNR DOCUMENT
    // =======================================================

    const pnrDocument = {

        // ---------------------------------------------------
        // OWNERSHIP
        // ---------------------------------------------------

        userId,

        journeyId:
            linkedJourneyId,


        // ---------------------------------------------------
        // PNR
        // ---------------------------------------------------

        pnr:
            normalizedPNR,


        // ---------------------------------------------------
        // TRAIN
        // ---------------------------------------------------

        train: {

            number:
                String(
                    data.train?.number || ""
                ).trim(),

            name:
                String(
                    data.train?.name || ""
                ).trim(),
        },


        // ---------------------------------------------------
        // JOURNEY
        // ---------------------------------------------------

        journey: {

            dateOfJourney:
                String(
                    data.journey?.dateOfJourney || ""
                ).trim(),


            class:
                String(
                    data.journey?.class || ""
                )
                    .trim()
                    .toUpperCase(),


            quota:
                String(
                    data.journey?.quota || ""
                )
                    .trim()
                    .toUpperCase(),


            // -----------------------------------------------
            // SOURCE
            // -----------------------------------------------

            source: {

                code:
                    String(
                        data.journey?.source?.code || ""
                    )
                        .trim()
                        .toUpperCase(),

                name:
                    String(
                        data.journey?.source?.name || ""
                    ).trim(),
            },


            // -----------------------------------------------
            // DESTINATION
            // -----------------------------------------------

            destination: {

                code:
                    String(
                        data.journey?.destination?.code || ""
                    )
                        .trim()
                        .toUpperCase(),

                name:
                    String(
                        data.journey?.destination?.name || ""
                    ).trim(),
            },


            // -----------------------------------------------
            // BOARDING POINT
            // -----------------------------------------------

            boardingPoint: {

                code:
                    String(
                        data.journey?.boardingPoint?.code || ""
                    )
                        .trim()
                        .toUpperCase(),

                name:
                    String(
                        data.journey?.boardingPoint?.name || ""
                    ).trim(),
            },


            // -----------------------------------------------
            // DISTANCE
            // -----------------------------------------------

            distance:
                data.journey?.distance !== undefined &&
                data.journey?.distance !== null &&
                Number.isFinite(
                    Number(data.journey.distance)
                )
                    ? Number(
                        data.journey.distance
                    )
                    : null,


            // -----------------------------------------------
            // ARRIVAL DATE
            // -----------------------------------------------

            arrivalDate:
                String(
                    data.journey?.arrivalDate || ""
                ).trim(),
        },


        // ---------------------------------------------------
        // CHART
        // ---------------------------------------------------

        chart: {

            status:
                String(
                    data.chart?.status || ""
                ).trim(),
        },


        // ---------------------------------------------------
        // BOOKING
        // ---------------------------------------------------

        booking: {

            fare:
                data.booking?.fare !== undefined &&
                data.booking?.fare !== null &&
                Number.isFinite(
                    Number(data.booking.fare)
                )
                    ? Number(
                        data.booking.fare
                    )
                    : null,


            ticketFare:
                data.booking?.ticketFare !== undefined &&
                data.booking?.ticketFare !== null &&
                Number.isFinite(
                    Number(data.booking.ticketFare)
                )
                    ? Number(
                        data.booking.ticketFare
                    )
                    : null,


            bookingDate:
                String(
                    data.booking?.bookingDate || ""
                ).trim(),
        },


        // ---------------------------------------------------
        // PASSENGERS
        // ---------------------------------------------------

        passengers:
            Array.isArray(data.passengers)

                ? data.passengers
                    .slice(0, 50)
                    .map(
                        (passenger) => ({

                            serialNumber:
                                String(
                                    passenger?.serialNumber || ""
                                ).trim(),


                            coachPosition:
                                passenger?.coachPosition !== undefined &&
                                passenger?.coachPosition !== null &&
                                Number.isFinite(
                                    Number(
                                        passenger.coachPosition
                                    )
                                )
                                    ? Number(
                                        passenger.coachPosition
                                    )
                                    : null,


                            booking: {

                                status:
                                    String(
                                        passenger?.booking?.status || ""
                                    ).trim(),

                                coach:
                                    String(
                                        passenger?.booking?.coach || ""
                                    )
                                        .trim()
                                        .toUpperCase(),

                                berthNo:
                                    passenger?.booking?.berthNo !== undefined &&
                                    passenger?.booking?.berthNo !== null &&
                                    Number.isFinite(
                                        Number(
                                            passenger.booking.berthNo
                                        )
                                    )
                                        ? Number(
                                            passenger.booking.berthNo
                                        )
                                        : null,

                                berthCode:
                                    String(
                                        passenger?.booking?.berthCode || ""
                                    )
                                        .trim()
                                        .toUpperCase(),

                                details:
                                    String(
                                        passenger?.booking?.details || ""
                                    ).trim(),
                            },


                            current: {

                                status:
                                    String(
                                        passenger?.current?.status || ""
                                    ).trim(),

                                coach:
                                    String(
                                        passenger?.current?.coach || ""
                                    )
                                        .trim()
                                        .toUpperCase(),

                                berthNo:
                                    passenger?.current?.berthNo !== undefined &&
                                    passenger?.current?.berthNo !== null &&
                                    Number.isFinite(
                                        Number(
                                            passenger.current.berthNo
                                        )
                                    )
                                        ? Number(
                                            passenger.current.berthNo
                                        )
                                        : null,

                                berthCode:
                                    String(
                                        passenger?.current?.berthCode || ""
                                    )
                                        .trim()
                                        .toUpperCase(),

                                details:
                                    String(
                                        passenger?.current?.details || ""
                                    ).trim(),
                            },
                        })
                    )

                : [],


        // ---------------------------------------------------
        // LAST CHECKED
        // ---------------------------------------------------

        lastCheckedAt:
            new Date(),
    };


    // =======================================================
    // SAVE / UPDATE PNR
    // =======================================================

    try {

        return await PNR.findOneAndUpdate(
            {
                userId,
                pnr: normalizedPNR,
            },

            {
                $set:
                    pnrDocument,
            },

            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true,
                runValidators: true,
            }
        ).lean();

    } catch (error) {

        // Duplicate PNR race condition.
        if (
            error &&
            error.code === 11000
        ) {

            const existingPNR =
                await PNR.findOne({
                    userId,
                    pnr: normalizedPNR,
                }).lean();

            if (existingPNR) {
                return existingPNR;
            }
        }


        throw error;
    }
};


// =========================================================
// GET ALL USER PNRs
// =========================================================

const getAllPNRsService = async (
    userId
) => {

    if (!userId) {

        const error =
            new Error(
                "User authentication is required."
            );

        error.statusCode = 401;

        throw error;
    }


    return await PNR.find({
        userId,
    })
        .sort({
            updatedAt: -1,
        })
        .lean();
};


// =========================================================
// GET SINGLE PNR
// =========================================================

const getPNRByIdService = async (
    pnrId,
    userId
) => {

    if (!userId) {

        const error =
            new Error(
                "User authentication is required."
            );

        error.statusCode = 401;

        throw error;
    }


    const pnr =
        await PNR.findOne({
            _id: pnrId,
            userId,
        }).lean();


    if (!pnr) {

        const error =
            new Error(
                "PNR not found."
            );

        error.statusCode = 404;

        throw error;
    }


    return pnr;
};


// =========================================================
// DELETE PNR
// =========================================================

const deletePNRService = async (
    pnrId,
    userId
) => {

    if (!userId) {

        const error =
            new Error(
                "User authentication is required."
            );

        error.statusCode = 401;

        throw error;
    }


    const pnr =
        await PNR.findOneAndDelete({
            _id: pnrId,
            userId,
        }).lean();


    if (!pnr) {

        const error =
            new Error(
                "PNR not found."
            );

        error.statusCode = 404;

        throw error;
    }


    return pnr;
};


// =========================================================
// EXPORT
// =========================================================

module.exports = {

    checkPNRService,

    getAllPNRsService,

    getPNRByIdService,

    deletePNRService,
};