const reservationGraphBuilder = require("./reservationGraphBuilder");

const analyzedData = {

    route: {

        stations: [

            "MUGR",
            "BDCR",
            "KRA",
            "DKJ",
            "GLA",
            "MABD",
            "WL",
            "KZJ",
            "ZN",
            "CHZ",
            "SC"

        ]

    },

    vacancies: [

        {
            from: "MUGR",
            to: "DKJ",
            class: "2A",
            coach: "A1",
            berth: 12
        },

        {
            from: "MUGR",
            to: "DKJ",
            class: "2A",
            coach: "A1",
            berth: 18
        },

        {
            from: "MUGR",
            to: "DKJ",
            class: "2A",
            coach: "A2",
            berth: 10
        },

        {
            from: "DKJ",
            to: "SC",
            class: "2A",
            coach: "A1",
            berth: 5
        },

        {
            from: "DKJ",
            to: "SC",
            class: "2A",
            coach: "A1",
            berth: 6
        }

    ]

};

const graph = reservationGraphBuilder.build(analyzedData);

console.log(JSON.stringify(graph, null, 2));