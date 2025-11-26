import { useEffect, useState } from "react";
import "../../styles/modal.css";

/**
 * Toast уведомление
 * @param {{
 *   message: string,
 *   type: 'success' | 'error' | 'info',
 *   isVisible: boolean,
 *   onClose: () => void,
 *   duration?: number
 * }} props
 */
export default function Toast({ 
    message, 
    type = "info", 
    isVisible, 
    onClose, 
    duration = 3000 
}) {
    useEffect(() => {
        if (isVisible && duration > 0) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    if (!isVisible) return null;

    const icons = {
        success: "✓",
        error: "✕",
        info: "ℹ",
    };

    return (
        <div className={`toast toast--${type}`}>
            <span className="toast__icon">{icons[type]}</span>
            <span className="toast__message">{message}</span>
            <button className="toast__close" onClick={onClose}>
                ✕
            </button>
        </div>
    );
}

/**
 * Хук для управления toast уведомлениями
 */
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

