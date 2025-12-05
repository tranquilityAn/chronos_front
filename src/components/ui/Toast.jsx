import { useEffect, useState } from "react";
import "../../styles/modal.css";

export default function Toast({ 
    message, 
    type = "info", 
    isVisible, 
    onClose, 
    duration = 3000 
}) {
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        if (isVisible && duration > 0) {
            const timer = setTimeout(() => {
                setIsClosing(true);
                setTimeout(onClose, 300);
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    useEffect(() => {
        if (isVisible) {
            setIsClosing(false);
        }
    }, [isVisible]);

    if (!isVisible) return null;

    const icons = {
        success: "✓",
        error: "✕",
        info: "ℹ",
    };

    return (
        <div className={`toast toast--${type} ${isClosing ? "toast--closing" : ""}`}>
            <span className="toast__icon">{icons[type]}</span>
            <span className="toast__message">{message}</span>
            <button className="toast__close" onClick={() => {
                setIsClosing(true);
                setTimeout(onClose, 300);
            }}>
                ✕
            </button>
        </div>
    );
}

export function useToast() {
    const [toast, setToast] = useState({
        isVisible: false,
        message: "",
        type: "info",
    });

    const showToast = (message, type = "info") => {
        setToast({ isVisible: true, message, type });
    };

    const hideToast = () => {
        setToast((prev) => ({ ...prev, isVisible: false }));
    };

    return { toast, showToast, hideToast };
}

