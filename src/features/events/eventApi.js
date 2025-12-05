import api from "../../app/api";

export const fetchEvents = async ({ calendarId, from, to, types }) => {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    if (types?.length) {
        const normalizedTypes = types.map(t => t === "meeting" ? "arrangement" : t);
        params.types = normalizedTypes.join(",");
    }
    
    const { data } = await api.get(`api/calendars/${calendarId}/events`, {
        params,
    });
    
    return data;
};

export const getEvent = async (calendarId, eventId) => {
    const { data } = await api.get(`api/calendars/${calendarId}/events/${eventId}`);
    return data.event;
};

export const createEvent = async (calendarId, body) => {
    const { data } = await api.post(`api/calendars/${calendarId}/events`, body);
    return data;
};

export const updateEvent = async (calendarId, eventId, body) => {
    const { data } = await api.patch(`api/calendars/${calendarId}/events/${eventId}`, body);
    return data;
};

export const deleteEvent = async (calendarId, eventId) => {
    await api.delete(`api/calendars/${calendarId}/events/${eventId}`);
    return true;
};

export const shareEvent = async ({ calendarId, eventId, email }) => {
    const { data } = await api.post(`api/calendars/${calendarId}/events/${eventId}/invite`, { email });
    return data;
};

export const fetchSharedEvents = async () => {
    const { data } = await api.get("api/calendars/events/shared");
    return data.items || data.events || [];
};

export const acceptEventInvite = async (token) => {
    const { data } = await api.get("api/calendars/events/accept-invite", {
        params: { token },
    });
    return data;
};

export const declineEventInvite = async (token) => {
    const { data } = await api.get("api/calendars/events/decline-invite", {
        params: { token },
    });
    return data;
};

export const fetchEventMembers = async ({ calendarId, eventId }) => {
    const { data } = await api.get(`api/calendars/${calendarId}/events/${eventId}/members`);
    return data.members || [];
};

export const removeEventMember = async ({ calendarId, eventId, userId }) => {
    await api.delete(`api/calendars/${calendarId}/events/${eventId}/members/${userId}`);
    return true;
};
