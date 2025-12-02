import api from "../../app/api";

/**
 * GET /api/calendars/:calendarId/events
 * Сервер возвращает: { items: [...], page, limit, total }
 * @param {string} calendarId
 * @param {string} from - ISO date string
 * @param {string} to - ISO date string
 * @param {string[]} types - массив типов событий
 * 
 * Примечание: бэкенд использует "arrangement" для встреч, а не "meeting"
 * Поэтому нужно преобразовать "meeting" -> "arrangement" перед отправкой запроса
 */
export const fetchEvents = async ({ calendarId, from, to, types }) => {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    if (types?.length) {
        // Преобразуем "meeting" в "arrangement" для соответствия бэкенду
        const normalizedTypes = types.map(t => t === "meeting" ? "arrangement" : t);
        params.types = normalizedTypes.join(",");
    }
    
    const { data } = await api.get(`api/calendars/${calendarId}/events`, {
        params,
    });
    
    return data; // { items, page, limit, total }
};

/**
 * GET /api/calendars/:calendarId/events/:id
 */
export const getEvent = async (calendarId, eventId) => {
    const { data } = await api.get(`api/calendars/${calendarId}/events/${eventId}`);
    return data.event;
};

/**
 * POST /api/calendars/:calendarId/events
 * body: { type, title, description?, ... }
 * 
 * type: "meeting" | "reminder" | "task"
 * - meeting: { allDay?, startAt, endAt, location? }
 * - reminder: { remindAt }
 * - task: { dueAt, isDone? }
 */
export const createEvent = async (calendarId, body) => {
    const { data } = await api.post(`api/calendars/${calendarId}/events`, body);
    return data;
};

/**
 * PATCH /api/calendars/:calendarId/events/:id
 * body: { title?, description?, color?, ... }
 */
export const updateEvent = async (calendarId, eventId, body) => {
    const { data } = await api.patch(`api/calendars/${calendarId}/events/${eventId}`, body);
    return data;
};

/**
 * DELETE /api/calendars/:calendarId/events/:id
 */
export const deleteEvent = async (calendarId, eventId) => {
    await api.delete(`api/calendars/${calendarId}/events/${eventId}`);
    return true;
};

/**
 * POST /api/calendars/:calendarId/events/:id/invite
 * body: { email: string }
 */
export const shareEvent = async ({ calendarId, eventId, email }) => {
    const { data } = await api.post(`api/calendars/${calendarId}/events/${eventId}/invite`, { email });
    return data;
};

/**
 * GET /api/calendars/events/shared
 * Returns list of all accepted shared events for current user
 */
export const fetchSharedEvents = async () => {
    const { data } = await api.get("api/calendars/events/shared");
    return data.items || data.events || [];
};

/**
 * GET /api/calendars/events/accept-invite?token=...
 * Accept an event invitation
 */
export const acceptEventInvite = async (token) => {
    const { data } = await api.get("api/calendars/events/accept-invite", {
        params: { token },
    });
    return data;
};

/**
 * GET /api/calendars/events/decline-invite?token=...
 * Decline an event invitation
 */
export const declineEventInvite = async (token) => {
    const { data } = await api.get("api/calendars/events/decline-invite", {
        params: { token },
    });
    return data;
};

/**
 * GET /api/calendars/:calendarId/events/:id/members
 * Returns list of event members
 * @param {string} calendarId
 * @param {string} eventId
 * @returns {Promise<Array>} Array of members: [{ status, joinedAt, user: { id, email, name, avatar } }]
 */
export const fetchEventMembers = async ({ calendarId, eventId }) => {
    const { data } = await api.get(`api/calendars/${calendarId}/events/${eventId}/members`);
    return data.members || [];
};

/**
 * DELETE /api/calendars/:calendarId/events/:id/members/:userId
 * Remove a member from an event
 * @param {string} calendarId
 * @param {string} eventId
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
export const removeEventMember = async ({ calendarId, eventId, userId }) => {
    await api.delete(`api/calendars/${calendarId}/events/${eventId}/members/${userId}`);
    return true;
};