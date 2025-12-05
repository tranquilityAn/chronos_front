import { useEffect } from "react";
import "../../styles/modal.css";

export default function Modal({ isOpen, onClose, title, children, closePosition = "right" }) {
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            document.addEventListener("keydown", handleEsc);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleEsc);
            document.body.style.overflow = "";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className={`modal-header modal-header--close-${closePosition}`}>
                    {closePosition === "left" && (
                        <button className="modal-close" onClick={onClose}>
                            ✕
                        </button>
                    )}
                    {title && <h2 className="modal-title">{title}</h2>}
                    {!title && <div className="modal-header__spacer" />}
                    {closePosition === "right" && (
                        <button className="modal-close" onClick={onClose}>
                            ✕
                        </button>
                    )}
                </div>
                <div className="modal-body">{children}</div>
            </div>
        </div>
    );
}
