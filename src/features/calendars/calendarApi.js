import api from "../../app/api";

/**
 * GET /api/calendars
 * Сервер возвращает: { calendars: [{ role, joinedAt, calendar: {...} }, ...] }
 */
export const fetchMyCalendars = async () => {
    const { data } = await api.get("api/calendars");
    // Парсим ответ сервера: извлекаем calendar из каждого membership
    const calendars = (data?.calendars ?? [])
        .map((m) => ({
            ...m.calendar,
            role: m.role,        // сохраняем роль пользователя
            joinedAt: m.joinedAt // когда присоединился
        }))
        .filter((c) => c.id); // фильтруем пустые
    return calendars;
};

/**
 * POST /api/calendars
 * body: { type, name, description?, color? }
 */
export const createCalendar = async (body) => {
    const { data } = await api.post("api/calendars", body);
    return data.calendar;
};

/**
 * GET /api/calendars/:id
 */
export const getCalendar = async (calendarId) => {
    const { data } = await api.get(`api/calendars/${calendarId}`);
    return data.calendar;
};

/**
 * PATCH /api/calendars/:id
 * body: { name?, description?, color? }
 */
export const updateCalendar = async (calendarId, body) => {
    const { data } = await api.patch(`api/calendars/${calendarId}`, body);
    return data.calendar;
};

/**
 * DELETE /api/calendars/:id
 */
export const deleteCalendar = async (calendarId) => {
    await api.delete(`api/calendars/${calendarId}`);
    return true;
};

/**
 * POST /api/calendars/:calendarId/invite
 * body: { email: string, role: "viewer" | "editor" }
 */
export const inviteToCalendar = async (calendarId, { email, role }) => {
    console.log("API: Inviting to calendar", { calendarId, email, role });
    try {
        const { data } = await api.post(`api/calendars/${calendarId}/invite`, {
            email,
            role,
        });
        console.log("API: Invite response", data);
        return data;
    } catch (error) {
        console.error("API: Invite error", error);
        throw error;
    }
};

/**
 * GET /api/calendars/:calendarId/members
 * Сервер возвращает: { members: [{ role, status, joinedAt, user: {...} }, ...] }
 */
export const listCalendarMembers = async (calendarId) => {
    const { data } = await api.get(`api/calendars/${calendarId}/members`);
    return data.members || [];
};

/**
 * DELETE /api/calendars/:calendarId/members/:userId
 */
export const removeCalendarMember = async (calendarId, userId) => {
    await api.delete(`api/calendars/${calendarId}/members/${userId}`);
    return true;
};

/**
 * PATCH /api/calendars/:calendarId/members/:userId
 * body: { role: "viewer" | "editor" }
 */
export const updateCalendarMemberRole = async (calendarId, userId, { role }) => {
    const { data } = await api.patch(`api/calendars/${calendarId}/members/${userId}`, {
        role,
    });
    return data;
};

/**
 * GET /api/calendars/accept-invite?token=...
 * Сервер возвращает: { calendar: { id, name, color }, role }
 */
export const acceptCalendarInvite = async (token) => {
    console.log("API: Accepting calendar invite", { token: token?.substring(0, 10) + "..." });
    try {
        const { data } = await api.get("api/calendars/accept-invite", {
            params: { token },
        });
        console.log("API: Accept invite response", data);
        return data;
    } catch (error) {
        console.error("API: Accept invite error", error);
        throw error;
    }
};

/**
 * GET /api/calendars/decline-invite?token=...
 * Сервер возвращает: { success: true }
 */
export const declineCalendarInvite = async (token) => {
    console.log("API: Declining calendar invite", { token: token?.substring(0, 10) + "..." });
    try {
        const { data } = await api.get("api/calendars/decline-invite", {
            params: { token },
        });
        console.log("API: Decline invite response", data);
        return data;
    } catch (error) {
        console.error("API: Decline invite error", error);
        throw error;
    }
};