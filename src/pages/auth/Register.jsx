import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/Register.css";
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
      // если бэк сразу даёт токен — можно вести на главную, иначе на логин
      navigate("/");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Register</h2>

      <form onSubmit={onSubmit}>
        <div>
          <label>Email</label>
          <input
            type="email"
            placeholder="you@domain.com"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label>Password</label>
          <input
            type="password"
            placeholder="••••••••"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div>
          <label>Confirm password</label>
          <input
            type="password"
            placeholder="••••••••"
            required
            autoComplete="new-password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
          />
        </div>

        <button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Registering…" : "Register"}
        </button>
      </form>

      {error && <p style={{ color: "crimson" }}>Ошибка: {error}</p>}

      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}
