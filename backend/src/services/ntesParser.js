const cheerio = require("cheerio");

/**
 * ============================================================
 * ERJA - NTES PARSER
 * ============================================================
 *
 * Parses NTES "Spot Your Train" HTML.
 *
 * IMPORTANT:
 * This file ONLY parses HTML.
 * It does NOT call NTES.
 * ============================================================
 */

class NTESParser {

  // ============================================================
  // MAIN PARSER
  // ============================================================

  parse(html, options = {}) {

    if (
      typeof html !== "string" ||
      !html.trim()
    ) {
      throw new Error("NTES parser requires valid HTML");
    }

    const $ = cheerio.load(html);

    const journeyDate =
      options.journeyDate ||
      this.extractJourneyDateFromHtml(html, $);

    const trainNumber =
      this.extractTrainNumber(html);

    const allRows =
      this.collectStopRows($);

    const stops =
      this.parseStops(
        $,
        allRows,
        journeyDate
      );

    const train =
      this.parseTrainInfo(
        $,
        html,
        stops,
        journeyDate,
        trainNumber
      );

    const status =
      this.parseRunningStatus(
        $,
        journeyDate
      );

    return {

      success: true,

      train: {
        trainNumber:
          train.trainNumber ||
          trainNumber ||
          null,

        trainName:
          train.trainName ||
          null,

        source:
          train.source ||
          null,

        destination:
          train.destination ||
          null,

        journeyDate:
          journeyDate ||
          null,
      },

      status,

      stops,

      summary: {

        totalStops:
          stops.length,

        source:
          stops.length > 0
            ? stops[0].code
            : null,

        destination:
          stops.length > 0
            ? stops[stops.length - 1].code
            : null,

        journeyDate:
          journeyDate ||
          null,

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


  // ============================================================
  // TRAIN NUMBER
  // ============================================================

  extractTrainNumber(html) {

    const patterns = [

      /showMapNew\s*\(\s*['"](\d{4,6})['"]/i,

      /Train\s*Number\s*[:\-]?\s*(\d{4,6})/i,

      /\b(\d{5})\b\s*[-|]\s*TATANAGAR/i,

      /\bTATANAGAR\b[\s\S]{0,200}?\b(\d{5})\b/i,
    ];

    for (const pattern of patterns) {

      const match =
        html.match(pattern);

      if (
        match &&
        match[1]
      ) {
        return match[1];
      }
    }

    return null;
  }


  // ============================================================
  // JOURNEY DATE
  // ============================================================

  extractJourneyDateFromHtml(
    html,
    $
  ) {

    const mapMatch =
      html.match(
        /showMapNew\s*\(\s*['"]\d{4,6}['"]\s*,\s*['"][^'"]+['"]\s*,\s*['"](\d{1,2}-[A-Za-z]{3}-\d{4})['"]/i
      );

    if (
      mapMatch &&
      mapMatch[1]
    ) {
      return mapMatch[1];
    }

    const startDate =
      this.extractStartDate($);

    if (startDate) {
      return startDate;
    }

    return this.extractLatestDate($);
  }


  extractStartDate($) {

    const bodyText =
      this.cleanText(
        $("body").text()
      );

    const match =
      bodyText.match(
        /Start\s*Date\s*:\s*(\d{1,2}-[A-Za-z]{3}-\d{4})/i
      );

    return match
      ? match[1]
      : null;
  }


  extractLatestDate($) {

    const bodyText =
      this.cleanText(
        $("body").text()
      );

    const matches = [
      ...bodyText.matchAll(
        /\b(\d{1,2}-[A-Za-z]{3}-\d{4})\b/g
      ),
    ];

    if (
      !matches.length
    ) {
      return null;
    }

    return matches[0][1];
  }


  // ============================================================
  // TRAIN INFORMATION
  // ============================================================

  parseTrainInfo(
    $,
    html,
    stops,
    journeyDate,
    trainNumber
  ) {

    let source =
      stops.length > 0
        ? stops[0].code
        : null;

    let destination =
      stops.length > 0
        ? stops[stops.length - 1].code
        : null;

    let trainName =
      null;

    const bodyText =
      this.cleanText(
        $("body").text()
      );

    const routeMatch =
      bodyText.match(
        /\b(TATANAGAR\s+JN)\s*\(TATA\)\s*-\s*(ERNAKULAM\s+JN)\s*\(ERS\)/i
      );

    if (routeMatch) {

      trainName =
        `${routeMatch[1]} - ${routeMatch[2]}`;

      if (!source) {
        source = "TATA";
      }

      if (!destination) {
        destination = "ERS";
      }
    }

    if (!trainName) {

      const generalRoute =
        bodyText.match(
          /\b(TATANAGAR\s+JN)\s*-\s*(ERNAKULAM\s+JN)\b/i
        );

      if (generalRoute) {

        trainName =
          `${generalRoute[1]} - ${generalRoute[2]}`;

        if (!source) {
          source = "TATA";
        }

        if (!destination) {
          destination = "ERS";
        }
      }
    }

    return {

      trainNumber:
        trainNumber ||
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


  // ============================================================
  // COLLECT STOP ROWS
  // ============================================================

  collectStopRows($) {

    const rows = [];

    const selectors = [
      ".stopRow",
      ".w3-card-2",
    ];

    const seenElements =
      new Set();

    for (
      const selector of selectors
    ) {

      $(selector).each(
        (index, element) => {

          if (
            seenElements.has(element)
          ) {
            return;
          }

          const $row =
            $(element);

          const rawText =
            this.cleanText(
              $row.text()
            );

          if (!rawText) {
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
            $row.hasClass(
              "nonStopRow"
            ) ||
            $row.find(
              ".nonStopRow"
            ).length
          ) {
            return;
          }

          const looksLikeStation =
            /\b[A-Z][A-Z0-9]{1,7}\s+PF\b/i.test(
              rawText
            ) ||
            /\bSRC\b/i.test(
              rawText
            ) ||
            /\bDSTN?\b/i.test(
              rawText
            );

          if (!looksLikeStation) {
            return;
          }

          seenElements.add(element);

          rows.push({
            element,
            index: rows.length,
          });
        }
      );
    }

    return rows;
  }


  // ============================================================
  // PARSE ALL STOPS
  // ============================================================

  parseStops(
    $,
    rows,
    journeyDate
  ) {

    if (
      !rows ||
      !rows.length
    ) {
      return [];
    }

    const parsedRows =
      rows
        .map(
          ({ element, index }) =>
            this.parseStopRow(
              $,
              $(element),
              index
            )
        )
        .filter(
          (stop) =>
            Boolean(
              stop.code
            )
        );

    const filtered =
      this.filterByJourneyDate(
        parsedRows,
        journeyDate
      );

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

      if (!code) {
        continue;
      }

      if (
        seenCodes.has(code)
      ) {
        continue;
      }

      seenCodes.add(code);

      unique.push(stop);
    }

    if (
      unique.length > 0
    ) {

      unique[0].isSource =
        true;

      unique[0].status =
        "SOURCE";
    }

    if (
      unique.length > 1
    ) {

      const last =
        unique[
          unique.length - 1
        ];

      last.isDestination =
        true;

      last.status =
        "DESTINATION";
    }

    return unique.map(
      (stop, index) => ({

        ...stop,

        sequence:
          index + 1,

        routeOrder:
          index + 1,
      })
    );
  }


  // ============================================================
  // JOURNEY DATE FILTER
  // ============================================================

  filterByJourneyDate(
    stops,
    journeyDate
  ) {

    if (
      !journeyDate
    ) {
      return [];
    }

    const target =
      this.normalizeDate(
        journeyDate
      );

    if (!target) {
      return [];
    }

    const targetParts =
      target.split("-");

    const targetDayMonth =
      targetParts
        .slice(0, 2)
        .join("-");

    return stops.filter(
      (stop) => {

        const primaryDate =
          this.extractPrimaryRowDate(
            stop.rawText
          );

        if (primaryDate) {

          return this.dateMatchesTarget(
            primaryDate,
            target,
            targetDayMonth
          );
        }

        const directDates = [
          stop.arrivalDate,
          stop.departureDate,
        ]
          .filter(Boolean);

        for (
          const date of directDates
        ) {

          if (
            this.dateMatchesTarget(
              date,
              target,
              targetDayMonth
            )
          ) {
            return true;
          }
        }

        return false;
      }
    );
  }


  // ============================================================
  // PRIMARY ROW DATE
  // ============================================================

  extractPrimaryRowDate(
    rawText
  ) {

    if (!rawText) {
      return null;
    }

    const match =
      rawText.match(
        /\b\d{1,2}:\d{2}\s+(\d{1,2}-[A-Za-z]{3}(?:-\d{4})?)\b/
      );

    if (
      match &&
      match[1]
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


  dateMatchesTarget(
    date,
    target,
    targetDayMonth
  ) {

    const normalized =
      this.normalizeDate(
        date
      );

    if (!normalized) {
      return false;
    }

    if (
      normalized === target
    ) {
      return true;
    }

    const parts =
      normalized.split("-");

    const dayMonth =
      parts
        .slice(0, 2)
        .join("-");

    return (
      dayMonth ===
      targetDayMonth
    );
  }


  // ============================================================
  // INDIVIDUAL STOP
  // ============================================================

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
        $row
      );

    const isSource =
      /\bSRC\b/i.test(
        rawText
      );

    const isDestination =
      /\bDSTN?\b/i.test(
        rawText
      );

    const timing =
      this.extractStopTimings(
        $,
        $row,
        rawText,
        isSource,
        isDestination
      );

    const arrival =
      timing.arrival;

    const departure =
      timing.departure;

    const platform =
      this.extractPlatform(
        rawText
      );

    const distanceKm =
      this.extractDistance(
        rawText
      );

    const arrivalDelay =
      this.calculateDelayMinutes(
        arrival.scheduled,
        arrival.actual
      );

    const departureDelay =
      this.calculateDelayMinutes(
        departure.scheduled,
        departure.actual
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

      arrivalDelayMinutes:
        arrivalDelay,

      departureDelayMinutes:
        departureDelay,

      delayMinutes:
        arrivalDelay !== null
          ? arrivalDelay
          : departureDelay,

      arrivalStatus:
        arrival.status,

      departureStatus:
        departure.status,

      isSource,

      isDestination,

      status:
        isSource
          ? "SOURCE"
          : isDestination
            ? "DESTINATION"
            : null,

      rawText,
    };
  }


  // ============================================================
  // NEW - EXTRACT STOP TIMINGS
  // ============================================================

  extractStopTimings(
    $,
    $row,
    rawText,
    isSource,
    isDestination
  ) {

    const columns =
      this.getRowColumns(
        $,
        $row
      );

    let arrival =
      this.parseTimeBlock(
        columns.left
      );

    let departure =
      this.parseTimeBlock(
        columns.right
      );

    /*
     * Get all timetable time entries from the row.
     */
    const timetableText =
      this.getTimetableText(
        rawText
      );

    const orderedTimes =
      this.extractAllTimePairs(
        timetableText
      );

    /*
     * ========================================================
     * SOURCE
     * ========================================================
     */

    if (
      isSource
    ) {

      if (
        !departure.scheduled &&
        orderedTimes.length > 0
      ) {

        departure =
          this.timeInfoFromPairGroup(
            orderedTimes,
            0
          );
      }

      /*
       * Source has departure only.
       */
      arrival =
        this.emptyTimeInfo();

      return {
        arrival,
        departure,
      };
    }

    /*
     * ========================================================
     * DESTINATION
     * ========================================================
     */

    if (
      isDestination
    ) {

      if (
        !arrival.scheduled &&
        orderedTimes.length > 0
      ) {

        arrival =
          this.timeInfoFromPairGroup(
            orderedTimes,
            0
          );
      }

      /*
       * Destination has arrival only.
       */
      departure =
        this.emptyTimeInfo();

      return {
        arrival,
        departure,
      };
    }

    /*
     * ========================================================
     * INTERMEDIATE STATION
     * ========================================================
     *
     * This is the important fix.
     *
     * Example:
     *
     * 05:36 16-Sep
     * 05:38 16-Sep
     * 05:38 16-Sep
     * 05:40 16-Sep
     *
     * becomes:
     *
     * arrival:
     *   scheduled = 05:36
     *   actual    = 05:38
     *
     * departure:
     *   scheduled = 05:38
     *   actual    = 05:40
     *
     * Previously the parser was often detecting only
     * the departure/right column.
     */
    if (
      orderedTimes.length >= 4
    ) {

      arrival =
        this.timeInfoFromPairGroup(
          orderedTimes,
          0
        );

      departure =
        this.timeInfoFromPairGroup(
          orderedTimes,
          2
        );

      return {
        arrival,
        departure,
      };
    }

    /*
     * If DOM extraction already found timing information,
     * preserve it.
     */
    if (
      arrival.scheduled ||
      departure.scheduled
    ) {

      return {
        arrival,
        departure,
      };
    }

    /*
     * Last fallback.
     */
    if (
      orderedTimes.length >= 2
    ) {

      arrival =
        this.timeInfoFromPairGroup(
          orderedTimes,
          0
        );
    }

    return {
      arrival,
      departure,
    };
  }


  // ============================================================
  // TIMETABLE TEXT
  // ============================================================

  getTimetableText(
    rawText
  ) {

    let text =
      this.cleanText(
        rawText
      );

    /*
     * Remove coach-position section because it may contain
     * unrelated times/numbers.
     */
    text =
      text.replace(
        /Coach\s+Position[\s\S]*$/i,
        ""
      );

    /*
     * Remove running-status text if it occurs in the row.
     */
    text =
      text.replace(
        /(?:Current\s+Position|Upcoming\s+Station|Last\s+Updated)[\s\S]*$/i,
        ""
      );

    return this.cleanText(
      text
    );
  }


  // ============================================================
  // STATION INFO
  // ============================================================

  extractStationInfo(
    $,
    $row
  ) {

    const rowText =
      this.cleanText(
        $row.text()
      );

    let code =
      null;

    let name =
      null;

    const codeMatch =
      rowText.match(
        /\b([A-Z][A-Z0-9]{1,7})\s+PF\b/i
      );

    if (
      codeMatch &&
      codeMatch[1]
    ) {

      code =
        codeMatch[1]
          .toUpperCase();
    }

    const boldTexts =
      $row
        .find("b")
        .map(
          (_, element) =>
            this.cleanText(
              $(element).text()
            )
        )
        .get()
        .filter(Boolean);

    if (code) {

      const codeIndex =
        boldTexts.findIndex(
          (text) =>
            new RegExp(
              `\\b${this.escapeRegex(code)}\\s+PF\\b`,
              "i"
            ).test(text)
        );

      if (
        codeIndex > 0
      ) {

        name =
          this.cleanStationName(
            boldTexts[
              codeIndex - 1
            ]
          );
      }
    }

    if (!name) {

      for (
        const text of boldTexts
      ) {

        if (
          /\bPF\b/i.test(text)
        ) {
          continue;
        }

        if (
          /\bSRC\b/i.test(text)
        ) {
          continue;
        }

        if (
          /\bDSTN?\b/i.test(text)
        ) {
          continue;
        }

        if (
          /\d{1,2}:\d{2}/.test(text)
        ) {
          continue;
        }

        if (
          text.length >= 3 &&
          text.length <= 80
        ) {

          name =
            this.cleanStationName(
              text
            );

          break;
        }
      }
    }

    if (
      !name &&
      code
    ) {

      const escapedCode =
        this.escapeRegex(
          code
        );

      const match =
        rowText.match(
          new RegExp(
            `([A-Z][A-Z .&'()\\-]{2,80}?)\\s+${escapedCode}\\s+PF`,
            "i"
          )
        );

      if (match) {

        name =
          this.cleanStationName(
            match[1]
          );
      }
    }

    if (name) {

      name =
        name
          .replace(
            /\b\d{1,2}:\d{2}\b/g,
            ""
          )
          .replace(
            /\b\d{1,2}-[A-Za-z]{3}(?:-\d{4})?\b/g,
            ""
          )
          .trim();
    }

    return {

      code:
        code ||
        null,

      name:
        name ||
        null,
    };
  }


  // ============================================================
  // ROW COLUMNS
  // ============================================================

  getRowColumns(
    $,
    $row
  ) {

    const children =
      $row.children("div");

    let left =
      "";

    let right =
      "";

    $row
      .find("div")
      .each(
        (_, element) => {

          const $div =
            $(element);

          const text =
            this.cleanText(
              $div.text()
            );

          if (!text) {
            return;
          }

          const style =
            (
              $div.attr("style") ||
              ""
            ).toLowerCase();

          if (
            style.includes(
              "text-align:right"
            )
          ) {

            if (
              /\b\d{1,2}:\d{2}\b/.test(
                text
              )
            ) {

              right =
                right ||
                text;
            }
          }

          if (
            style.includes(
              "text-align:left"
            )
          ) {

            if (
              /\b\d{1,2}:\d{2}\b/.test(
                text
              )
            ) {

              left =
                left ||
                text;
            }
          }
        }
      );

    if (
      !left &&
      !right &&
      children.length >= 2
    ) {

      const texts =
        children
          .map(
            (_, element) =>
              this.cleanText(
                $(element).text()
              )
          )
          .get();

      for (
        const text of texts
      ) {

        if (
          !/\b\d{1,2}:\d{2}\b/.test(
            text
          )
        ) {
          continue;
        }

        if (!left) {
          left = text;
        } else if (!right) {
          right = text;
        }
      }
    }

    return {

      left,

      center:
        "",

      right,
    };
  }


  // ============================================================
  // TIME BLOCK
  // ============================================================

  parseTimeBlock(
    text
  ) {

    const clean =
      this.cleanText(
        text
      );

    if (!clean) {
      return this.emptyTimeInfo();
    }

    const matches = [
      ...clean.matchAll(
        /\b(\d{1,2}:\d{2})\s*(\d{1,2}-[A-Za-z]{3}(?:-\d{4})?)?\*?/g
      ),
    ];

    if (
      !matches.length
    ) {
      return this.emptyTimeInfo();
    }

    const scheduled =
      matches[0]?.[1] ||
      null;

    const scheduledDate =
      matches[0]?.[2] ||
      null;

    const actual =
      matches.length > 1
        ? matches[1]?.[1] ||
          null
        : null;

    const actualDate =
      matches.length > 1
        ? matches[1]?.[2] ||
          null
        : null;

    let status =
      "SCHEDULED";

    if (actual) {

      const delay =
        this.calculateDelayMinutes(
          scheduled,
          actual
        );

      if (
        delay === null
      ) {

        status =
          "ACTUAL";

      } else if (
        delay > 0
      ) {

        status =
          "DELAYED";

      } else if (
        delay < 0
      ) {

        status =
          "EARLY";

      } else {

        status =
          "ON_TIME";
      }
    }

    return {

      scheduled,

      actual,

      date:
        actualDate ||
        scheduledDate ||
        null,

      status,
    };
  }


  // ============================================================
  // EMPTY TIME INFO
  // ============================================================

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


  // ============================================================
  // EXTRACT ALL TIME PAIRS
  // ============================================================

  extractAllTimePairs(
    text
  ) {

    const matches = [
      ...String(
        text || ""
      ).matchAll(
        /\b(\d{1,2}:\d{2})\s*(\d{1,2}-[A-Za-z]{3}(?:-\d{4})?)?\*?/g
      ),
    ];

    return matches.map(
      (match) => ({

        time:
          match[1] ||
          null,

        date:
          match[2] ||
          null,
      })
    );
  }


  // ============================================================
  // TIME INFO FROM PAIR
  // ============================================================

  timeInfoFromPair(
    pair
  ) {

    if (!pair) {
      return this.emptyTimeInfo();
    }

    return this.buildTimeInfo(
      pair,
      null
    );
  }


  // ============================================================
  // TIME INFO FROM PAIR GROUP
  // ============================================================

  timeInfoFromPairGroup(
    pairs,
    startIndex
  ) {

    if (
      !pairs ||
      !pairs[startIndex]
    ) {
      return this.emptyTimeInfo();
    }

    const scheduledPair =
      pairs[startIndex];

    const actualPair =
      pairs[startIndex + 1] ||
      null;

    return this.buildTimeInfo(
      scheduledPair,
      actualPair
    );
  }


  // ============================================================
  // BUILD TIME INFO
  // ============================================================

  buildTimeInfo(
    scheduledPair,
    actualPair
  ) {

    if (
      !scheduledPair
    ) {
      return this.emptyTimeInfo();
    }

    const scheduled =
      scheduledPair.time ||
      null;

    const actual =
      actualPair?.time ||
      null;

    const scheduledDate =
      scheduledPair.date ||
      null;

    const actualDate =
      actualPair?.date ||
      null;

    let status =
      "SCHEDULED";

    if (actual) {

      const delay =
        this.calculateDelayMinutes(
          scheduled,
          actual
        );

      if (
        delay === null
      ) {

        status =
          "ACTUAL";

      } else if (
        delay > 0
      ) {

        status =
          "DELAYED";

      } else if (
        delay < 0
      ) {

        status =
          "EARLY";

      } else {

        status =
          "ON_TIME";
      }
    }

    return {

      scheduled,

      actual,

      date:
        actualDate ||
        scheduledDate ||
        null,

      status,
    };
  }


  // ============================================================
  // PLATFORM
  // ============================================================

  extractPlatform(
    text
  ) {

    const match =
      String(
        text || ""
      ).match(
        /\bPF\s*([A-Z0-9-]+)\*?/i
      );

    return match
      ? match[1]
      : null;
  }


  // ============================================================
  // DISTANCE
  // ============================================================

  extractDistance(
    text
  ) {

    const match =
      String(
        text || ""
      ).match(
        /\b(\d+(?:\.\d+)?)\s*KMs?\b/i
      );

    if (!match) {
      return null;
    }

    return Number(
      match[1]
    );
  }


  // ============================================================
  // RUNNING STATUS
  // ============================================================

  parseRunningStatus(
    $,
    journeyDate
  ) {

    const bodyText =
      this.cleanText(
        $("body").text()
      );

    /*
     * ARRIVED
     */

    const arrivedRegex =
      /Arrived\s+at\s+(.+?)\s*\(([A-Z0-9]{2,8})\)\s+at\s+(\d{1,2}:\d{2})\s+(\d{1,2}-[A-Za-z]{3}(?:-\d{4})?)/gi;

    const arrivedMatches = [
      ...bodyText.matchAll(
        arrivedRegex
      ),
    ];

    for (
      const match of arrivedMatches
    ) {

      const station =
        this.cleanStationName(
          match[1]
        );

      const code =
        match[2]
          .toUpperCase();

      const time =
        match[3];

      const date =
        match[4];

      if (
        journeyDate &&
        !this.datesMatchTarget(
          date,
          journeyDate
        )
      ) {
        continue;
      }

      return {

        state:
          "ARRIVED",

        currentStation:
          station,

        currentStationCode:
          code,

        currentTime:
          time,

        currentDate:
          date,

        upcomingStation:
          null,

        upcomingStationCode:
          null,

        journeyDate:
          journeyDate ||
          null,

        rawText:
          match[0],
      };
    }


    /*
     * DEPARTED
     */

    const departedRegex =
      /Departed\s+from\s+(.+?)\s*\(([A-Z0-9]{2,8})\)\s+(?:on|at)\s+(\d{1,2}-[A-Za-z]{3}(?:-\d{4})?)\s+(\d{1,2}:\d{2})/gi;

    const departedMatches = [
      ...bodyText.matchAll(
        departedRegex
      ),
    ];

    for (
      const match of departedMatches
    ) {

      const station =
        this.cleanStationName(
          match[1]
        );

      const code =
        match[2]
          .toUpperCase();

      const date =
        match[3];

      const time =
        match[4];

      if (
        journeyDate &&
        !this.datesMatchTarget(
          date,
          journeyDate
        )
      ) {
        continue;
      }

      const upcoming =
        this.extractUpcomingStation(
          bodyText,
          journeyDate
        );

      return {

        state:
          "DEPARTED",

        currentStation:
          station,

        currentStationCode:
          code,

        currentTime:
          time,

        currentDate:
          date,

        upcomingStation:
          upcoming.station,

        upcomingStationCode:
          upcoming.code,

        journeyDate:
          journeyDate ||
          null,

        rawText:
          match[0],
      };
    }


    /*
     * GENERIC CURRENT POSITION
     */

    const currentRegex =
      /Current\s+Position\s*[:\-]?\s*(.+?)(?=\s+Upcoming\s+Station|\s+Last\s+Updates|\s*$)/i;

    const currentMatch =
      bodyText.match(
        currentRegex
      );

    if (
      currentMatch
    ) {

      const position =
        this.cleanText(
          currentMatch[1]
        );

      const codeMatch =
        position.match(
          /\(([A-Z0-9]{2,8})\)/
        );

      return {

        state:
          "RUNNING",

        currentStation:
          position.replace(
            /\s*\([A-Z0-9]{2,8}\)/,
            ""
          ).trim(),

        currentStationCode:
          codeMatch
            ? codeMatch[1]
                .toUpperCase()
            : null,

        currentTime:
          this.extractFirstTime(
            position
          ),

        currentDate:
          this.extractDateFromText(
            position
          ),

        upcomingStation:
          null,

        upcomingStationCode:
          null,

        journeyDate:
          journeyDate ||
          null,

        rawText:
          currentMatch[0],
      };
    }


    /*
     * NOT STARTED
     */

    const notStartedRegex =
      /Yet\s+to\s+start\s+from\s+its\s+source/i;

    if (
      notStartedRegex.test(
        bodyText
      )
    ) {

      const startDate =
        this.extractStartDate(
          $
        );

      if (
        !journeyDate ||
        !startDate ||
        this.datesMatchTarget(
          startDate,
          journeyDate
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

          currentDate:
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
    }


    /*
     * UNKNOWN
     */

    return {

      state:
        "UNKNOWN",

      currentStation:
        null,

      currentStationCode:
        null,

      currentTime:
        null,

      currentDate:
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


  // ============================================================
  // UPCOMING STATION
  // ============================================================

  extractUpcomingStation(
    bodyText,
    journeyDate
  ) {

    const regex =
      /Upcoming\s+Station\s*[:\-]?\s*(.+?)\s*\(([A-Z0-9]{2,8})\)/i;

    const match =
      bodyText.match(
        regex
      );

    if (!match) {

      return {

        station:
          null,

        code:
          null,
      };
    }

    return {

      station:
        this.cleanStationName(
          match[1]
        ),

      code:
        match[2]
          .toUpperCase(),
    };
  }


  // ============================================================
  // FIRST TIME
  // ============================================================

  extractFirstTime(
    text
  ) {

    const match =
      String(
        text || ""
      ).match(
        /\b(\d{1,2}:\d{2})\b/
      );

    return match
      ? match[1]
      : null;
  }


  // ============================================================
  // DATE FROM TEXT
  // ============================================================

  extractDateFromText(
    text
  ) {

    if (!text) {
      return null;
    }

    const match =
      String(
        text
      ).match(
        /\b(\d{1,2}-[A-Za-z]{3}(?:-\d{4})?)\b/
      );

    return match
      ? match[1]
      : null;
  }


  // ============================================================
  // DATE COMPARISON
  // ============================================================

  datesMatchTarget(
    a,
    b
  ) {

    const normalizedA =
      this.normalizeDate(
        a
      );

    const normalizedB =
      this.normalizeDate(
        b
      );

    if (
      !normalizedA ||
      !normalizedB
    ) {
      return false;
    }

    if (
      normalizedA ===
      normalizedB
    ) {
      return true;
    }

    const aParts =
      normalizedA.split("-");

    const bParts =
      normalizedB.split("-");

    if (
      aParts.length >= 2 &&
      bParts.length >= 2
    ) {

      return (
        aParts[0] ===
          bParts[0] &&

        aParts[1] ===
          bParts[1]
      );
    }

    return false;
  }


  // ============================================================
  // DATE NORMALIZATION
  // ============================================================

  normalizeDate(
    date
  ) {

    if (!date) {
      return null;
    }

    const value =
      String(
        date
      )
        .trim()
        .replace(
          /\*/g,
          ""
        );

    let match =
      value.match(
        /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/
      );

    if (match) {

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

    if (match) {

      return (
        `${match[1].padStart(2, "0")}-` +
        `${match[2].toLowerCase()}`
      );
    }

    return value.toLowerCase();
  }


  // ============================================================
  // DELAY CALCULATION
  // ============================================================

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

    /*
     * Midnight crossing.
     */
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


  // ============================================================
  // TIME -> MINUTES
  // ============================================================

  timeToMinutes(
    time
  ) {

    const match =
      String(
        time
      ).match(
        /^(\d{1,2}):(\d{2})$/
      );

    if (!match) {
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


  // ============================================================
  // REGEX ESCAPE
  // ============================================================

  escapeRegex(
    value
  ) {

    return String(
      value
    ).replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
  }


  // ============================================================
  // TEXT CLEANING
  // ============================================================

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
        /\s+/g,
        " "
      )
      .trim();
  }


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
}


// ============================================================
// EXPORT SINGLETON
// ============================================================

module.exports =
  new NTESParser();