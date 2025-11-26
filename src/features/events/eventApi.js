import api from "../../app/api";

/**
 * GET /api/calendars/:calendarId/events
 * Сервер возвращает: { items: [...], page, limit, total }
 * @param {string} calendarId
 * @param {string} from - ISO date string
 * @param {string} to - ISO date string
 * @param {string[]} types - массив типов событий
 */
export const fetchEvents = async ({ calendarId, from, to, types }) => {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    if (types?.length) params.types = types.join(",");
    
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
