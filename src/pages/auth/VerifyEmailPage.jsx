import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifyEmailRequest } from "../../features/auth/authApi";
import styles from "../../styles/Auth.module.css";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const calledRef = useRef(false);

  const token = useMemo(() => {
    const t = searchParams.get("token")?.trim();
    return t || null;
  }, [searchParams]);

  useEffect(() => {
    if (!token || calledRef.current) {
      if (!token) {
        setStatus("error");
        setMessage("Verification token is missing");
      }
      return;
    }

    calledRef.current = true;

    const verify = async () => {
      try {
        await verifyEmailRequest(token);
        setStatus("success");
        setMessage("Your email has been successfully verified!");

        setTimeout(() => {
          navigate("/login?verified=success");
        }, 2000);
      } catch (err) {
        setStatus("error");

        const backendMessage =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message;

        setMessage(
          backendMessage ||
            "Email verification failed. The verification link is invalid or has expired."
        );

        console.error("Email verification error:", err);
      }
    };

    verify();
  }, [token, navigate]);

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
                <p style={{ color: "var(--success-color, #7AC74F)" }}>
                  {message}
                </p>
                <p
                  style={{
                    color: "var(--second-text-color)",
                    fontSize: "14px",
                    marginTop: "10px",
                  }}
                >
                  You can now log in to your account.
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

            {status === "error" && (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <p style={{ color: "var(--error-color, #E86A5D)" }}>
                  {message ||
                    "Email verification failed. The verification link is invalid or has expired."}
                </p>
                <div style={{ marginTop: "20px" }}>
                  <button
                    className={styles.buttonX}
                    onClick={() => navigate("/login")}
                  >
                    Go to Login
                  </button>
                  <div style={{ marginTop: "12px" }}>
                    <button
                      className={styles.linkX}
                      type="button"
                      onClick={() => navigate("/register")}
                      style={{ background: "none", border: "none" }}
                    >
                      Go to Registration
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

