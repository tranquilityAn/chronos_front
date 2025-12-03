import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import Modal from "../ui/Modal";
import Toast, { useToast } from "../ui/Toast";
import { shareEvent, fetchEventMembers, removeEventMember } from "../../features/events/eventApi";
import { getUserById } from "../../features/user/userApi";
import { removeSharedEventById } from "../../features/sharedEvents/sharedEventsSlice";
import { removeSharedEventFromCalendar } from "../../features/events/eventsSlice";

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
    
    // Share functionality state
    const { toast, showToast, hideToast } = useToast();
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [shareEmail, setShareEmail] = useState("");
    const [isSharing, setIsSharing] = useState(false);
    const [shareError, setShareError] = useState(null);

    // Get current user for shared event detection
    const currentUser = useSelector((s) => s.auth.user);
    const dispatch = useDispatch();

    // State and cache for owner user data
    const [ownerUser, setOwnerUser] = useState(null);
    const ownerCacheRef = useRef({});

    // Event members state
    const [eventMembers, setEventMembers] = useState([]);
    const [membersLoading, setMembersLoading] = useState(false);
    const [membersError, setMembersError] = useState(null);
    const [memberActionLoadingId, setMemberActionLoadingId] = useState(null);

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
        // Reset share state
        setIsShareOpen(false);
        setShareEmail("");
        setShareError(null);
        // Reset owner user state
        const sharedOwnerFromEvent = event?.sharedOwner || null;
        setOwnerUser(sharedOwnerFromEvent || null);
        // Reset event members state
        setEventMembers([]);
        setMembersLoading(false);
        setMembersError(null);
        setMemberActionLoadingId(null);
    }, [event, isOpen]);

    // Determine if event is shared and if current user is recipient (not owner)
    // Вычисляем переменные после всех хуков, но до раннего return
    const isShared = event?.isShared === true || !!event?.sharedItemId;
    const sharedOwnerFromEvent = event?.sharedOwner || null;
    const sharedOwnerId = event?.sharedOwnerId || 
                         (event?.createdBy ? String(event.createdBy) : null) ||
                         null;

    // Определяем, является ли текущий пользователь владельцем
    const currentUserId = currentUser?.id || currentUser?._id || null;
    const isOwner = !!currentUserId && 
                    !!sharedOwnerId && 
                    String(currentUserId) === String(sharedOwnerId);

    const isSharedRecipient = isShared && !isOwner;

    // Extract calendarId and eventId for API calls
    const calendarId = event?.calendarId || event?.calendar?.id || event?.calendar?._id || null;
    const eventId = event?.id || event?._id || null;
    const eventOwnerId = event?.createdBy ? String(event.createdBy) : null;

    // Load owner data for shared events
    useEffect(() => {
        let isCancelled = false;

        const loadOwner = async () => {
            // Нужен только если это shared event и мы не владелец
            if (!isSharedRecipient) return;
            if (!sharedOwnerId) return;

            // Если данные уже есть в event, используем их
            if (sharedOwnerFromEvent && !ownerUser) {
                setOwnerUser(sharedOwnerFromEvent);
                return;
            }

            // Проверим кэш внутри компонента
            if (ownerCacheRef.current[sharedOwnerId]) {
                setOwnerUser(ownerCacheRef.current[sharedOwnerId]);
                return;
            }

            try {
                const userData = await getUserById(sharedOwnerId);
                if (isCancelled) return;

                ownerCacheRef.current[sharedOwnerId] = userData;
                setOwnerUser(userData);
            } catch (e) {
                console.error("Failed to load event owner by id:", e);
            }
        };

        loadOwner();

        return () => {
            isCancelled = true;
        };
    }, [isSharedRecipient, sharedOwnerId, sharedOwnerFromEvent, ownerUser]);

    // Load event members for shared events
    useEffect(() => {
        if (!isOpen) return;
        if (!calendarId || !eventId) return;
        if (!isShared) return; // Only load for shared events

        let cancelled = false;

        const loadMembers = async () => {
            try {
                setMembersLoading(true);
                setMembersError(null);
                const members = await fetchEventMembers({ calendarId, eventId });
                if (cancelled) return;
                setEventMembers(members || []);
            } catch (err) {
                if (cancelled) return;
                console.error("Failed to load event members", err);
                setMembersError(
                    err?.response?.data?.error ||
                    err?.response?.data?.message ||
                    "Failed to load event members"
                );
            } finally {
                if (!cancelled) setMembersLoading(false);
            }
        };

        loadMembers();

        return () => {
            cancelled = true;
        };
    }, [isOpen, calendarId, eventId, isShared]);

    // Compute current member and event owner status
    const currentMember = eventMembers.find(
        (m) => currentUser && m.user && String(m.user.id || m.user._id) === String(currentUserId)
    );
    const iAmEventOwner = !!currentUserId && 
                          !!eventOwnerId && 
                          String(currentUserId) === String(eventOwnerId);

    // Early return after all hooks
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

    const handleToggleCompleted = async () => {
        if (isUpdating || !event || event.type !== "task") return;
        try {
            await onUpdate(event.calendarId, event.id, { isDone: !event.isDone });
        } catch (err) {
            // Ошибка обрабатывается в родительском компоненте
        }
    };

    const handleOpenShare = () => {
        setIsShareOpen(prev => !prev);
        setShareError(null);
    };

    const handleChangeShareEmail = (e) => {
        setShareEmail(e.target.value);
        setShareError(null);
    };

    const handleSubmitShare = async (e) => {
        e.preventDefault();
        if (!event) return;

        const trimmedEmail = (shareEmail || "").trim();
        if (!trimmedEmail) {
            setShareError("Email is required");
            return;
        }

        try {
            setIsSharing(true);
            setShareError(null);

            const calendarId = event.calendarId || event.calendar?.id;
            const eventId = event.id || event._id;

            await shareEvent({
                calendarId,
                eventId,
                email: trimmedEmail,
            });

            showToast("Invite sent successfully", "success");
            setShareEmail("");
            setIsShareOpen(false);
        } catch (err) {
            const msg =
                err?.response?.data?.error ||
                err?.response?.data?.message ||
                err?.message ||
                "Failed to send invite";
            setShareError(msg);
            showToast(msg, "error");
        } finally {
            setIsSharing(false);
        }
    };

    const handleRemoveMember = async (member) => {
        if (!calendarId || !eventId) return;
        if (!currentUser) return;
        if (!member?.user?.id && !member?.user?._id) return;

        const userId = member.user.id || member.user._id;

        const confirmed = window.confirm(
            `Remove ${member.user.name || member.user.email} from this event?`
        );
        if (!confirmed) return;

        try {
            setMemberActionLoadingId(userId);
            await removeEventMember({ calendarId, eventId, userId });

            // Локально обновляем список участников
            setEventMembers((prev) => prev.filter((m) => {
                const mid = m.user.id || m.user._id;
                return String(mid) !== String(userId);
            }));

            showToast("Member removed successfully", "success");
        } catch (err) {
            console.error("Failed to remove event member", err);
            const msg =
                err?.response?.data?.error ||
                err?.response?.data?.message ||
                err?.message ||
                "Failed to remove member";
            showToast(msg, "error");
        } finally {
            setMemberActionLoadingId(null);
        }
    };

    const handleLeaveEvent = async () => {
        if (!calendarId || !eventId) return;
        if (!currentUser) return;

        const userId = currentUser.id || currentUser._id;

        const confirmed = window.confirm("Are you sure you want to leave this event?");
        if (!confirmed) return;

        try {
            setMemberActionLoadingId(userId);
            await removeEventMember({ calendarId, eventId, userId });

            // Локально обновляем список участников
            setEventMembers((prev) => prev.filter((m) => {
                const mid = m.user.id || m.user._id;
                return String(mid) !== String(userId);
            }));

            // Удаляем из sharedEventsSlice
            if (event.sharedItemId) {
                dispatch(removeSharedEventById(event.sharedItemId));
            }
            
            // Удаляем из eventsSlice.byDate
            if (event.sharedItemId) {
                dispatch(removeSharedEventFromCalendar(event.sharedItemId));
            }

            showToast("You have left the event", "success");

            // Закрываем модалку после выхода
            if (typeof onClose === "function") {
                onClose();
            }
        } catch (err) {
            console.error("Failed to leave event", err);
            const msg =
                err?.response?.data?.error ||
                err?.response?.data?.message ||
                err?.message ||
                "Failed to leave event";
            showToast(msg, "error");
        } finally {
            setMemberActionLoadingId(null);
        }
    };

    return (
        <>
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
                                        <div className="event-detail__status-toggle">
                                            <label htmlFor="task-completed-toggle" className="event-detail__toggle-label">
                                                <input
                                                    type="checkbox"
                                                    id="task-completed-toggle"
                                                    checked={event?.isDone === true}
                                                    onChange={handleToggleCompleted}
                                                    disabled={isUpdating}
                                                    className="event-detail__toggle-input"
                                                />
                                                <span className="event-detail__toggle-text">Completed</span>
                                            </label>
                                        </div>
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

                            {/* Owner information for shared events */}
                            {isSharedRecipient && (() => {
                                const ownerName = ownerUser?.name || 
                                                 ownerUser?.nickname || 
                                                 ownerUser?.username || 
                                                 null;
                                const ownerEmail = ownerUser?.email || null;
                                const ownerDisplayText = ownerName && ownerEmail
                                    ? `${ownerName} (${ownerEmail})`
                                    : ownerName || ownerEmail || null;
                                
                                return ownerDisplayText ? (
                                    <div className="event-detail__row event-detail__row--owner">
                                        <span className="event-detail__label">Owner</span>
                                        <span className="event-detail__value">
                                            {ownerDisplayText}
                                        </span>
                                    </div>
                                ) : null;
                            })()}
                        </div>

                        {/* Event Members Section */}
                        {isShared && (membersLoading || membersError || (eventMembers && eventMembers.length > 0)) && (
                            <div className="event-members">
                                <div className="event-members__header">
                                    <h4 className="event-members__title">Participants</h4>
                                    {membersLoading && (
                                        <span className="event-members__status">Loading...</span>
                                    )}
                                    {membersError && (
                                        <span className="event-members__status event-members__status--error">
                                            {membersError}
                                        </span>
                                    )}
                                </div>

                                {!membersLoading && !membersError && eventMembers && eventMembers.length > 0 && (
                                <ul className="event-members__list">
                                    {eventMembers.map((member) => {
                                        if (!member.user) return null;

                                        const user = member.user || {};
                                        const userId = user.id || user._id;
                                        const isMe =
                                            currentUser &&
                                            userId &&
                                            String(userId) === String(currentUserId);

                                        const isOwner = userId && eventOwnerId && String(userId) === String(eventOwnerId);

                                        return (
                                            <li key={userId} className="event-members__item">
                                                <div className="event-members__info">
                                                    <div className="event-members__name">
                                                        {user.name || user.email || "Unknown user"}
                                                        {isMe && " • You"}
                                                    </div>
                                                    {user.email && user.name && (
                                                        <div className="event-members__email">
                                                            {user.email}
                                                        </div>
                                                    )}
                                                    <div className="event-members__role">
                                                        {isOwner ? "Owner" : "Member"}
                                                    </div>
                                                </div>

                                                <div className="event-members__actions">
                                                    {/* Владелец ивента может удалить других участников */}
                                                    {iAmEventOwner && !isMe && (
                                                        <button
                                                            type="button"
                                                            className="event-members__btn event-members__btn--remove"
                                                            disabled={memberActionLoadingId === userId}
                                                            onClick={() => handleRemoveMember(member)}
                                                        >
                                                            {memberActionLoadingId === userId ? "Removing..." : "Remove"}
                                                        </button>
                                                    )}

                                                    {/* Получатель (не-owner) может удалить только себя */}
                                                    {!iAmEventOwner && isMe && (
                                                        <button
                                                            type="button"
                                                            className="event-members__btn event-members__btn--leave"
                                                            disabled={memberActionLoadingId === userId}
                                                            onClick={handleLeaveEvent}
                                                        >
                                                            {memberActionLoadingId === userId ? "Leaving..." : "Leave event"}
                                                        </button>
                                                    )}
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                                )}
                                {!membersLoading && !membersError && (!eventMembers || eventMembers.length === 0) && (
                                    <div style={{ padding: "12px", textAlign: "center", color: "var(--second-text-color)", fontSize: "14px" }}>
                                        No participants found
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Кнопки */}
                        {!isSharedRecipient && (
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
                                    <button
                                        type="button"
                                        className="event-detail__btn event-detail__btn--secondary"
                                        onClick={handleOpenShare}
                                    >
                                        Share
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
                        )}

                        {/* Share form */}
                        {!isSharedRecipient && isShareOpen && (
                            <form
                                className="event-detail__share"
                                onSubmit={handleSubmitShare}
                            >
                                <label className="event-detail__share-label">
                                    Share this event via email
                                </label>
                                <div className="event-detail__share-row">
                                    <input
                                        type="email"
                                        className="event-detail__share-input"
                                        placeholder="user@example.com"
                                        value={shareEmail}
                                        onChange={handleChangeShareEmail}
                                        disabled={isSharing}
                                        required
                                    />
                                    <button
                                        type="submit"
                                        className="event-detail__btn event-detail__btn--primary"
                                        disabled={isSharing}
                                    >
                                        {isSharing ? "Sending..." : "Send"}
                                    </button>
                                </div>

                                {shareError && (
                                    <div className="event-detail__share-message event-detail__share-message--error">
                                        {shareError}
                                    </div>
                                )}
                            </form>
                        )}
                    </>
                )}
            </div>
        </Modal>
        
        {/* Toast notifications */}
        <Toast
            message={toast.message}
            type={toast.type}
            isVisible={toast.isVisible}
            onClose={hideToast}
        />
        </>
    );
}
