import api from "../../app/api";

export const fetchMyCalendars = async () => {
    const { data } = await api.get("api/calendars");
    const calendars = (data?.items ?? [])
        .map((m) => m.calendar)
        .filter(Boolean);
    return calendars; // [{ id, type, name, color, ... }]
};

export const createCalendar = (body) => api.post("api/calendars", body);
