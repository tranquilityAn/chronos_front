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

import { eachDayOfInterval } from "date-fns";

/**
 * Форматирует дату в локальном часовом поясе как YYYY-MM-DD
 * Используем локальное время, потому что пользователь создаёт события в своём часовом поясе
 */
function formatLocalDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Получает даты на которых должно отображаться событие
 * Типы событий от бэкенда: "arrangement" (meeting), "reminder", "task"
 */
function materializeEventDates(ev) {
    // Reminder — отображаем в день напоминания
    if (ev.type === "reminder") {
        if (!ev.remindAt) return [];
        return [formatLocalDate(ev.remindAt)];
    }
    
    // Task — отображаем в день дедлайна
    if (ev.type === "task") {
        if (!ev.dueAt) return [];
        return [formatLocalDate(ev.dueAt)];
    }
    
    // Meeting/Arrangement — отображаем в диапазоне дат
    // type может быть "arrangement" (от MongoDB discriminator) или "meeting"
    if (ev.type === "arrangement" || ev.type === "meeting") {
        // Если allDay событие без startAt/endAt — используем createdAt
        if (ev.allDay && !ev.startAt) {
            const date = ev.createdAt ? new Date(ev.createdAt) : new Date();
            return [formatLocalDate(date)];
        }
        
        if (!ev.startAt) return [];
        
        const start = new Date(ev.startAt);
        const end = new Date(ev.endAt ?? ev.startAt);
        
        // Защита от невалидных дат
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];
        if (start > end) return [formatLocalDate(start)];
        
        // Для многодневных событий генерируем все даты в диапазоне
        return eachDayOfInterval({ start, end }).map((d) => formatLocalDate(d));
    }
    
    // Fallback для неизвестных типов — пробуем startAt или createdAt
    if (ev.startAt) {
        const start = new Date(ev.startAt);
        const end = new Date(ev.endAt ?? ev.startAt);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
            return eachDayOfInterval({ start, end }).map((d) => formatLocalDate(d));
        }
    }
    
    if (ev.createdAt) {
        return [formatLocalDate(ev.createdAt)];
    }
    
    return [];
}
