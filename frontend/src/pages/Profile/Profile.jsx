import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    getProfile,
    updateProfile,
} from "../../api/profileAPI";

import "./Profile.css";


export default function Profile() {

    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);

    const [formData, setFormData] = useState({
        fullName: "",
        phoneNumber: "",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");


    // =========================================
    // LOAD PROFILE
    // =========================================

    const loadProfile = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await getProfile();

            const data = response?.data?.data;

            if (!data) {
                throw new Error(
                    "Profile information was not returned."
                );
            }

            setProfile(data);

            setFormData({
                fullName: data.fullName || "",
                phoneNumber: data.phoneNumber || "",
            });

        } catch (err) {

            console.error(
                "Failed to load profile:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to load your profile."
            );

        } finally {

            setLoading(false);

        }
    };


    useEffect(() => {
        loadProfile();
    }, []);


    // =========================================
    // INPUT CHANGE
    // =========================================

    const handleChange = (event) => {

        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        setSuccess("");
        setError("");
    };


    // =========================================
    // UPDATE PROFILE
    // =========================================

    const handleSubmit = async (event) => {

        event.preventDefault();

        try {

            setSaving(true);

            setError("");
            setSuccess("");

            const response =
                await updateProfile(formData);

            const updatedProfile =
                response?.data?.data;

            if (updatedProfile) {

                setProfile(updatedProfile);

                setFormData({
                    fullName:
                        updatedProfile.fullName || "",

                    phoneNumber:
                        updatedProfile.phoneNumber || "",
                });
            }

            setSuccess(
                "Profile updated successfully."
            );

        } catch (err) {

            console.error(
                "Failed to update profile:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to update your profile."
            );

        } finally {

            setSaving(false);

        }
    };


    // =========================================
    // LOGOUT
    // =========================================

    const handleLogout = () => {

        localStorage.removeItem("token");

        navigate("/login");
    };


    // =========================================
    // LOADING
    // =========================================

    if (loading) {

        return (
            <div className="profile-page">

                <div className="profile-state-card">

                    <div className="profile-state-icon">
                        👤
                    </div>

                    <span className="profile-eyebrow">
                        ERJA USER PROFILE
                    </span>

                    <h2>
                        Loading Profile
                    </h2>

                    <p>
                        Fetching your account information...
                    </p>

                    <div className="profile-loading-bar">
                        <div />
                    </div>

                </div>

            </div>
        );
    }


    // =========================================
    // ERROR
    // =========================================

    if (error && !profile) {

        return (
            <div className="profile-page">

                <div className="profile-state-card">

                    <div className="profile-state-icon">
                        ⚠️
                    </div>

                    <span className="profile-eyebrow">
                        ERJA USER PROFILE
                    </span>

                    <h2>
                        Unable to Load Profile
                    </h2>

                    <p>
                        {error}
                    </p>

                    <button
                        className="profile-primary-btn"
                        onClick={loadProfile}
                    >
                        Try Again
                    </button>

                </div>

            </div>
        );
    }


    // =========================================
    // MAIN PAGE
    // =========================================

    return (
        <div className="profile-page">

            <header className="profile-header">

                <button
                    className="profile-back-btn"
                    onClick={() =>
                        navigate("/dashboard")
                    }
                >
                    ← Back to Dashboard
                </button>

                <span className="profile-eyebrow">
                    ERJA USER PROFILE
                </span>

                <h1>
                    My Profile
                </h1>

                <p>
                    Manage your personal information
                    used by the Emergency Railway
                    Journey Assistant.
                </p>

            </header>


            <main className="profile-content">


                {/* =================================
                    PROFILE IDENTITY
                ================================== */}

                <section className="profile-identity-card">

                    <div className="profile-avatar">
                        {(profile?.fullName ||
                            profile?.email ||
                            "U")
                            .charAt(0)
                            .toUpperCase()}
                    </div>

                    <div className="profile-identity">

                        <span>
                            ERJA ACCOUNT
                        </span>

                        <h2>
                            {profile?.fullName ||
                                "ERJA User"}
                        </h2>

                        <p>
                            {profile?.email ||
                                "Email unavailable"}
                        </p>

                    </div>

                    <div className="account-status">

                        <span className="status-dot" />

                        Active Account

                    </div>

                </section>


                {/* =================================
                    ALERTS
                ================================== */}

                {success && (
                    <div className="profile-alert success">

                        <span>✓</span>

                        <p>
                            {success}
                        </p>

                    </div>
                )}


                {error && (
                    <div className="profile-alert error">

                        <span>⚠</span>

                        <p>
                            {error}
                        </p>

                    </div>
                )}


                {/* =================================
                    PROFILE FORM
                ================================== */}

                <section className="profile-panel">

                    <div className="profile-panel-heading">

                        <div className="panel-number">
                            01
                        </div>

                        <div>

                            <span>
                                PERSONAL INFORMATION
                            </span>

                            <h2>
                                Account Details
                            </h2>

                        </div>

                    </div>


                    <form
                        className="profile-form"
                        onSubmit={handleSubmit}
                    >


                        {/* FULL NAME */}

                        <div className="profile-field">

                            <label htmlFor="fullName">
                                Full Name
                            </label>

                            <div className="profile-input-wrap">

                                <span>
                                    👤
                                </span>

                                <input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    value={
                                        formData.fullName
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Enter your full name"
                                    autoComplete="name"
                                />

                            </div>

                        </div>


                        {/* EMAIL */}

                        <div className="profile-field">

                            <label htmlFor="email">
                                Email Address
                            </label>

                            <div className="profile-input-wrap disabled">

                                <span>
                                    ✉
                                </span>

                                <input
                                    id="email"
                                    type="email"
                                    value={
                                        profile?.email ||
                                        ""
                                    }
                                    disabled
                                />

                                <small>
                                    Verified
                                </small>

                            </div>

                            <p className="field-note">
                                Email address cannot be
                                changed from your profile.
                            </p>

                        </div>


                        {/* PHONE */}

                        <div className="profile-field">

                            <label htmlFor="phoneNumber">
                                Phone Number
                            </label>

                            <div className="profile-input-wrap">

                                <span>
                                    📱
                                </span>

                                <input
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    type="tel"
                                    value={
                                        formData.phoneNumber
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Enter your phone number"
                                    autoComplete="tel"
                                />

                            </div>

                        </div>


                        {/* ACTIONS */}

                        <div className="profile-form-actions">

                            <button
                                type="submit"
                                className="profile-save-btn"
                                disabled={saving}
                            >

                                {saving
                                    ? "Saving Changes..."
                                    : "Save Changes"}

                            </button>

                            <button
                                type="button"
                                className="profile-cancel-btn"
                                onClick={() =>
                                    setFormData({
                                        fullName:
                                            profile?.fullName ||
                                            "",

                                        phoneNumber:
                                            profile?.phoneNumber ||
                                            "",
                                    })
                                }
                                disabled={saving}
                            >
                                Reset
                            </button>

                        </div>

                    </form>

                </section>


                {/* =================================
                    ACCOUNT INFORMATION
                ================================== */}

                <section className="profile-panel">

                    <div className="profile-panel-heading">

                        <div className="panel-number">
                            02
                        </div>

                        <div>

                            <span>
                                ACCOUNT
                            </span>

                            <h2>
                                Account Information
                            </h2>

                        </div>

                    </div>


                    <div className="account-info-grid">

                        <div className="account-info-item">

                            <span>
                                Account ID
                            </span>

                            <strong>
                                {profile?._id ||
                                    "Unavailable"}
                            </strong>

                        </div>


                        <div className="account-info-item">

                            <span>
                                Member Since
                            </span>

                            <strong>
                                {profile?.createdAt
                                    ? new Date(
                                        profile.createdAt
                                    ).toLocaleDateString(
                                        "en-IN",
                                        {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                        }
                                    )
                                    : "Unavailable"}
                            </strong>

                        </div>

                    </div>

                </section>


                {/* =================================
                    LOGOUT
                ================================== */}

                <section className="profile-logout-card">

                    <div>

                        <span>
                            ACCOUNT SESSION
                        </span>

                        <h3>
                            Sign out of ERJA
                        </h3>

                        <p>
                            You can sign in again at
                            any time using your account.
                        </p>

                    </div>

                    <button
                        className="profile-logout-btn"
                        onClick={handleLogout}
                    >
                        Sign Out
                    </button>

                </section>

            </main>

        </div>
    );
}