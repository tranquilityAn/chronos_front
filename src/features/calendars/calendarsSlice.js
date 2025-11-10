import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchMyCalendars } from "./calendarApi";

export const loadCalendars = createAsyncThunk("calendars/load", async () => {
    return await fetchMyCalendars();
});

const slice = createSlice({
    name: "calendars",
    initialState: { items: [], selectedIds: [], status: "idle" },
    reducers: {
        toggleCalendar(state, action) {
            const id = action.payload;
            state.selectedIds = state.selectedIds.includes(id)
                ? state.selectedIds.filter((x) => x !== id)
                : state.selectedIds.concat(id);
        },
        setSelected(state, action) {
            state.selectedIds = action.payload;
        },
    },
    extraReducers: (b) => {
        b.addCase(loadCalendars.pending, (s) => {
            s.status = "loading";
        });
        b.addCase(loadCalendars.fulfilled, (s, a) => {
            s.status = "succeeded";
            s.items = a.payload;
            if (!s.selectedIds.length)
                s.selectedIds = a.payload.map((c) => c.id);
        });
        b.addCase(loadCalendars.rejected, (s) => {
            s.status = "failed";
        });
    },
});

export const { toggleCalendar, setSelected } = slice.actions;
export default slice.reducer;
