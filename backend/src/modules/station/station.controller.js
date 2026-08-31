const {
    searchStationService,
} = require("./station.service");

const searchStation = async (req, res) => {

    try {

        const result =
            await searchStationService(
                req.query
            );

        return res.status(200).json({

            success: true,

            message:
                "Station search successful.",

            data: result,
        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message:
                error.message,
        });
    }
};

module.exports = {
    searchStation,
};