const chartService = require("./chart.service");

class ChartController {

    // ==============================
    // Fetch Train Composition
    // ==============================

    async testChart(req, res) {

        try {

            const {
                trainNumber,
                journeyDate,
                boardingStation
            } = req.body;

            const chart = await chartService.fetchAndCacheChart(
                trainNumber,
                journeyDate,
                boardingStation
            );

            return res.status(200).json({
                success: true,
                message: "Chart fetched and cached successfully",
                data: chart
            });

        } catch (err) {

            console.error(err);

            return res.status(500).json({
                success: false,
                message: err.message
            });

        }

    }

    // ==============================
    // Fetch Vacant Berths
    // ==============================

    async fetchVacantBerth(req, res) {

        try {

            const {
                trainNumber,
                journeyDate,
                boardingStation,
                classCode,
                chartType
            } = req.body;

            const result = await chartService.fetchVacantBerth(
                trainNumber,
                journeyDate,
                boardingStation,
                classCode,
                chartType
            );

            return res.status(200).json({
                success: true,
                message: "Vacant berth fetched successfully",
                data: result
            });

        } catch (err) {

            console.error(err);

            return res.status(500).json({
                success: false,
                message: err.message
            });

        }

    }

}

module.exports = new ChartController();