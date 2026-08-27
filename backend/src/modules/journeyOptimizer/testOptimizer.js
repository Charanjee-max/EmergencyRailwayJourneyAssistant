const journeyOptimizer = require("./journeyOptimizer.service");

const result = journeyOptimizer.optimize({

    journey: {

        trainNumber: "12745",

        source: "MUGR",

        destination: "SC",

        preferredClasses: ["2A"],

        allowMixedClass: true

    },

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

    chart: {

        chartPrepared: true,

        cdd: []

    },

    vacancies: {

        vbd: [

            {

                from: "MUGR",

                to: "DKJ",

                class: "2A",

                coach: "A1",

                berth: 12

            },

            {

                from: "DKJ",

                to: "SC",

                class: "2A",

                coach: "A1",

                berth: 5

            }

        ]

    }

});

console.log(JSON.stringify(result.recommendations, null, 2));