import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchMyCalendars } from "./calendarApi";

const CALENDAR_SELECTED_KEY = "calendarSelectedIds";

function loadSelectedCalendarIds() {
    try {
        const raw = localStorage.getItem(CALENDAR_SELECTED_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveSelectedCalendarIds(ids) {
    try {
        localStorage.setItem(CALENDAR_SELECTED_KEY, JSON.stringify(ids || []));
    } catch {
    }
}

export const loadCalendars = createAsyncThunk("calendars/load", async () => {
    return await fetchMyCalendars();
});

const initialState = {
    items: [],
    selectedIds: loadSelectedCalendarIds(),
    status: "idle",
};

const slice = createSlice({
    name: "calendars",
    initialState,
    reducers: {
        toggleCalendar(state, action) {
            const id = action.payload;
            state.selectedIds = state.selectedIds.includes(id)
                ? state.selectedIds.filter((x) => x !== id)
                : state.selectedIds.concat(id);
            saveSelectedCalendarIds(state.selectedIds);
        },
        setSelected(state, action) {
            state.selectedIds = action.payload;
            saveSelectedCalendarIds(state.selectedIds);
        },
    },
    extraReducers: (b) => {
        b.addCase(loadCalendars.pending, (s) => {
            s.status = "loading";
        });
        b.addCase(loadCalendars.fulfilled, (s, a) => {
            s.status = "succeeded";
            s.items = a.payload;
            const allIds = a.payload.map((c) => c.id);

            if (s.selectedIds && s.selectedIds.length) {
                s.selectedIds = s.selectedIds.filter((id) => allIds.includes(id));
            } else {
                s.selectedIds = allIds;
            }

            saveSelectedCalendarIds(s.selectedIds);
        });
        b.addCase(loadCalendars.rejected, (s) => {
            s.status = "failed";
        });
    },
});

export const { toggleCalendar, setSelected } = slice.actions;
export default slice.reducer;
