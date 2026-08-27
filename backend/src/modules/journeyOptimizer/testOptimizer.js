const journeyOptimizer = require("./journeyOptimizer.service");

(async () => {

    const recommendations = await journeyOptimizer.optimize({

        journey: {

            _id: "6a898a70220aa65338c00822", // Use an existing Journey _id from MongoDB

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

        vacancies: [

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

    });

    console.log("========================================");
    console.log("🚆 RECOMMENDATIONS GENERATED");
    console.log("========================================");

    console.log(JSON.stringify(recommendations, null, 2));

})();