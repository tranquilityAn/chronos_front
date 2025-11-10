const asDate = (v) => (v instanceof Date ? v : new Date(v));

export default function DayEventsPopover({ date, events, onClose }) {
    if (!date) return null;
    return (
        <div className="pop-overlay" onClick={onClose}>
            <div className="pop-card" onClick={(e) => e.stopPropagation()}>
                <div className="pop-head">
                    <h4>
                        {date.toLocaleDateString("uk-UA", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                        })}
                    </h4>
                    <button className="btn" onClick={onClose}>
                        Close
                    </button>
                </div>

                {events?.length ? (
                    <ul className="pop-list">
                        {events.map((ev) => {
                            const start = asDate(
                                ev.start ??
                                    ev.startAt ??
                                    ev.remindAt ??
                                    ev.dueAt
                            );
                            const end = asDate(
                                ev.end ??
                                    ev.endAt ??
                                    ev.startAt ??
                                    ev.remindAt ??
                                    ev.dueAt
                            );
                            return (
                                <li key={ev.id} className="pop-item">
                                    <div className="pop-title">{ev.title}</div>
                                    <div className="pop-time">
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
                ) : (
                    <p className="muted">No events</p>
                )}
            </div>
        </div>
    );
}
