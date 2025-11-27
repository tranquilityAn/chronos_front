import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './UserAvatar.css';

export default function UserAvatar({ onLogout }) {
    const navigate = useNavigate();
    const user = useSelector((state) => state.auth.user);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [avatarError, setAvatarError] = useState(false);
    const menuRef = useRef(null);

    // Закрытие меню при клике вне его
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

    const getInitials = (name, email) => {
        // Если есть имя, формируем инициалы из имени
        if (name && typeof name === 'string' && name.trim()) {
            const parts = name.trim().split(/\s+/).filter(part => part.length > 0);
            if (parts.length >= 2) {
                // Если несколько слов, берем первую букву первого и последнего слова
                const first = parts[0][0] || '';
                const last = parts[parts.length - 1][0] || '';
                return (first + last).toUpperCase();
            }
            if (parts.length === 1 && parts[0].length >= 2) {
                // Если одно слово, берем первые две буквы
                return parts[0].substring(0, 2).toUpperCase();
            }
            if (parts.length === 1) {
                // Если одно слово из одной буквы
                return parts[0][0].toUpperCase();
            }
        }
        
        // Если имени нет, формируем из email
        if (email && typeof email === 'string' && email.trim()) {
            const emailClean = email.trim();
            const atIndex = emailClean.indexOf('@');
            if (atIndex > 0) {
                // Берем первые две буквы до символа @
                const beforeAt = emailClean.substring(0, atIndex);
                if (beforeAt.length >= 2) {
                    return beforeAt.substring(0, 2).toUpperCase();
                }
                return beforeAt[0].toUpperCase();
            }
            if (emailClean.length >= 2) {
                return emailClean.substring(0, 2).toUpperCase();
            }
            return emailClean[0].toUpperCase();
        }
        
        // Если ничего нет, возвращаем дефолтный символ
        return 'U';
    };

    const handleAvatarClick = (e) => {
        e.stopPropagation();
        setIsMenuOpen(!isMenuOpen);
    };

    const handleProfileClick = () => {
        setIsMenuOpen(false);
        navigate('/profile');
    };

    const handleLogoutClick = () => {
        setIsMenuOpen(false);
        if (onLogout) {
            onLogout();
        }
    };

    // Проверяем наличие валидного аватара
    const hasAvatar = user?.avatar && 
                      typeof user.avatar === 'string' && 
                      user.avatar.trim() !== '' && 
                      user.avatar !== 'null' && 
                      user.avatar !== 'undefined';

    // Сбрасываем ошибку при изменении аватара
    useEffect(() => {
        if (user?.avatar) {
            setAvatarError(false);
        }
    }, [user?.avatar]);

    const showAvatar = hasAvatar && !avatarError;

    if (!user) {
        return null;
    }

    return (
        <div className="user-avatar-wrapper" ref={menuRef}>
            <button 
                className="user-avatar" 
                onClick={handleAvatarClick} 
                title="User Menu"
                aria-expanded={isMenuOpen}
                aria-haspopup="true"
            >
                {showAvatar ? (
                    <img 
                        src={user.avatar} 
                        alt={user.name || user.email}
                        className="user-avatar__image"
                        onError={() => {
                            // Если изображение не загрузилось, показываем инициалы
                            setAvatarError(true);
                        }}
                    />
                ) : (
                    <div className="user-avatar__initials" title={user.name || user.email || 'User'}>
                        {getInitials(user.name, user.email)}
                    </div>
                )}
            </button>

            {isMenuOpen && (
                <div className="user-avatar__dropdown">
                    <div className="user-avatar__dropdown-header">
                        <div className="user-avatar__dropdown-name">
                            {user.name || 'User'}
                        </div>
                        <div className="user-avatar__dropdown-email">
                            {user.email}
                        </div>
                    </div>
                    <div className="user-avatar__dropdown-divider"></div>
                    <button 
                        className="user-avatar__dropdown-item"
                        onClick={handleProfileClick}
                    >
                        <span className="user-avatar__dropdown-icon">👤</span>
                        Profile
                    </button>
                    <button 
                        className="user-avatar__dropdown-item user-avatar__dropdown-item--danger"
                        onClick={handleLogoutClick}
                    >
                        <span className="user-avatar__dropdown-icon">🚪</span>
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
}

