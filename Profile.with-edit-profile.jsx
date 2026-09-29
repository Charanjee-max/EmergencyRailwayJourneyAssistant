import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import Navbar from "../../components/Navbar/Navbar";
import { updateProfile } from "../../api/profileAPI.js";

import "./Profile.css";


// =========================================================
// HELPERS
// =========================================================

const getStoredUser = () => {
    try {
        const storedUser =
            localStorage.getItem("user");

        if (!storedUser) {
            return {};
        }

        const parsed =
            JSON.parse(storedUser);

        return (
            parsed &&
            typeof parsed === "object"
                ? parsed
                : {}
        );

    } catch {
        return {};
    }
};


const getInitials = (
    name = ""
) => {

    const cleanName =
        String(name)
            .trim();

    if (!cleanName) {
        return "U";
    }

    const parts =
        cleanName
            .split(/\s+/)
            .filter(Boolean);

    if (parts.length === 1) {
        return parts[0]
            .slice(0, 2)
            .toUpperCase();
    }

    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();
};


const getDisplayValue = (
    value,
    fallback = "Not available"
) => {

    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
    ) {
        return fallback;
    }

    return String(value).trim();
};


// =========================================================
// COMPONENT
// =========================================================

export default function Profile() {

    const navigate =
        useNavigate();


    // =====================================================
    // USER
    // =====================================================

    const [
        user,
        setUser,
    ] = useState(
        getStoredUser()
    );


    // =====================================================
    // UI
    // =====================================================

    const [
        copied,
        setCopied,
    ] = useState(false);

    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileError, setProfileError] = useState("");
    const [profileSuccess, setProfileSuccess] = useState("");
    const [editFullName, setEditFullName] = useState("");
    const [editPhoneNumber, setEditPhoneNumber] = useState("");


    // =====================================================
    // LOAD USER
    // =====================================================

    useEffect(() => {

        const refreshUser =
            () => {

                setUser(
                    getStoredUser()
                );
            };

        window.addEventListener(
            "storage",
            refreshUser
        );

        refreshUser();

        return () => {

            window.removeEventListener(
                "storage",
                refreshUser
            );

        };

    }, []);


    // =====================================================
    // NORMALIZED USER VALUES
    // =====================================================

    const userName =
        getDisplayValue(
            user?.name ||
            user?.fullName ||
            user?.username ||
            user?.userName,
            "ERJA User"
        );

    const email =
        getDisplayValue(
            user?.email ||
            user?.emailAddress
        );

    const phone =
        getDisplayValue(
            user?.phoneNumber ||
            user?.phone ||
            user?.mobile ||
            user?.mobileNumber,
            "Not provided"
        );

    const userId =
        getDisplayValue(
            user?._id ||
            user?.id ||
            user?.userId,
            "Not available"
        );

    const role =
        getDisplayValue(
            user?.role,
            "USER"
        )
            .toUpperCase();

    const initials =
        useMemo(
            () =>
                getInitials(
                    userName
                ),
            [userName]
        );


    // =====================================================
    // MEMBER DATE
    // =====================================================

    const memberSince =
        user?.createdAt ||
        user?.created_at;

    const formattedMemberSince =
        memberSince
            ? new Date(
                memberSince
            ).toLocaleDateString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                }
            )
            : "Available in account data";


    // =====================================================
    // COPY USER ID
    // =====================================================

    const handleCopyUserId =
        async () => {

            if (
                !userId ||
                userId === "Not available"
            ) {
                return;
            }

            try {

                await navigator.clipboard.writeText(
                    userId
                );

                setCopied(true);

                window.setTimeout(
                    () => {
                        setCopied(false);
                    },
                    1800
                );

            } catch {

                setCopied(false);

            }
        };


    const openProfileEditor = () => {
        setEditFullName(user?.fullName || user?.name || user?.username || user?.userName || "");
        setEditPhoneNumber(user?.phoneNumber || user?.phone || user?.mobile || user?.mobileNumber || "");
        setProfileError("");
        setProfileSuccess("");
        setIsEditingProfile(true);
    };

    const handleProfileSave = async (event) => {
        event.preventDefault();
        const fullName = editFullName.trim();
        const phoneNumber = editPhoneNumber.trim();
        if (fullName.length < 3) {
            setProfileError("Enter a name with at least 3 characters.");
            return;
        }
        if (phoneNumber.length > 20) {
            setProfileError("Mobile number must be 20 characters or fewer.");
            return;
        }
        setIsSavingProfile(true);
        setProfileError("");
        setProfileSuccess("");
        try {
            const response = await updateProfile({ fullName, phoneNumber });
            const updatedUser = response?.data?.data || {};
            const savedUser = {
                ...user,
                ...updatedUser,
                fullName: updatedUser.fullName || fullName,
                phoneNumber: updatedUser.phoneNumber ?? phoneNumber,
            };
            localStorage.setItem("user", JSON.stringify(savedUser));
            setUser(savedUser);
            setProfileSuccess("Profile updated successfully.");
            setIsEditingProfile(false);
        } catch (error) {
            setProfileError(error?.response?.data?.message || "Could not update your profile. Please try again.");
        } finally {
            setIsSavingProfile(false);
        }
    };

    // =====================================================
    // LOGOUT
    // =====================================================

    const handleLogout =
        () => {

            localStorage.removeItem(
                "token"
            );

            localStorage.removeItem(
                "user"
            );

            navigate(
                "/login",
                {
                    replace: true,
                }
            );
        };


    // =====================================================
    // NAVIGATION
    // =====================================================

    const goToJourneys =
        () => {

            navigate(
                "/journeys"
            );
        };


    const goToNotifications =
        () => {

            navigate(
                "/notifications"
            );
        };


    // RENDER
    // =====================================================

    return (

        <div className="profilePage">

            <Navbar />

            {isEditingProfile && (
                <div
                    role="presentation"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget && !isSavingProfile) setIsEditingProfile(false);
                    }}
                    style={{ position: "fixed", inset: 0, zIndex: 1000, display: "grid", placeItems: "center", padding: 16, background: "rgba(15, 23, 42, 0.58)" }}
                >
                    <form
                        onSubmit={handleProfileSave}
                        aria-labelledby="edit-profile-title"
                        style={{ width: "min(100%, 480px)", padding: 24, borderRadius: 20, background: "#fff", boxShadow: "0 24px 70px rgba(0,0,0,.24)" }}
                    >
                        <h2 id="edit-profile-title" style={{ margin: "0 0 8px", color: "#172033" }}>Edit Profile</h2>
                        <p style={{ margin: "0 0 20px", color: "#68778b" }}>Update your name and mobile number.</p>
                        <label style={{ display: "block", marginBottom: 14, color: "#344256", fontWeight: 700 }}>
                            Full name
                            <input autoComplete="name" required minLength={3} maxLength={100} value={editFullName} onChange={(event) => setEditFullName(event.target.value)} style={{ display: "block", boxSizing: "border-box", width: "100%", marginTop: 7, padding: "12px 14px", border: "1px solid #d5deea", borderRadius: 10, font: "inherit" }} />
                        </label>
                        <label style={{ display: "block", marginBottom: 14, color: "#344256", fontWeight: 700 }}>
                            Mobile number
                            <input autoComplete="tel" maxLength={20} value={editPhoneNumber} onChange={(event) => setEditPhoneNumber(event.target.value)} style={{ display: "block", boxSizing: "border-box", width: "100%", marginTop: 7, padding: "12px 14px", border: "1px solid #d5deea", borderRadius: 10, font: "inherit" }} />
                        </label>
                        {profileError && <p role="alert" style={{ color: "#c43d4b", margin: "0 0 14px" }}>{profileError}</p>}
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                            <button type="button" disabled={isSavingProfile} onClick={() => setIsEditingProfile(false)} style={{ padding: "10px 16px", border: "1px solid #d5deea", borderRadius: 10, background: "#fff", color: "#344256", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                            <button type="submit" disabled={isSavingProfile} style={{ padding: "10px 18px", border: 0, borderRadius: 10, background: "#315fc9", color: "#fff", fontWeight: 700, cursor: isSavingProfile ? "wait" : "pointer" }}>{isSavingProfile ? "Saving…" : "Save Changes"}</button>
                        </div>
                    </form>
                </div>
            )}

            <main className="profileMain">

                {/* =================================================
                    PAGE HEADER
                ================================================= */}

                <section className="profilePageHeader">

                    <div>

                        <div className="profileEyebrow">
                            ERJA ACCOUNT
                        </div>

                        <h1>
                            My
                            <span>
                                Profile
                            </span>
                        </h1>

                        <p>
                            Manage your ERJA account
                            information and view your
                            account status.
                        </p>

                    </div>

                    <div className="profileHeaderStatus">

                        <span className="profileStatusDot" />

                        <span>
                            Account Active
                        </span>

                    </div>

                </section>


                {/* =================================================
                    PROFILE HERO
                ================================================= */}

                <section className="profileHero">

                    <div className="profileHeroGlow" />

                    <div className="profileAvatar">

                        <span>
                            {initials}
                        </span>

                    </div>


                    <div className="profileHeroInfo">

                        <div className="profileHeroName">
                            {userName}
                        </div>

                        <div className="profileHeroEmail">
                            {email}
                        </div>

                        <div className="profileHeroMeta">

                            <span>
                                ● {role}
                            </span>

                            <span>
                                ● ERJA Account
                            </span>

                        </div>

                    </div>




                </section>


                {/* =================================================
                    CONTENT GRID
                ================================================= */}

                <section className="profileContentGrid">


                    {/* =================================================
                        PERSONAL INFORMATION
                    ================================================= */}

                    <div className="profileCard personalCard">

                        <div className="profileCardHeader">

                            <div>

                                <span className="profileCardIcon">
                                    👤
                                </span>

                                <div>

                                    <h2>
                                        Personal Information
                                    </h2>

                                    <p>
                                        Information associated
                                        with your ERJA account.
                                    </p>
                                    {profileSuccess && <p role="status" style={{ color: "#23824b", fontWeight: 700 }}>{profileSuccess}</p>}

                                </div>

                            </div>

                            <button type="button" onClick={openProfileEditor} style={{ alignSelf: "center", padding: "10px 15px", border: "1px solid #cbdaf4", borderRadius: 10, background: "#f3f7ff", color: "#315fc9", fontWeight: 750, cursor: "pointer" }}>
                                Edit Profile
                            </button>

                        </div>


                        <div className="profileInfoGrid">

                            <div className="profileInfoItem">

                                <span>
                                    FULL NAME
                                </span>

                                <strong>
                                    {userName}
                                </strong>

                            </div>


                            <div className="profileInfoItem">

                                <span>
                                    EMAIL ADDRESS
                                </span>

                                <strong>
                                    {email}
                                </strong>

                            </div>


                            <div className="profileInfoItem">

                                <span>
                                    MOBILE NUMBER
                                </span>

                                <strong>
                                    {phone}
                                </strong>

                            </div>


                            <div className="profileInfoItem">

                                <span>
                                    ACCOUNT ROLE
                                </span>

                                <strong>
                                    {role}
                                </strong>

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        ACCOUNT INFORMATION
                    ================================================= */}

                    <div className="profileCard accountCard">

                        <div className="profileCardHeader">

                            <div>

                                <span className="profileCardIcon">
                                    🛡️
                                </span>

                                <div>

                                    <h2>
                                        Account
                                    </h2>

                                    <p>
                                        Your ERJA account
                                        status and identity.
                                    </p>

                                </div>

                            </div>

                        </div>


                        <div className="accountRows">

                            <div className="accountRow">

                                <div className="accountRowLabel">

                                    <span>
                                        ACCOUNT STATUS
                                    </span>

                                    <strong>
                                        Active
                                    </strong>

                                </div>

                                <div className="accountBadge success">
                                    ACTIVE
                                </div>

                            </div>


                            <div className="accountRow">

                                <div className="accountRowLabel">

                                    <span>
                                        MEMBER SINCE
                                    </span>

                                    <strong>
                                        {formattedMemberSince}
                                    </strong>

                                </div>

                                <span className="accountRowIcon">
                                    📅
                                </span>

                            </div>


                            <div className="accountRow">

                                <div className="accountRowLabel">

                                    <span>
                                        USER ID
                                    </span>

                                    <strong className="userIdValue">
                                        {userId}
                                    </strong>

                                </div>

                                <button
                                    type="button"
                                    className="copyButton"
                                    onClick={
                                        handleCopyUserId
                                    }
                                    disabled={
                                        userId ===
                                        "Not available"
                                    }
                                >
                                    {
                                        copied
                                            ? "Copied"
                                            : "Copy"
                                    }
                                </button>

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        ERJA ACTIVITY
                    ================================================= */}

                    <div className="profileCard activityCard">

                        <div className="profileCardHeader">

                            <div>

                                <span className="profileCardIcon">
                                    🚆
                                </span>

                                <div>

                                    <h2>
                                        ERJA Activity
                                    </h2>

                                    <p>
                                        Quick access to your
                                        railway monitoring tools.
                                    </p>

                                </div>

                            </div>

                        </div>


                        <div className="activityGrid">

                            <button
                                type="button"
                                className="activityItem"
                                onClick={
                                    goToJourneys
                                }
                            >

                                <span className="activityIcon blue">
                                    🚆
                                </span>

                                <span className="activityText">

                                    <strong>
                                        My Journeys
                                    </strong>

                                    <small>
                                        View monitored
                                        train journeys
                                    </small>

                                </span>

                                <span className="activityArrow">
                                    →
                                </span>

                            </button>


                            <button
                                type="button"
                                className="activityItem"
                                onClick={
                                    goToNotifications
                                }
                            >

                                <span className="activityIcon purple">
                                    🔔
                                </span>

                                <span className="activityText">

                                    <strong>
                                        Notifications
                                    </strong>

                                    <small>
                                        View journey and
                                        chart updates
                                    </small>

                                </span>

                                <span className="activityArrow">
                                    →
                                </span>

                            </button>


                            

                        </div>

                    </div>


                    {/* =================================================
                        SECURITY / SESSION
                    ================================================= */}

                    <div className="profileCard securityCard">

                        <div className="profileCardHeader">

                            <div>

                                <span className="profileCardIcon">
                                    🔐
                                </span>

                                <div>

                                    <h2>
                                        Security
                                    </h2>

                                    <p>
                                        Current authentication
                                        session information.
                                    </p>

                                </div>

                            </div>

                        </div>


                        <div className="securityStatus">

                            <div className="securityStatusIcon">
                                ✓
                            </div>

                            <div>

                                <strong>
                                    Session secured
                                </strong>

                                <span>
                                    Your current ERJA
                                    session is authenticated.
                                </span>

                            </div>

                        </div>


                        <button
                            type="button"
                            className="logoutLargeButton"
                            onClick={
                                handleLogout
                            }
                        >
                            <span>
                                ↪
                            </span>

                            Sign Out
                        </button>

                    </div>

                </section>


                {/* =================================================
                    FOOTER NOTE
                ================================================= */}

                <section className="profileFooter">

                    <div className="profileFooterMark">
                        E
                    </div>

                    <div>

                        <strong>
                            Emergency Railway Journey Assistant
                        </strong>

                        <span>
                            Your railway journey monitoring
                            workspace.
                        </span>

                    </div>

                </section>

            </main>

        </div>
    );
}