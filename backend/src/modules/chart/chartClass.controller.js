"use strict";

const {
    getAvailableTrainClasses,
} = require("./chartClass.service");

const getTrainClasses = async (
    req,
    res
) => {

    try {

        const trainNumber =
            String(
                req.query.trainNumber ||
                ""
            )
                .trim();

        const journeyDate =
            String(
                req.query.journeyDate ||
                ""
            )
                .trim();

        const boardingStation =
            String(
                req.query.boardingStation ||
                ""
            )
                .trim()
                .toUpperCase();

        // =====================================================
        // VALIDATE TRAIN
        // =====================================================

        if (
            !/^\d{4,5}$/.test(
                trainNumber
            )
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid train number.",
            });
        }

        // =====================================================
        // VALIDATE DATE
        // =====================================================

        if (
            !/^\d{4}-\d{2}-\d{2}$/.test(
                journeyDate
            )
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid journey date.",
            });
        }

        // =====================================================
        // VALIDATE STATION
        // =====================================================

        if (
            !/^[A-Z0-9]{2,10}$/.test(
                boardingStation
            )
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid boarding station.",
            });
        }

        // =====================================================
        // FETCH ACTUAL CLASSES
        // =====================================================

        const result =
            await getAvailableTrainClasses({
                trainNumber,
                journeyDate,
                boardingStation,
            });

        return res.status(200).json({
            success: true,
            message:
                "Train classes fetched successfully.",
            data: result,
        });

    } catch (error) {

        console.error(
            "❌ TRAIN CLASS ERROR:",
            error.message
        );

        return res.status(502).json({
            success: false,
            message:
                "Unable to fetch actual train classes.",
        });
    }
};

module.exports = {
    getTrainClasses,
};