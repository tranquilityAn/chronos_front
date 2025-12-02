import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchEvents } from "./eventApi";

export const loadEventsForRange = createAsyncThunk(
    "events/loadForRange",
    async ({ calendarIds, from, to, types }, { getState }) => {
        // 1) Загружаем обычные события по календарям
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

        // 2) Добавляем видимые shared events из state.sharedEvents
        const state = getState();
        const { items: sharedItems, selectedIds: selectedShared } = state.sharedEvents || {
            items: [],
            selectedIds: [],
        };
        const visibleSharedEvents = sharedItems.filter((ev) => {
            const eventId = String(ev.id || ev._id);
            return selectedShared.includes(eventId);
        });

        // Нормализуем shared events: они могут иметь вложенную структуру { event: {...} } или быть плоскими
        const normalizedSharedEvents = visibleSharedEvents.map((ev) => {
            // Если есть вложенный объект event, используем его, иначе используем сам ev
            const eventData = ev.event || ev;
            const eventId = ev.id || ev._id || eventData.id || eventData._id;
            
            // Извлекаем ownerId из createdBy (это владелец события)
            const ownerId = eventData.createdBy || ev.createdBy || null;
            const sharedOwnerId = ownerId ? String(ownerId) : null;
            
            // Проверяем, есть ли уже объект владельца (если бэкенд его вернул)
            const sharedOwner = ev.owner || ev.sharedBy || ev.inviter || 
                               (typeof ownerId === 'object' ? ownerId : null) || null;
            
            return {
                ...eventData,
                id: eventId,
                // calendarId может быть в eventData или в ev
                calendarId: eventData.calendarId || ev.calendarId || eventData.sourceCalendarId || null,
                isShared: true,
                sharedOwner: sharedOwner,  // объект владельца, если есть
                sharedOwnerId: sharedOwnerId,  // ID владельца (строка)
                sharedItemId: ev.id || ev._id || null,
            };
        });

        // Объединяем обычные события и shared events
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
    },
    extraReducers: (b) => {
        b.addCase(loadEventsForRange.pending, (s) => {
            s.status = "loading";
        });
        b.addCase(loadEventsForRange.fulfilled, (s, a) => {
            s.status = "succeeded";
            s.byDate = {};
            
            for (const ev of a.payload) {
                // Явно обрабатываем тип "arrangement" - это основной тип для встреч
                // Бэкенд возвращает __t: "arrangement" для встреч (MongoDB discriminator)
                let eventType = ev.type || ev.__t;
                
                // Если тип не определён, но есть поля характерные для arrangement, считаем его arrangement
                if (!eventType) {
                    // Если есть startAt/endAt или allDay, это скорее всего arrangement
                    if (ev.startAt || ev.endAt || ev.allDay !== undefined) {
                        eventType = "arrangement";
                    } else {
                        eventType = "unknown";
                    }
                }
                
                // Нормализуем "meeting" -> "arrangement" для внутренней обработки
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
        try {
            return [formatLocalDate(ev.remindAt)];
        } catch (e) {
            return [];
        }
    }
    
    // Task — отображаем в день дедлайна
    if (ev.type === "task") {
        if (!ev.dueAt) return [];
        try {
            return [formatLocalDate(ev.dueAt)];
        } catch (e) {
            return [];
        }
    }
    
    // Arrangement (Meeting) — отображаем в диапазоне дат
    // Бэкенд использует тип "arrangement" для встреч
    // Это основной тип для встреч, поэтому обрабатываем его явно
    if (ev.type === "arrangement" || ev.type === "meeting") {
        // Для allDay событий сервер удаляет startAt/endAt (pre-save hook)
        // Используем createdAt для определения даты (это единственный способ, так как бэкенд удаляет startAt)
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
        
        // Для не-allDay событий используем startAt/endAt
        if (!ev.startAt) {
            // Fallback на createdAt если startAt отсутствует (может быть для старых событий)
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
            
            // Защита от невалидных дат
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                // Fallback на createdAt если даты невалидны
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
            
            // Для многодневных событий генерируем все даты в диапазоне
            const dates = eachDayOfInterval({ start, end });
            return dates.map((d) => formatLocalDate(d));
        } catch (e) {
            // Fallback на createdAt
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
    
    // Fallback для неизвестных типов — пробуем startAt или createdAt
    if (ev.startAt) {
        try {
            const start = new Date(ev.startAt);
            const end = ev.endAt ? new Date(ev.endAt) : start;
            if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
                return eachDayOfInterval({ start, end }).map((d) => formatLocalDate(d));
            }
        } catch (e) {
            // Игнорируем ошибки
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
