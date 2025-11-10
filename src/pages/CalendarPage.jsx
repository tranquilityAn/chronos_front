import { useMemo, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import CalendarToolbar from "../components/calendar/CalendarToolbar";
import CalendarSidebar from "../components/calendar/CalendarSidebar";
import CalendarMonth from "../components/calendar/CalendarMonth";
import DayEventsPopover from "../components/calendar/DayEventsPopover";
import EventList from "../components/calendar/EventList";
import {
    loadCalendars,
    toggleCalendar,
} from "../features/calendars/calendarsSlice";
import { loadEventsForRange } from "../features/events/eventsSlice";

export default function CalendarPage() {
    const dispatch = useDispatch();

    // глобальний стан
    const { items: calendars, selectedIds } = useSelector((s) => s.calendars);
    const eventsByDate = useSelector((s) => s.events.byDate);
    const filters = useSelector((s) => s.events.filters);

    // локальний UI-стан
    const [activeDate, setActiveDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [visibleRange, setVisibleRange] = useState(null);

    // 1) підвантажуємо календарі
    useEffect(() => {
        dispatch(loadCalendars());
    }, [dispatch]);

    // 2) коли відомий діапазон і є вибрані календарі — тягнемо події
    useEffect(() => {
        if (!visibleRange || !selectedIds.length) return;
        const [from, to] = visibleRange;
        dispatch(
            loadEventsForRange({
                calendarIds: selectedIds,
                from: from.toISOString(),
                to: to.toISOString(),
                types: filters.types,
            })
        );
    }, [dispatch, visibleRange, selectedIds, filters.types]);

    // для сайдбара позначимо who isVisible
    const uiCalendars = useMemo(
        () =>
            calendars.map((c) => ({
                ...c,
                isVisible: selectedIds.includes(c.id),
            })),
        [calendars, selectedIds]
    );

    // для правої колонки подій по вибраному дню
    const selectedKey = selectedDate
        ? new Date(
              selectedDate.getFullYear(),
              selectedDate.getMonth(),
              selectedDate.getDate()
          )
        : null;

    const selectedKeyStr = selectedKey
        ? selectedKey.toISOString().slice(0, 10) // yyyy-MM-dd
        : null;

    const dayEvents = selectedKeyStr ? eventsByDate[selectedKeyStr] ?? [] : [];

    return (
        <div className="cal-layout">
            <CalendarToolbar
                activeDate={activeDate}
                onPrev={() =>
                    setActiveDate(
                        new Date(
                            activeDate.getFullYear(),
                            activeDate.getMonth() - 1,
                            1
                        )
                    )
                }
                onNext={() =>
                    setActiveDate(
                        new Date(
                            activeDate.getFullYear(),
                            activeDate.getMonth() + 1,
                            1
                        )
                    )
                }
                onToday={() => setActiveDate(new Date())}
            />

            <section className="cal-content">
                <CalendarSidebar
                    calendars={uiCalendars}
                    onToggle={(id) => dispatch(toggleCalendar(id))}
                />

                <CalendarMonth
                    activeDate={activeDate}
                    onActiveRangeChange={setVisibleRange}
                    eventsByDay={eventsByDate}
                    onSelectDate={(d) => setSelectedDate(d)}
                />

                <EventList
                    date={selectedDate || activeDate}
                    events={dayEvents}
                />
            </section>

            <DayEventsPopover
                date={selectedDate}
                events={dayEvents}
                onClose={() => setSelectedDate(null)}
            />
        </div>
    );
}
