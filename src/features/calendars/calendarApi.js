import api from "../../app/api";

export const fetchMyCalendars = async () => {
    const { data } = await api.get("api/calendars");
    const calendars = (data?.calendars ?? [])
        .map((m) => ({
            ...m.calendar,
            role: m.role,
            joinedAt: m.joinedAt
        }))
        .filter((c) => c.id);
    return calendars;
};

export const createCalendar = async (body) => {
    const { data } = await api.post("api/calendars", body);
    return data.calendar;
};

export const getCalendar = async (calendarId) => {
    const { data } = await api.get(`api/calendars/${calendarId}`);
    return data.calendar;
};

export const updateCalendar = async (calendarId, body) => {
    const { data } = await api.patch(`api/calendars/${calendarId}`, body);
    return data.calendar;
};

export const deleteCalendar = async (calendarId) => {
    await api.delete(`api/calendars/${calendarId}`);
    return true;
};

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

export const listCalendarMembers = async (calendarId) => {
    const { data } = await api.get(`api/calendars/${calendarId}/members`);
    return data.members || [];
};

export const removeCalendarMember = async (calendarId, userId) => {
    await api.delete(`api/calendars/${calendarId}/members/${userId}`);
    return true;
};

export const updateCalendarMemberRole = async (calendarId, userId, { role }) => {
    const { data } = await api.patch(`api/calendars/${calendarId}/members/${userId}`, {
        role,
    });
    return data;
};

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
