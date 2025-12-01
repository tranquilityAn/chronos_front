import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import UserAvatar from '../ui/UserAvatar';

/**
 * @param {{
 *   activeDate: Date,
 *   onPrevMonth: () => void,
 *   onNextMonth: () => void,
 *   onToday: () => void,
 *   onLogout?: () => void,
 *   isLoading?: boolean,
 *   onToggleSidebar?: () => void
 * }} props
 */
export default function HeaderBar({ 
    activeDate, 
    onPrevMonth,
    onNextMonth,
    onToday,
    onLogout, 
    isLoading,
    onToggleSidebar
}) {
    const navigate = useNavigate();
    const location = useLocation();
    const user = useSelector((state) => state.auth.user);
    const isProfilePage = location.pathname === '/profile';
    
    const monthLabel = activeDate.toLocaleString("en-US", {
        month: "long",
        year: "numeric",
    });

    const handleHomeClick = () => {
        navigate('/');
    };

    // Если страница профиля - показываем только "Houdini" как ссылку
    if (isProfilePage) {
        return (
            <header className="headerbar">
                <div className="headerbar__left">
                    <span 
                        className="headerbar__brand"
                        onClick={handleHomeClick}
                        style={{ cursor: 'pointer' }}
                        title="На главную"
                    >
                        Houdini
                    </span>
                </div>
            </header>
        );
    }

    return (
        <header className="headerbar">
            {/* Ліво: навігація по місяцях */}
            <div className="headerbar__left">
                {onToggleSidebar && (
                    <button 
                        className="headerbar__burger"
                        onClick={onToggleSidebar}
                        title="Toggle sidebar"
                        aria-label="Toggle sidebar"
                    >
                        ☰
                    </button>
                )}
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

            {/* Право: имя пользователя и навигация */}
            <div className="headerbar__right">
                {user?.name && (
                    <span className="headerbar__user-name">{user.name}</span>
                )}
                <UserAvatar onLogout={onLogout} />
            </div>
        </header>
    );
}
