import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import Modal from "../ui/Modal";
import { 
    getCalendar, 
    updateCalendar, 
    deleteCalendar,
    inviteToCalendar,
    listCalendarMembers,
    removeCalendarMember,
    updateCalendarMemberRole
} from "../../features/calendars/calendarApi";

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
 *   calendarId: string | null,
 *   isLoading?: boolean,
 *   isDeleting?: boolean
 * }} props
 */
export default function EditCalendarModal({ 
    isOpen, 
    onClose, 
    onSubmit, 
    onDelete, 
    calendarId, 
    isLoading, 
    isDeleting 
}) {
    const currentUser = useSelector((state) => state.auth.user);
    
    const [calendar, setCalendar] = useState(null);
    const [members, setMembers] = useState([]);
    const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        color: COLORS[0],
    });
    const [error, setError] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    
    // Sharing state
    const [showShareForm, setShowShareForm] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("viewer");
    const [isInviting, setIsInviting] = useState(false);
    const [inviteError, setInviteError] = useState("");
    
    // Member management state
    const [removingMemberId, setRemovingMemberId] = useState(null);
    const [updatingMemberId, setUpdatingMemberId] = useState(null);
    const [isOwner, setIsOwner] = useState(false);

    // Загрузка данных календаря и участников при открытии
    useEffect(() => {
        if (calendarId && isOpen) {
            loadCalendarData();
            loadMembers();
        }
    }, [calendarId, isOpen]);

    const loadCalendarData = async () => {
        if (!calendarId) return;
        
        setIsLoadingCalendar(true);
        setError("");
        try {
            const calendarData = await getCalendar(calendarId);
            setCalendar(calendarData);
            setFormData({
                name: calendarData.name || "",
                description: calendarData.description || "",
                color: calendarData.color || COLORS[0],
            });
        } catch (err) {
            console.error("Failed to load calendar:", err);
            setError(err?.response?.data?.message || err.message || "Failed to load calendar");
        } finally {
            setIsLoadingCalendar(false);
        }
    };

    const loadMembers = async () => {
        if (!calendarId) return;
        
        setIsLoadingMembers(true);
        try {
            const membersData = await listCalendarMembers(calendarId);
            setMembers(membersData || []);
            
            // Определяем роль текущего пользователя после загрузки members
            const currentUserRole = membersData?.find(
                (m) => m.user && m.user.id === currentUser?.id
            )?.role || null;
            
            setIsOwner(currentUserRole === "owner");
            console.log("Current user role:", currentUserRole, "isOwner:", currentUserRole === "owner");
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

        if (!calendarId) return;

        try {
            await onSubmit(calendarId, {
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
        setShowShareForm(false);
        setInviteEmail("");
        setInviteRole("viewer");
        setInviteError("");
        setCalendar(null);
        setMembers([]);
        onClose();
    };

    const handleDelete = async () => {
        if (!calendarId) return;
        try {
            await onDelete(calendarId);
            setShowDeleteConfirm(false);
            handleClose();
        } catch (err) {
            setError(err?.response?.data?.message || err.message || "Failed to delete calendar");
        }
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

        if (!calendarId) return;

        setIsInviting(true);
        setInviteError("");
        try {
            console.log("Inviting user:", { calendarId, email: inviteEmail.trim(), role: inviteRole });
            const result = await inviteToCalendar(calendarId, {
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

    const handleRemoveMember = async (userId) => {
        if (!calendarId || !isOwner) return;
        
        if (!window.confirm("Are you sure you want to remove this member?")) {
            return;
        }

        setRemovingMemberId(userId);
        try {
            await removeCalendarMember(calendarId, userId);
            await loadMembers();
        } catch (err) {
            setError(err?.response?.data?.message || err.message || "Failed to remove member");
        } finally {
            setRemovingMemberId(null);
        }
    };

    const handleUpdateMemberRole = async (userId, newRole) => {
        if (!calendarId || !isOwner) return;

        setUpdatingMemberId(userId);
        try {
            await updateCalendarMemberRole(calendarId, userId, { role: newRole });
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

    if (!calendarId || !isOpen) return null;

    if (isLoadingCalendar) {
        return (
            <Modal isOpen={isOpen} onClose={handleClose} title="Edit Calendar">
                <div style={{ padding: "20px", textAlign: "center" }}>
                    Loading calendar...
                </div>
            </Modal>
        );
    }

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
        <Modal isOpen={isOpen} onClose={handleClose} title="Edit Calendar">
            <div className="modal-form">
                <form onSubmit={handleSubmit}>
                    {/* Информация о календаре */}
                    <div className="modal-form__section">
                        <h3 className="modal-form__section-title">Calendar Information</h3>
                        
                        {/* ID и тип (readonly) */}
                        <div className="modal-form__group">
                            <label className="modal-form__label">ID</label>
                            <input
                                type="text"
                                className="modal-form__input"
                                value={calendar.id || ""}
                                readOnly
                                disabled
                            />
                        </div>

                        <div className="modal-form__group">
                            <label className="modal-form__label">Type</label>
                            <input
                                type="text"
                                className="modal-form__input"
                                value={calendar.type || ""}
                                readOnly
                                disabled
                            />
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

                        {/* Даты создания и обновления (readonly) */}
                        {calendar.createdAt && (
                            <div className="modal-form__group">
                                <label className="modal-form__label">Created At</label>
                                <input
                                    type="text"
                                    className="modal-form__input"
                                    value={new Date(calendar.createdAt).toLocaleString()}
                                    readOnly
                                    disabled
                                />
                            </div>
                        )}

                        {calendar.updatedAt && (
                            <div className="modal-form__group">
                                <label className="modal-form__label">Updated At</label>
                                <input
                                    type="text"
                                    className="modal-form__input"
                                    value={new Date(calendar.updatedAt).toLocaleString()}
                                    readOnly
                                    disabled
                                />
                            </div>
                        )}
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
                                    disabled={isLoading || !isOwner}
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
                                                    onClick={() => handleRemoveMember(member.user.id)}
                                                    disabled={removingMemberId === member.user.id}
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
    );
}
