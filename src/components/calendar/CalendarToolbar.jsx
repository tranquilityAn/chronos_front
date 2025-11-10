export default function CalendarToolbar({
    activeDate,
    onPrev,
    onNext,
    onToday,
}) {
    const month = activeDate.toLocaleString("uk-UA", {
        month: "long",
        year: "numeric",
    });
    return (
        <div className="cal-toolbar">
            <div className="cal-toolbar__left">
                <button onClick={onPrev} className="btn">
                    ‹
                </button>
                <button onClick={onToday} className="btn">
                    Today
                </button>
                <button onClick={onNext} className="btn">
                    ›
                </button>
            </div>
            <h2 className="cal-toolbar__title">{month}</h2>
            <div />
        </div>
    );
}
