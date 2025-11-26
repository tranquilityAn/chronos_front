import { useEffect, useMemo, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import HeaderBar from "../components/calendar/HeaderBar";
import Sidebar from "../components/calendar/Sidebar";
import CalendarGrid from "../components/calendar/CalendarGrid";
import CreateCalendarModal from "../components/modals/CreateCalendarModal";
import CreateEventModal from "../components/modals/CreateEventModal";
import Toast, { useToast } from "../components/ui/Toast";

import {
    loadCalendars,
    toggleCalendar,
} from "../features/calendars/calendarsSlice";
import { loadEventsForRange } from "../features/events/eventsSlice";
import { logout } from "../features/auth/authSlice";
import { createCalendar } from "../features/calendars/calendarApi";
import { createEvent } from "../features/events/eventApi";
import "../styles/calendar.css";

export default function CalendarPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Toast уведомления
    const { toast, showToast, hideToast } = useToast();

    // Проверяем токен — если нет, редирект на логин
    const token = useSelector((s) => s.auth.token);
    
    useEffect(() => {
        if (!token) {
            navigate("/login", { replace: true });
        }
    }, [token, navigate]);

    const { items: calendars, selectedIds, status: calStatus } = useSelector((s) => s.calendars);
    const { byDate: eventsByDate, status: evStatus } = useSelector((s) => s.events);
    const filters = useSelector((s) => s.events.filters);

    const [activeDate, setActiveDate] = useState(new Date());
    const [visibleRange, setVisibleRange] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);

    // Навигация по месяцам
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

    // Модальные окна
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Загрузка календарей при монтировании (если авторизован)
    useEffect(() => {
        if (token) {
            dispatch(loadCalendars());
        }
    }, [dispatch, token]);

    // Загрузка событий при изменении диапазона
    useEffect(() => {
        if (!visibleRange || !selectedIds.length) return;
        dispatch(
            loadEventsForRange({
                calendarIds: selectedIds,
                from: visibleRange.from,
                to: visibleRange.to,
                types: filters.types,
            })
        );
    }, [dispatch, visibleRange, selectedIds, filters.types]);

    // Подготовка календарей для UI
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

    // Handlers
    const handleLogout = () => {
        dispatch(logout());
        navigate("/login");
    };

    // Создание календаря
    const handleCreateCalendar = useCallback(async (data) => {
        setIsSubmitting(true);
        try {
            await createCalendar(data);
            setIsCalendarModalOpen(false);
            showToast("Calendar created successfully!", "success");
            // Перезагружаем список календарей
            dispatch(loadCalendars());
        } catch (err) {
            // Ошибка будет показана в модалке
            throw err;
        } finally {
            setIsSubmitting(false);
        }
    }, [dispatch, showToast]);

    // Создание события
    const handleCreateEvent = useCallback(async (calendarId, data) => {
        setIsSubmitting(true);
        try {
            await createEvent(calendarId, data);
            setIsEventModalOpen(false);
            showToast("Event created successfully!", "success");
            // Перезагружаем события
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
            // Ошибка будет показана в модалке
            throw err;
        } finally {
            setIsSubmitting(false);
        }
    }, [dispatch, visibleRange, selectedIds, filters.types, showToast]);

    // Показываем загрузку пока нет токена
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
                onToggleCalendar={(id) => dispatch(toggleCalendar(id))}
                onAddEvent={() => setIsEventModalOpen(true)}
                onAddCalendar={() => setIsCalendarModalOpen(true)}
            />

            <div className="calendar-main">
                <HeaderBar 
                    activeDate={activeDate}
                    onPrevMonth={handlePrevMonth}
                    onNextMonth={handleNextMonth}
                    onToday={handleToday}
                    onLogout={handleLogout}
                    isLoading={isLoading}
                />
                <CalendarGrid
                    activeDate={activeDate}
                    eventsByDate={eventsByDate}
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                    onRangeChange={setVisibleRange}
                />
            </div>

            {/* Модалка создания календаря */}
            <CreateCalendarModal
                isOpen={isCalendarModalOpen}
                onClose={() => setIsCalendarModalOpen(false)}
                onSubmit={handleCreateCalendar}
                isLoading={isSubmitting}
            />

            {/* Модалка создания события */}
            <CreateEventModal
                isOpen={isEventModalOpen}
                onClose={() => setIsEventModalOpen(false)}
                onSubmit={handleCreateEvent}
                calendars={calendars}
                selectedDate={selectedDate}
                isLoading={isSubmitting}
            />

            {/* Toast уведомления */}
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={hideToast}
            />
        </div>
    );
}
