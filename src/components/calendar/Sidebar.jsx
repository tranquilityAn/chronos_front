import { useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * @param {{
 *   serviceName: string,
 *   myCalendars: Array,
 *   sharedCalendars: Array,
 *   onToggleCalendar: (id: string) => void,
 *   onAddEvent: () => void,
 *   onAddCalendar: () => void,
 *   onEditCalendar: (calendar: object) => void,
 * }} props
 */
export default function Sidebar({
    serviceName,
    myCalendars,
    sharedCalendars,
    onToggleCalendar,
    onAddEvent,
    onAddCalendar,
    onEditCalendar,
}) {
    const navigate = useNavigate();
    const [isMyOpen, setIsMyOpen] = useState(true);
    const [isSharedOpen, setIsSharedOpen] = useState(true);

    const handleBrandClick = () => {
        navigate('/');
    };

    return (
        <aside className="sidebar">
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
                    onClick={() => setIsMyOpen((v) => !v)}
                >
                    <span className="sidebar__section-title">Calendars</span>
                </button>

                <div className="sidebar__subsection">
                    <button
                        className="sidebar__subsection-header"
                        onClick={() => setIsMyOpen((v) => !v)}
                    >
                        <span className="sidebar__subsection-title">
                            your calendars
                        </span>
                        <span className="sidebar__chevron">
                            {isMyOpen ? "▾" : "▸"}
                        </span>
                    </button>

                    {isMyOpen && (
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
                        onClick={() => setIsSharedOpen((v) => !v)}
                    >
                        <span className="sidebar__subsection-title">
                            shared calendars
                        </span>
                        <span className="sidebar__chevron">
                            {isSharedOpen ? "▾" : "▸"}
                        </span>
                    </button>

                    {isSharedOpen && (
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
    );
}
