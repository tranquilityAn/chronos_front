import { useState, useEffect } from "react";
import Modal from "../ui/Modal";

/**
 * Форматирует дату/время для отображения
 */
function formatDateTime(dateString, options = {}) {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
        ...options,
    });
}

/**
 * Форматирует только дату
 */
function formatDate(dateString) {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

/**
 * Возвращает название типа события для отображения
 */
function getEventTypeLabel(type) {
    switch (type) {
        case "arrangement":
            return "Meeting";
        case "reminder":
            return "Reminder";
        case "task":
            return "Task";
        default:
            return "Event";
    }
}

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
 * Модальное окно с деталями события
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   event: object | null,
 *   onDelete: (calendarId: string, eventId: string) => Promise<void>,
 *   onUpdate: (calendarId: string, eventId: string, data: object) => Promise<void>,
 *   isDeleting?: boolean,
 *   isUpdating?: boolean
 * }} props
 */
export default function EventDetailModal({
    isOpen,
    onClose,
    event,
    onDelete,
    onUpdate,
    isDeleting,
    isUpdating,
}) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        title: "",
        description: "",
        color: "",
    });
    const [error, setError] = useState("");

    // Сброс состояния при открытии/закрытии
    useEffect(() => {
        if (event) {
            setEditData({
                title: event.title || "",
                description: event.description || "",
                color: event.color || "",
            });
        }
        setIsEditing(false);
        setShowDeleteConfirm(false);
        setError("");
    }, [event, isOpen]);

    if (!event) return null;

    const handleDelete = async () => {
        try {
            await onDelete(event.calendarId, event.id);
            setShowDeleteConfirm(false);
            onClose();
        } catch (err) {
            // Ошибка обрабатывается в родительском компоненте
        }
    };

    const handleClose = () => {
        setShowDeleteConfirm(false);
        setIsEditing(false);
        setError("");
        onClose();
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditData((prev) => ({ ...prev, [name]: value }));
        setError("");
    };

    const handleColorSelect = (color) => {
        setEditData((prev) => ({ ...prev, color }));
    };

    const handleSave = async () => {
        if (!editData.title.trim()) {
            setError("Title is required");
            return;
        }
        if (editData.title.length > 200) {
            setError("Title must be less than 200 characters");
            return;
        }

        try {
            await onUpdate(event.calendarId, event.id, {
                title: editData.title.trim(),
                description: editData.description.trim() || undefined,
                color: editData.color || undefined,
            });
            setIsEditing(false);
        } catch (err) {
            setError(err?.response?.data?.message || err.message || "Failed to update");
        }
    };

    const handleCancelEdit = () => {
        setEditData({
            title: event.title || "",
            description: event.description || "",
            color: event.color || "",
        });
        setIsEditing(false);
        setError("");
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={null} closePosition="right">
            <div className="event-detail">
                {/* Заголовок с типом */}
                <div className="event-detail__header">
                    <span className="event-detail__type-label">
                        {getEventTypeLabel(event.type)}
                    </span>
                </div>

                {/* Режим редактирования */}
                {isEditing ? (
                    <div className="event-detail__edit-form">
                        {/* Название */}
                        <div className="event-detail__edit-group">
                            <label className="event-detail__edit-label">Title</label>
                            <input
                                type="text"
                                name="title"
                                className="event-detail__edit-input"
                                value={editData.title}
                                onChange={handleEditChange}
                                maxLength={200}
                                autoFocus
                            />
                        </div>

                        {/* Описание */}
                        <div className="event-detail__edit-group">
                            <label className="event-detail__edit-label">Description</label>
                            <textarea
                                name="description"
                                className="event-detail__edit-textarea"
                                value={editData.description}
                                onChange={handleEditChange}
                                maxLength={5000}
                                rows={3}
                                placeholder="Optional description..."
                            />
                        </div>

                        {/* Цвет */}
                        <div className="event-detail__edit-group">
                            <label className="event-detail__edit-label">Color</label>
                            <div className="event-detail__colors">
                                <button
                                    type="button"
                                    className={`event-detail__color-btn event-detail__color-btn--none ${
                                        !editData.color ? "event-detail__color-btn--selected" : ""
                                    }`}
                                    onClick={() => handleColorSelect("")}
                                    title="No color"
                                >
                                    ✕
                                </button>
                                {COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        className={`event-detail__color-btn ${
                                            editData.color === color ? "event-detail__color-btn--selected" : ""
                                        }`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => handleColorSelect(color)}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Ошибка */}
                        {error && <div className="event-detail__error">{error}</div>}

                        {/* Кнопки редактирования */}
                        <div className="event-detail__edit-actions">
                            <button
                                type="button"
                                className="event-detail__btn event-detail__btn--cancel"
                                onClick={handleCancelEdit}
                                disabled={isUpdating}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="event-detail__btn event-detail__btn--save"
                                onClick={handleSave}
                                disabled={isUpdating}
                            >
                                {isUpdating ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Название */}
                        <h2 className="event-detail__title">{event.title}</h2>

                        {/* Цветовой индикатор */}
                        {event.color && (
                            <div
                                className="event-detail__color-bar"
                                style={{ backgroundColor: event.color }}
                            />
                        )}

                        {/* Детали в зависимости от типа */}
                        <div className="event-detail__info">
                            {/* Arrangement (Meeting) */}
                            {event.type === "arrangement" && (
                                <>
                                    {event.allDay ? (
                                        <div className="event-detail__row">
                                            <span className="event-detail__label">Date</span>
                                            <span className="event-detail__value">
                                                All day event
                                            </span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="event-detail__row">
                                                <span className="event-detail__label">Start</span>
                                                <span className="event-detail__value">
                                                    {formatDateTime(event.startAt)}
                                                </span>
                                            </div>
                                            <div className="event-detail__row">
                                                <span className="event-detail__label">End</span>
                                                <span className="event-detail__value">
                                                    {formatDateTime(event.endAt)}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                    {event.location && (
                                        <div className="event-detail__row">
                                            <span className="event-detail__label">Location</span>
                                            <span className="event-detail__value">
                                                {event.location}
                                            </span>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Reminder */}
                            {event.type === "reminder" && (
                                <div className="event-detail__row">
                                    <span className="event-detail__label">Remind at</span>
                                    <span className="event-detail__value">
                                        {formatDateTime(event.remindAt)}
                                    </span>
                                </div>
                            )}

                            {/* Task */}
                            {event.type === "task" && (
                                <>
                                    <div className="event-detail__row">
                                        <span className="event-detail__label">Due date</span>
                                        <span className="event-detail__value">
                                            {formatDateTime(event.dueAt)}
                                        </span>
                                    </div>
                                    <div className="event-detail__row">
                                        <span className="event-detail__label">Status</span>
                                        <span className={`event-detail__value event-detail__status--${event.isDone ? "done" : "pending"}`}>
                                            {event.isDone ? "Completed" : "Pending"}
                                        </span>
                                    </div>
                                </>
                            )}

                            {/* Описание */}
                            {event.description && (
                                <div className="event-detail__row event-detail__row--column">
                                    <span className="event-detail__label">Description</span>
                                    <p className="event-detail__description">
                                        {event.description}
                                    </p>
                                </div>
                            )}

                            {/* Дата создания */}
                            <div className="event-detail__row event-detail__row--meta">
                                <span className="event-detail__meta">
                                    Created: {formatDate(event.createdAt)}
                                </span>
                            </div>
                        </div>

                        {/* Кнопки */}
                        <div className="event-detail__actions">
                            {!showDeleteConfirm ? (
                                <>
                                    <button
                                        type="button"
                                        className="event-detail__btn event-detail__btn--delete"
                                        onClick={() => setShowDeleteConfirm(true)}
                                    >
                                        Delete
                                    </button>
                                    <button
                                        type="button"
                                        className="event-detail__btn event-detail__btn--edit"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        Edit
                                    </button>
                                </>
                            ) : (
                                <div className="event-detail__confirm">
                                    <p className="event-detail__confirm-text">
                                        Are you sure you want to delete this event?
                                    </p>
                                    <div className="event-detail__confirm-actions">
                                        <button
                                            type="button"
                                            className="event-detail__btn event-detail__btn--cancel"
                                            onClick={() => setShowDeleteConfirm(false)}
                                            disabled={isDeleting}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            className="event-detail__btn event-detail__btn--confirm-delete"
                                            onClick={handleDelete}
                                            disabled={isDeleting}
                                        >
                                            {isDeleting ? "Deleting..." : "Yes, delete"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}
