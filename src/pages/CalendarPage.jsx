import { useEffect, useMemo, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import HeaderBar from "../components/calendar/HeaderBar";
import Sidebar from "../components/calendar/Sidebar";
import CalendarGrid from "../components/calendar/CalendarGrid";
import CreateCalendarModal from "../components/modals/CreateCalendarModal";
import EditCalendarModal from "../components/modals/EditCalendarModal";
import CreateEventModal from "../components/modals/CreateEventModal";
import EventDetailModal from "../components/modals/EventDetailModal";
import DayEventsModal from "../components/modals/DayEventsModal";
import Toast, { useToast } from "../components/ui/Toast";

import {
    loadCalendars,
    toggleCalendar,
} from "../features/calendars/calendarsSlice";
import { loadEventsForRange, clearEvents } from "../features/events/eventsSlice";
import { loadSharedEvents, toggleSharedEventVisibility } from "../features/sharedEvents/sharedEventsSlice";
import { logout, updateUser } from "../features/auth/authSlice";
import { getCurrentUser } from "../features/user/userApi";
import { createCalendar, updateCalendar, deleteCalendar } from "../features/calendars/calendarApi";
import { createEvent, deleteEvent, updateEvent } from "../features/events/eventApi";
import "../styles/calendar.css";

export default function CalendarPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { toast, showToast, hideToast } = useToast();

    const token = useSelector((s) => s.auth.token);
    const user = useSelector((s) => s.auth.user);
    
    useEffect(() => {
        if (!token) {
            navigate("/login", { replace: true });
        }
    }, [token, navigate]);

    useEffect(() => {
        const loadUser = async () => {
            if (token && !user) {
                try {
                    const userData = await getCurrentUser();
                    dispatch(updateUser(userData));
                } catch (error) {
                    console.error('Error loading user:', error);
                    if (error?.response?.status === 401) {
                        dispatch(logout());
                        navigate("/login", { replace: true });
                    }
                }
            }
        };

        loadUser();
    }, [token, user, dispatch, navigate]);

    const { items: calendars, selectedIds, status: calStatus } = useSelector((s) => s.calendars);
    const { byDate: eventsByDate, status: evStatus } = useSelector((s) => s.events);
    const filters = useSelector((s) => s.events.filters);
    const { items: sharedEventsItems, selectedIds: selectedSharedIds, status: sharedStatus } = useSelector((s) => s.sharedEvents);

    const [activeDate, setActiveDate] = useState(new Date());
    const [visibleRange, setVisibleRange] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    const handleDateClick = useCallback((date) => {
        setSelectedDate(date);
        setIsEventModalOpen(true);
    }, []);

    const handlePrevMonth = useCallback(() => {
        setActiveDate((prev) => {
            const d = new Date(prev);
            d.setMonth(d.getMonth() - 1);
            return d;
        });
    }, []);

    const handleNextMonth = useCallback(() => {
        setActiveDate((prev) => {
            const d = new Date(prev);
            d.setMonth(d.getMonth() + 1);
            return d;
        });
    }, []);

    const handleToday = useCallback(() => {
        setActiveDate(new Date());
        setSelectedDate(new Date());
    }, []);

    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
    const [isEditCalendarModalOpen, setIsEditCalendarModalOpen] = useState(false);
    const [selectedCalendar, setSelectedCalendar] = useState(null);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeletingCalendar, setIsDeletingCalendar] = useState(false);
    
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    
    const [dayEventsModal, setDayEventsModal] = useState({
        isOpen: false,
        date: null,
        events: [],
    });

    useEffect(() => {
        if (token) {
            dispatch(loadCalendars());
            dispatch(loadSharedEvents());
        }
    }, [dispatch, token]);

    useEffect(() => {
        if (!visibleRange) return;

        if (!selectedIds.length) {
            dispatch(clearEvents());
            return;
        }
        
        dispatch(
            loadEventsForRange({
                calendarIds: selectedIds,
                from: visibleRange.from,
                to: visibleRange.to,
                types: filters.types,
            })
        );
    }, [dispatch, visibleRange, selectedIds, filters.types, selectedSharedIds]);

    const uiCalendars = useMemo(
        () =>
            calendars.map((c) => ({
                ...c,
                isVisible: selectedIds.includes(c.id),
            })),
        [calendars, selectedIds]
    );

    const myCalendars = uiCalendars.filter((c) => c.role === "owner");
    const sharedCalendars = uiCalendars.filter((c) => c.role !== "owner");

    const visibleSharedEvents = useMemo(
        () =>
            sharedEventsItems.map((e) => {
                const eventId = String(e.id || e._id);
                return {
                    ...e,
                    isVisible: selectedSharedIds.includes(eventId),
                };
            }),
        [sharedEventsItems, selectedSharedIds]
    );

    const handleLogout = () => {
        dispatch(logout());
        navigate("/login");
    };

    const handleCreateCalendar = useCallback(async (data) => {
        setIsSubmitting(true);
        try {
            await createCalendar(data);
            setIsCalendarModalOpen(false);
            showToast("Calendar created successfully!", "success");
            dispatch(loadCalendars());
        } catch (err) {
            throw err;
        } finally {
            setIsSubmitting(false);
        }
    }, [dispatch, showToast]);

    const handleEditCalendar = useCallback((calendar) => {
        setSelectedCalendar(calendar || null);
        setIsEditCalendarModalOpen(true);
    }, []);

    const handleUpdateCalendar = useCallback(async (calendarId, data) => {
        setIsSubmitting(true);
        try {
            await updateCalendar(calendarId, data);
            setIsEditCalendarModalOpen(false);
            setSelectedCalendar(null);
            showToast("Calendar updated successfully!", "success");
            dispatch(loadCalendars());
        } catch (err) {
            throw err;
        } finally {
            setIsSubmitting(false);
        }
    }, [dispatch, showToast]);

    const handleDeleteCalendar = useCallback(async (calendarId) => {
        setIsDeletingCalendar(true);
        try {
            await deleteCalendar(calendarId);
            setIsEditCalendarModalOpen(false);
            setSelectedCalendar(null);
            showToast("Calendar deleted successfully!", "success");
            dispatch(loadCalendars());
        } catch (err) {
            showToast("Failed to delete calendar", "error");
            throw err;
        } finally {
            setIsDeletingCalendar(false);
        }
    }, [dispatch, showToast]);

    const handleCreateEvent = useCallback(async (calendarId, data) => {
        setIsSubmitting(true);
        try {
            const result = await createEvent(calendarId, data);
            setIsEventModalOpen(false);
            showToast("Event created successfully!", "success");
            setTimeout(() => {
                if (visibleRange && selectedIds.length) {
                    dispatch(
                        loadEventsForRange({
                            calendarIds: selectedIds,
                            from: visibleRange.from,
                            to: visibleRange.to,
                            types: filters.types,
                        })
                    );
                }
            }, 500);
        } catch (err) {
            throw err;
        } finally {
            setIsSubmitting(false);
        }
    }, [dispatch, visibleRange, selectedIds, filters.types, showToast]);

    const handleEventClick = useCallback((event) => {
        setSelectedEvent(event);
        setIsEventDetailOpen(true);
    }, []);

    const handleShowAllEvents = useCallback((date, events) => {
        setDayEventsModal({
            isOpen: true,
            date,
            events,
        });
    }, []);

    const handleDeleteEvent = useCallback(async (calendarId, eventId) => {
        setIsDeleting(true);
        try {
            await deleteEvent(calendarId, eventId);
            setIsEventDetailOpen(false);
            setSelectedEvent(null);
            showToast("Event deleted successfully!", "success");
            if (visibleRange && selectedIds.length) {
                dispatch(
                    loadEventsForRange({
                        calendarIds: selectedIds,
                        from: visibleRange.from,
                        to: visibleRange.to,
                        types: filters.types,
                    })
                );
            }
        } catch (err) {
            showToast("Failed to delete event", "error");
            throw err;
        } finally {
            setIsDeleting(false);
        }
    }, [dispatch, visibleRange, selectedIds, filters.types, showToast]);

    const handleUpdateEvent = useCallback(async (calendarId, eventId, data) => {
        setIsUpdating(true);
        try {
            const result = await updateEvent(calendarId, eventId, data);
            setSelectedEvent((prev) => ({
                ...prev,
                ...result,
                id: result?._id || result?.id || eventId,
            }));
            showToast("Event updated successfully!", "success");
            if (visibleRange && selectedIds.length) {
                dispatch(
                    loadEventsForRange({
                        calendarIds: selectedIds,
                        from: visibleRange.from,
                        to: visibleRange.to,
                        types: filters.types,
                    })
                );
            }
        } catch (err) {
            showToast("Failed to update event", "error");
            throw err;
        } finally {
            setIsUpdating(false);
        }
    }, [dispatch, visibleRange, selectedIds, filters.types, showToast]);

    if (!token) {
        return null;
    }

    const isLoading = calStatus === "loading" || evStatus === "loading";

    return (
        <div className="calendar-page">
            <Sidebar
                serviceName="Houdini"
                myCalendars={myCalendars}
                sharedCalendars={sharedCalendars}
                sharedEvents={visibleSharedEvents}
                onToggleCalendar={(id) => dispatch(toggleCalendar(id))}
                onToggleSharedEvent={(id) => dispatch(toggleSharedEventVisibility(id))}
                onAddEvent={() => setIsEventModalOpen(true)}
                onAddCalendar={() => setIsCalendarModalOpen(true)}
                onEditCalendar={handleEditCalendar}
                isMobileOpen={isSidebarOpen}
                onCloseMobile={() => setIsSidebarOpen(false)}
            />

            <div className="calendar-main">
                <HeaderBar 
                    activeDate={activeDate}
                    onPrevMonth={handlePrevMonth}
                    onNextMonth={handleNextMonth}
                    onToday={handleToday}
                    onLogout={handleLogout}
                    isLoading={isLoading}
                    onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
                />
                <CalendarGrid
                    activeDate={activeDate}
                    eventsByDate={eventsByDate}
                    selectedDate={selectedDate}
                    onSelectDate={handleDateClick}
                    onRangeChange={setVisibleRange}
                    onEventClick={handleEventClick}
                    onShowAllEvents={handleShowAllEvents}
                />
            </div>

            <EventDetailModal
                isOpen={isEventDetailOpen}
                onClose={() => {
                    setIsEventDetailOpen(false);
                    setSelectedEvent(null);
                }}
                event={selectedEvent}
                onDelete={handleDeleteEvent}
                onUpdate={handleUpdateEvent}
                isDeleting={isDeleting}
                isUpdating={isUpdating}
            />

            <CreateCalendarModal
                isOpen={isCalendarModalOpen}
                onClose={() => setIsCalendarModalOpen(false)}
                onSubmit={handleCreateCalendar}
                isLoading={isSubmitting}
            />

            <EditCalendarModal
                isOpen={isEditCalendarModalOpen}
                onClose={() => {
                    setIsEditCalendarModalOpen(false);
                    setSelectedCalendar(null);
                }}
                onSubmit={handleUpdateCalendar}
                onDelete={handleDeleteCalendar}
                calendar={selectedCalendar}
                isLoading={isSubmitting}
                isDeleting={isDeletingCalendar}
            />

            <CreateEventModal
                isOpen={isEventModalOpen}
                onClose={() => {
                    setIsEventModalOpen(false);
                    setSelectedDate(null);
                }}
                onSubmit={handleCreateEvent}
                calendars={calendars}
                selectedDate={selectedDate}
                isLoading={isSubmitting}
            />

            <DayEventsModal
                isOpen={dayEventsModal.isOpen}
                onClose={() => setDayEventsModal({ isOpen: false, date: null, events: [] })}
                date={dayEventsModal.date}
                events={dayEventsModal.events}
                onEventClick={handleEventClick}
            />

            <DayEventsModal
                isOpen={dayEventsModal.isOpen}
                onClose={() => setDayEventsModal({ isOpen: false, date: null, events: [] })}
                date={dayEventsModal.date}
                events={dayEventsModal.events}
                onEventClick={handleEventClick}
            />

            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={hideToast}
            />
        </div>
    );
}
