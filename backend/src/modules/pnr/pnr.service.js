const { configure, checkPNRStatus } = require("railkit");
const PNR = require("./pnr.model");

let railKitConfigured = false;

const configureRailKit = () => {
  if (railKitConfigured) return;

  const apiKey = process.env.RAILKIT_API_KEY;

  if (!apiKey) {
    const error = new Error("RAILKIT_API_KEY is not configured.");
    error.statusCode = 500;
    throw error;
  }

  configure(apiKey);
  railKitConfigured = true;
};

const normalizePNR = (pnr) =>
  String(pnr || "").replace(/\D/g, "");

const checkPNRService = async (pnr, userId) => {
  configureRailKit();

  const normalizedPNR = normalizePNR(pnr);

  if (!/^\d{10}$/.test(normalizedPNR)) {
    const error = new Error("PNR must contain exactly 10 digits.");
    error.statusCode = 400;
    throw error;
  }

  if (!userId) {
    const error = new Error("User authentication is required.");
    error.statusCode = 401;
    throw error;
  }

  let result;

  try {
    result = await checkPNRStatus(normalizedPNR);
  } catch (error) {
    console.error("❌ RAILKIT PNR ERROR:", error.message);

    const serviceError = new Error(
      error.message || "Unable to fetch PNR status from RailKit."
    );

    serviceError.statusCode = error.statusCode || 502;
    throw serviceError;
  }

  if (!result || result.success !== true || !result.data) {
    const error = new Error(
      result?.error || "No PNR data found or invalid PNR number."
    );

    error.statusCode = 404;
    throw error;
  }

  const data = result.data;

  const pnrDocument = {
    userId,
    pnr: normalizedPNR,

    train: {
      number: data.train?.number || "",
      name: data.train?.name || "",
    },

    journey: {
      dateOfJourney: data.journey?.dateOfJourney || "",
      class: data.journey?.class || "",
      quota: data.journey?.quota || "",

      source: {
        code: data.journey?.source?.code || "",
        name: data.journey?.source?.name || "",
      },

      destination: {
        code: data.journey?.destination?.code || "",
        name: data.journey?.destination?.name || "",
      },

      boardingPoint: {
        code: data.journey?.boardingPoint?.code || "",
        name: data.journey?.boardingPoint?.name || "",
      },

      distance: data.journey?.distance ?? null,
      arrivalDate: data.journey?.arrivalDate || "",
    },

    chart: {
      status: data.chart?.status || "",
    },

    booking: {
      fare: data.booking?.fare ?? null,
      ticketFare: data.booking?.ticketFare ?? null,
      bookingDate: data.booking?.bookingDate || "",
    },

    passengers: Array.isArray(data.passengers)
      ? data.passengers.map((passenger) => ({
          serialNumber: passenger.serialNumber || "",
          coachPosition: passenger.coachPosition ?? null,

          booking: {
            status: passenger.booking?.status || "",
            coach: passenger.booking?.coach || "",
            berthNo: passenger.booking?.berthNo ?? null,
            berthCode: passenger.booking?.berthCode || "",
            details: passenger.booking?.details || "",
          },

          current: {
            status: passenger.current?.status || "",
            coach: passenger.current?.coach || "",
            berthNo: passenger.current?.berthNo ?? null,
            berthCode: passenger.current?.berthCode || "",
            details: passenger.current?.details || "",
          },
        }))
      : [],

    lastCheckedAt: new Date(),
  };

  return await PNR.findOneAndUpdate(
    {
      userId,
      pnr: normalizedPNR,
    },
    {
      $set: pnrDocument,
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  ).lean();
};

const getAllPNRsService = async (userId) => {
  return await PNR.find({ userId })
    .sort({ updatedAt: -1 })
    .lean();
};

const getPNRByIdService = async (pnrId, userId) => {
  const pnr = await PNR.findOne({
    _id: pnrId,
    userId,
  }).lean();

  if (!pnr) {
    const error = new Error("PNR not found.");
    error.statusCode = 404;
    throw error;
  }

  return pnr;
};

const deletePNRService = async (pnrId, userId) => {
  const pnr = await PNR.findOneAndDelete({
    _id: pnrId,
    userId,
  }).lean();

  if (!pnr) {
    const error = new Error("PNR not found.");
    error.statusCode = 404;
    throw error;
  }

  return pnr;
};

module.exports = {
  checkPNRService,
  getAllPNRsService,
  getPNRByIdService,
  deletePNRService,
};