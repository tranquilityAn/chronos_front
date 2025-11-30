import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { acceptCalendarInvite, declineCalendarInvite } from "../features/calendars/calendarApi";
import { loadCalendars } from "../features/calendars/calendarsSlice";
import styles from "../styles/Auth.module.css";

export default function CalendarInvitePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const dispatch = useDispatch();
    
    const token = useSelector((state) => state.auth.token);
    const [status, setStatus] = useState("loading"); // loading, success, error, need-auth
    const [message, setMessage] = useState("");
    const [calendarInfo, setCalendarInfo] = useState(null);
    
    // Защита от повторной обработки одного и того же токена
    const processedTokenRef = useRef(null);

    useEffect(() => {
        // Определяем действие из пути URL
        const isAccept = location.pathname.includes("/accept");
        const isDecline = location.pathname.includes("/decline");
        const action = isAccept ? "accept" : isDecline ? "decline" : null;

        if (!action) {
            setStatus("error");
            setMessage("Invalid invitation link");
            return;
        }

        // Получаем токен из URL параметра
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

        console.log("Calendar invite token received, action:", action);

        // Проверяем авторизацию
        if (!token) {
            // Сохраняем полный URL для возврата после логина
            const returnUrl = `${location.pathname}${location.search}`;
            console.log("Not authenticated, redirecting to login with return URL:", returnUrl);
            setStatus("need-auth");
            // Редирект на логин с сохранением URL для возврата
            setTimeout(() => {
                navigate(`/login?redirect=${encodeURIComponent(returnUrl)}`, { replace: true });
            }, 100);
            return;
        }

        // Защита от повторной обработки: если этот токен уже обрабатывался, не запускаем снова
        if (processedTokenRef.current === inviteToken) {
            return;
        }
        processedTokenRef.current = inviteToken;

        // Если авторизован, обрабатываем приглашение
        const processInvite = async () => {
            try {
                setStatus("loading");
                let result;
                
                if (action === "accept") {
                    result = await acceptCalendarInvite(inviteToken);
                    setCalendarInfo(result.calendar);
                    setMessage(`You have successfully joined the calendar "${result.calendar?.name || "Unknown"}" as ${result.role || "member"}`);
                    setStatus("success");
                    
                    // Перезагружаем список календарей
                    dispatch(loadCalendars());
                    
                    // Редирект на главную страницу через 2 секунды
                    setTimeout(() => {
                        navigate("/", { replace: true });
                    }, 2000);
                } else {
                    result = await declineCalendarInvite(inviteToken);
                    setMessage("You have declined the calendar invitation");
                    setStatus("success");
                    
                    // Редирект на главную страницу через 2 секунды
                    setTimeout(() => {
                        navigate("/", { replace: true });
                    }, 2000);
                }
            } catch (err) {
                // Обработка ошибок с учетом различных сценариев
                // 
                // ВАЖНО: При повторном заходе по уже использованному токену бэкенд возвращает ошибку
                // TOKEN_INVALID_OR_EXPIRED, но это не означает, что пользователь не имеет доступа к календарю.
                // Если пользователь уже принял приглашение ранее, он уже является участником календаря,
                // и токен просто был помечен как использованный. В этом случае мы должны показать success,
                // а не error. Проверяем это через загрузку списка календарей пользователя.
                //
                const errorCode = err?.response?.data?.error;
                const errorMessage = err?.response?.data?.message || err?.response?.data?.error || err?.message;
                const statusCode = err?.response?.status;

                // Специальная обработка для TOKEN_INVALID_OR_EXPIRED (400):
                // Если токен уже использован, но пользователь уже является участником календаря,
                // это не является реальной ошибкой. Проверяем это через загрузку календарей.
                // Только если загрузка календарей тоже не удалась, показываем реальную ошибку.
                if (errorCode === "TOKEN_INVALID_OR_EXPIRED" || statusCode === 400) {
                    try {
                        // Пытаемся загрузить календари пользователя
                        // Если загрузка успешна, значит пользователь уже имеет доступ к календарям
                        // (включая тот, на который была ссылка)
                        const calendars = await dispatch(loadCalendars()).unwrap();
                        
                        // Если календари успешно загружены, считаем это успехом
                        // Пользователь уже является участником календаря
                        setStatus("success");
                        setMessage("You are already a member of this calendar. Redirecting to your calendars...");
                        
                        setTimeout(() => {
                            navigate("/", { replace: true });
                        }, 2000);
                        return;
                    } catch (loadErr) {
                        // Если загрузка календарей не удалась, это реальная ошибка
                        // Токен действительно невалидный или протухший
                        setStatus("error");
                        setMessage(errorMessage || "The invitation link is invalid or has expired");
                        console.error(`Calendar invite ${action} error:`, err);
                        return;
                    }
                }

                // Обработка FORBIDDEN (403): проверяем конкретное сообщение
                // Некоторые 403 ошибки могут означать, что пользователь уже участник (например,
                // "No pending invite found for this user" - приглашение уже было обработано ранее)
                if (statusCode === 403) {
                    const messageLower = errorMessage?.toLowerCase() || "";
                    // Если сообщение говорит о том, что нет pending invite или пользователь уже участник,
                    // проверяем через загрузку календарей, чтобы подтвердить успешное состояние
                    if (messageLower.includes("no pending invite") || messageLower.includes("already a member")) {
                        try {
                            // Проверяем через загрузку календарей
                            await dispatch(loadCalendars()).unwrap();
                            setStatus("success");
                            setMessage("You are already a member of this calendar. Redirecting to your calendars...");
                            setTimeout(() => {
                                navigate("/", { replace: true });
                            }, 2000);
                            return;
                        } catch (loadErr) {
                            // Если не удалось загрузить календари, показываем ошибку
                            setStatus("error");
                            setMessage(errorMessage || `Failed to ${action} calendar invitation`);
                            console.error(`Calendar invite ${action} error:`, err);
                            return;
                        }
                    }
                }

                // Для всех остальных ошибок (401, 404, 500 и т.д.) показываем стандартное сообщение об ошибке
                // Это реальные ошибки: невалидный токен авторизации, календарь не найден, серверная ошибка и т.п.
                setStatus("error");
                setMessage(errorMessage || `Failed to ${action} calendar invitation`);
                console.error(`Calendar invite ${action} error:`, err);
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
                        <h2 className={styles.title}>Calendar Invitation</h2>

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
                                {calendarInfo && (
                                    <div style={{ marginTop: "16px", padding: "12px", background: "rgba(237, 233, 134, 0.1)", borderRadius: "8px" }}>
                                        <p style={{ fontSize: "14px", color: "var(--main-text-color)", margin: "4px 0" }}>
                                            <strong>Calendar:</strong> {calendarInfo.name}
                                        </p>
                                        {calendarInfo.color && (
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "8px" }}>
                                                <span style={{ fontSize: "12px", color: "var(--second-text-color)" }}>Color:</span>
                                                <div
                                                    style={{
                                                        width: "20px",
                                                        height: "20px",
                                                        borderRadius: "50%",
                                                        backgroundColor: calendarInfo.color,
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

