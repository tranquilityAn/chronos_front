import { useState, useEffect } from "react";
import Modal from "../ui/Modal";

const EVENT_TYPES = [
    { value: "arrangement", label: "Meeting" },
    { value: "reminder", label: "Reminder" },
    { value: "task", label: "Task" },
];

function toLocalDatetime(date) {
    if (!date) return "";
    const d = new Date(date);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60 * 1000);
    return local.toISOString().slice(0, 16);
}

export default function CreateEventModal({
    isOpen,
    onClose,
    onSubmit,
    calendars,
    selectedDate,
    isLoading,
}) {
    const [formData, setFormData] = useState({
        calendarId: "",
        type: "arrangement",
        title: "",
        description: "",
        allDay: false,
        startAt: "",
        endAt: "",
        location: "",
        remindAt: "",
        dueAt: "",
    });
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            const defaultCalendar = calendars.find((c) => c.type === "primary") || calendars[0];
            const now = selectedDate || new Date();
            const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

            setFormData((prev) => ({
                ...prev,
                calendarId: defaultCalendar?.id || "",
                startAt: toLocalDatetime(now),
                endAt: toLocalDatetime(oneHourLater),
                remindAt: toLocalDatetime(now),
                dueAt: toLocalDatetime(now),
            }));
        }
    }, [isOpen, calendars, selectedDate]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!formData.calendarId) {
            setError("Please select a calendar");
            return;
        }
        if (!formData.title.trim()) {
            setError("Event title is required");
            return;
        }
        if (formData.title.length > 200) {
            setError("Title must be less than 200 characters");
            return;
        }

        const payload = {
            type: formData.type,
            title: formData.title.trim(),
            description: formData.description.trim() || undefined,
        };

        if (formData.type === "arrangement") {
            payload.allDay = formData.allDay;
            if (formData.allDay) {
                if (!formData.startAt) {
                    setError("Start date is required");
                    return;
                }
                const startDate = new Date(formData.startAt);
                startDate.setHours(0, 0, 0, 0);
                payload.startAt = startDate.toISOString();
                const endDate = new Date(startDate);
                endDate.setHours(23, 59, 59, 999);
                payload.endAt = endDate.toISOString();
            } else {
                if (!formData.startAt) {
                    setError("Start date/time is required");
                    return;
                }
                if (!formData.endAt) {
                    setError("End date/time is required");
                    return;
                }
                const start = new Date(formData.startAt);
                const end = new Date(formData.endAt);
                if (start >= end) {
                    setError("End time must be after start time");
                    return;
                }
                payload.startAt = start.toISOString();
                payload.endAt = end.toISOString();
            }
            if (formData.location.trim()) {
                payload.location = formData.location.trim();
            }
        } else if (formData.type === "reminder") {
            if (!formData.remindAt) {
                setError("Remind date/time is required");
                return;
            }
            payload.remindAt = new Date(formData.remindAt).toISOString();
        } else if (formData.type === "task") {
            if (!formData.dueAt) {
                setError("Due date/time is required");
                return;
            }
            payload.dueAt = new Date(formData.dueAt).toISOString();
        }

        try {
            await onSubmit(formData.calendarId, payload);
            resetForm();
        } catch (err) {
            setError(err?.response?.data?.message || err.message || "Failed to create event");
        }
    };

    const resetForm = () => {
        setFormData({
            calendarId: calendars[0]?.id || "",
            type: "arrangement",
            title: "",
            description: "",
            allDay: false,
            startAt: "",
            endAt: "",
            location: "",
            remindAt: "",
            dueAt: "",
        });
        setError("");
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Create Event">
            <form className="modal-form" onSubmit={handleSubmit}>
                <div className="modal-form__group">
                    <label className="modal-form__label">
                        Calendar <span className="modal-form__required">*</span>
                    </label>
                    <select
                        name="calendarId"
                        className="modal-form__select"
                        value={formData.calendarId}
                        onChange={handleChange}
                    >
                        {calendars.map((cal) => (
                            <option key={cal.id} value={cal.id}>
                                {cal.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="modal-form__group">
                    <label className="modal-form__label">Event Type</label>
                    <div className="modal-form__radio-group">
                        {EVENT_TYPES.map((t) => (
                            <label key={t.value} className="modal-form__radio">
                                <input
                                    type="radio"
                                    name="type"
                                    value={t.value}
                                    checked={formData.type === t.value}
                                    onChange={handleChange}
                                />
                                <span>{t.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="modal-form__group">
                    <label className="modal-form__label">
                        Title <span className="modal-form__required">*</span>
                    </label>
                    <input
                        type="text"
                        name="title"
                        className="modal-form__input"
                        placeholder="Event title"
                        value={formData.title}
                        onChange={handleChange}
                        maxLength={200}
                        autoFocus
                    />
                </div>

                <div className="modal-form__group">
                    <label className="modal-form__label">Description</label>
                    <textarea
                        name="description"
                        className="modal-form__textarea"
                        placeholder="Optional description..."
                        value={formData.description}
                        onChange={handleChange}
                        maxLength={5000}
                        rows={2}
                    />
                </div>

                {formData.type === "arrangement" && (
                    <>
                        <div className="modal-form__group">
                            <label className="modal-form__checkbox">
                                <input
                                    type="checkbox"
                                    name="allDay"
                                    checked={formData.allDay}
                                    onChange={handleChange}
                                />
                                <span>All day event</span>
                            </label>
                        </div>

                        {!formData.allDay && (
                            <div className="modal-form__row">
                                <div className="modal-form__group modal-form__group--half">
                                    <label className="modal-form__label">
                                        Start <span className="modal-form__required">*</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        name="startAt"
                                        className="modal-form__input"
                                        value={formData.startAt}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="modal-form__group modal-form__group--half">
                                    <label className="modal-form__label">
                                        End <span className="modal-form__required">*</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        name="endAt"
                                        className="modal-form__input"
                                        value={formData.endAt}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="modal-form__group">
                            <label className="modal-form__label">Location</label>
                            <input
                                type="text"
                                name="location"
                                className="modal-form__input"
                                placeholder="Meeting location"
                                value={formData.location}
                                onChange={handleChange}
                                maxLength={500}
                            />
                        </div>
                    </>
                )}

                {formData.type === "reminder" && (
                    <div className="modal-form__group">
                        <label className="modal-form__label">
                            Remind At <span className="modal-form__required">*</span>
                        </label>
                        <input
                            type="datetime-local"
                            name="remindAt"
                            className="modal-form__input"
                            value={formData.remindAt}
                            onChange={handleChange}
                        />
                    </div>
                )}

                {formData.type === "task" && (
                    <div className="modal-form__group">
                        <label className="modal-form__label">
                            Due Date <span className="modal-form__required">*</span>
                        </label>
                        <input
                            type="datetime-local"
                            name="dueAt"
                            className="modal-form__input"
                            value={formData.dueAt}
                            onChange={handleChange}
                        />
                    </div>
                )}

                {error && <div className="modal-form__error">{error}</div>}

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
                        {isLoading ? "Creating..." : "Create Event"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

