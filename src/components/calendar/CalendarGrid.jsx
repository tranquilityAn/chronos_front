import { useEffect, useMemo } from "react";
import ColorDot from "./ColorDot";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getKey(date) {
    return date.toISOString().slice(0, 10);
}

/**
 * @param {{
 *   activeDate: Date,
 *   eventsByDate: Record<string, Array>,
 *   selectedDate: Date | null,
 *   onSelectDate: (d: Date) => void,
 *   onRangeChange: ([Date, Date]) => void,
 * }} props
 */
export default function CalendarGrid({
    activeDate,
    eventsByDate,
    selectedDate,
    onSelectDate,
    onRangeChange,
}) {
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

    // повідомляємо сторінці видимий діапазон
    useEffect(() => {
        onRangeChange?.([from, to]);
    }, [from, to, onRangeChange]);

    const month = activeDate.getMonth();

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
                    const isSelected =
                        selectedDate && getKey(selectedDate) === getKey(date);

                    return (
                        <button
                            key={key}
                            className={[
                                "cal-grid__cell",
                                !isCurrentMonth && "cal-grid__cell--outside",
                                isSelected && "cal-grid__cell--selected",
                            ]
                                .filter(Boolean)
                                .join(" ")}
                            onClick={() => onSelectDate?.(date)}
                        >
                            <div className="cal-grid__cell-date">
                                {date.getDate()}
                            </div>

                            <div className="cal-grid__cell-events">
                                {items.slice(0, 3).map((ev) => (
                                    <div
                                        key={ev.id}
                                        className="cal-grid__event-row"
                                    >
                                        <ColorDot
                                            color={
                                                ev.color ||
                                                ev.calendar?.color ||
                                                "#000"
                                            }
                                        />
                                        <span className="cal-grid__event-title">
                                            {ev.title}
                                        </span>
                                    </div>
                                ))}
                                {items.length > 3 && (
                                    <div className="cal-grid__event-more">
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
