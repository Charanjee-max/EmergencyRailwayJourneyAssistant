const axios = require("axios");
const Chart = require("./chart.model");
const ChartEvent = require("./chartEvent.model");

const TRAIN_COMPOSITION_URL =
  "https://www.irctc.co.in/online-charts/api/trainComposition";

const VACANT_BERTH_URL =
  "https://www.irctc.co.in/online-charts/api/vacantBerth";

const COMMON_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
  Origin: "https://www.irctc.co.in",
  Referer: "https://www.irctc.co.in/online-charts/",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
};

class ChartService {
  // =========================================================
  // SAVE CHART EVENT
  // =========================================================
  //
  // Stores individual chart preparation events.
  //
  // Examples:
  //
  // FIRST
  // INTERMEDIATE
  // FINAL
  //
  // We keep every event instead of overwriting old
  // chart preparation times.
  // =========================================================

  async saveChartEvent({
    journeyId,
    trainNumber,
    journeyDate,
    sequence,
    chartType,
    stationCode,
    stationName = "",
    expectedAt = null,
    checkedAt = new Date(),
    preparedAt = null,
    prepared = false,
    rawStatus = "",
  }) {
    try {
      if (
        !journeyId ||
        !trainNumber ||
        !journeyDate ||
        !stationCode
      ) {
        console.log(
          "⚠️ Chart event skipped: required information missing."
        );

        return null;
      }

      const normalizedTrainNumber =
        String(trainNumber).trim();

      const normalizedJourneyDate =
        String(journeyDate).trim();

      const normalizedStationCode =
        String(stationCode)
          .trim()
          .toUpperCase();

      if (
        !normalizedTrainNumber ||
        !normalizedJourneyDate ||
        !normalizedStationCode
      ) {
        console.log(
          "⚠️ Chart event skipped: invalid chart event data."
        );

        return null;
      }

      const chartEvent =
        await ChartEvent.findOneAndUpdate(
          {
            journey: journeyId,
            sequence,
          },
          {
            journey: journeyId,

            trainNumber:
              normalizedTrainNumber,

            journeyDate:
              normalizedJourneyDate,

            sequence,

            chartType,

            stationCode:
              normalizedStationCode,

            stationName:
              String(
                stationName || ""
              ).trim(),

            expectedAt,

            checkedAt,

            preparedAt,

            prepared,

            source: "IRCTC",

            rawStatus:
              String(
                rawStatus || ""
              ),
          },
          {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
          }
        ).lean();

      console.log(
        `💾 Chart event saved: ${chartType} | ${normalizedStationCode}`
      );

      if (preparedAt) {
        console.log(
          "🕒 Chart prepared at:",
          preparedAt
        );
      }

      return chartEvent;
    } catch (error) {
      console.log(
        "⚠️ Failed to save chart event:",
        error.message
      );

      /*
       * Chart-event history should never make the
       * main chart workflow fail.
       */
      return null;
    }
  }

  // =========================================================
  // TRAIN COMPOSITION / CHART STATUS
  // =========================================================

