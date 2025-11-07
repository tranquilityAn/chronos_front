import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
// важное: используем тот же файл стилей, что и логин
import "../../styles/Login.css";
import { register } from "../../features/auth/authSlice";

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((s) => s.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    if (password !== password2) {
      alert("Пароли не совпадают");
      return;
    }
    try {
      await dispatch(register({ email, password })).unwrap();
      // если после регистрации сразу выдаётся токен — можно вести на главную
      // иначе поменяй на navigate("/login")
      navigate("/");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <label>Houdini</label>
      </div>

      <div className="container-main">
        <div className="container-image"></div>

        <div className="container-login">
          <div className="container-second-color">
            <h2>Sign up</h2>

            <form onSubmit={onSubmit}>
              <div className="container-input">
                <label className="label-input">Email</label>
                <input
                  type="email"
                  placeholder="you@domain.com"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="container-input">
                <label className="label-input">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="container-input">
                <label className="label-input">Confirm password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                />
                <label id="ny-eto">
                  Already have an account?{" "}
                  <Link to="/login">Sign in</Link>
                </label>
              </div>

              <button type="submit" disabled={status === "loading"}>
                {status === "loading" ? "Registering…" : "Register"}
              </button>
            </form>

            {error && <p style={{ color: "crimson" }}>Ошибка: {error}</p>}

            <label id="ne-eto">
              By signing up, you agree to the{" "}
              <a href="#">Terms</a>.
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
