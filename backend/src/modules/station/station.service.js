const stations = require("../../data/list_of_stations.json");


// =========================================================
// PREPARE STATION DIRECTORY
// =========================================================

const stationDirectory = stations
    .filter(
        (station) =>
            station.station_code &&
            station.station_name
    )
    .map((station) => ({
        code: String(
            station.station_code
        ).trim(),

        name: String(
            station.station_name
        ).trim(),

        region: String(
            station.region_code || ""
        ).trim(),
    }));


console.log(
    `🚉 Station directory loaded: ${stationDirectory.length} stations`
);


// =========================================================
// SEARCH STATIONS
// =========================================================

const searchStationService = async (query) => {

    const search = String(
        query.search || ""
    )
        .trim()
        .toLowerCase();


    if (search.length < 2) {
        return [];
    }


    const results = stationDirectory
        .filter((station) => {

            const code =
                station.code.toLowerCase();

            const name =
                station.name.toLowerCase();

            return (
                code.includes(search) ||
                name.includes(search)
            );
        })


        // =====================================================
        // BETTER MATCHES FIRST
        // =====================================================

        .sort((a, b) => {

            const aCode =
                a.code.toLowerCase();

            const bCode =
                b.code.toLowerCase();

            const aName =
                a.name.toLowerCase();

            const bName =
                b.name.toLowerCase();


            // Exact station code
            if (aCode === search) {
                return -1;
            }

            if (bCode === search) {
                return 1;
            }


            // Code starts with search
            const aCodeStarts =
                aCode.startsWith(search);

            const bCodeStarts =
                bCode.startsWith(search);


            if (
                aCodeStarts &&
                !bCodeStarts
            ) {
                return -1;
            }

            if (
                !aCodeStarts &&
                bCodeStarts
            ) {
                return 1;
            }


            // Station name starts with search
            const aNameStarts =
                aName.startsWith(search);

            const bNameStarts =
                bName.startsWith(search);


            if (
                aNameStarts &&
                !bNameStarts
            ) {
                return -1;
            }

            if (
                !aNameStarts &&
                bNameStarts
            ) {
                return 1;
            }


            return aName.localeCompare(
                bName
            );
        })


        // Only show 10 suggestions
        .slice(0, 10);


    return results;
};


// =========================================================
// EXPORT
// =========================================================

module.exports = {
    searchStationService,
};