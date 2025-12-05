import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./NotFoundPage.css";

export default function NotFoundPage() {
  const audioRef = useRef(null);

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
          })
          .catch((error) => {
            console.log("Audio play was prevented:", error);
          });
      }
    }
  };

  useEffect(() => {
    playAudio();
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
            onClick={playAudio}
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

