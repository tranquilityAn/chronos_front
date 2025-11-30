import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./NotFoundPage.css";

export default function NotFoundPage() {
  const audioRef = useRef(null);

  useEffect(() => {
    // Принудительно воспроизводим аудио при загрузке страницы
    if (audioRef.current) {
      const playPromise = audioRef.current.play();
      
      // Обрабатываем промис, так как play() возвращает Promise
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Воспроизведение успешно началось
          })
          .catch((error) => {
            // Автоплей заблокирован браузером - это нормально
            console.log("Audio autoplay was prevented:", error);
          });
      }
    }
  }, []);

  return (
    <div className="notfound-page">
      <header className="notfound-header">
        <span className="notfound-brand">Houdini</span>
      </header>
      <main className="notfound-main">
        <div className="notfound-content">
          <img
            src="/404.png"
            alt="404"
            className="notfound-image"
          />
          <h1 className="notfound-title">This page does not exist</h1>
          <p className="notfound-text">
            The page you are looking for was not found.
          </p>
          <Link to="/" className="notfound-link">
            Back to calendar
          </Link>
        </div>

        <audio
          ref={audioRef}
          src="/404.mp3"
          className="notfound-audio"
        />
      </main>
    </div>
  );
}

