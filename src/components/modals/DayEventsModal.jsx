import Modal from "../ui/Modal";

/**
 * Форматирует время события
 */
function formatEventTime(event) {
    const type = event.type === "arrangement" ? "meeting" : event.type;
    
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
    
    if (type === "reminder" && event.remindAt) {
        const d = new Date(event.remindAt);
        return d.toLocaleTimeString("en-US", { 
            hour: "2-digit", 
            minute: "2-digit",
            hour12: false 
        });
    }
    
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
 * Возвращает название типа события
 */
function getEventTypeLabel(type) {
    switch (type) {
        case "arrangement":
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
 * Возвращает CSS класс для типа события
 */
function getEventTypeClass(type) {
    if (type === "arrangement") return "meeting";
    return type || "default";
}

/**
 * Форматирует дату для заголовка
 */
function formatDate(date) {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

/**
 * Модальное окно со всеми событиями дня
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   date: Date | null,
 *   events: Array,
 *   onEventClick: (event: object) => void
 * }} props
 */
export default function DayEventsModal({
    isOpen,
    onClose,
    date,
    events = [],
    onEventClick,
}) {
    if (!date) return null;

    const handleEventClick = (event) => {
        onEventClick?.(event);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={formatDate(date)}>
            <div className="day-events">
                {events.length === 0 ? (
                    <div className="day-events__empty">
                        No events for this day
                    </div>
                ) : (
                    <div className="day-events__list">
                        {events.map((event) => {
                            const time = formatEventTime(event);
                            const typeClass = getEventTypeClass(event.type);
                            const typeLabel = getEventTypeLabel(event.type);
                            const isCompletedTask = event.type === "task" && (event.isDone === true || event.status === "completed" || event.completed === true);
                            
                            return (
                                <div
                                    key={event.id}
                                    className={`day-events__item day-events__item--${typeClass}${isCompletedTask ? " day-events__item--completed" : ""}`}
                                    onClick={() => handleEventClick(event)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            handleEventClick(event);
                                        }
                                    }}
                                >
                                    <div className="day-events__item-header">
                                        <span className="day-events__item-type">
                                            {typeLabel}
                                        </span>
                                        {time && (
                                            <span className="day-events__item-time">
                                                {time}
                                            </span>
                                        )}
                                    </div>
                                    <div className="day-events__item-title">
                                        {event.title}
                                    </div>
                                    {event.description && (
                                        <div className="day-events__item-description">
                                            {event.description}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </Modal>
    );
}

