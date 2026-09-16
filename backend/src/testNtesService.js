const ntesService =
    require("./modules/train/ntes.service");


async function test() {

    try {

        console.log(
            "\n========================================"
        );

        console.log(
            "       ERJA - NTES SERVICE TEST"
        );

        console.log(
            "========================================\n"
        );


        // ====================================================
        // TEST PARAMETERS
        // ====================================================

        const trainNumber =
            "18189";

        const journeyDate =
            "16-Sep-2026";


        // ====================================================
        // CALL NTES
        // ====================================================

        const result =
            await ntesService
                .getTrainRunningStatus(
                    trainNumber,
                    journeyDate
                );


        // ====================================================
        // TRAIN
        // ====================================================

        console.log(
            "\n========================================"
        );

        console.log(
            "TRAIN INFORMATION"
        );

        console.log(
            "========================================"
        );

        console.log(
            JSON.stringify(
                result.train,
                null,
                2
            )
        );


        // ====================================================
        // RUNNING STATUS
        // ====================================================

        console.log(
            "\n========================================"
        );

        console.log(
            "LIVE RUNNING STATUS"
        );

        console.log(
            "========================================"
        );

        console.log(
            JSON.stringify(
                result.status,
                null,
                2
            )
        );


        // ====================================================
        // SUMMARY
        // ====================================================

        console.log(
            "\n========================================"
        );

        console.log(
            "SUMMARY"
        );

        console.log(
            "========================================"
        );

        console.log(
            JSON.stringify(
                result.summary,
                null,
                2
            )
        );


        // ====================================================
        // STOPS
        // ====================================================

        console.log(
            "\n========================================"
        );

        console.log(
            "STOP SUMMARY"
        );

        console.log(
            "========================================"
        );

        console.log(
            "Total stops:",
            result.stops.length
        );


        // ====================================================
        // FIRST STOP
        // ====================================================

        if (
            result.stops.length > 0
        ) {

            console.log(
                "\n========================================"
            );

            console.log(
                "FIRST STOP"
            );

            console.log(
                "========================================"
            );

            console.log(
                JSON.stringify(
                    result.stops[0],
                    null,
                    2
                )
            );
        }


        // ====================================================
        // LAST STOP
        // ====================================================

        if (
            result.stops.length > 1
        ) {

            console.log(
                "\n========================================"
            );

            console.log(
                "LAST STOP"
            );

            console.log(
                "========================================"
            );

            console.log(
                JSON.stringify(
                    result.stops[
                        result.stops.length - 1
                    ],
                    null,
                    2
                )
            );
        }


        // ====================================================
        // ALL STOPS
        // ====================================================

        console.log(
            "\n========================================"
        );

        console.log(
            "ALL PARSED STOPS"
        );

        console.log(
            "========================================\n"
        );


        result.stops.forEach(
            (stop) => {

                console.log(

                    `${String(
                        stop.routeOrder
                    ).padStart(
                        3,
                        " "
                    )} | ` +

                    `${String(
                        stop.code || "-"
                    ).padEnd(
                        8,
                        " "
                    )} | ` +

                    `${String(
                        stop.name || "-"
                    ).padEnd(
                        35,
                        " "
                    )} | ` +

                    `ARR: ${
                        stop.actualArrival ||
                        stop.scheduledArrival ||
                        "-"
                    } | ` +

                    `DEP: ${
                        stop.actualDeparture ||
                        stop.scheduledDeparture ||
                        "-"
                    } | ` +

                    `PF: ${
                        stop.platform ||
                        "-"
                    } | ` +

                    `KM: ${
                        stop.distanceKm ??
                        "-"
                    }`
                );
            }
        );


        // ====================================================
        // DEBUG HTML
        // ====================================================

        console.log(
            "\n========================================"
        );

        console.log(
            "DEBUG RESPONSE"
        );

        console.log(
            "========================================"
        );

        console.log(
            "HTML size:",
            result.rawHtmlSize
        );

        console.log(
            "HTTP status:",
            result.httpStatus
        );

        console.log(
            "Saved HTML:",
            result.debugPath ||
            "Not available"
        );


        // ====================================================
        // FINAL
        // ====================================================

        console.log(
            "\n========================================"
        );

        console.log(
            "✅ NTES SERVICE TEST COMPLETED"
        );

        console.log(
            "========================================\n"
        );

    } catch (error) {

        console.error(
            "\n========================================"
        );

        console.error(
            "❌ NTES SERVICE TEST FAILED"
        );

        console.error(
            "========================================\n"
        );


        console.error(
            "Message:",
            error.message
        );


        if (
            error.response
        ) {

            console.error(
                "HTTP Status:",
                error.response.status
            );

            console.error(
                "Response:",
                String(
                    error.response.data ||
                    ""
                ).slice(
                    0,
                    1000
                )
            );
        }


        if (
            error.stack
        ) {

            console.error(
                "\nStack:"
            );

            console.error(
                error.stack
            );
        }


        process.exitCode =
            1;
    }
}


test();