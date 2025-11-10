import ColorDot from "./ColorDot";

/** @param {{calendars: Array, onToggle: (id:string)=>void}} props */
export default function CalendarSidebar({ calendars, onToggle }) {
    return (
        <div className="cal-sidebar">
            <h3>Calendars</h3>
            <ul>
                {calendars.map((c) => (
                    <li key={c.id}>
                        <label>
                            <input
                                type="checkbox"
                                checked={c.isVisible}
                                onChange={() => onToggle(c.id)}
                            />
                            <ColorDot color={c.color} />
                            <span>{c.name}</span>
                        </label>
                    </li>
                ))}
            </ul>
        </div>
    );
}
