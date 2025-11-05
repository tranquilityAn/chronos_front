import { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import api from './app/api.js';

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <h1>Chronos</h1>
      <p>Стартовая страница (плейсхолдер).</p>
      <div>
        <Link to="/login">Войти</Link>
        <Link to="/register">Регистрация</Link>
      </div>
    </div>
  );
}
