import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import HeaderBar from "../components/calendar/HeaderBar";
import Sidebar from "../components/calendar/Sidebar";
import CalendarGrid from "../components/calendar/CalendarGrid";

import {
    loadCalendars,
    toggleCalendar,
} from "../features/calendars/calendarsSlice";
import { loadEventsForRange } from "../features/events/eventsSlice";
import "../styles/calendar.css";

export default function CalendarPage() {
    const dispatch = useDispatch();

    const { items: calendars, selectedIds } = useSelector((s) => s.calendars);
    const eventsByDate = useSelector((s) => s.events.byDate);
    const filters = useSelector((s) => s.events.filters);

    const [activeDate, setActiveDate] = useState(new Date());
    const [visibleRange, setVisibleRange] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);

    useEffect(() => {
        dispatch(loadCalendars());
    }, [dispatch]);

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

    const uiCalendars = useMemo(
        () =>
            calendars.map((c) => ({
                ...c,
                isVisible: selectedIds.includes(c.id),
            })),
        [calendars, selectedIds]
    );

    const myCalendars = uiCalendars.filter((c) => c.type !== "shared");
    const sharedCalendars = uiCalendars.filter((c) => c.type === "shared");

    return (
        <div className="calendar-page">
            <Sidebar
                serviceName="Houdini"
                myCalendars={myCalendars}
                sharedCalendars={sharedCalendars}
                onToggleCalendar={(id) => dispatch(toggleCalendar(id))}
                onAddEvent={() => {}}
                onAddCalendar={() => {}}
            />

            <div className="calendar-main">
                <HeaderBar activeDate={activeDate} />
                <CalendarGrid
                    activeDate={activeDate}
                    eventsByDate={eventsByDate}
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                    onRangeChange={setVisibleRange}
                />
            </div>
        </div>
    );
}
