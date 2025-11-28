import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifyEmailRequest } from "../../features/auth/authApi";
import styles from "../../styles/Auth.module.css";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Получаем токен из URL параметра (useSearchParams автоматически декодирует)
    let token = searchParams.get("token");

    // Дополнительная проверка и нормализация токена
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing");
      return;
    }

    // Убеждаемся, что токен не пустой после trim
    token = token.trim();
    if (!token) {
      setStatus("error");
      setMessage("Verification token is invalid");
      return;
    }

    // Логирование для отладки (можно убрать в production)
    console.log("Verification token received, length:", token.length);

    const verifyEmail = async () => {
      try {
        await verifyEmailRequest(token);
        setStatus("success");
        setMessage("Email verified successfully");
        // Редирект на логин через 2 секунды
        setTimeout(() => {
          navigate("/login?verified=success");
        }, 2000);
      } catch (err) {
        setStatus("error");
        const errorMessage = err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Email verification failed";
        setMessage(errorMessage);
        console.error("Email verification error:", err);
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className={styles.brand}>Houdini</span>
      </div>

      <div className={styles.main}>
        <div className={styles.image} />

        <div className={styles.panel}>
          <div className={styles.pad}>
            <h2 className={styles.title}>Email Verification</h2>

            {status === "loading" && (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <p style={{ color: "var(--main-text-color)" }}>
                  Verifying your email...
                </p>
              </div>
            )}

            {status === "success" && (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <p style={{ color: "var(--success-color, #4caf50)" }}>
                  {message}
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

            {status === "error" && (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <p style={{ color: "var(--error-color, crimson)" }}>
                  {message}
                </p>
                <button
                  className={styles.buttonX}
                  onClick={() => navigate("/login")}
                  style={{ marginTop: "20px" }}
                >
                  Go to Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

