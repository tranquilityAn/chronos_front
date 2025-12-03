import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchSharedEvents } from "../events/eventApi";

export const loadSharedEvents = createAsyncThunk("sharedEvents/load", async () => {
    return await fetchSharedEvents();
});

const slice = createSlice({
    name: "sharedEvents",
    initialState: { items: [], selectedIds: [], status: "idle", error: null },
    reducers: {
        toggleSharedEventVisibility(state, action) {
            const id = String(action.payload);
            state.selectedIds = state.selectedIds.includes(id)
                ? state.selectedIds.filter((x) => x !== id)
                : state.selectedIds.concat(id);
        },
        setSelectedSharedEvents(state, action) {
            state.selectedIds = action.payload.map((id) => String(id));
        },
        /**
         * Удаляет shared-ивент (и его видимость) после выхода пользователя из события.
         * Принимает ID записи shared-ивента (event.sharedItemId / ev.id / ev._id).
         */
        removeSharedEventById(state, action) {
            const targetId = String(action.payload);
            // Удаляем сам shared-item
            state.items = state.items.filter((item) => {
                const itemId = item.id || item._id;
                return String(itemId) !== targetId;
            });
            // И убираем его из списка выбранных для отображения
            state.selectedIds = state.selectedIds.filter(
                (id) => String(id) !== targetId
            );
        },
    },
    extraReducers: (b) => {
        b.addCase(loadSharedEvents.pending, (s) => {
            s.status = "loading";
            s.error = null;
        });
        b.addCase(loadSharedEvents.fulfilled, (s, a) => {
            s.status = "succeeded";
            s.items = a.payload;
            // Auto-select all on first load if selectedIds is empty
            if (!s.selectedIds.length) {
                s.selectedIds = a.payload
                    .map((e) => String(e.id || e._id))
                    .filter(Boolean);
            }
        });
        b.addCase(loadSharedEvents.rejected, (s, a) => {
            s.status = "failed";
            s.error = a.error?.message || "Failed to load shared events";
        });
    },
});

export const { toggleSharedEventVisibility, setSelectedSharedEvents, removeSharedEventById } = slice.actions;
export default slice.reducer;

