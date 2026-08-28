import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "./AddJourney.css";
import { createJourney } from "../../api/journeyAPI";

export default function AddJourney() {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        trainNumber: "",
        journeyDate: "",
        source: "",
        destination: "",
        preferredClasses: "3A",
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

            await createJourney({
                trainNumber: formData.trainNumber,
                journeyDate: formData.journeyDate,
                source: formData.source.toUpperCase(),
                destination: formData.destination.toUpperCase(),
                preferredClasses: [formData.preferredClasses],
                allowMixedClass: formData.allowMixedClass,
            });

            alert("Journey saved successfully.");

            navigate("/dashboard");

        } catch (error) {

            console.error(error);

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

                    <div className="formGroup">

                        <label>Source</label>

                        <input
                            type="text"
                            name="source"
                            value={formData.source}
                            onChange={handleChange}
                            placeholder="BDCR"
                            required
                        />

                    </div>

                    <div className="formGroup">

                        <label>Destination</label>

                        <input
                            type="text"
                            name="destination"
                            value={formData.destination}
                            onChange={handleChange}
                            placeholder="SC"
                            required
                        />

                    </div>

                    <div className="formGroup">

                        <label>Preferred Class</label>

                        <select
                            name="preferredClasses"
                            value={formData.preferredClasses}
                            onChange={handleChange}
                        >
                            <option value="3A">3A</option>
                            <option value="2A">2A</option>
                            <option value="SL">SL</option>
                            <option value="CC">CC</option>
                        </select>

                    </div>

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