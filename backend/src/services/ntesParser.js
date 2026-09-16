const cheerio = require("cheerio");


/**
 * ============================================================
 * ERJA - NTES PARSER
 * ============================================================
 *
 * Parses the HTML returned by NTES.
 *
 * Responsibilities:
 *
 * 1. Extract train number
 * 2. Extract train name
 * 3. Extract source/destination
 * 4. Extract running status
 * 5. Extract current station
 * 6. Extract upcoming station
 * 7. Extract station rows
 * 8. Extract scheduled/actual times
 * 9. Extract platform
 * 10. Extract distance
 *
 * This class does NOT call NTES.
 * ============================================================
 */

class NTESParser {

    // ========================================================
    // MAIN PARSER
    // ========================================================

    parse(
        html,
        options = {}
    ) {

        if (
            typeof html !== "string" ||
            !html.trim()
        ) {
            throw new Error(
                "NTES parser requires valid HTML."
            );
        }


        const $ =
            cheerio.load(
                html
            );


        const detectedTrainNumber =
            this.extractTrainNumber(
                html,
                $
            );


        const journeyDate =
            options.journeyDate ||
            this.extractJourneyDate(
                $
            );


        console.log(
            "\n========================================"
        );

        console.log(
            "🧩 NTES PARSER"
        );

        console.log(
            "========================================"
        );

        console.log(
            "Train:",
            detectedTrainNumber
        );

        console.log(
            "Journey Date:",
            journeyDate
        );


        // ====================================================
        // COLLECT ROWS
        // ====================================================

        const rows =
            this.collectStopRows(
                $
            );


        console.log(
            "Candidate stop rows:",
            rows.length
        );


        // ====================================================
        // PARSE STOPS
        // ====================================================

        const stops =
            this.parseStops(
                $,
                rows,
                journeyDate
            );


        console.log(
            "Parsed stops:",
            stops.length
        );


        // ====================================================
        // TRAIN INFO
        // ====================================================

        const train =
            this.parseTrainInfo(
                $,
                html,
                stops,
                journeyDate,
                detectedTrainNumber
            );


        // ====================================================
        // RUNNING STATUS
        // ====================================================

        const status =
            this.parseRunningStatus(
                $,
                journeyDate
            );


        return {

            success:
                true,

            train,

            status,

            stops,

            summary: {

                totalStops:
                    stops.length,

                source:
                    stops[0]?.code ||
                    train.source ||
                    null,

                destination:
                    stops[stops.length - 1]?.code ||
                    train.destination ||
                    null,

                journeyDate:
                    journeyDate || null,

                currentStation:
                    status.currentStationCode ||
                    null,

                upcomingStation:
                    status.upcomingStationCode ||
                    null,
            },

            parsedAt:
                new Date().toISOString(),
        };
    }


    // ========================================================
    // TRAIN NUMBER
    // ========================================================

