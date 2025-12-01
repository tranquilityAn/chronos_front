import { useEffect, useMemo } from "react";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Форматирует дату в локальном часовом поясе как YYYY-MM-DD
 * Важно использовать локальное время для соответствия с eventsByDate
 */
function getKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Нормализует тип события для отображения
 * Бэкенд возвращает "arrangement" вместо "meeting"
 */
function normalizeEventType(type) {
    if (type === "arrangement") return "meeting";
    return type;
}

function formatEventTime(event) {
    const type = normalizeEventType(event.type);
    
    // Meeting/Arrangement
    if (type === "meeting") {
        if (event.allDay) return "All day";
        if (event.startAt) {
            const d = new Date(event.startAt);
            return d.toLocaleTimeString("en-US", { 
                hour: "2-digit", 
                minute: "2-digit",
                hour12: false 
            });
        }
    }
    
    // Reminder
    if (type === "reminder" && event.remindAt) {
        const d = new Date(event.remindAt);
        return d.toLocaleTimeString("en-US", { 
            hour: "2-digit", 
            minute: "2-digit",
            hour12: false 
        });
    }
    
    // Task
    if (type === "task" && event.dueAt) {
        const d = new Date(event.dueAt);
        return d.toLocaleTimeString("en-US", { 
            hour: "2-digit", 
            minute: "2-digit",
            hour12: false 
        });
    }
    
    return null;
}

/**
 * Возвращает CSS класс для типа события
 */
function getEventTypeClass(type) {
    const normalized = normalizeEventType(type);
    return normalized || "default";
}

/**
 * Возвращает текст типа события для отображения
 */
function getEventTypeLabel(type) {
    const normalized = normalizeEventType(type);
    switch (normalized) {
        case "meeting":
            return "Meeting";
        case "reminder":
            return "Reminder";
        case "task":
            return "Task";
        default:
            return "Event";
    }
}

/**
 * @param {{
 *   activeDate: Date,
 *   eventsByDate: Record<string, Array>,
 *   selectedDate: Date | null,
 *   onSelectDate: (d: Date) => void,
 *   onRangeChange: ({ from: string, to: string }) => void,
 *   onEventClick: (event: object) => void,
 *   onShowAllEvents: (date: Date, events: Array) => void,
 * }} props
 */
export default function CalendarGrid({
    activeDate,
    eventsByDate,
    selectedDate,
    onSelectDate,
    onRangeChange,
    onEventClick,
    onShowAllEvents,
}) {
    const today = useMemo(() => getKey(new Date()), []);
    
    const { days, from, to } = useMemo(() => {
        const year = activeDate.getFullYear();
        const month = activeDate.getMonth();

        const firstOfMonth = new Date(year, month, 1);
        const dayOfWeek = (firstOfMonth.getDay() + 6) % 7;
        const gridStart = new Date(year, month, 1 - dayOfWeek);

        const arr = [];
        for (let i = 0; i < 42; i++) {
            arr.push(
                new Date(
                    gridStart.getFullYear(),
                    gridStart.getMonth(),
                    gridStart.getDate() + i
                )
            );
        }

        const fromDate = arr[0];
        const toDate = arr[arr.length - 1];

        return { days: arr, from: fromDate, to: toDate };
    }, [activeDate]);

    // повідомляємо сторінці видимий діапазон (використовуємо ISO строки для стабільного порівняння)
    const fromISO = from.toISOString();
    const toISO = to.toISOString();
    
    useEffect(() => {
        onRangeChange?.({ from: fromISO, to: toISO });
    }, [fromISO, toISO, onRangeChange]);

    const month = activeDate.getMonth();

    const handleShowAllEvents = (date, events, e) => {
        e.stopPropagation();
        onShowAllEvents?.(date, events);
    };

    return (
        <div className="cal-grid">
            {/* верхній рядок з назвами днів тижня */}
            <div className="cal-grid__weekdays">
                {WEEKDAYS.map((d) => (
                    <div key={d} className="cal-grid__weekday">
                        {d}
                    </div>
                ))}
            </div>

            {/* сама сітка 6x7 */}
            <div className="cal-grid__cells">
                {days.map((date) => {
                    const key = getKey(date);
                    const items = eventsByDate[key] || [];
                    const isCurrentMonth = date.getMonth() === month;
                    const isToday = key === today;
                    const isSelected =
                        selectedDate && getKey(selectedDate) === key;

                    return (
                        <button
                            key={key}
                            className={[
                                "cal-grid__cell",
                                !isCurrentMonth && "cal-grid__cell--outside",
                                isToday && "cal-grid__cell--today",
                                isSelected && "cal-grid__cell--selected",
                            ]
                                .filter(Boolean)
                                .join(" ")}
                            onClick={() => onSelectDate?.(date)}
                        >
                            <div className={`cal-grid__cell-date ${isToday ? "cal-grid__cell-date--today" : ""}`}>
                                {date.getDate()}
                            </div>

                            <div className="cal-grid__cell-events">
                                {items.slice(0, 3).map((ev) => {
                                    const time = formatEventTime(ev);
                                    const typeClass = getEventTypeClass(ev.type);
                                    const typeLabel = getEventTypeLabel(ev.type);
                                    const isCompletedTask = ev.type === "task" && ev.isDone === true;
                                    return (
                                        <div
                                            key={ev.id}
                                            className={`cal-grid__event-row cal-grid__event-row--${typeClass}${isCompletedTask ? " cal-grid__event-row--completed" : ""}`}
                                            title={`${ev.title}${time ? ` at ${time}` : ""}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEventClick?.(ev);
                                            }}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") {
                                                    e.stopPropagation();
                                                    onEventClick?.(ev);
                                                }
                                            }}
                                        >
                                            <span className="cal-grid__event-type">
                                                {typeLabel}
                                            </span>
                                            {time && (
                                                <span className="cal-grid__event-time">
                                                    {time}
                                                </span>
                                            )}
                                            <span className="cal-grid__event-title">
                                                {ev.title}
                                            </span>
                                        </div>
                                    );
                                })}
                                {items.length > 3 && (
                                    <div 
                                        className="cal-grid__event-more"
                                        onClick={(e) => handleShowAllEvents(date, items, e)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                handleShowAllEvents(date, items, e);
                                            }
                                        }}
                                    >
                                        +{items.length - 3} more
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
