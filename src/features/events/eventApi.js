import api from "../../app/api";

export const fetchEvents = async ({ calendarId, from, to, types }) => {
    const params = { from, to };
    if (types?.length) params.types = types.join(",");
    const { data } = await api.get(`api/calendars/${calendarId}/events`, {
        params,
    });
    return data;
};