  async fetchAndCacheChart(
    trainNumber,
    journeyDate,
    boardingStation,
    chartOptions = {}
  ) {
    try {
      const payload = {
        trainNo: trainNumber,
        jDate: journeyDate,
        boardingStation,
      };

      console.log(
        "\n========================================"
      );

      console.log(
        "🚆 Calling IRCTC Train Composition API"
      );

      console.log(
        "========================================"
      );

      console.log(payload);

      const response =
        await axios.post(
          TRAIN_COMPOSITION_URL,
          payload,
          {
            headers:
              COMMON_HEADERS,

            timeout:
              10000,
          }
        );

      console.log(
        "✅ Train Composition Response Received"
      );

      console.log(
        "\n============= TRAIN COMPOSITION RESPONSE ============="
      );

      console.dir(
        response.data,
        {
          depth: null,
        }
      );

      const data =
        response.data || {};

      // =====================================================
      // REAL IRCTC CHART STATUS
      // =====================================================
      //
      // IRCTC provides chart status through:
      //
      // chartStatusResponseDto.chartOneFlag
      // chartStatusResponseDto.chartTwoFlag
      //
      // Based on the currently observed IRCTC response:
      //
      // 0 = not prepared
      // 1 = prepared
      //
      // Some responses can use additional status values.
      // We treat 1 and 3 as prepared because ERJA has
      // already observed chartOneFlag = 3 in a prepared
      // IRCTC response.
      // =====================================================

      const chartStatus =
        data.chartStatusResponseDto ||
        {};

      const chartOneFlag =
        Number(
          chartStatus.chartOneFlag || 0
        );

      const chartTwoFlag =
        Number(
          chartStatus.chartTwoFlag || 0
        );

      const chartOnePrepared =
        chartOneFlag === 1 ||
        chartOneFlag === 3;

      const chartTwoPrepared =
        chartTwoFlag === 1 ||
        chartTwoFlag === 3;

      const chartPrepared =
        chartOnePrepared ||
        chartTwoPrepared;

      console.log(
        "\n============= REAL CHART STATUS ============="
      );

      console.log(
        "Chart One Flag:",
        chartOneFlag
      );

      console.log(
        "Chart Two Flag:",
        chartTwoFlag
      );

      console.log(
        "Chart One Prepared:",
        chartOnePrepared
      );

      console.log(
        "Chart Two Prepared:",
        chartTwoPrepared
      );

      console.log(
        "Chart Prepared:",
        chartPrepared
      );

      // =====================================================
      // RAW CHART DATES
      // =====================================================

      const chartOneDate =
        data.chartOneDate ||
        null;

      const chartTwoDate =
        data.chartTwoDate ||
        null;

      console.log(
        "Chart One Date:",
        chartOneDate
      );

      console.log(
        "Chart Two Date:",
        chartTwoDate
      );

      // =====================================================
      // CACHE CHART
      // =====================================================

      const chart =
        await Chart.findOneAndUpdate(
          {
            trainNumber,
            journeyDate,
            boardingStation,
          },
          {
            trainNumber,
            journeyDate,
            boardingStation,

            chartPrepared,

            trainName:
              data.trainName ||
              null,

            from:
              data.from ||
              null,

            to:
              data.to ||
              null,

            chartOneDate,

            chartTwoDate,

            cdd:
              Array.isArray(
                data.cdd
              )
                ? data.cdd
                : [],

            vbd:
              Array.isArray(
                data.vbd
              )
                ? data.vbd
                : [],

            rawResponse:
              data,

            fetchedAt:
              new Date(),
          },
          {
            new: true,
            upsert: true,
          }
        );

      console.log(
        "✅ Chart Cached"
      );

      // =====================================================
      // SAVE CHART EVENTS
      // =====================================================
      //
      // Only save these when a journeyId is supplied.
      //
      // IMPORTANT:
      // We only use station information that is actually
      // available to ERJA. We do NOT invent intermediate
      // charting stations.
      // =====================================================

      const journeyId =
        chartOptions?.journeyId ||
        null;

      const expectedFirstChartAt =
        chartOptions?.firstChartTime ||
        null;

      const expectedFinalChartAt =
        chartOptions?.finalChartTime ||
        null;

      const checkedAt =
        new Date();

      if (journeyId) {
        // ===================================================
        // FIRST CHART EVENT
        // ===================================================

        await this.saveChartEvent({
          journeyId,

          trainNumber,

          journeyDate,

          sequence: 1,

          chartType:
            "FIRST",

          stationCode:
            boardingStation,

          stationName:
            chartOptions?.boardingStationName ||
            "",

          expectedAt:
            expectedFirstChartAt,

          checkedAt,

          preparedAt:
            chartOnePrepared &&
            chartOneDate
              ? this.parseIrctcDate(
                  chartOneDate
                )
              : null,

          prepared:
            chartOnePrepared,

          rawStatus:
            String(
              chartOneFlag
            ),
        });

        // ===================================================
        // FINAL / SECOND CHART EVENT
        // ===================================================
        //
        // Current IRCTC response exposes chartTwoDate.
        // We store it as FINAL for the current two-chart
        // model.
        //
        // If future IRCTC responses expose actual
        // intermediate charting stations/events, this
        // method can be extended without changing the
        // ChartEvent collection structure.
        // ===================================================

        await this.saveChartEvent({
          journeyId,

          trainNumber,

          journeyDate,

          sequence: 2,

          chartType:
            "FINAL",

          stationCode:
            chartOptions?.finalChartStationCode ||
            boardingStation,

          stationName:
            chartOptions?.finalChartStationName ||
            chartOptions?.boardingStationName ||
            "",

          expectedAt:
            expectedFinalChartAt,

          checkedAt,

          preparedAt:
            chartTwoPrepared &&
            chartTwoDate
              ? this.parseIrctcDate(
                  chartTwoDate
                )
              : null,

          prepared:
            chartTwoPrepared,

          rawStatus:
            String(
              chartTwoFlag
            ),
        });
      }

      // =====================================================
      // RETURN NORMALIZED CHART RESULT
      // =====================================================

      return {
        ...chart.toObject(),

        chartPrepared,

        chartOnePrepared,

        chartTwoPrepared,

        chartOneFlag,

        chartTwoFlag,

        chartOneDate,

        chartTwoDate,

        firstChartTime:
          expectedFirstChartAt,

        finalChartTime:
          expectedFinalChartAt,
      };
    } catch (err) {
      console.log(
        "\n========================================"
      );

      console.log(
        "❌ Train Composition Error"
      );

      console.log(
        "========================================"
      );

      console.log(
        "Message:",
        err.message
      );

      if (err.response) {
        console.log(
          "Status:",
          err.response.status
        );

        console.log(
          "Response:",
          err.response.data
        );
      }

      throw err;
    }
  }

