import "./AddJourney.css";

export default function AddJourney() {
    return (
        <div className="addJourneyContainer">

            <div className="journeyCard">

                <h2>Add New Journey</h2>

                <form>

                    <div className="formGroup">
                        <label>Train Number</label>
                        <input
                            type="text"
                            placeholder="12746"
                        />
                    </div>

                    <div className="formGroup">
                        <label>Journey Date</label>
                        <input type="date" />
                    </div>

                    <div className="formGroup">
                        <label>Source</label>
                        <input
                            type="text"
                            placeholder="BDCR"
                        />
                    </div>

                    <div className="formGroup">
                        <label>Destination</label>
                        <input
                            type="text"
                            placeholder="SC"
                        />
                    </div>

                    <div className="formGroup">
                        <label>Preferred Class</label>

                        <select>
                            <option>3A</option>
                            <option>2A</option>
                            <option>SL</option>
                            <option>CC</option>
                        </select>

                    </div>

                    <div className="checkboxGroup">

                        <input
                            type="checkbox"
                            id="mixed"
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