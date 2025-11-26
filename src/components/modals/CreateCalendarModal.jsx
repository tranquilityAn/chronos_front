import { useState } from "react";
import Modal from "../ui/Modal";

const CALENDAR_TYPES = [
    { value: "ordinary", label: "Ordinary" },
    { value: "holidays", label: "Holidays" },
];

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
 * Модальное окно создания календаря
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onSubmit: (data: { type: string, name: string, description?: string, color?: string }) => Promise<void>,
 *   isLoading?: boolean
 * }} props
 */
export default function CreateCalendarModal({ isOpen, onClose, onSubmit, isLoading }) {
    const [formData, setFormData] = useState({
        type: "ordinary",
        name: "",
        description: "",
        color: COLORS[0],
    });
    const [error, setError] = useState("");

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

        try {
            await onSubmit({
                type: formData.type,
                name: formData.name.trim(),
                description: formData.description.trim() || undefined,
                color: formData.color,
            });
            // Сброс формы после успешного создания
            setFormData({
                type: "ordinary",
                name: "",
                description: "",
                color: COLORS[0],
            });
        } catch (err) {
            setError(err?.response?.data?.message || err.message || "Failed to create calendar");
        }
    };

    const handleClose = () => {
        setError("");
        setFormData({
            type: "ordinary",
            name: "",
            description: "",
            color: COLORS[0],
        });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Create Calendar">
            <form className="modal-form" onSubmit={handleSubmit}>
                {/* Тип календаря */}
                <div className="modal-form__group">
                    <label className="modal-form__label">Type</label>
                    <select
                        name="type"
                        className="modal-form__select"
                        value={formData.type}
                        onChange={handleChange}
                    >
                        {CALENDAR_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                                {t.label}
                            </option>
                        ))}
                    </select>
                </div>

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

                {/* Кнопки */}
                <div className="modal-form__actions">
                    <button
                        type="button"
                        className="modal-form__btn modal-form__btn--secondary"
                        onClick={handleClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="modal-form__btn modal-form__btn--primary"
                        disabled={isLoading}
                    >
                        {isLoading ? "Creating..." : "Create Calendar"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

