export default function EventList({ date, events }) {
    const title = date.toLocaleDateString("uk-UA", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });

    const asDate = (v) => (v instanceof Date ? v : new Date(v));

    return (
        <div className="cal-right">
            <h3>{title}</h3>
            {!events.length && <p className="muted">No events</p>}
            <ul className="event-list">
                {events.map((ev) => {
                    const start = asDate(
                        ev.start ?? ev.startAt ?? ev.remindAt ?? ev.dueAt
                    );
                    const end = asDate(
                        ev.end ??
                            ev.endAt ??
                            ev.startAt ??
                            ev.remindAt ??
                            ev.dueAt
                    );
                    return (
                        <li key={ev.id} className="event-item">
                            <div className="event-title">{ev.title}</div>
                            <div className="event-time">
                                {start.toLocaleTimeString("uk-UA", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                                {" – "}
                                {end.toLocaleTimeString("uk-UA", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
