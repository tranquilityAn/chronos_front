// src/pages/auth/Login.jsx
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import styles from "../../styles/Auth.module.css";
import { login } from "../../features/auth/authSlice";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, token } = useSelector((s) => s.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(login({ email, password })).unwrap();
      navigate("/");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className={styles.brand}>Houdini</span>
      </div>

      <div className={styles.main}>
        <div className={styles.image} />

        <div className={styles.panel}>
          <div className={styles.pad}>
            <h2 className={styles.title}>Sign in</h2>

            <form className={styles.form} onSubmit={onSubmit}>
              <div className={styles.group}>
                <label className={styles.labelX}>Email</label>
                <input
                  className={styles.inputX}
                  type="email"
                  placeholder="user@example.com"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className={styles.group}>
                <label className={styles.labelX}>Password</label>
                <input
                  className={styles.inputX}
                  type="password"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span className={styles.hint}>
                  Forgot your password?{" "}
                  <Link className={styles.linkX} to="/register">Change it.</Link>
                </span>
              </div>

              <button className={styles.buttonX} type="submit" disabled={status === "loading"}>
                {status === "loading" ? "Logging in…" : "Sign in"}
              </button>
            </form>

            {error && <p style={{ color: "crimson" }}>Error: {error}</p>}
            {token && <p style={{ color: "green" }}></p>}

            <span className={styles.fineprint}>
              No account?{" "}
              <Link className={styles.linkX} to="/register">Register</Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
