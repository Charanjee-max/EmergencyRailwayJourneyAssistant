const axios = require("axios");
const ntesParser = require("./ntesParser");

class NTESService {
  constructor() {
    this.timeout = 30000;
  }

  async fetchHtml(url) {
    if (!url) {
      throw new Error("NTES URL is required");
    }

    console.log("\n========== NTES FETCH ==========");
    console.log("Fetching NTES page...");

    try {
      const response = await axios.get(url, {
        timeout: this.timeout,

        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
            "AppleWebKit/537.36 (KHTML, like Gecko) " +
            "Chrome/139.0.0.0 Safari/537.36",

          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",

          "Accept-Language": "en-US,en;q=0.9",

          Connection: "keep-alive",
        },
      });

      console.log("NTES response:", response.status);
      console.log("HTML size:", response.data?.length || 0);

      return response.data;
    } catch (error) {
      console.error("\n========== NTES FETCH ERROR ==========");

      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Status text:", error.response.statusText);
      }

      console.error("Message:", error.message);

      throw new Error(
        `Failed to fetch NTES page: ${error.message}`
      );
    }
  }

  parseHtml(html, options = {}) {
    if (!html) {
      throw new Error("NTES HTML is empty");
    }

    console.log("\n========== NTES PARSER ==========");

    const result = ntesParser.parse(html, options);

    console.log("Train:", result.train?.trainNumber);
    console.log("Journey Date:", result.train?.journeyDate);
    console.log("Stops:", result.stops?.length || 0);

    console.log(
      "Running State:",
      result.status?.state
    );

    console.log(
      "Current Station:",
      result.status?.currentStation,
      result.status?.currentStationCode
    );

    console.log(
      "Upcoming Station:",
      result.status?.upcomingStation,
      result.status?.upcomingStationCode
    );

    return result;
  }

  async getTrainStatus({ url, journeyDate }) {
    const html = await this.fetchHtml(url);

    return this.parseHtml(html, {
      journeyDate,
    });
  }
}

module.exports = new NTESService();