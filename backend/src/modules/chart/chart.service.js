const axios = require("axios");
const Chart = require("./chart.model");

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
  // ==========================================
  // Train Composition
  // ==========================================

  async fetchAndCacheChart(trainNumber, journeyDate, boardingStation) {
    try {
      const payload = {
        trainNo: trainNumber,
        jDate: journeyDate,
        boardingStation,
      };

      console.log("\n========================================");
      console.log("🚆 Calling IRCTC Train Composition API");
      console.log("========================================");
      console.log(payload);

      const response = await axios.post(
        TRAIN_COMPOSITION_URL,
        payload,
        {
          headers: COMMON_HEADERS,
          timeout: 10000,
        }
      );

      console.log("✅ Train Composition Response Received");
      console.log("\n============= TRAIN COMPOSITION RESPONSE =============");
console.dir(response.data, { depth: null });

      const data = response.data;

      const chartPrepared = !data.error;

      const chart = await Chart.findOneAndUpdate(
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

          trainName: data.trainName || null,

          from: data.from || null,

          to: data.to || null,

          chartOneDate: data.chartOneDate || null,

          chartTwoDate: data.chartTwoDate || null,

          cdd: data.cdd || [],

          vbd: data.vbd || [],

          rawResponse: data,

          fetchedAt: new Date(),
        },
        {
          new: true,
          upsert: true,
        }
      );

      console.log("✅ Chart Cached");

      return chart;
    } catch (err) {
      console.log("\n========================================");
      console.log("❌ Train Composition Error");
      console.log("========================================");

      console.log(err.message);

      if (err.response) {
        console.log(err.response.status);
        console.log(err.response.data);
      }

      throw err;
    }
  }

  // ==========================================
  // Vacant Berth
  // ==========================================

  async fetchVacantBerth(
    trainNumber,
    journeyDate,
    boardingStation,
    classCode,
    chartType = 2
  ) {
    try {
      const payload = {
        trainNo: trainNumber,
        boardingStation,
        remoteStation: boardingStation,
        trainSourceStation: boardingStation,
        cls: classCode,
        chartType,
        jDate: journeyDate,
      };

      console.log("\n========================================");
      console.log("🚆 Calling IRCTC Vacant Berth API");
      console.log("========================================");
      console.log(payload);

      const response = await axios.post(
        VACANT_BERTH_URL,
        payload,
        {
          headers: COMMON_HEADERS,
          timeout: 10000,
        }
      );

      console.log("✅ Vacant Berth Response Received");
      console.log("\n============= VACANT BERTH RESPONSE =============");
console.dir(response.data, { depth: null });

      return response.data;
    } catch (err) {
      console.log("\n========================================");
      console.log("❌ Vacant Berth Error");
      console.log("========================================");

      console.log(err.message);

      if (err.response) {
        console.log(err.response.status);
        console.log(err.response.data);
      }

      throw err;
    }
  }
}

module.exports = new ChartService();