import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  searchStation,
  searchTrain,
  getTrainClasses,
} from "../../api/trainAPI";
import "./AddJourney.css";

const INITIAL_FORM = {
  trainNumber: "",
  journeyDate: "",
  boardingStation: "",
  destinationStation: "",
  preferredClass: "",
  allowMixedClass: false,
};

const getTodayIndia = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());

const FEATURES = [
  ["🚆", "Enter Journey", "Provide your train and route details."],
  ["🔎", "Monitor Availability", "ERJA tracks available seats."],
  ["🧠", "Analyze & Optimize", "Find practical booking possibilities."],
  ["🎯", "Get Recommendation", "Receive the best available strategy."],
];

export default function AddJourney() {
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL_FORM);
  const [boardingSuggestions, setBoardingSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [classLoading, setClassLoading] = useState(false);
  const [classMessage, setClassMessage] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const boardingTimer = useRef(null);
  const destinationTimer = useRef(null);
  const classTimer = useRef(null);
  const trainTimer = useRef(null);

  const boardingController = useRef(null);
  const destinationController = useRef(null);
  const classController = useRef(null);
  const trainController = useRef(null);

  const boardingRequest = useRef(0);
  const destinationRequest = useRef(0);
  const classRequest = useRef(0);
  const trainRequest = useRef(0);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setMessage("");
  };

  /* ---------------- STATIONS ---------------- */

  const searchStations = useCallback((value, type) => {
    const query = String(value || "").trim();

    const timer =
      type === "boarding"
        ? boardingTimer
        : destinationTimer;

    const controller =
      type === "boarding"
        ? boardingController
        : destinationController;

    const request =
      type === "boarding"
        ? boardingRequest
        : destinationRequest;

    const setSuggestions =
      type === "boarding"
        ? setBoardingSuggestions
        : setDestinationSuggestions;

    clearTimeout(timer.current);
    controller.current?.abort();

    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    timer.current = setTimeout(async () => {
      const id = ++request.current;
      const abortController = new AbortController();

      controller.current = abortController;

      try {
        const response = await searchStation(query, {
          signal: abortController.signal,
        });

        if (id !== request.current) return;

        setSuggestions(response?.data?.data || []);
      } catch (error) {
        if (
          error?.name === "CanceledError" ||
          error?.code === "ERR_CANCELED"
        ) {
          return;
        }

        setSuggestions([]);
      }
    }, 300);
  }, []);

  const chooseStation = (station, type) => {
    const code = String(station?.code || "")
      .trim()
      .toUpperCase();

    if (!code) return;

    if (type === "boarding") {
      updateField("boardingStation", code);
      setBoardingSuggestions([]);
    } else {
      updateField("destinationStation", code);
      setDestinationSuggestions([]);
    }
  };

  /* ---------------- TRAIN ---------------- */

  useEffect(() => {
    const trainNumber = form.trainNumber.trim();

    clearTimeout(trainTimer.current);
    trainController.current?.abort();

    if (!/^\d{4,6}$/.test(trainNumber)) return;

    trainTimer.current = setTimeout(async () => {
      const id = ++trainRequest.current;
      const controller = new AbortController();

      trainController.current = controller;

      try {
        await searchTrain(trainNumber, {
          signal: controller.signal,
        });

        if (id !== trainRequest.current) return;
      } catch (error) {
        if (
          error?.name === "CanceledError" ||
          error?.code === "ERR_CANCELED"
        ) {
          return;
        }
      }
    }, 500);

    return () => {
      clearTimeout(trainTimer.current);
      trainController.current?.abort();
    };
  }, [form.trainNumber]);

  /* ---------------- DYNAMIC IRCTC CLASSES ---------------- */

  useEffect(() => {
    const trainNumber = form.trainNumber.trim();
    const journeyDate = form.journeyDate.trim();
    const boardingStation = form.boardingStation
      .trim()
      .toUpperCase();

    clearTimeout(classTimer.current);
    classController.current?.abort();

    setAvailableClasses([]);
    setClassMessage("");

    setForm((prev) => ({
      ...prev,
      preferredClass: "",
    }));

    if (
      !/^\d{4,6}$/.test(trainNumber) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(journeyDate) ||
      !/^[A-Z0-9]{2,10}$/.test(boardingStation)
    ) {
      return;
    }

    classTimer.current = setTimeout(async () => {
      const id = ++classRequest.current;
      const controller = new AbortController();

      classController.current = controller;
      setClassLoading(true);

      try {
        const response = await getTrainClasses({
          trainNumber,
          journeyDate,
          boardingStation,
          signal: controller.signal,
        });

        if (id !== classRequest.current) return;

        const classes =
          response?.data?.data?.classes || [];

        if (classes.length) {
          setAvailableClasses(classes);
        } else {
          setClassMessage(
            "No class information is available."
          );
        }
      } catch (error) {
        if (
          error?.name === "CanceledError" ||
          error?.code === "ERR_CANCELED"
        ) {
          return;
        }

        if (id === classRequest.current) {
          setClassMessage(
            "Unable to load actual train classes."
          );
        }
      } finally {
        if (id === classRequest.current) {
          setClassLoading(false);
        }
      }
    }, 500);

    return () => {
      clearTimeout(classTimer.current);
      classController.current?.abort();
    };
  }, [
    form.trainNumber,
    form.journeyDate,
    form.boardingStation,
  ]);

  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    const trainNumber = form.trainNumber.trim();
    const journeyDate = form.journeyDate.trim();
    const boardingStation = form.boardingStation
      .trim()
      .toUpperCase();
    const destinationStation = form.destinationStation
      .trim()
      .toUpperCase();
    const preferredClass = form.preferredClass;

    if (!/^\d{4,6}$/.test(trainNumber)) {
      setMessage("Enter a valid train number.");
      return;
    }

    if (!journeyDate) {
      setMessage("Select your journey date.");
      return;
    }

    if (!/^[A-Z0-9]{2,10}$/.test(boardingStation)) {
      setMessage("Select a valid source station.");
      return;
    }

    if (!/^[A-Z0-9]{2,10}$/.test(destinationStation)) {
      setMessage("Select a valid destination station.");
      return;
    }

    if (boardingStation === destinationStation) {
      setMessage(
        "Source and destination cannot be the same."
      );
      return;
    }

    if (!preferredClass) {
      setMessage("Select a preferred class.");
      return;
    }

    if (
      !availableClasses.some(
        (item) => item.code === preferredClass
      )
    ) {
      setMessage(
        "Selected class is not available in this train."
      );
      return;
    }

    setSubmitting(true);

    try {
      const { createJourney } = await import(
        "../../api/journeyAPI"
      );

      const response = await createJourney({
        trainNumber,
        journeyDate,
        boardingStation,
        destinationStation,
        allowedClasses: [preferredClass],
        allowMixedClass: form.allowMixedClass,
        preferredStrategy: "BEST_AVAILABLE",
      });

      const journeyId = response?.data?.data?._id;

      navigate(
        journeyId
          ? `/recommendation/${journeyId}`
          : "/journeys"
      );
    } catch (error) {
      setMessage(
        error?.response?.data?.message ||
          "Unable to create journey. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="add-journey-page">
      <button
        type="button"
        className="dashboard-button"
        onClick={() => navigate("/dashboard")}
      >
        ← Back to Dashboard
      </button>

      <div className="add-journey-layout">
        {/* LEFT SIDE */}
        <section className="journey-intro">
          <div className="intro-badge">
            ERJA JOURNEY MONITOR
          </div>

          <h1>
            Add New
            <span>Journey</span>
          </h1>

          <p className="intro-description">
            Tell ERJA about your railway journey and
            we'll monitor availability, analyze vacant
            berths and find possible booking strategies.
          </p>

          <div className="feature-list">
            {FEATURES.map(
              ([icon, title, description]) => (
                <div
                  className="feature-item"
                  key={title}
                >
                  <div className="feature-icon">
                    {icon}
                  </div>

                  <div>
                    <strong>{title}</strong>
                    <span>{description}</span>
                  </div>
                </div>
              )
            )}
          </div>
        </section>

        {/* RIGHT CARD */}
        <section className="journey-card">
          <div className="card-header">
            <div>
              <div className="card-eyebrow">
                JOURNEY REQUEST
              </div>

              <h2>Journey Details</h2>

              <p>
                Enter the details you want ERJA to
                monitor.
              </p>
            </div>

            <div className="card-train-icon">
              🚆
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* TRAIN */}
            <div className="field">
              <label htmlFor="trainNumber">
                Train Number
              </label>

              <div className="input-box">
                <span>🚆</span>

                <input
                  id="trainNumber"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="e.g. 12746"
                  value={form.trainNumber}
                  onChange={(e) =>
                    updateField(
                      "trainNumber",
                      e.target.value.replace(
                        /\D/g,
                        ""
                      )
                    )
                  }
                  autoComplete="off"
                />
              </div>

              <small>
                Enter the Indian Railways train number.
              </small>
            </div>

            {/* DATE */}
            <div className="field">
              <label htmlFor="journeyDate">
                Journey Date
              </label>

              <div className="input-box">
                <span>📅</span>

                <input
                  id="journeyDate"
                  type="date"
                  min={getTodayIndia()}
                  value={form.journeyDate}
                  onChange={(e) =>
                    updateField(
                      "journeyDate",
                      e.target.value
                    )
                  }
                />
              </div>

              <small>
                Select the date of your journey.
              </small>
            </div>

            {/* SOURCE DESTINATION */}
            <div className="route-row">
              <div className="field station-field">
                <label htmlFor="boardingStation">
                  Source
                </label>

                <div className="input-box">
                  <span>📍</span>

                  <input
                    id="boardingStation"
                    type="text"
                    placeholder="SC or Secunderabad"
                    value={form.boardingStation}
                    onChange={(e) => {
                      const value =
                        e.target.value.toUpperCase();

                      updateField(
                        "boardingStation",
                        value
                      );

                      searchStations(
                        value,
                        "boarding"
                      );
                    }}
                    autoComplete="off"
                  />
                </div>

                {boardingSuggestions.length > 0 && (
                  <div className="station-results">
                    {boardingSuggestions.map(
                      (station) => (
                        <button
                          type="button"
                          key={`${station.code}-${station.name}`}
                          onClick={() =>
                            chooseStation(
                              station,
                              "boarding"
                            )
                          }
                        >
                          <strong>
                            {station.code}
                          </strong>
                          <span>
                            {station.name}
                          </span>
                        </button>
                      )
                    )}
                  </div>
                )}

                <small>Station code</small>
              </div>

              <div className="route-arrow">→</div>

              <div className="field station-field">
                <label htmlFor="destinationStation">
                  Destination
                </label>

                <div className="input-box">
                  <span>📍</span>

                  <input
                    id="destinationStation"
                    type="text"
                    placeholder="JSG"
                    value={form.destinationStation}
                    onChange={(e) => {
                      const value =
                        e.target.value.toUpperCase();

                      updateField(
                        "destinationStation",
                        value
                      );

                      searchStations(
                        value,
                        "destination"
                      );
                    }}
                    autoComplete="off"
                  />
                </div>

                {destinationSuggestions.length >
                  0 && (
                  <div className="station-results">
                    {destinationSuggestions.map(
                      (station) => (
                        <button
                          type="button"
                          key={`${station.code}-${station.name}`}
                          onClick={() =>
                            chooseStation(
                              station,
                              "destination"
                            )
                          }
                        >
                          <strong>
                            {station.code}
                          </strong>
                          <span>
                            {station.name}
                          </span>
                        </button>
                      )
                    )}
                  </div>
                )}

                <small>Station code</small>
              </div>
            </div>

            {/* CLASS */}
            <div className="field">
              <label htmlFor="preferredClass">
                Preferred Class
              </label>

              <div className="select-box">
                <span>🛏️</span>

                <select
                  id="preferredClass"
                  value={form.preferredClass}
                  disabled={
                    classLoading ||
                    availableClasses.length === 0
                  }
                  onChange={(e) =>
                    updateField(
                      "preferredClass",
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    {classLoading
                      ? "Loading actual classes..."
                      : availableClasses.length
                      ? "Select preferred class"
                      : "Select train, date & source"}
                  </option>

                  {availableClasses.map((item) => (
                    <option
                      key={item.code}
                      value={item.code}
                    >
                      {item.code} — {item.name}
                    </option>
                  ))}
                </select>

                <span className="select-arrow">
                  ⌄
                </span>
              </div>

              {classMessage && (
                <small className="class-warning">
                  {classMessage}
                </small>
              )}
            </div>

            {/* MIXED CLASS */}
            <label className="mixed-card">
              <input
                type="checkbox"
                checked={form.allowMixedClass}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    allowMixedClass:
                      e.target.checked,
                  }))
                }
              />

              <span className="checkmark">
                {form.allowMixedClass ? "✓" : ""}
              </span>

              <span className="mixed-text">
                <strong>Allow Mixed Class</strong>

                <span>
                  Allow ERJA to recommend different
                  classes for different journey segments.
                </span>
              </span>
            </label>

            {/* ERROR */}
            {message && (
              <div className="form-error">
                {message}
              </div>
            )}

            {/* BUTTON */}
            <button
              type="submit"
              className="monitor-button"
              disabled={submitting}
            >
              {submitting
                ? "Creating Journey..."
                : "Start Monitoring →"}
            </button>

            <div className="security-note">
              🔐 Your journey information is securely
              stored and used only for monitoring.
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}