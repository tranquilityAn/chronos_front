import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { acceptEventInvite, declineEventInvite } from "../features/events/eventApi";
import { loadSharedEvents } from "../features/sharedEvents/sharedEventsSlice";
import styles from "../styles/Auth.module.css";

export default function EventInvitePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const dispatch = useDispatch();
    
    const token = useSelector((state) => state.auth.token);
    const [status, setStatus] = useState("loading");
    const [message, setMessage] = useState("");
    const [eventInfo, setEventInfo] = useState(null);
    
    const processedTokenRef = useRef(null);

    useEffect(() => {
        const isAccept = location.pathname.includes("/accept");
        const isDecline = location.pathname.includes("/decline");
        const action = isAccept ? "accept" : isDecline ? "decline" : null;

        if (!action) {
            setStatus("error");
            setMessage("Invalid invitation link");
            return;
        }

        let inviteToken = searchParams.get("token");

        if (!inviteToken) {
            setStatus("error");
            setMessage("Invitation token is missing");
            return;
        }

        inviteToken = inviteToken.trim();
        if (!inviteToken) {
            setStatus("error");
            setMessage("Invitation token is invalid");
            return;
        }

        console.log("Event invite token received, action:", action);

        if (!token) {
            const returnUrl = `${location.pathname}${location.search}`;
            console.log("Not authenticated, redirecting to login with return URL:", returnUrl);
            setStatus("need-auth");
            setTimeout(() => {
                navigate(`/login?redirect=${encodeURIComponent(returnUrl)}`, { replace: true });
            }, 100);
            return;
        }

        if (processedTokenRef.current === inviteToken) {
            return;
        }
        processedTokenRef.current = inviteToken;

        const processInvite = async () => {
            try {
                setStatus("loading");
                let result;
                
                if (action === "accept") {
                    result = await acceptEventInvite(inviteToken);
                    setEventInfo(result.event);
                    setMessage(`You have successfully joined the event "${result.event?.title || "Unknown"}"`);
                    setStatus("success");
                    
                    dispatch(loadSharedEvents());
                    
                    setTimeout(() => {
                        navigate("/", { replace: true });
                    }, 2000);
                } else {
                    result = await declineEventInvite(inviteToken);
                    setMessage("You have declined the event invitation");
                    setStatus("success");
                    
                    setTimeout(() => {
                        navigate("/", { replace: true });
                    }, 2000);
                }
            } catch (err) {
                const errorCode = err?.response?.data?.error;
                const errorMessage = err?.response?.data?.message || err?.response?.data?.error || err?.message;
                const statusCode = err?.response?.status;

                if (errorCode === "TOKEN_INVALID_OR_EXPIRED" || statusCode === 400) {
                    try {
                        const sharedEvents = await dispatch(loadSharedEvents()).unwrap();
                        
                        setStatus("success");
                        setMessage("You are already a member of this event. Redirecting to your calendar...");
                        
                        setTimeout(() => {
                            navigate("/", { replace: true });
                        }, 2000);
                        return;
                    } catch (loadErr) {
                        setStatus("error");
                        setMessage(errorMessage || "The invitation link is invalid or has expired");
                        console.error(`Event invite ${action} error:`, err);
                        return;
                    }
                }

                if (statusCode === 403) {
                    const messageLower = errorMessage?.toLowerCase() || "";
                    if (messageLower.includes("no pending invite") || messageLower.includes("already a member")) {
                        try {
                            await dispatch(loadSharedEvents()).unwrap();
                            setStatus("success");
                            setMessage("You are already a member of this event. Redirecting to your calendar...");
                            setTimeout(() => {
                                navigate("/", { replace: true });
                            }, 2000);
                            return;
                        } catch (loadErr) {
                            setStatus("error");
                            setMessage(errorMessage || `Failed to ${action} event invitation`);
                            console.error(`Event invite ${action} error:`, err);
                            return;
                        }
                    }
                }

                setStatus("error");
                setMessage(errorMessage || `Failed to ${action} event invitation`);
                console.error(`Event invite ${action} error:`, err);
            }
        };

        processInvite();
    }, [searchParams, location, navigate, token, dispatch]);

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <span className={styles.brand}>Houdini</span>
            </div>

            <div className={styles.main}>
                <div className={styles.image} />

                <div className={styles.panel}>
                    <div className={styles.pad}>
                        <h2 className={styles.title}>Event Invitation</h2>

                        {status === "loading" && (
                            <div style={{ textAlign: "center", padding: "20px" }}>
                                <p style={{ color: "var(--main-text-color)" }}>
                                    Processing invitation...
                                </p>
                            </div>
                        )}

                        {status === "need-auth" && (
                            <div style={{ textAlign: "center", padding: "20px" }}>
                                <p style={{ color: "var(--main-text-color)" }}>
                                    Please log in to process this invitation
                                </p>
                                <p
                                    style={{
                                        color: "var(--second-text-color)",
                                        fontSize: "14px",
                                        marginTop: "10px",
                                    }}
                                >
                                    Redirecting to login page...
                                </p>
                            </div>
                        )}

                        {status === "success" && (
                            <div style={{ textAlign: "center", padding: "20px" }}>
                                <p style={{ color: "var(--success-color, #4caf50)" }}>
                                    {message}
                                </p>
                                {eventInfo && (
                                    <div style={{ marginTop: "16px", padding: "12px", background: "rgba(237, 233, 134, 0.1)", borderRadius: "8px" }}>
                                        <p style={{ fontSize: "14px", color: "var(--main-text-color)", margin: "4px 0" }}>
                                            <strong>Event:</strong> {eventInfo.title}
                                        </p>
                                        {eventInfo.color && (
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "8px" }}>
                                                <span style={{ fontSize: "12px", color: "var(--second-text-color)" }}>Color:</span>
                                                <div
                                                    style={{
                                                        width: "20px",
                                                        height: "20px",
                                                        borderRadius: "50%",
                                                        backgroundColor: eventInfo.color,
                                                        border: "1px solid rgba(0,0,0,0.1)",
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                                <p
                                    style={{
                                        color: "var(--second-text-color)",
                                        fontSize: "14px",
                                        marginTop: "16px",
                                    }}
                                >
                                    Redirecting to calendar...
                                </p>
                            </div>
                        )}

                        {status === "error" && (
                            <div style={{ textAlign: "center", padding: "20px" }}>
                                <p style={{ color: "var(--error-color, crimson)" }}>
                                    {message}
                                </p>
                                <div style={{ marginTop: "20px", display: "flex", gap: "10px", justifyContent: "center" }}>
                                    <button
                                        className={styles.buttonX}
                                        onClick={() => navigate("/")}
                                    >
                                        Go to Calendar
                                    </button>
                                    <button
                                        className={styles.buttonX}
                                        onClick={() => window.location.reload()}
                                        style={{ background: "transparent", border: "1px solid var(--second-color)" }}
                                    >
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

