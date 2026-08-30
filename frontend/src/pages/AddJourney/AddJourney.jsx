import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "./AddJourney.css";
import { createJourney } from "../../api/journeyAPI";

export default function AddJourney() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        trainNumber: "",
        journeyDate: "",
        boardingStation: "",
        destinationStation: "",
        preferredClass: "3A",
        allowMixedClass: false,
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const payload = {
                trainNumber: formData.trainNumber.trim(),

                journeyDate: formData.journeyDate,

                boardingStation:
                    formData.boardingStation.trim().toUpperCase(),

                destinationStation:
                    formData.destinationStation.trim().toUpperCase(),

                allowedClasses: [
                    {
                        class: formData.preferredClass,
                        enabled: true,
                    },
                ],

                allowMixedClass: formData.allowMixedClass,

                preferredStrategy: "SINGLE_TICKET",
            };

            console.log("CREATE JOURNEY PAYLOAD =", payload);

            await createJourney(payload);

            alert("Journey saved successfully.");

            navigate("/dashboard");
        } catch (error) {
            console.error("CREATE JOURNEY ERROR =", error);

            console.error(
                "BACKEND RESPONSE =",
                error.response?.data
            );

            alert(
                error.response?.data?.message ||
                "Failed to save journey."
            );
        }
    };

    return (
        <div className="addJourneyContainer">
            <div className="journeyCard">

                <h2>Add New Journey</h2>

                <form onSubmit={handleSubmit}>

                    {/* Train Number */}
                    <div className="formGroup">
                        <label>Train Number</label>

                        <input
                            type="text"
                            name="trainNumber"
                            value={formData.trainNumber}
                            onChange={handleChange}
                            placeholder="12746"
                            required
                        />
                    </div>

                    {/* Journey Date */}
                    <div className="formGroup">
                        <label>Journey Date</label>

                        <input
                            type="date"
                            name="journeyDate"
                            value={formData.journeyDate}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Boarding Station */}
                    <div className="formGroup">
                        <label>Source</label>

                        <input
                            type="text"
                            name="boardingStation"
                            value={formData.boardingStation}
                            onChange={handleChange}
                            placeholder="BDCR"
                            required
                        />
                    </div>

                    {/* Destination Station */}
                    <div className="formGroup">
                        <label>Destination</label>

                        <input
                            type="text"
                            name="destinationStation"
                            value={formData.destinationStation}
                            onChange={handleChange}
                            placeholder="SC"
                            required
                        />
                    </div>

                    {/* Preferred Class */}
                    <div className="formGroup">
                        <label>Preferred Class</label>

                        <select
                            name="preferredClass"
                            value={formData.preferredClass}
                            onChange={handleChange}
                        >
                            <option value="1A">1A</option>
                            <option value="2A">2A</option>
                            <option value="3A">3A</option>
                            <option value="3E">3E</option>
                            <option value="SL">SL</option>
                        </select>
                    </div>

                    {/* Mixed Class */}
                    <div className="checkboxGroup">

                        <input
                            type="checkbox"
                            id="mixed"
                            name="allowMixedClass"
                            checked={formData.allowMixedClass}
                            onChange={handleChange}
                        />

                        <label htmlFor="mixed">
                            Allow Mixed Class
                        </label>

                    </div>

                    <button type="submit">
                        Save Journey
                    </button>

                </form>

            </div>
        </div>
    );
}