  // =========================================================
  // PARSE IRCTC DATE
  // =========================================================
  //
  // IRCTC examples:
  //
  // "2026-09-07 14:33:25"
  //
  // JavaScript does not reliably interpret that string as
  // Asia/Kolkata on every environment.
  //
  // We explicitly treat the IRCTC chart timestamp as IST.
  // =========================================================

  parseIrctcDate(value) {
    if (!value) {
      return null;
    }

    if (
      value instanceof Date
    ) {
      return value;
    }

    const text =
      String(value).trim();

    if (!text) {
      return null;
    }

    // Already contains timezone information.
    if (
      /(?:Z|[+-]\d{2}:\d{2})$/.test(
        text
      )
    ) {
      const date =
        new Date(text);

      return Number.isNaN(
        date.getTime()
      )
        ? null
        : date;
    }

    // IRCTC format:
    // YYYY-MM-DD HH:mm:ss
    const match =
      text.match(
        /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/
      );

    if (!match) {
      const fallback =
        new Date(text);

      return Number.isNaN(
        fallback.getTime()
      )
        ? null
        : fallback;
    }

    const year =
      Number(match[1]);

    const month =
      Number(match[2]);

    const day =
      Number(match[3]);

    const hours =
      Number(match[4]);

    const minutes =
      Number(match[5]);

    const seconds =
      Number(match[6] || 0);

    /*
     * Convert IST to UTC.
     *
     * IST = UTC + 05:30
     */
    return new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        hours - 5,
        minutes - 30,
        seconds,
        0
      )
    );
  }

  // =========================================================
  // GET CHART EVENTS
  // =========================================================

  async getChartEvents(
    journeyId
  ) {
    if (!journeyId) {
      return [];
    }

    return ChartEvent.find({
      journey:
        journeyId,
    })
      .sort({
        sequence: 1,
      })
      .lean();
  }

  // =========================================================
  // VACANT BERTH
  // =========================================================

  async fetchVacantBerth(
    trainNumber,
    journeyDate,
    boardingStation,
    classCode,
    chartType = 1
  ) {
    try {
      const payload = {
        trainNo:
          trainNumber,

        boardingStation,

        remoteStation:
          boardingStation,

        trainSourceStation:
          boardingStation,

        cls:
          classCode,

        chartType,

        jDate:
          journeyDate,
      };

      console.log(
        "\n========================================"
      );

      console.log(
        "🚆 Calling IRCTC Vacant Berth API"
      );

      console.log(
        "========================================"
      );

      console.log(
        payload
      );

      const response =
        await axios.post(
          VACANT_BERTH_URL,
          payload,
          {
            headers:
              COMMON_HEADERS,

            timeout:
              10000,
          }
        );

      console.log(
        "✅ Vacant Berth Response Received"
      );

      console.log(
        "\n============= VACANT BERTH RESPONSE ============="
      );

      console.dir(
        response.data,
        {
          depth: null,
        }
      );

      return response.data;
    } catch (err) {
      console.log(
        "\n========================================"
      );

      console.log(
        "❌ Vacant Berth Error"
      );

      console.log(
        "========================================"
      );

      console.log(
        "Message:",
        err.message
      );

      if (err.response) {
        console.log(
          "Status:",
          err.response.status
        );

        console.log(
          "Response:",
          err.response.data
        );
      }

      throw err;
    }
  }
}

module.exports =
  new ChartService();