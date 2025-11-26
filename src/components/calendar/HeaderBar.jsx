/**
 * @param {{
 *   activeDate: Date,
 *   onPrevMonth: () => void,
 *   onNextMonth: () => void,
 *   onToday: () => void,
 *   onLogout?: () => void,
 *   isLoading?: boolean
 * }} props
 */
export default function HeaderBar({ 
    activeDate, 
    onPrevMonth,
    onNextMonth,
    onToday,
    onLogout, 
    isLoading 
}) {
    const monthLabel = activeDate.toLocaleString("en-US", {
        month: "long",
        year: "numeric",
    });

    return (
        <header className="headerbar">
            {/* Ліво: навігація по місяцях */}
            <div className="headerbar__left">
                <div className="headerbar__nav">
                    <button 
                        className="headerbar__nav-btn" 
                        onClick={onPrevMonth}
                        title="Previous month"
                    >
                        ◀
                    </button>
                    <button 
                        className="headerbar__today-btn" 
                        onClick={onToday}
                    >
                        Today
                    </button>
                    <button 
                        className="headerbar__nav-btn" 
                        onClick={onNextMonth}
                        title="Next month"
                    >
                        ▶
                    </button>
                </div>
                <span className="headerbar__month">{monthLabel}</span>
                {isLoading && <span className="headerbar__loading">Loading...</span>}
            </div>

            {/* Центр: пошук, тип івенту — TODO */}
            <div className="headerbar__center">
                {/* TODO: search bar, select "event type" */}
            </div>

            {/* Право: logout */}
            <div className="headerbar__right">
                {onLogout && (
                    <button className="headerbar__logout" onClick={onLogout}>
                        Logout
                    </button>
                )}
            </div>
        </header>
    );
}
