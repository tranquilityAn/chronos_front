import { useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { format, compareAsc } from "date-fns";

function CellEvents({ items = [], onMore }) {
    if (!items.length) return null;

    const MAX = 3;
    const visible = items.slice(0, MAX);
    const more = items.length - visible.length;

    return (
        <div className="cell-events">
            {visible.map((ev) => {
                const color = ev.color || ev.calendar?.color || "#6b7280"; // fallback
                return (
                    <div className="cell-ev" key={ev.id} title={ev.title}>
                        <span
                            className="dot"
                            style={{ backgroundColor: color }}
                        />
                        <span className="label">{ev.title}</span>
                    </div>
                );
            })}
            {more > 0 && (
                <button
                    className="cell-more"
                    onClick={onMore}
                    title="Показати всі"
                >
                    +{more}
                </button>
            )}
        </div>
    );
}

export default function CalendarMonth({
    activeDate,
    onActiveRangeChange,
    eventsByDay,
    onSelectDate,
}) {
    useEffect(() => {
        const from = new Date(
            activeDate.getFullYear(),
            activeDate.getMonth(),
            1
        );
        const to = new Date(
            activeDate.getFullYear(),
            activeDate.getMonth() + 1,
            0
        );
        onActiveRangeChange?.([from, to]);
    }, [activeDate, onActiveRangeChange]);

    const getKey = (date) => format(date, "yyyy-MM-dd");

    return (
        <Calendar
            view="month"
            minDetail="month"
            maxDetail="month"
            showNeighboringMonth={true}
            prev2Label={null}
            next2Label={null}
            formatMonthYear={(locale, date) =>
                date.toLocaleDateString("uk-UA", {
                    month: "long",
                    year: "numeric",
                })
            }
            formatShortWeekday={(locale, date) =>
                date
                    .toLocaleDateString("uk-UA", { weekday: "short" })
                    .toUpperCase()
            }
            value={activeDate}
            onClickDay={(d) => onSelectDate?.(d)}
            onActiveStartDateChange={({ activeStartDate }) =>
                onActiveRangeChange?.([
                    new Date(
                        activeStartDate.getFullYear(),
                        activeStartDate.getMonth(),
                        1
                    ),
                    new Date(
                        activeStartDate.getFullYear(),
                        activeStartDate.getMonth() + 1,
                        0
                    ),
                ])
            }
            tileContent={({ date, view }) => {
                if (view !== "month") return null;
                const key = getKey(date);
                const items = (eventsByDay?.[key] ?? [])
                    .slice()
                    .sort((a, b) =>
                        compareAsc(
                            new Date(
                                a.start ?? a.startAt ?? a.remindAt ?? a.dueAt
                            ),
                            new Date(
                                b.start ?? b.startAt ?? b.remindAt ?? b.dueAt
                            )
                        )
                    );
                if (!items.length) return null;

                return (
                    <CellEvents
                        items={items}
                        onMore={(e) => {
                            e.stopPropagation();
                            onSelectDate?.(date);
                        }}
                    />
                );
            }}
            tileClassName={({ date, view }) => {
                if (view !== "month") return "";
                const key = getKey(date);
                return eventsByDay?.[key]?.length ? "cal-has-events" : "";
            }}
        />
    );
}
