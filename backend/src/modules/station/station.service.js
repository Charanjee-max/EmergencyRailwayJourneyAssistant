const stations = [
    {
        code: "SC",
        name: "Secunderabad Junction",
    },
    {
        code: "BZA",
        name: "Vijayawada Junction",
    },
    {
        code: "CSMT",
        name: "Chhatrapati Shivaji Maharaj Terminus",
    },
    {
        code: "BBSN",
        name: "Bhubaneswar New",
    },
    {
        code: "BDCR",
        name: "Bhadrachalam Road",
    },
    {
        code: "MUGR",
        name: "Manuguru",
    },
    {
        code: "KRA",
        name: "Kothagudem",
    },
    {
        code: "DKJ",
        name: "Dornakal Junction",
    },
    {
        code: "WL",
        name: "Warangal",
    },
];

const searchStationService = async (query) => {

    const search = String(
        query.search || ""
    )
        .trim()
        .toLowerCase();

    if (!search) {
        return [];
    }

    const results = stations
        .filter((station) => {

            const codeMatch =
                station.code
                    .toLowerCase()
                    .includes(search);

            const nameMatch =
                station.name
                    .toLowerCase()
                    .includes(search);

            return codeMatch || nameMatch;
        })
        .slice(0, 10);

    return results;
};

module.exports = {
    searchStationService,
};