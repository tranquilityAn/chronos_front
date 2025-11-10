import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchEvents } from "./eventApi";

export const loadEventsForRange = createAsyncThunk(
    "events/loadForRange",
    async ({ calendarIds, from, to, types }) => {
        const all = await Promise.all(
            calendarIds.map(async (id) => {
                const data = await fetchEvents({
                    calendarId: id,
                    from,
                    to,
                    types,
                });
                return data.items.map((e) => ({ ...e, calendarId: id }));
            })
        );
        return all.flat();
    }
);

const slice = createSlice({
    name: "events",
    initialState: { byDate: {}, status: "idle", filters: { types: [] } },
    reducers: {
        setTypesFilter(state, action) {
            state.filters.types = action.payload ?? [];
        },
    },
    extraReducers: (b) => {
        b.addCase(loadEventsForRange.pending, (s) => {
            s.status = "loading";
        });
        b.addCase(loadEventsForRange.fulfilled, (s, a) => {
            s.status = "succeeded";
            s.byDate = {};
            for (const ev of a.payload) {
                const dates = materializeEventDates(ev);
                dates.forEach((d) => {
                    (s.byDate[d] ||= []).push(ev);
                });
            }
        });
        b.addCase(loadEventsForRange.rejected, (s) => {
            s.status = "failed";
        });
    },
});

export const { setTypesFilter } = slice.actions;
export default slice.reducer;

import { format, eachDayOfInterval } from "date-fns";
function materializeEventDates(ev) {
    if (ev.type === "reminder") {
        return [format(new Date(ev.remindAt), "yyyy-MM-dd")];
    }
    if (ev.type === "task") {
        return [format(new Date(ev.dueAt), "yyyy-MM-dd")];
    }
    const start = new Date(ev.startAt);
    const end = new Date(ev.endAt ?? ev.startAt);
    return eachDayOfInterval({ start, end }).map((d) =>
        format(d, "yyyy-MM-dd")
    );
}
