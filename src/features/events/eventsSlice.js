import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchEvents } from "./eventApi";

export const loadEventsForRange = createAsyncThunk(
    "events/loadForRange",
    async ({ calendarIds, from, to, types }, { getState }) => {
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
        let events = all.flat();

        const state = getState();
        const { items: sharedItems, selectedIds: selectedShared } = state.sharedEvents || {
            items: [],
            selectedIds: [],
        };
        const visibleSharedEvents = sharedItems.filter((ev) => {
            const eventId = String(ev.id || ev._id);
            return selectedShared.includes(eventId);
        });

        const normalizedSharedEvents = visibleSharedEvents.map((ev) => {
            const eventData = ev.event || ev;
            const eventId = ev.id || ev._id || eventData.id || eventData._id;
            
            const ownerId = eventData.createdBy || ev.createdBy || null;
            const sharedOwnerId = ownerId ? String(ownerId) : null;
            
            const sharedOwner = ev.owner || ev.sharedBy || ev.inviter || 
                               (typeof ownerId === 'object' ? ownerId : null) || null;
            
            return {
                ...eventData,
                id: eventId,
                calendarId: eventData.calendarId || ev.calendarId || eventData.sourceCalendarId || null,
                isShared: true,
                sharedOwner: sharedOwner,
                sharedOwnerId: sharedOwnerId,
                sharedItemId: ev.id || ev._id || null,
            };
        });

        events = events.concat(normalizedSharedEvents);

        return events;
    }
);

const slice = createSlice({
    name: "events",
    initialState: { byDate: {}, status: "idle", filters: { types: [] } },
    reducers: {
        setTypesFilter(state, action) {
            state.filters.types = action.payload ?? [];
        },
        clearEvents(state) {
            state.byDate = {};
            state.status = "idle";
        },
        removeSharedEventFromCalendar(state, action) {
            const sharedItemId = String(action.payload);
            Object.keys(state.byDate).forEach(dateKey => {
                state.byDate[dateKey] = state.byDate[dateKey].filter(ev => {
                    if (ev.isShared && ev.sharedItemId) {
                        return String(ev.sharedItemId) !== sharedItemId;
                    }
                    return true;
                });
            });
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
                let eventType = ev.type || ev.__t;
                
                if (!eventType) {
                    if (ev.startAt || ev.endAt || ev.allDay !== undefined) {
                        eventType = "arrangement";
                    } else {
                        eventType = "unknown";
                    }
                }
                
                if (eventType === "meeting") {
                    eventType = "arrangement";
                }
                
                const normalizedEv = {
                    ...ev,
                    type: eventType,
                };
                
                const dates = materializeEventDates(normalizedEv);
                
                if (dates.length === 0) {
                    continue;
                }
                
                dates.forEach((d) => {
                    (s.byDate[d] ||= []).push(normalizedEv);
                });
            }
        });
        b.addCase(loadEventsForRange.rejected, (s) => {
            s.status = "failed";
        });
    },
});

export const { setTypesFilter, clearEvents, removeSharedEventFromCalendar } = slice.actions;
export default slice.reducer;

import { eachDayOfInterval } from "date-fns";

function formatLocalDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function materializeEventDates(ev) {
    if (ev.type === "reminder") {
        if (!ev.remindAt) return [];
        try {
            return [formatLocalDate(ev.remindAt)];
        } catch (e) {
            return [];
        }
    }
    
    if (ev.type === "task") {
        if (!ev.dueAt) return [];
        try {
            return [formatLocalDate(ev.dueAt)];
        } catch (e) {
            return [];
        }
    }
    
    if (ev.type === "arrangement" || ev.type === "meeting") {
        if (ev.allDay === true) {
            if (ev.createdAt) {
                try {
                    return [formatLocalDate(ev.createdAt)];
                } catch (e) {
                    return [];
                }
            }
            return [];
        }
        
        if (!ev.startAt) {
            if (ev.createdAt) {
                try {
                    return [formatLocalDate(ev.createdAt)];
                } catch (e) {
                    return [];
                }
            }
            return [];
        }
        
        try {
            const start = new Date(ev.startAt);
            const end = ev.endAt ? new Date(ev.endAt) : start;
            
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                if (ev.createdAt) {
                    try {
                        return [formatLocalDate(ev.createdAt)];
                    } catch (e) {
                        return [];
                    }
                }
                return [];
            }
            
            if (start > end) {
                return [formatLocalDate(start)];
            }
            
            const dates = eachDayOfInterval({ start, end });
            return dates.map((d) => formatLocalDate(d));
        } catch (e) {
            if (ev.createdAt) {
                try {
                    return [formatLocalDate(ev.createdAt)];
                } catch (e2) {
                    return [];
                }
            }
            return [];
        }
    }
    
    if (ev.startAt) {
        try {
            const start = new Date(ev.startAt);
            const end = ev.endAt ? new Date(ev.endAt) : start;
            if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
                return eachDayOfInterval({ start, end }).map((d) => formatLocalDate(d));
            }
        } catch (e) {
        }
    }
    
    if (ev.createdAt) {
        try {
            return [formatLocalDate(ev.createdAt)];
        } catch (e) {
            return [];
        }
    }
    
    return [];
}
