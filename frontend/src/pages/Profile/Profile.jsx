import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import Navbar from "../../components/Navbar/Navbar";

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


    const goToAddJourney =
        () => {

            navigate(
                "/add-journey"
            );
        };


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div className="profilePage">

            <Navbar />


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


                    <div className="profileHeroAction">

                        <button
                            type="button"
                            className="profilePrimaryButton"
                            onClick={goToAddJourney}
                        >
                            <span>
                                +
                            </span>

                            Add Journey
                        </button>

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

                                </div>

                            </div>

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


                            <button
                                type="button"
                                className="activityItem"
                                onClick={
                                    goToAddJourney
                                }
                            >

                                <span className="activityIcon green">
                                    +
                                </span>

                                <span className="activityText">

                                    <strong>
                                        New Journey
                                    </strong>

                                    <small>
                                        Start monitoring
                                        another train
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