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
