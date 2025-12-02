import { useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * @param {{
 *   serviceName: string,
 *   myCalendars: Array,
 *   sharedCalendars: Array,
 *   sharedEvents: Array,
 *   onToggleCalendar: (id: string) => void,
 *   onToggleSharedEvent: (id: string) => void,
 *   onAddEvent: () => void,
 *   onAddCalendar: () => void,
 *   onEditCalendar: (calendar: object) => void,
 *   isMobileOpen?: boolean,
 *   onCloseMobile?: () => void,
 * }} props
 */
export default function Sidebar({
    serviceName,
    myCalendars,
    sharedCalendars,
    sharedEvents = [],
    onToggleCalendar,
    onToggleSharedEvent,
    onAddEvent,
    onAddCalendar,
    onEditCalendar,
    isMobileOpen = false,
    onCloseMobile,
}) {
    const navigate = useNavigate();
    const [areCalendarsOpen, setAreCalendarsOpen] = useState(true);
    const [areSharedEventsOpen, setAreSharedEventsOpen] = useState(true);

    const handleBrandClick = () => {
        navigate('/');
    };

    return (
        <>
            {/* Overlay для мобильной версии */}
            {isMobileOpen && onCloseMobile && (
                <div 
                    className={`sidebar-overlay ${isMobileOpen ? 'sidebar-overlay--visible' : ''}`}
                    onClick={onCloseMobile}
                />
            )}
            
            <aside className={`sidebar ${isMobileOpen ? 'sidebar--mobile-open' : ''}`}>
                {/* Назва сервісу зверху */}
                <div className="sidebar__brand">
                <span 
                    className="sidebar__brand-title"
                    onClick={handleBrandClick}
                    style={{ cursor: 'pointer' }}
                    title="На главную"
                >
                    {serviceName}
                </span>
            </div>

            {/* Блок "your calendars" */}
            <div className="sidebar__section">
                <button
                    className="sidebar__section-header"
                    onClick={() => setAreCalendarsOpen((v) => !v)}
                >
                    <span className="sidebar__section-title">Calendars</span>
                </button>

                <div className="sidebar__subsection">
                    <button
                        className="sidebar__subsection-header"
                        onClick={() => setAreCalendarsOpen((v) => !v)}
                    >
                        <span className="sidebar__subsection-title">
                            your calendars
                        </span>
                        <span className="sidebar__chevron">
                            {areCalendarsOpen ? "▾" : "▸"}
                        </span>
                    </button>

                    {areCalendarsOpen && (
                        <ul className="sidebar__list">
                            {myCalendars.map((c) => (
                                <li key={c.id} className="sidebar__item">
                                    <label 
                                        className="sidebar__checkbox-row"
                                        style={{ "--calendar-color": c.color || "#EDE986" }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={c.isVisible}
                                            onChange={() =>
                                                onToggleCalendar(c.id)
                                            }
                                        />
                                        <span>{c.name}</span>
                                    </label>
                                    <button
                                        className="sidebar__item-menu"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEditCalendar?.(c);
                                        }}
                                        title="Edit calendar"
                                    >
                                        ⋯
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* shared calendars */}
                <div className="sidebar__subsection">
                    <button
                        className="sidebar__subsection-header"
                        onClick={() => setAreCalendarsOpen((v) => !v)}
                    >
                        <span className="sidebar__subsection-title">
                            shared calendars
                        </span>
                        <span className="sidebar__chevron">
                            {areCalendarsOpen ? "▾" : "▸"}
                        </span>
                    </button>

                    {areCalendarsOpen && (
                        <ul className="sidebar__list">
                            {sharedCalendars.map((c) => (
                                <li key={c.id} className="sidebar__item">
                                    <label 
                                        className="sidebar__checkbox-row"
                                        style={{ "--calendar-color": c.color || "#EDE986" }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={c.isVisible}
                                            onChange={() =>
                                                onToggleCalendar(c.id)
                                            }
                                        />
                                        <span>{c.name}</span>
                                    </label>
                                    <button
                                        className="sidebar__item-menu"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEditCalendar?.(c);
                                        }}
                                        title="Edit calendar"
                                    >
                                        ⋯
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Блок "Shared events" */}
            {sharedEvents.length > 0 && (
                <div className="sidebar__section">
                    <div className="sidebar__subsection">
                        <button
                            className="sidebar__subsection-header"
                            onClick={() => setAreSharedEventsOpen((v) => !v)}
                        >
                            <span className="sidebar__subsection-title">
                                shared events
                            </span>
                            <span className="sidebar__chevron">
                                {areSharedEventsOpen ? "▾" : "▸"}
                            </span>
                        </button>

                        {areSharedEventsOpen && (
                            <ul className="sidebar__list">
                                {sharedEvents.map((ev) => {
                                    const eventId = String(ev.id || ev._id);
                                    const eventTitle = ev.title || ev.name || "Shared event";
                                    const eventColor = ev.color || ev.event?.color || "#EDE986";
                                    return (
                                        <li key={eventId} className="sidebar__item">
                                            <label 
                                                className="sidebar__checkbox-row"
                                                style={{ "--calendar-color": eventColor }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={ev.isVisible}
                                                    onChange={() => onToggleSharedEvent(eventId)}
                                                />
                                                <span>{eventTitle}</span>
                                            </label>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            {/* Кнопки в самому низу */}
            <div className="sidebar__footer">
                <button className="sidebar__btn" onClick={onAddEvent}>
                    + event
                </button>
                <button className="sidebar__btn" onClick={onAddCalendar}>
                    + calendar
                </button>
            </div>
        </aside>
        </>
    );
}
