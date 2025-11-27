import { useState, useEffect } from "react";
import Modal from "../ui/Modal";

const COLORS = [
    "#EDE986", // yellow (accent)
    "#7AC74F", // green
    "#5DADE2", // blue
    "#AF7AC5", // purple
    "#E86A5D", // red
    "#F5B041", // orange
    "#58D68D", // mint
    "#85C1E9", // light blue
];

/**
 * Модальное окно редактирования календаря
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onSubmit: (calendarId: string, data: { name: string, description?: string, color?: string }) => Promise<void>,
 *   onDelete: (calendarId: string) => Promise<void>,
 *   calendar: { id: string, name: string, description?: string, color?: string } | null,
 *   isLoading?: boolean,
 *   isDeleting?: boolean
 * }} props
 */
export default function EditCalendarModal({ isOpen, onClose, onSubmit, onDelete, calendar, isLoading, isDeleting }) {
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        color: COLORS[0],
    });
    const [error, setError] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Заполнение формы при открытии или изменении календаря
    useEffect(() => {
        if (calendar && isOpen) {
            setFormData({
                name: calendar.name || "",
                description: calendar.description || "",
                color: calendar.color || COLORS[0],
            });
            setError("");
            setShowDeleteConfirm(false);
        }
    }, [calendar, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError("");
    };

    const handleColorSelect = (color) => {
        setFormData((prev) => ({ ...prev, color }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // Валидация
        if (!formData.name.trim()) {
            setError("Calendar name is required");
            return;
        }
        if (formData.name.length > 100) {
            setError("Name must be less than 100 characters");
            return;
        }

        if (!calendar) return;

        try {
            await onSubmit(calendar.id, {
                name: formData.name.trim(),
                description: formData.description.trim() || undefined,
                color: formData.color || undefined,
            });
        } catch (err) {
            setError(err?.response?.data?.message || err.message || "Failed to update calendar");
        }
    };

    const handleClose = () => {
        setError("");
        setShowDeleteConfirm(false);
        onClose();
    };

    const handleDelete = async () => {
        if (!calendar) return;
        try {
            await onDelete(calendar.id);
            setShowDeleteConfirm(false);
            onClose();
        } catch (err) {
            setError(err?.response?.data?.message || err.message || "Failed to delete calendar");
        }
    };

    if (!calendar) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Edit Calendar">
            <form className="modal-form" onSubmit={handleSubmit}>
                {/* Название */}
                <div className="modal-form__group">
                    <label className="modal-form__label">
                        Name <span className="modal-form__required">*</span>
                    </label>
                    <input
                        type="text"
                        name="name"
                        className="modal-form__input"
                        placeholder="My Calendar"
                        value={formData.name}
                        onChange={handleChange}
                        maxLength={100}
                        autoFocus
                    />
                </div>

                {/* Описание */}
                <div className="modal-form__group">
                    <label className="modal-form__label">Description</label>
                    <textarea
                        name="description"
                        className="modal-form__textarea"
                        placeholder="Optional description..."
                        value={formData.description}
                        onChange={handleChange}
                        maxLength={2000}
                        rows={3}
                    />
                </div>

                {/* Цвет */}
                <div className="modal-form__group">
                    <label className="modal-form__label">Color</label>
                    <div className="modal-form__colors">
                        <button
                            type="button"
                            className={`modal-form__color-btn ${
                                !formData.color ? "modal-form__color-btn--selected" : ""
                            }`}
                            style={{ 
                                backgroundColor: "transparent",
                                border: "2px dashed var(--second-text-color)"
                            }}
                            onClick={() => handleColorSelect("")}
                            title="No color"
                        >
                            ✕
                        </button>
                        {COLORS.map((color) => (
                            <button
                                key={color}
                                type="button"
                                className={`modal-form__color-btn ${
                                    formData.color === color ? "modal-form__color-btn--selected" : ""
                                }`}
                                style={{ backgroundColor: color }}
                                onClick={() => handleColorSelect(color)}
                            />
                        ))}
                    </div>
                </div>

                {/* Ошибка */}
                {error && <div className="modal-form__error">{error}</div>}

                {/* Подтверждение удаления */}
                {showDeleteConfirm ? (
                    <div className="modal-form__delete-confirm">
                        <p className="modal-form__delete-text">
                            Are you sure you want to delete this calendar? This action cannot be undone.
                        </p>
                        <div className="modal-form__actions">
                            <button
                                type="button"
                                className="modal-form__btn modal-form__btn--secondary"
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="modal-form__btn modal-form__btn--danger"
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? "Deleting..." : "Yes, delete"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Кнопки */}
                        <div className="modal-form__actions">
                            <button
                                type="button"
                                className="modal-form__btn modal-form__btn--danger"
                                onClick={() => setShowDeleteConfirm(true)}
                                disabled={isLoading}
                            >
                                Delete Calendar
                            </button>
                            <div style={{ flex: 1 }} />
                            <button
                                type="submit"
                                className="modal-form__btn modal-form__btn--primary"
                                disabled={isLoading}
                            >
                                {isLoading ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </>
                )}
            </form>
        </Modal>
    );
}