    extractTrainNumber(
        html,
        $
    ) {

        const patterns = [

            /showMapNew\s*\(\s*['"](\d{4,6})['"]/i,

            /trainNo\s*[=:]\s*['"]?(\d{4,6})/i,

            /Train\s*(?:No|Number)\s*[:\-]?\s*(\d{4,6})/i,

            /\b(\d{5})\b\s*[-|]\s*TATANAGAR/i,

            /\bTATANAGAR\b[\s\S]{0,300}?\b(\d{5})\b/i,
        ];


        for (
            const pattern of patterns
        ) {

            const match =
                html.match(
                    pattern
                );


            if (
                match &&
                match[1]
            ) {
                return match[1];
            }
        }


        const bodyText =
            this.cleanText(
                $("body").text()
            );


        const bodyMatch =
            bodyText.match(
                /\b(\d{5})\b/
            );


        return bodyMatch
            ? bodyMatch[1]
            : null;
    }


    // ========================================================
    // JOURNEY DATE
    // ========================================================

    extractJourneyDate(
        $
    ) {

        const text =
            this.cleanText(
                $("body").text()
            );


        const patterns = [

            /Start\s*Date\s*:\s*(\d{1,2}-[A-Za-z]{3}-\d{4})/i,

            /showMapNew\s*\([^,]+,[^,]+,\s*['"](\d{1,2}-[A-Za-z]{3}-\d{4})['"]/i,

            /\b(\d{1,2}-[A-Za-z]{3}-\d{4})\b/,
        ];


        for (
            const pattern of patterns
        ) {

            const match =
                text.match(
                    pattern
                );


            if (
                match &&
                match[1]
            ) {
                return match[1];
            }
        }


        return null;
    }


    // ========================================================
    // TRAIN INFORMATION
    // ========================================================

    parseTrainInfo(
        $,
        html,
        stops,
        journeyDate,
        detectedTrainNumber
    ) {

        const bodyText =
            this.cleanText(
                $("body").text()
            );


        let trainName =
            null;


        let source =
            stops[0]?.code ||
            null;


        let destination =
            stops[stops.length - 1]?.code ||
            null;


        // ----------------------------------------------------
        // Route title
        // ----------------------------------------------------

        const routePatterns = [

            /\b(TATANAGAR\s+JN)\s*-\s*(ERNAKULAM\s+JN)\b/i,

            /\b(TATANAGAR\s+JN)\s*[-–]\s*(ERNAKULAM\s+JN)\b/i,
        ];


        for (
            const pattern of routePatterns
        ) {

            const match =
                bodyText.match(
                    pattern
                );


            if (
                match
            ) {

                trainName =
                    `${match[1]} - ${match[2]}`;

                break;
            }
        }


        // ----------------------------------------------------
        // Extract source/destination from route title
        // ----------------------------------------------------

        if (
            !source
        ) {
            if (
                /TATANAGAR\s+JN/i.test(
                    bodyText
                )
            ) {
                source =
                    "TATA";
            }
        }


        if (
            !destination
        ) {
            if (
                /ERNAKULAM\s+JN/i.test(
                    bodyText
                )
            ) {
                destination =
                    "ERS";
            }
        }


        return {

            trainNumber:
                detectedTrainNumber ||
                null,

            trainName:
                trainName ||
                null,

            source:
                source ||
                null,

            destination:
                destination ||
                null,

            journeyDate:
                journeyDate ||
                null,
        };
    }


    // ========================================================
    // COLLECT STOP ROWS
    // ========================================================

    collectStopRows(
        $
    ) {

        const rows = [];

        const selectors = [

            ".stopRow",

            ".w3-card-2.stopRow",

            "div.stopRow",

            "[class*='stopRow']",
        ];


        const seen =
            new Set();


        for (
            const selector of selectors
        ) {

            $(selector).each(
                (
                    index,
                    element
                ) => {

                    if (
                        seen.has(
                            element
                        )
                    ) {
                        return;
                    }


                    const $row =
                        $(element);


                    const rawText =
                        this.cleanText(
                            $row.text()
                        );


                    if (
                        !rawText
                    ) {
                        return;
                    }


                    // ----------------------------------------
                    // Reject non-stopping rows
                    // ----------------------------------------

                    if (
                        $row.hasClass(
                            "nonStopRow"
                        )
                    ) {
                        return;
                    }


                    if (
                        /Non-Reporting\s+Station/i.test(
                            rawText
                        )
                    ) {
                        return;
                    }


                    if (
                        /Non-Stopping/i.test(
                            rawText
                        )
                    ) {
                        return;
                    }


                    // ----------------------------------------
                    // Station code requirement
                    // ----------------------------------------

                    if (
                        !this.hasLikelyStationCode(
                            rawText
                        )
                    ) {
                        return;
                    }


                    seen.add(
                        element
                    );


                    rows.push({
                        element,
                        index:
                            rows.length,
                    });
                }
            );
        }


        return rows;
    }


    // ========================================================
    // STATION CODE DETECTOR
    // ========================================================

    hasLikelyStationCode(
        text
    ) {

        const patterns = [

            /\b[A-Z]{2,5}\s+PF\b/i,

            /\b[A-Z0-9]{2,8}\s+PF\b/i,

            /\(([A-Z0-9]{2,8})\)/i,

            /\bPF\s*[A-Z0-9-]+\b/i,
        ];


        return patterns.some(
            (pattern) =>
                pattern.test(
                    text
                )
        );
    }


    // ========================================================
    // PARSE STOPS
    // ========================================================

    parseStops(
        $,
        rows,
        journeyDate
    ) {

        if (
            !rows.length
        ) {
            return [];
        }


        const parsed = [];


        for (
            const row of rows
        ) {

            const stop =
                this.parseStopRow(
                    $,
                    $(row.element),
                    row.index
                );


            if (
                !stop.code &&
                !stop.name
            ) {
                continue;
            }


            parsed.push(
                stop
            );
        }


        // ----------------------------------------------------
        // Date filter
        // ----------------------------------------------------

        let filtered =
            parsed;


        if (
            journeyDate
        ) {

            filtered =
                parsed.filter(
                    (stop) =>
                        this.stopBelongsToJourneyDate(
                            stop,
                            journeyDate
                        )
                );
        }


        // ----------------------------------------------------
        // If strict filtering removed everything,
        // don't immediately return zero.
        //
        // The NTES page can omit explicit dates from
        // some station rows.
        //
        // Use rows that have valid station data.
        // ----------------------------------------------------

        if (
            filtered.length === 0 &&
            parsed.length > 0
        ) {

            console.warn(
                "⚠️ Strict NTES date filtering removed all rows. Using parsed station rows."
            );

            filtered =
                parsed;
        }


        // ----------------------------------------------------
        // Remove duplicates
        // ----------------------------------------------------

        const unique = [];

        const seenCodes =
            new Set();


        for (
            const stop of filtered
        ) {

            const code =
                stop.code
                    ? String(
                        stop.code
                    )
                        .trim()
                        .toUpperCase()
                    : null;


            if (
                code &&
                seenCodes.has(
                    code
                )
            ) {
                continue;
            }


            if (
                code
            ) {
                seenCodes.add(
                    code
                );
            }


            unique.push(
                stop
            );
        }


        // ----------------------------------------------------
        // Route order
        // ----------------------------------------------------

        return unique.map(
            (
                stop,
                index
            ) => {

                const result = {

                    ...stop,

                    sequence:
                        index + 1,

                    routeOrder:
                        index + 1,

                    isSource:
                        index === 0,

                    isDestination:
                        index ===
                        unique.length - 1,
                };


                if (
                    index === 0
                ) {
                    result.status =
                        "SOURCE";
                }
                else if (
                    index ===
                    unique.length - 1
                ) {
                    result.status =
                        "DESTINATION";
                }
                else {
                    result.status =
                        null;
                }


                return result;
            }
        );
    }


    // ========================================================
    // STOP DATE VALIDATION
    // ========================================================

    stopBelongsToJourneyDate(
        stop,
        journeyDate
    ) {

        const dates = [

            stop.arrivalDate,

            stop.departureDate,

            this.extractPrimaryRowDate(
                stop.rawText
            ),
        ]
            .filter(Boolean);


        if (
            dates.length === 0
        ) {
            return true;
        }


        return dates.some(
            (date) =>
                this.datesMatch(
                    date,
                    journeyDate
                )
        );
    }


    // ========================================================
    // PRIMARY ROW DATE
    // ========================================================

    extractPrimaryRowDate(
        rawText
    ) {

        if (
            !rawText
        ) {
            return null;
        }


        const match =
            rawText.match(
                /\b\d{1,2}:\d{2}\s+(\d{1,2}-[A-Za-z]{3}(?:-\d{4})?)\b/
            );


        if (
            match
        ) {
            return match[1];
        }


        const fallback =
            rawText.match(
                /\b(\d{1,2}-[A-Za-z]{3}(?:-\d{4})?)\b/
            );


        return fallback
            ? fallback[1]
            : null;
    }


    // ========================================================
    // PARSE INDIVIDUAL STOP
    // ========================================================

    parseStopRow(
        $,
        $row,
        index
    ) {

        const rawText =
            this.cleanText(
                $row.text()
            );


        const station =
            this.extractStationInfo(
                $,
                $row,
                rawText
            );


        const timePairs =
            this.extractTimePairs(
                rawText
            );


        const isSource =
            /\bSRC\b/i.test(
                rawText
            );


        const isDestination =
            /\b(?:DST|DSTN|DESTINATION)\b/i.test(
                rawText
            );


        let arrival =
            this.emptyTimeInfo();


        let departure =
            this.emptyTimeInfo();


        // ----------------------------------------------------
        // Source
        // ----------------------------------------------------

        if (
            isSource &&
            timePairs.length >= 2
        ) {

            departure =
                this.createTimeInfoFromPairs(
                    timePairs[0],
                    timePairs[1]
                );
        }


        // ----------------------------------------------------
        // Destination
        // ----------------------------------------------------

        else if (
            isDestination &&
            timePairs.length >= 2
        ) {

            arrival =
                this.createTimeInfoFromPairs(
                    timePairs[0],
                    timePairs[1]
                );
        }


        // ----------------------------------------------------
        // Normal station
        // ----------------------------------------------------

        else {

            const columns =
                this.getRowColumns(
                    $,
                    $row
                );


            arrival =
                this.parseTimeBlock(
                    columns.left
                );


            departure =
                this.parseTimeBlock(
                    columns.right
                );


            /*
             * Fallback when column structure isn't usable.
             */

            if (
                !arrival.scheduled &&
                timePairs.length >= 1
            ) {

                arrival =
                    this.createTimeInfoFromPairs(
                        timePairs[0],
                        null
                    );
            }


            if (
                !departure.scheduled &&
                timePairs.length >= 2
            ) {

                departure =
                    this.createTimeInfoFromPairs(
                        timePairs[1],
                        null
                    );
            }
        }


        const platform =
            this.extractPlatform(
                rawText
            );


        const distanceKm =
            this.extractDistance(
                rawText
            );


        const halt =
            this.extractHalt(
                rawText
            );


        return {

            sequence:
                index + 1,

            code:
                station.code,

            name:
                station.name,

            scheduledArrival:
                arrival.scheduled,

            actualArrival:
                arrival.actual,

            scheduledDeparture:
                departure.scheduled,

            actualDeparture:
                departure.actual,

            arrivalDate:
                arrival.date,

            departureDate:
                departure.date,

            platform,

            distanceKm,

            halt,

            arrivalDelayMinutes:
                this.calculateDelayMinutes(
                    arrival.scheduled,
                    arrival.actual
                ),

            departureDelayMinutes:
                this.calculateDelayMinutes(
                    departure.scheduled,
                    departure.actual
                ),

            delayMinutes:
                this.calculateDelayMinutes(
                    arrival.scheduled,
                    arrival.actual
                ) ??
                this.calculateDelayMinutes(
                    departure.scheduled,
                    departure.actual
                ),

            arrivalStatus:
                arrival.status,

            departureStatus:
                departure.status,

            isSource,

            isDestination,

            rawText,
        };
    }


    // ========================================================
    // STATION INFORMATION
    // ========================================================

    extractStationInfo(
        $,
        $row,
        rawText
    ) {

        let code =
            null;


        let name =
            null;


        // ----------------------------------------------------
        // Parenthesized code
        // Example:
        //
        // MAVELIPALAYAM (MVPM)
        // ----------------------------------------------------

        const parenthesized =
            rawText.match(
                /\(([A-Z0-9]{2,8})\)/
            );


        if (
            parenthesized
        ) {

            code =
                parenthesized[1]
                    .toUpperCase();
        }


        // ----------------------------------------------------
        // Code before PF
        // ----------------------------------------------------

        if (
            !code
        ) {

            const codeMatch =
                rawText.match(
                    /\b([A-Z0-9]{2,8})\s+PF\b/i
                );


            if (
                codeMatch
            ) {

                code =
                    codeMatch[1]
                        .toUpperCase();
            }
        }


        // ----------------------------------------------------
        // PF code format
        // ----------------------------------------------------

        if (
            !code
        ) {

            const pfMatch =
                rawText.match(
                    /\bPF\s*([A-Z0-9-]+)\b/i
                );


            if (
                pfMatch
            ) {

                const possibleCode =
                    pfMatch[1]
                        .toUpperCase();


                if (
                    /^[A-Z0-9]{2,8}$/.test(
                        possibleCode
                    )
                ) {

                    code =
                        possibleCode;
                }
            }
        }


        // ----------------------------------------------------
        // Station name + code + PF
        // ----------------------------------------------------

        if (
            code
        ) {

            const escapedCode =
                code.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                );


            const pattern =
                new RegExp(
                    `([A-Za-z][A-Za-z0-9 .&'()/\\-]{2,80}?)\\s+${escapedCode}\\s+PF`,
                    "i"
                );


            const match =
                rawText.match(
                    pattern
                );


            if (
                match
            ) {

                name =
                    this.cleanStationName(
                        match[1]
                    );
            }
        }


        // ----------------------------------------------------
        // Parenthesized code:
        //
        // STATION NAME (CODE)
        // ----------------------------------------------------

        if (
            !name &&
            code
        ) {

            const escapedCode =
                code.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                );


            const pattern =
                new RegExp(
                    `([A-Za-z][A-Za-z0-9 .&'()/\\-]{2,80}?)\\s*\\(${escapedCode}\\)`,
                    "i"
                );


            const match =
                rawText.match(
                    pattern
                );


            if (
                match
            ) {

                name =
                    this.cleanStationName(
                        match[1]
                    );
            }
        }


        // ----------------------------------------------------
        // Bold elements
        // ----------------------------------------------------

        if (
            !name
        ) {

            const candidates =
                $row
                    .find("b,strong")
                    .map(
                        (
                            _,
                            element
                        ) =>
                            this.cleanText(
                                $(element).text()
                            )
                    )
                    .get()
                    .filter(Boolean);


            for (
                const candidate of candidates
            ) {

                if (
                    /^(SRC|DST|DSTN|PF)$/i.test(
                        candidate
                    )
                ) {
                    continue;
                }


                if (
                    /^\d{1,2}:\d{2}/.test(
                        candidate
                    )
                ) {
                    continue;
                }


                if (
                    /^\d{1,2}-[A-Za-z]{3}/.test(
                        candidate
                    )
                ) {
                    continue;
                }


                if (
                    /Coach Position/i.test(
                        candidate
                    )
                ) {
                    continue;
                }


                if (
                    /Non-Reporting/i.test(
                        candidate
                    )
                ) {
                    continue;
                }


                if (
                    candidate.length >= 3 &&
                    candidate.length <= 80
                ) {

                    name =
                        this.cleanStationName(
                            candidate
                        );

                    break;
                }
            }
        }


        return {

            code,

            name,
        };
    }


    // ========================================================
    // TIME PAIRS
    // ========================================================

    extractTimePairs(
        text
    ) {

        if (
            !text
        ) {
            return [];
        }


        const matches = [
            ...text.matchAll(
                /\b(\d{1,2}:\d{2})\s+(\d{1,2}-[A-Za-z]{3}(?:-\d{4})?)?\*?/g
            ),
        ];


        return matches.map(
            (
                match
            ) => ({

                time:
                    match[1] ||
                    null,

                date:
                    match[2] ||
                    null,
            })
        );
    }


    // ========================================================
    // ROW COLUMNS
    // ========================================================

    getRowColumns(
        $,
        $row
    ) {

        const children =
            $row.children(
                "div"
            );


        if (
            children.length >= 3
        ) {

            return {

                left:
                    this.cleanText(
                        $(children.eq(0))
                            .text()
                    ),

                center:
                    this.cleanText(
                        $(children.eq(1))
                            .text()
                    ),

                right:
                    this.cleanText(
                        $(
                            children.eq(
                                children.length - 1
                            )
                        ).text()
                    ),
            };
        }


        const texts =
            $row
                .find("div")
                .map(
                    (
                        _,
                        element
                    ) =>
                        this.cleanText(
                            $(element).text()
                        )
                )
                .get()
                .filter(Boolean);


        const timeBlocks =
            texts.filter(
                (text) =>
                    /\b\d{1,2}:\d{2}\b/.test(
                        text
                    )
            );


        return {

            left:
                timeBlocks[0] ||
                "",

            center:
                "",

            right:
                timeBlocks[1] ||
                "",
        };
    }


    // ========================================================
    // TIME BLOCK
    // ========================================================

    parseTimeBlock(
        text
    ) {

        const clean =
            this.cleanText(
                text
            );


        if (
            !clean ||
            /\bSRC\b/i.test(
                clean
            )
        ) {
            return this.emptyTimeInfo();
        }


        const matches = [
            ...clean.matchAll(
                /\b(\d{1,2}:\d{2})\s*(\d{1,2}-[A-Za-z]{3}(?:-\d{4})?)?\*?/g
            ),
        ];


        if (
            matches.length === 0
        ) {
            return this.emptyTimeInfo();
        }


        const scheduled =
            matches[0][1] ||
            null;


        const scheduledDate =
            matches[0][2] ||
            null;


        const actual =
            matches.length > 1
                ? matches[1][1] ||
                  null
                : null;


        const actualDate =
            matches.length > 1
                ? matches[1][2] ||
                  null
                : null;


        return {

            scheduled,

            actual,

            date:
                actualDate ||
                scheduledDate ||
                null,

            status:
                actual
                    ? this.getTimeStatus(
                        scheduled,
                        actual
                    )
                    : "SCHEDULED",
        };
    }


    // ========================================================
    // TIME INFO
    // ========================================================

    createTimeInfoFromPairs(
        first,
        second
    ) {

        if (
            !first
        ) {
            return this.emptyTimeInfo();
        }


        const scheduled =
            first.time ||
            null;


        const actual =
            second?.time ||
            null;


        const date =
            second?.date ||
            first.date ||
            null;


        return {

            scheduled,

            actual,

            date,

            status:
                actual
                    ? this.getTimeStatus(
                        scheduled,
                        actual
                    )
                    : "SCHEDULED",
        };
    }


    emptyTimeInfo() {

        return {

            scheduled:
                null,

            actual:
                null,

            date:
                null,

            status:
                null,
        };
    }


    // ========================================================
    // TIME STATUS
    // ========================================================

    getTimeStatus(
        scheduled,
        actual
    ) {

        const delay =
            this.calculateDelayMinutes(
                scheduled,
                actual
            );


        if (
            delay === null
        ) {
            return "ACTUAL";
        }


        if (
            delay > 0
        ) {
            return "DELAYED";
        }


        if (
            delay < 0
        ) {
            return "EARLY";
        }


        return "ON_TIME";
    }


    // ========================================================
    // PLATFORM
    // ========================================================

    extractPlatform(
        text
    ) {

        if (
            !text
        ) {
            return null;
        }


        const match =
            text.match(
                /\bPF\s*([A-Z0-9-]+)\*?/i
            );


        return match
            ? match[1]
            : null;
    }


    // ========================================================
    // DISTANCE
    // ========================================================

    extractDistance(
        text
    ) {

        if (
            !text
        ) {
            return null;
        }


        const match =
            text.match(
                /\b(\d+(?:\.\d+)?)\s*KMs?\b/i
            );


        return match
            ? Number(
                match[1]
            )
            : null;
    }


    // ========================================================
    // HALT
    // ========================================================

    extractHalt(
        text
    ) {

        if (
            !text
        ) {
            return null;
        }


        const match =
            text.match(
                /\b(\d+)\s*(?:Min|Mins|Minutes)\b/i
            );


        return match
            ? Number(
                match[1]
            )
            : null;
    }


    // ========================================================
    // RUNNING STATUS
    // ========================================================

    parseRunningStatus(
        $,
        journeyDate
    ) {

        const bodyText =
            this.cleanText(
                $("body").text()
            );


        let currentStation =
            null;


        let currentStationCode =
            null;


        let currentTime =
            null;


        // ----------------------------------------------------
        // DEPARTED FROM
        // ----------------------------------------------------

        const departureRegex =
            /Departed\s+from\s+(.+?)\s*\(([A-Z0-9]{2,8})\)\s+(?:on|at)\s+(.+?)(?=\s+(?:Upcoming\s+Station|Current\s+Position|Arrived\s+at)|$)/i;


        const departureMatch =
            bodyText.match(
                departureRegex
            );


        if (
            departureMatch
        ) {

            const statusDate =
                this.extractDateFromText(
                    departureMatch[3]
                );


            if (
                !journeyDate ||
                !statusDate ||
                this.datesMatch(
                    statusDate,
                    journeyDate
                )
            ) {

                currentStation =
                    this.cleanStationName(
                        departureMatch[1]
                    );


                currentStationCode =
                    departureMatch[2]
                        .toUpperCase();


                const timeMatch =
                    departureMatch[3].match(
                        /\b(\d{1,2}:\d{2})\s*(\d{1,2}-[A-Za-z]{3}(?:-\d{4})?)?/i
                    );


                if (
                    timeMatch
                ) {

                    currentTime =
                        (
                            `${timeMatch[1]} ` +
                            `${timeMatch[2] || ""}`
                        ).trim();
                }
            }
        }


        // ----------------------------------------------------
        // ARRIVED AT
        // ----------------------------------------------------

        if (
            !currentStationCode
        ) {

            const arrivalRegex =
                /Arrived\s+at\s+(.+?)\s*\(([A-Z0-9]{2,8})\)\s+(?:on|at)\s+(.+?)(?=\s+(?:Upcoming\s+Station|Current\s+Position|Departed\s+from)|$)/i;


            const arrivalMatch =
                bodyText.match(
                    arrivalRegex
                );


            if (
                arrivalMatch
            ) {

                const statusDate =
                    this.extractDateFromText(
                        arrivalMatch[3]
                    );


                if (
                    !journeyDate ||
                    !statusDate ||
                    this.datesMatch(
                        statusDate,
                        journeyDate
                    )
                ) {

                    currentStation =
                        this.cleanStationName(
                            arrivalMatch[1]
                        );


                    currentStationCode =
                        arrivalMatch[2]
                            .toUpperCase();


                    const timeMatch =
                        arrivalMatch[3].match(
                            /\b(\d{1,2}:\d{2})\s*(\d{1,2}-[A-Za-z]{3}(?:-\d{4})?)?/i
                        );


                    if (
                        timeMatch
                    ) {

                        currentTime =
                            (
                                `${timeMatch[1]} ` +
                                `${timeMatch[2] || ""}`
                            ).trim();
                    }
                }
            }
        }


        // ----------------------------------------------------
        // UPCOMING STATION
        // ----------------------------------------------------

        let upcomingStation =
            null;


        let upcomingStationCode =
            null;


        const upcomingPatterns = [

            /Upcoming\s+Station\s*[:\-]?\s*(.+?)\s*\(([A-Z0-9]{2,8})\)/i,

            /Next\s+Station\s*[:\-]?\s*(.+?)\s*\(([A-Z0-9]{2,8})\)/i,
        ];


        for (
            const pattern of upcomingPatterns
        ) {

            const match =
                bodyText.match(
                    pattern
                );


            if (
                match
            ) {

                upcomingStation =
                    this.cleanStationName(
                        match[1]
                    );


                upcomingStationCode =
                    match[2]
                        .toUpperCase();


                break;
            }
        }


        // ----------------------------------------------------
        // NOT STARTED
        // ----------------------------------------------------

        if (
            !currentStationCode &&
            !upcomingStationCode &&
            /Yet to start from its source/i.test(
                bodyText
            )
        ) {

            return {

                state:
                    "NOT_STARTED",

                currentStation:
                    null,

                currentStationCode:
                    null,

                currentTime:
                    null,

                upcomingStation:
                    null,

                upcomingStationCode:
                    null,

                journeyDate:
                    journeyDate ||
                    null,

                rawText:
                    "Yet to start from its source",
            };
        }


        // ----------------------------------------------------
        // RETURN
        // ----------------------------------------------------

        if (
            currentStationCode ||
            upcomingStationCode
        ) {

            return {

                state:
                    currentStationCode
                        ? "DEPARTED"
                        : "RUNNING",

                currentStation,

                currentStationCode,

                currentTime,

                upcomingStation,

                upcomingStationCode,

                journeyDate:
                    journeyDate ||
                    null,

                rawText:
                    this.extractStatusContext(
                        bodyText,
                        currentStationCode ||
                        upcomingStationCode
                    ),
            };
        }


        return {

            state:
                "UNKNOWN",

            currentStation:
                null,

            currentStationCode:
                null,

            currentTime:
                null,

            upcomingStation:
                null,

            upcomingStationCode:
                null,

            journeyDate:
                journeyDate ||
                null,

            rawText:
                null,
        };
    }


    // ========================================================
    // DATE FROM TEXT
    // ========================================================

    extractDateFromText(
        text
    ) {

        if (
            !text
        ) {
            return null;
        }


        const match =
            text.match(
                /\b(\d{1,2}-[A-Za-z]{3}(?:-\d{4})?)\b/
            );


        return match
            ? match[1]
            : null;
    }


    // ========================================================
    // DATE NORMALIZATION
    // ========================================================

    normalizeDate(
        date
    ) {

        if (
            !date
        ) {
            return null;
        }


        const value =
            String(date)
                .trim()
                .replace(
                    /\*/g,
                    ""
                );


        let match =
            value.match(
                /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/
            );


        if (
            match
        ) {

            return (
                `${match[1].padStart(2, "0")}-` +
                `${match[2].toLowerCase()}-` +
                `${match[3]}`
            );
        }


        match =
            value.match(
                /^(\d{1,2})-([A-Za-z]{3})$/
            );


        if (
            match
        ) {

            return (
                `${match[1].padStart(2, "0")}-` +
                `${match[2].toLowerCase()}`
            );
        }


        return value.toLowerCase();
    }


    // ========================================================
    // DATE MATCH
    // ========================================================

    datesMatch(
        first,
        second
    ) {

        const a =
            this.normalizeDate(
                first
            );


        const b =
            this.normalizeDate(
                second
            );


        if (
            !a ||
            !b
        ) {
            return false;
        }


        const aParts =
            a.split("-");


        const bParts =
            b.split("-");


        if (
            aParts.length === 2 &&
            bParts.length === 3
        ) {

            return (
                aParts[0] === bParts[0] &&
                aParts[1] === bParts[1]
            );
        }


        if (
            aParts.length === 3 &&
            bParts.length === 2
        ) {

            return (
                aParts[0] === bParts[0] &&
                aParts[1] === bParts[1]
            );
        }


        return a === b;
    }


    // ========================================================
    // DELAY
    // ========================================================

    calculateDelayMinutes(
        scheduled,
        actual
    ) {

        if (
            !scheduled ||
            !actual
        ) {
            return null;
        }


        const scheduledMinutes =
            this.timeToMinutes(
                scheduled
            );


        const actualMinutes =
            this.timeToMinutes(
                actual
            );


        if (
            scheduledMinutes === null ||
            actualMinutes === null
        ) {
            return null;
        }


        let difference =
            actualMinutes -
            scheduledMinutes;


        if (
            difference < -720
        ) {
            difference += 1440;
        }


        if (
            difference > 720
        ) {
            difference -= 1440;
        }


        return difference;
    }


    // ========================================================
    // TIME TO MINUTES
    // ========================================================

    timeToMinutes(
        time
    ) {

        const match =
            String(time).match(
                /^(\d{1,2}):(\d{2})$/
            );


        if (
            !match
        ) {
            return null;
        }


        const hours =
            Number(
                match[1]
            );


        const minutes =
            Number(
                match[2]
            );


        if (
            hours < 0 ||
            hours > 23 ||
            minutes < 0 ||
            minutes > 59
        ) {
            return null;
        }


        return (
            hours * 60 +
            minutes
        );
    }


    // ========================================================
    // STATUS CONTEXT
    // ========================================================

    extractStatusContext(
        text,
        keyword
    ) {

        if (
            !text ||
            !keyword
        ) {
            return null;
        }


        const index =
            text
                .toLowerCase()
                .indexOf(
                    String(
                        keyword
                    ).toLowerCase()
                );


        if (
            index === -1
        ) {
            return null;
        }


        const start =
            Math.max(
                0,
                index - 150
            );


        const end =
            Math.min(
                text.length,
                index + 450
            );


        return text
            .slice(
                start,
                end
            )
            .trim();
    }


    // ========================================================
    // STATION NAME CLEANING
    // ========================================================

    cleanStationName(
        value
    ) {

        return this.cleanText(
            value
        )
            .replace(
                /\s+/g,
                " "
            )
            .trim();
    }


    // ========================================================
    // GENERAL TEXT CLEANING
    // ========================================================

    cleanText(
        value
    ) {

        return String(
            value || ""
        )
            .replace(
                /\u00a0/g,
                " "
            )
            .replace(
                /&nbsp;/gi,
                " "
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();
    }
}


module.exports =
    new NTESParser();