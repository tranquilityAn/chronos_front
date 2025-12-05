import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { register as registerAction } from "../../features/auth/authSlice";
import styles from "../../styles/Auth.module.css";

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((s) => s.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    
    const trimmedEmail = (email || '').trim();
    const trimmedPassword = (password || '').trim();
    
    if (!trimmedEmail) {
      alert("Email не может быть пустым");
      return;
    }
    
    if (!trimmedPassword) {
      alert("Пароль не может быть пустым");
      return;
    }
    
    if (password !== password2) {
      alert("Пароли не совпадают");
      return;
    }
    
    try {
      await dispatch(registerAction({ email: trimmedEmail, password })).unwrap();
      navigate("/");
    } catch (err) {
      alert(err?.message || err?.payload || "Ошибка регистрации");
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
            <h2 className={styles.title}>Sign up</h2>

            <form className={styles.form} onSubmit={onSubmit}>
              <div className={styles.group}>
                <label className={styles.labelX}>Email</label>
                <input
                  className={styles.inputX}
                  type="email"
                  placeholder="you@domain.com"
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
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className={styles.group}>
                <label className={styles.labelX}>Confirm password</label>
                <input
                  className={styles.inputX}
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                />
                <span className={styles.hint}>
                  Already have an account?{" "}
                  <Link className={styles.linkX} to="/login">Sign in</Link>
                </span>
              </div>

              <button className={styles.buttonX} type="submit" disabled={status === "loading"}>
                {status === "loading" ? "Registering…" : "Register"}
              </button>
            </form>

            {error && <p style={{ color: "crimson" }}>Ошибка: {error}</p>}

            <span className={styles.fineprint}>
              By signing up, you agree to the <a className={styles.linkX} href="#">Terms</a>.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
