import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, updateUser, updateUserAvatar, deleteCurrentUser } from '../features/user/userApi';
import { logout, updateUser as updateUserAction } from '../features/auth/authSlice';
import HeaderBar from '../components/calendar/HeaderBar';
import Toast, { useToast } from '../components/ui/Toast';
import '../styles/calendar.css';
import './ProfilePage.css';

export default function ProfilePage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { toast, showToast, hideToast } = useToast();
    
    const token = useSelector((state) => state.auth.token);
    const userFromStore = useSelector((state) => state.auth.user);

    const [user, setUser] = useState(userFromStore);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [avatarError, setAvatarError] = useState(false);
    const [isDeletingUser, setIsDeletingUser] = useState(false);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        country: '',
    });
    const fileInputRef = useRef(null);

    // Проверка авторизации
    useEffect(() => {
        if (!token) {
            navigate('/login', { replace: true });
        }
    }, [token, navigate]);

    // Загрузка данных пользователя
    useEffect(() => {
        const loadUser = async () => {
            if (!token) return;
            
            try {
                setIsLoading(true);
                const userData = await getCurrentUser();
                console.log('Loaded user data:', userData);
                console.log('Avatar URL:', userData?.avatar);
                setUser(userData);
                dispatch(updateUserAction(userData));
                setAvatarError(false); // Сбрасываем ошибку при загрузке
                setFormData({
                    name: userData.name || '',
                    country: userData.country || '',
                });
            } catch (error) {
                console.error('Error loading user:', error);
                showToast('Error Loading User Data', 'error');
            } finally {
                setIsLoading(false);
            }
        };

        loadUser();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, dispatch]);

    // Сбрасываем ошибку при изменении аватара
    useEffect(() => {
        setAvatarError(false);
    }, [user?.avatar]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            await updateUser({
                name: formData.name || '',
                country: formData.country || '',
            });
            // Перезагружаем данные с сервера для получения актуальной информации
            const freshUserData = await getCurrentUser();
            setUser(freshUserData);
            dispatch(updateUserAction(freshUserData));
            setFormData({
                name: freshUserData.name || '',
                country: freshUserData.country || '',
            });
            setIsEditing(false);
            showToast('Profile Updated Successfully', 'success');
        } catch (error) {
            console.error('Error updating user:', error);
            showToast(error?.response?.data?.error || 'Error Updating Profile', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            name: user?.name || '',
            country: user?.country || '',
        });
        setIsEditing(false);
    };

    const handleAvatarClick = () => {
        if (!isUploadingAvatar) {
            fileInputRef.current?.click();
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Проверка типа файла
        if (!file.type.startsWith('image/')) {
            showToast('Please Select An Image', 'error');
            return;
        }

        // Проверка размера (максимум 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showToast('File Size Must Not Exceed 5MB', 'error');
            return;
        }

        try {
            setIsUploadingAvatar(true);
            await updateUserAvatar(file);
            // Перезагружаем данные с сервера для получения актуального аватара
            const freshUserData = await getCurrentUser();
            setUser(freshUserData);
            dispatch(updateUserAction(freshUserData));
            setAvatarError(false); // Сбрасываем ошибку после успешного обновления
            showToast('Avatar Updated Successfully', 'success');
        } catch (error) {
            console.error('Error updating avatar:', error);
            showToast(error?.response?.data?.error || 'Error Updating Avatar', 'error');
        } finally {
            setIsUploadingAvatar(false);
            e.target.value = ''; // Сброс input
        }
    };

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const handleDeleteClick = () => {
        setIsConfirmDeleteOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            setIsDeletingUser(true);
            await deleteCurrentUser();
            dispatch(logout());
            showToast('Account deleted successfully', 'success');
            navigate('/login', { replace: true });
        } catch (error) {
            console.error('Error deleting user:', error);
            const errorMessage = error?.response?.data?.error || 
                                error?.response?.data?.message || 
                                'Failed to delete account';
            showToast(errorMessage, 'error');
        } finally {
            setIsDeletingUser(false);
            setIsConfirmDeleteOpen(false);
        }
    };

    const handleCancelDelete = () => {
        setIsConfirmDeleteOpen(false);
    };

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

    if (isLoading) {
        return (
            <div className="profile-page-wrapper">
                <HeaderBar 
                    activeDate={new Date()}
                    onPrevMonth={() => {}}
                    onNextMonth={() => {}}
                    onToday={() => {}}
                    onLogout={handleLogout}
                    isLoading={false}
                />
                <div className="profile-page">
                    <div className="profile-page__loading">Loading...</div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="profile-page-wrapper">
                <HeaderBar 
                    activeDate={new Date()}
                    onPrevMonth={() => {}}
                    onNextMonth={() => {}}
                    onToday={() => {}}
                    onLogout={handleLogout}
                    isLoading={false}
                />
                <div className="profile-page">
                    <div className="profile-page__error">User Not Found</div>
                </div>
            </div>
        );
    }

    const isLoadingForHeader = false; // Для HeaderBar

    return (
        <div className="profile-page-wrapper">
            <HeaderBar 
                activeDate={new Date()}
                onPrevMonth={() => {}}
                onNextMonth={() => {}}
                onToday={() => {}}
                onLogout={handleLogout}
                isLoading={isLoadingForHeader}
            />
            
            <div className="profile-page">
                <div className="profile-page__container">
                    <div className="profile-page__header">
                        <h1 className="profile-page__title">User Profile</h1>
                    </div>

                    <div className="profile-page__content">
                        {/* Аватар */}
                        <div className="profile-page__avatar-section">
                            <div 
                                className={`profile-page__avatar-wrapper ${isUploadingAvatar ? 'profile-page__avatar-wrapper--loading' : ''}`}
                                onClick={handleAvatarClick}
                            >
                                {(() => {
                                    const hasAvatar = !avatarError &&
                                                      user.avatar && 
                                                      typeof user.avatar === 'string' && 
                                                      user.avatar.trim() !== '' && 
                                                      user.avatar !== 'null' && 
                                                      user.avatar !== 'undefined' &&
                                                      !user.avatar.toLowerCase().includes('null');
                                    
                                    if (hasAvatar) {
                                        return (
                                            <>
                                                <img 
                                                    key={user.avatar} // Добавляем key для перезагрузки при изменении
                                                    src={user.avatar} 
                                                    alt={user.name || user.email}
                                                    className="profile-page__avatar"
                                                    onError={(e) => {
                                                        // Если изображение не загрузилось, показываем инициалы
                                                        console.error('Failed to load avatar image:', user.avatar);
                                                        setAvatarError(true);
                                                        e.target.style.display = 'none';
                                                    }}
                                                    onLoad={() => {
                                                        // Успешно загружено, сбрасываем ошибку
                                                        setAvatarError(false);
                                                    }}
                                                />
                                                {avatarError && (
                                                    <div className="profile-page__avatar-placeholder">
                                                        {getInitials(user.name, user.email)}
                                                    </div>
                                                )}
                                            </>
                                        );
                                    }
                                    return (
                                        <div className="profile-page__avatar-placeholder">
                                            {getInitials(user.name, user.email)}
                                        </div>
                                    );
                                })()}
                                <div className="profile-page__avatar-overlay">
                                    {isUploadingAvatar ? (
                                        <div className="profile-page__avatar-loading">
                                            <div className="profile-page__avatar-spinner"></div>
                                            <span>Loading...</span>
                                        </div>
                                    ) : (
                                        <div className="profile-page__avatar-upload-btn">
                                            Change
                                        </div>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    disabled={isUploadingAvatar}
                                    style={{ display: 'none' }}
                                />
                            </div>
                        </div>

                        {/* Информация о пользователе */}
                        <div className="profile-page__info">
                            <div className="profile-page__info-row">
                                <label className="profile-page__label">Email</label>
                                <div className="profile-page__value profile-page__value--readonly">
                                    {user.email}
                                </div>
                            </div>

                            <div className="profile-page__info-row">
                                <label className="profile-page__label">Name</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="name"
                                        className="profile-page__input"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Enter Name"
                                    />
                                ) : (
                                    <div className="profile-page__value">
                                        {user.name || 'Not Specified'}
                                    </div>
                                )}
                            </div>

                            <div className="profile-page__info-row">
                                <label className="profile-page__label">Country</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="country"
                                        className="profile-page__input"
                                        value={formData.country}
                                        onChange={handleChange}
                                        placeholder="Country Code (e.g., US, UA)"
                                        maxLength={2}
                                        style={{ textTransform: 'uppercase' }}
                                    />
                                ) : (
                                    <div className="profile-page__value">
                                        {user.country || 'Not Specified'}
                                    </div>
                                )}
                            </div>

                            {/* Кнопки действий */}
                            <div className="profile-page__actions">
                                {isEditing ? (
                                    <>
                                        <button
                                            className="profile-page__btn profile-page__btn--save"
                                            onClick={handleSave}
                                            disabled={isSaving}
                                        >
                                            {isSaving ? 'Saving...' : 'Save'}
                                        </button>
                                        <button
                                            className="profile-page__btn profile-page__btn--cancel"
                                            onClick={handleCancel}
                                            disabled={isSaving}
                                        >
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            className="profile-page__btn profile-page__btn--edit"
                                            onClick={() => setIsEditing(true)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="profile-page__btn profile-page__btn--danger"
                                            onClick={handleDeleteClick}
                                            disabled={isDeletingUser}
                                        >
                                            Delete user
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Модальное окно подтверждения удаления */}
            {isConfirmDeleteOpen && (
                <div className="profile-page__modal-backdrop">
                    <div className="profile-page__modal">
                        <h2 className="profile-page__modal-title">Delete account</h2>
                        <p className="profile-page__modal-text">
                            Are you sure you want to delete your account? This action cannot be undone.
                        </p>
                        <div className="profile-page__modal-actions">
                            <button
                                className="profile-page__btn profile-page__btn--cancel"
                                onClick={handleCancelDelete}
                                disabled={isDeletingUser}
                            >
                                Cancel
                            </button>
                            <button
                                className="profile-page__btn profile-page__btn--danger"
                                onClick={handleConfirmDelete}
                                disabled={isDeletingUser}
                            >
                                {isDeletingUser ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast уведомления */}
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={hideToast}
            />
        </div>
    );
}

