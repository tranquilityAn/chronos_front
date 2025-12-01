import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import Modal from "../ui/Modal";
import Toast, { useToast } from "../ui/Toast";
import { 
    updateCalendar, 
    deleteCalendar,
    inviteToCalendar,
    listCalendarMembers,
    removeCalendarMember,
    updateCalendarMemberRole
} from "../../features/calendars/calendarApi";
import "./EditCalendarModal.css";

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
 * Модальное окно редактирования календаря с функционалом шаринга
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onSubmit: (calendarId: string, data: { name: string, description?: string, color?: string }) => Promise<void>,
 *   onDelete: (calendarId: string) => Promise<void>,
 *   calendar: { id: string, name: string, description?: string, color?: string, role: "owner" | "editor" | "viewer", createdAt?: string, updatedAt?: string } | null,
 *   isLoading?: boolean,
 *   isDeleting?: boolean
 * }} props
 */
export default function EditCalendarModal({ 
    isOpen, 
    onClose, 
    onSubmit, 
    onDelete, 
    calendar: calendarProp, 
    isLoading, 
    isDeleting 
}) {
    const currentUser = useSelector((state) => state.auth.user);
    const { toast, showToast, hideToast } = useToast();
    
    const [calendar, setCalendar] = useState(null);
    const [members, setMembers] = useState([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        color: COLORS[0],
    });
    const [error, setError] = useState("");
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    
    // Sharing state
    const [showShareForm, setShowShareForm] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("viewer");
    const [isInviting, setIsInviting] = useState(false);
    const [inviteError, setInviteError] = useState("");
    
    // Member management state
    const [removingMemberId, setRemovingMemberId] = useState(null);
    const [updatingMemberId, setUpdatingMemberId] = useState(null);
    
    // Remove member confirmation modal state
    const [memberToRemove, setMemberToRemove] = useState(null);
    const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);
    const [isRemovingMember, setIsRemovingMember] = useState(false);

    // Определение роли на основе calendar.role
    const isOwner = calendarProp?.role === "owner";
    const isEditor = calendarProp?.role === "editor";
    const isViewer = calendarProp?.role === "viewer";

    // Инициализация calendar и formData при изменении calendarProp
    useEffect(() => {
        if (calendarProp && isOpen) {
            setCalendar(calendarProp);
            setFormData({
                name: calendarProp.name || "",
                description: calendarProp.description || "",
                color: calendarProp.color || COLORS[0],
            });
            loadMembers();
        }
    }, [calendarProp, isOpen]);

    const loadMembers = async () => {
        if (!calendarProp?.id) return;
        
        setIsLoadingMembers(true);
        try {
            const membersData = await listCalendarMembers(calendarProp.id);
            setMembers(membersData || []);
        } catch (err) {
            console.error("Failed to load members:", err);
        } finally {
            setIsLoadingMembers(false);
        }
    };

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

        if (!calendarProp?.id) return;

        try {
            await onSubmit(calendarProp.id, {
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
        setIsDeleteConfirmOpen(false);
        setShowShareForm(false);
        setInviteEmail("");
        setInviteRole("viewer");
        setInviteError("");
        setMembers([]);
        setIsRemoveConfirmOpen(false);
        setMemberToRemove(null);
        onClose();
    };

    const handleDeleteClick = () => {
        setIsDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!calendarProp?.id) return;
        try {
            await onDelete(calendarProp.id);
            setIsDeleteConfirmOpen(false);
            handleClose();
        } catch (err) {
            setError(err?.response?.data?.message || err.message || "Failed to delete calendar");
            // Don't close modal on error, let user see the error and try again or cancel
        }
    };

    const handleCancelDelete = () => {
        setIsDeleteConfirmOpen(false);
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        e.stopPropagation(); // Предотвращаем всплытие события к родительской форме
        setInviteError("");

        // Валидация email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!inviteEmail.trim()) {
            setInviteError("Email is required");
            return;
        }
        if (!emailRegex.test(inviteEmail.trim())) {
            setInviteError("Invalid email format");
            return;
        }

        if (!calendarProp?.id) return;

        setIsInviting(true);
        setInviteError("");
        try {
            console.log("Inviting user:", { calendarId: calendarProp.id, email: inviteEmail.trim(), role: inviteRole });
            const result = await inviteToCalendar(calendarProp.id, {
                email: inviteEmail.trim(),
                role: inviteRole,
            });
            console.log("Invite successful:", result);
            setInviteEmail("");
            setInviteRole("viewer");
            setShowShareForm(false);
            // Перезагружаем список участников
            await loadMembers();
        } catch (err) {
            console.error("Invite error:", err);
            const errorMessage = err?.response?.data?.message || 
                                err?.response?.data?.error || 
                                err?.message || 
                                "Failed to invite user";
            console.error("Invite error details:", {
                status: err?.response?.status,
                data: err?.response?.data,
                message: errorMessage
            });
            setInviteError(errorMessage);
        } finally {
            setIsInviting(false);
        }
    };

    const handleRemoveMemberClick = (member) => {
        if (!calendarProp?.id || !isOwner) return;
        setMemberToRemove(member);
        setIsRemoveConfirmOpen(true);
    };

    const handleConfirmRemoveMember = async () => {
        if (!memberToRemove || !calendarProp?.id || !isOwner) return;

        setIsRemovingMember(true);
        try {
            await removeCalendarMember(calendarProp.id, memberToRemove.user.id);
            await loadMembers();
            showToast("Member removed successfully", "success");
            setIsRemoveConfirmOpen(false);
            setMemberToRemove(null);
        } catch (err) {
            const errorMessage = err?.response?.data?.error ||
                                err?.response?.data?.message ||
                                err?.message ||
                                "Failed to remove member";
            showToast(errorMessage, "error");
        } finally {
            setIsRemovingMember(false);
        }
    };

    const handleCancelRemoveMember = () => {
        setIsRemoveConfirmOpen(false);
        setMemberToRemove(null);
    };

    const handleUpdateMemberRole = async (userId, newRole) => {
        if (!calendarProp?.id || !isOwner) return;

        setUpdatingMemberId(userId);
        try {
            await updateCalendarMemberRole(calendarProp.id, userId, { role: newRole });
            await loadMembers();
        } catch (err) {
            setError(err?.response?.data?.message || err.message || "Failed to update member role");
        } finally {
            setUpdatingMemberId(null);
        }
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            accepted: { text: "Accepted", className: "status-badge--accepted" },
            pending: { text: "Pending", className: "status-badge--pending" },
            declined: { text: "Declined", className: "status-badge--declined" },
        };
        const statusInfo = statusMap[status] || { text: status, className: "" };
        return (
            <span className={`status-badge ${statusInfo.className}`}>
                {statusInfo.text}
            </span>
        );
    };

    const getRoleDisplay = (role) => {
        const roleMap = {
            owner: "Owner",
            editor: "Editor",
            viewer: "Viewer",
        };
        return roleMap[role] || role;
    };

    if (!calendarProp || !isOpen) return null;

    if (!calendar) {
        return (
            <Modal isOpen={isOpen} onClose={handleClose} title="Edit Calendar">
                <div style={{ padding: "20px" }}>
                    {error || "Failed to load calendar"}
                </div>
            </Modal>
        );
    }

    return (
        <>
        <Modal isOpen={isOpen} onClose={handleClose} title="Edit Calendar">
            <div className="modal-form">
                <form onSubmit={handleSubmit}>
                    {/* Информация о календаре */}
                    <div className="modal-form__section">
                        <h3 className="modal-form__section-title">Calendar Information</h3>
                        
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
                                readOnly={isViewer}
                                disabled={isViewer}
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
                                readOnly={isViewer}
                                disabled={isViewer}
                            />
                        </div>

                        {/* Цвет */}
                        <div className="modal-form__group modal-form__group--color">
                            <label className="modal-form__label">Color</label>
                            {isViewer ? (
                                <div className="modal-form__color-display">
                                    <div 
                                        className="modal-form__color-preview"
                                        style={{ 
                                            backgroundColor: formData.color || "transparent",
                                            width: "28px",
                                            height: "28px",
                                            borderRadius: "50%",
                                            border: formData.color ? "2px solid var(--main-text-color)" : "2px dashed var(--second-text-color)",
                                            display: "inline-block"
                                        }}
                                    />
                                </div>
                            ) : (
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
                            )}
                        </div>

                        {/* Даты создания и обновления (как текст) */}
                        {calendar && (calendar.createdAt || calendar.updatedAt) && (
                            <div className="modal-form__group modal-form__group--meta">
                                {calendar.createdAt && (
                                    <div style={{ marginBottom: "8px" }}>
                                        <span className="modal-form__label">Created at: </span>
                                        <span className="modal-form__meta-value">
                                            {new Date(calendar.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                )}
                                {calendar.updatedAt && (
                                    <div>
                                        <span className="modal-form__label">Updated at: </span>
                                        <span className="modal-form__meta-value">
                                            {new Date(calendar.updatedAt).toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Ошибка */}
                    {error && <div className="modal-form__error">{error}</div>}

                    {/* Кнопки */}
                    <div className="modal-form__actions">
                        {isOwner && (
                            <button
                                type="button"
                                className="modal-form__btn modal-form__btn--danger"
                                onClick={handleDeleteClick}
                                disabled={isLoading}
                            >
                                Delete Calendar
                            </button>
                        )}
                        <div style={{ flex: 1 }} />
                        {!isViewer && (
                            <button
                                type="submit"
                                className="modal-form__btn modal-form__btn--primary"
                                disabled={isLoading}
                            >
                                {isLoading ? "Saving..." : "Save Changes"}
                            </button>
                        )}
                    </div>
                </form>

                {/* Секция шаринга - вынесена из основной формы */}
                {isOwner && !isLoadingMembers && (
                    <div className="modal-form__section">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <h3 className="modal-form__section-title">Sharing</h3>
                            <button
                                type="button"
                                className="modal-form__btn modal-form__btn--secondary"
                                onClick={() => {
                                    setShowShareForm(!showShareForm);
                                    setInviteError("");
                                }}
                            >
                                {showShareForm ? "Cancel" : "Share"}
                            </button>
                        </div>

                        {showShareForm && (
                            <form onSubmit={handleInvite} style={{ marginBottom: "16px" }}>
                                <div className="modal-form__group">
                                    <label className="modal-form__label">
                                        Email <span className="modal-form__required">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        className="modal-form__input"
                                        placeholder="user@example.com"
                                        value={inviteEmail}
                                        onChange={(e) => {
                                            setInviteEmail(e.target.value);
                                            setInviteError("");
                                        }}
                                        disabled={isInviting}
                                    />
                                </div>

                                <div className="modal-form__group">
                                    <label className="modal-form__label">Role</label>
                                    <select
                                        className="modal-form__input"
                                        value={inviteRole}
                                        onChange={(e) => setInviteRole(e.target.value)}
                                        disabled={isInviting}
                                    >
                                        <option value="viewer">Viewer</option>
                                        <option value="editor">Editor</option>
                                    </select>
                                </div>

                                {inviteError && (
                                    <div className="modal-form__error" style={{ marginBottom: "12px" }}>
                                        {inviteError}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="modal-form__btn modal-form__btn--primary"
                                    disabled={isInviting}
                                >
                                    {isInviting ? "Inviting..." : "Invite"}
                                </button>
                            </form>
                        )}
                    </div>
                )}

                {/* Список участников */}
                <div className="modal-form__section">
                    <h3 className="modal-form__section-title">Members</h3>
                    
                    {isLoadingMembers ? (
                        <div style={{ padding: "20px", textAlign: "center" }}>
                            Loading members...
                        </div>
                    ) : members.length === 0 ? (
                        <div style={{ padding: "20px", textAlign: "center", color: "var(--second-text-color)" }}>
                            No members found
                        </div>
                    ) : (
                        <div className="members-list">
                            {members.map((member) => {
                                if (!member.user) return null;
                                
                                const isCurrentUser = member.user.id === currentUser?.id;
                                const canManage = isOwner && !isCurrentUser && member.role !== "owner";

                                return (
                                    <div key={member.user.id} className="member-item">
                                        <div className="member-item__info">
                                            <div className="member-item__name">
                                                {member.user.name || member.user.email}
                                                {isCurrentUser && (
                                                    <span style={{ marginLeft: "8px", fontSize: "0.85em", color: "var(--second-text-color)" }}>
                                                        (You)
                                                    </span>
                                                )}
                                            </div>
                                            <div className="member-item__email">
                                                {member.user.email}
                                            </div>
                                            <div className="member-item__meta">
                                                <span className="member-item__role">{getRoleDisplay(member.role)}</span>
                                                {getStatusBadge(member.status)}
                                            </div>
                                        </div>
                                        
                                        {canManage && (
                                            <div className="member-item__actions">
                                                {member.role !== "owner" && (
                                                    <select
                                                        className="modal-form__input"
                                                        style={{ marginRight: "8px", minWidth: "100px" }}
                                                        value={member.role}
                                                        onChange={(e) => handleUpdateMemberRole(member.user.id, e.target.value)}
                                                        disabled={updatingMemberId === member.user.id}
                                                    >
                                                        <option value="viewer">Viewer</option>
                                                        <option value="editor">Editor</option>
                                                    </select>
                                                )}
                                                <button
                                                    type="button"
                                                    className="modal-form__btn modal-form__btn--danger"
                                                    style={{ padding: "6px 12px", fontSize: "0.9em" }}
                                                    onClick={() => handleRemoveMemberClick(member)}
                                                    disabled={removingMemberId === member.user.id || isRemovingMember}
                                                >
                                                    {removingMemberId === member.user.id ? "Removing..." : "Remove"}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </Modal>

        {/* Модальное окно подтверждения удаления календаря */}
        {isDeleteConfirmOpen && (
            <div className="calendar-delete-modal-backdrop">
                <div className="calendar-delete-modal">
                    <h2 className="calendar-delete-modal__title">Delete calendar</h2>
                    <p className="calendar-delete-modal__text">
                        Are you sure you want to delete this calendar? This action cannot be undone.
                    </p>
                    <div className="calendar-delete-modal__actions">
                        <button
                            className="calendar-delete-modal__btn"
                            onClick={handleCancelDelete}
                            disabled={isDeleting}
                        >
                            Cancel
                        </button>
                        <button
                            className="calendar-delete-modal__btn calendar-delete-modal__btn--danger"
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Модальное окно подтверждения удаления участника */}
        {isRemoveConfirmOpen && (
            <div className="calendar-remove-modal-backdrop">
                <div className="calendar-remove-modal">
                    <h2 className="calendar-remove-modal__title">Remove member</h2>
                    <p className="calendar-remove-modal__text">
                        Are you sure you want to remove
                        {memberToRemove?.user?.email ? ` ${memberToRemove.user.email} ` : " this user "}
                        from the calendar?
                    </p>
                    <div className="calendar-remove-modal__actions">
                        <button
                            className="calendar-remove-modal__btn"
                            onClick={handleCancelRemoveMember}
                            disabled={isRemovingMember}
                        >
                            Cancel
                        </button>
                        <button
                            className="calendar-remove-modal__btn calendar-remove-modal__btn--danger"
                            onClick={handleConfirmRemoveMember}
                            disabled={isRemovingMember}
                        >
                            {isRemovingMember ? "Removing..." : "Remove"}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Toast уведомления */}
        <Toast
            message={toast.message}
            type={toast.type}
            isVisible={toast.isVisible}
            onClose={hideToast}
        />
    </>
    );
}
