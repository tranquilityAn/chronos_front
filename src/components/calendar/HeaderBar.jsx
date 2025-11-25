/**
 * Поки просто контейнер під майбутній вміст.
 * @param {{ activeDate: Date }} props
 */
export default function HeaderBar({ activeDate }) {
    const monthLabel = activeDate.toLocaleString("en-US", {
        month: "long",
        year: "numeric",
    });

    return (
        <header className="headerbar">
            {/* Ліво: назва місяця */}
            <div className="headerbar__left">
                <span className="headerbar__month">{monthLabel}</span>
            </div>

            {/* Центр: пошук, тип івенту — TODO */}
            <div className="headerbar__center">
                {/* TODO: search bar, select "event type" */}
            </div>

            {/* Право: нікнейм + аватар — TODO */}
            <div className="headerbar__right">
                {/* TODO: nickname, avatar */}
            </div>
        </header>
    );
}
