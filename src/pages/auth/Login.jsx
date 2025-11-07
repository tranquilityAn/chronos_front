import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/Login.css";
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
      // если нужен редирект после логина:
      navigate("/");
    } catch (err) {
      // error уже в стейте, но и локально покажем
      console.error(err);
    }
  };

  return (
    <div class="container">
      <div class="header">
        <label>Houdini</label>
      </div>
        <div class="container-main">
          <div class="container-image"></div>
            <div class ="container-login">
              <div class="container-second-color">
                <h2>Sign in</h2>

                <form onSubmit={onSubmit}>
                    <div class="container-input">
                    <label  class="label-input">Email</label>
                      <input
                          type="email"
                          placeholder="user@example.com"
                          required
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    <div class="container-input">
                      <label class="label-input">Password</label>
                      <input
                          type="password"
                          placeholder="Enter your password"
                          required
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                      />
                      <label id="ny-eto">Forgot your password? <Link to="/register">Change it.</Link></label>
                    </div>
                    
                    <button type="submit" disabled={status === "loading"}>
                    {status === "loading" ? "Logging in…" : "Sign in"}
                    </button>
                </form>

                {error && <p style={{ color: "crimson" }}>Error: {error}</p>}
                {token && <p style={{ color: "green" }}></p>}

                <label id="ne-eto">
                    No account? <Link to="/register">Register</Link>
                </label>
              </div>
            </div>
          </div>
    </div>
  );
}
