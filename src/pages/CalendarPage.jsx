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
import { loadEventsForRange } from "../features/events/eventsSlice";
import { logout, updateUser } from "../features/auth/authSlice";
import { getCurrentUser } from "../features/user/userApi";
import { createCalendar, updateCalendar, deleteCalendar } from "../features/calendars/calendarApi";
import { createEvent, deleteEvent, updateEvent } from "../features/events/eventApi";
import "../styles/calendar.css";

export default function CalendarPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Toast уведомления
    const { toast, showToast, hideToast } = useToast();

    // Проверяем токен — если нет, редирект на логин
    const token = useSelector((s) => s.auth.token);
    const user = useSelector((s) => s.auth.user);
    
    useEffect(() => {
        if (!token) {
            navigate("/login", { replace: true });
        }
    }, [token, navigate]);

    // Загрузка данных пользователя при инициализации (если есть токен, но нет данных пользователя)
    useEffect(() => {
        const loadUser = async () => {
            if (token && !user) {
                try {
                    const userData = await getCurrentUser();
                    dispatch(updateUser(userData));
                } catch (error) {
                    console.error('Error loading user:', error);
                    // Если ошибка 401, токен невалидный - очищаем и редиректим на логин
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

    const [activeDate, setActiveDate] = useState(new Date());
    const [visibleRange, setVisibleRange] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    
    // Обработчик клика на ячейку дня - открывает модальное окно создания события
    const handleDateClick = useCallback((date) => {
        setSelectedDate(date);
        setIsEventModalOpen(true);
    }, []);

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
    const [isEditCalendarModalOpen, setIsEditCalendarModalOpen] = useState(false);
    const [selectedCalendarId, setSelectedCalendarId] = useState(null);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeletingCalendar, setIsDeletingCalendar] = useState(false);
    
    // Детали события
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    
    // Модальное окно всех событий дня
    const [dayEventsModal, setDayEventsModal] = useState({
        isOpen: false,
        date: null,
        events: [],
    });

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

    const myCalendars = uiCalendars.filter((c) => c.role === "owner");
    const sharedCalendars = uiCalendars.filter((c) => c.role !== "owner");

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

    // Редактирование календаря
    const handleEditCalendar = useCallback((calendar) => {
        setSelectedCalendarId(calendar?.id || null);
        setIsEditCalendarModalOpen(true);
    }, []);

    // Обновление календаря
    const handleUpdateCalendar = useCallback(async (calendarId, data) => {
        setIsSubmitting(true);
        try {
            await updateCalendar(calendarId, data);
            setIsEditCalendarModalOpen(false);
            setSelectedCalendarId(null);
            showToast("Calendar updated successfully!", "success");
            // Перезагружаем список календарей
            dispatch(loadCalendars());
        } catch (err) {
            // Ошибка будет показана в модалке
            throw err;
        } finally {
            setIsSubmitting(false);
        }
    }, [dispatch, showToast]);

    // Удаление календаря
    const handleDeleteCalendar = useCallback(async (calendarId) => {
        setIsDeletingCalendar(true);
        try {
            await deleteCalendar(calendarId);
            setIsEditCalendarModalOpen(false);
            setSelectedCalendarId(null);
            showToast("Calendar deleted successfully!", "success");
            // Перезагружаем список календарей
            dispatch(loadCalendars());
        } catch (err) {
            showToast("Failed to delete calendar", "error");
            throw err;
        } finally {
            setIsDeletingCalendar(false);
        }
    }, [dispatch, showToast]);

    // Создание события
    const handleCreateEvent = useCallback(async (calendarId, data) => {
        setIsSubmitting(true);
        try {
            const result = await createEvent(calendarId, data);
            setIsEventModalOpen(false);
            showToast("Event created successfully!", "success");
            // Увеличиваем задержку перед перезагрузкой, чтобы сервер успел сохранить событие
            // Особенно важно для allDay событий, где сервер удаляет startAt/endAt
            setTimeout(() => {
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
            }, 500);
        } catch (err) {
            // Ошибка будет показана в модалке
            throw err;
        } finally {
            setIsSubmitting(false);
        }
    }, [dispatch, visibleRange, selectedIds, filters.types, showToast]);

    // Открытие деталей события
    const handleEventClick = useCallback((event) => {
        setSelectedEvent(event);
        setIsEventDetailOpen(true);
    }, []);

    // Открытие модального окна всех событий дня
    const handleShowAllEvents = useCallback((date, events) => {
        setDayEventsModal({
            isOpen: true,
            date,
            events,
        });
    }, []);

    // Удаление события
    const handleDeleteEvent = useCallback(async (calendarId, eventId) => {
        setIsDeleting(true);
        try {
            await deleteEvent(calendarId, eventId);
            setIsEventDetailOpen(false);
            setSelectedEvent(null);
            showToast("Event deleted successfully!", "success");
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
            showToast("Failed to delete event", "error");
            throw err;
        } finally {
            setIsDeleting(false);
        }
    }, [dispatch, visibleRange, selectedIds, filters.types, showToast]);

    // Обновление события
    const handleUpdateEvent = useCallback(async (calendarId, eventId, data) => {
        setIsUpdating(true);
        try {
            const result = await updateEvent(calendarId, eventId, data);
            // Обновляем selectedEvent с новыми данными
            setSelectedEvent((prev) => ({
                ...prev,
                ...result.event,
                id: result.event?._id || result.event?.id || eventId,
            }));
            showToast("Event updated successfully!", "success");
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
            showToast("Failed to update event", "error");
            throw err;
        } finally {
            setIsUpdating(false);
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
                onEditCalendar={handleEditCalendar}
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
                    onSelectDate={handleDateClick}
                    onRangeChange={setVisibleRange}
                    onEventClick={handleEventClick}
                    onShowAllEvents={handleShowAllEvents}
                />
            </div>

            {/* Модалка деталей события */}
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

            {/* Модалка создания календаря */}
            <CreateCalendarModal
                isOpen={isCalendarModalOpen}
                onClose={() => setIsCalendarModalOpen(false)}
                onSubmit={handleCreateCalendar}
                isLoading={isSubmitting}
            />

            {/* Модалка редактирования календаря */}
            <EditCalendarModal
                isOpen={isEditCalendarModalOpen}
                onClose={() => {
                    setIsEditCalendarModalOpen(false);
                    setSelectedCalendarId(null);
                }}
                onSubmit={handleUpdateCalendar}
                onDelete={handleDeleteCalendar}
                calendarId={selectedCalendarId}
                isLoading={isSubmitting}
                isDeleting={isDeletingCalendar}
            />

            {/* Модалка создания события */}
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

            {/* Модальное окно всех событий дня */}
            <DayEventsModal
                isOpen={dayEventsModal.isOpen}
                onClose={() => setDayEventsModal({ isOpen: false, date: null, events: [] })}
                date={dayEventsModal.date}
                events={dayEventsModal.events}
                onEventClick={handleEventClick}
            />

            {/* Модальное окно всех событий дня */}
            <DayEventsModal
                isOpen={dayEventsModal.isOpen}
                onClose={() => setDayEventsModal({ isOpen: false, date: null, events: [] })}
                date={dayEventsModal.date}
                events={dayEventsModal.events}
                onEventClick={handleEventClick}
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
