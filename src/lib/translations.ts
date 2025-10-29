export type TranslationKey = 
  // Общие
  | 'common.home'
  | 'common.library'
  | 'common.playlists'
  | 'common.analytics'
  | 'common.profile'
  | 'common.settings'
  | 'common.logout'
  | 'common.search'
  | 'common.loading'
  | 'common.save'
  | 'common.cancel'
  | 'common.delete'
  | 'common.edit'
  | 'common.add'
  | 'common.create'
  | 'common.close'
  | 'common.confirm'
  | 'common.yes'
  | 'common.no'
  | 'common.russian'
  | 'common.english'
  | 'common.loggedOut'
  
  // Библиотека
  | 'library.title'
  | 'library.tracks'
  | 'library.artistsAlbums'
  | 'library.albums'
  | 'library.searchPlaceholder'
  | 'library.sortBy'
  | 'library.sortByDate'
  | 'library.sortByTitle'
  | 'library.sortByPlays'
  | 'library.sortByLikes'
  | 'library.sortOrder'
  | 'library.sortAsc'
  | 'library.sortDesc'
  | 'library.empty'
  | 'library.emptySearch'
  | 'library.emptyMessage'
  | 'library.uploadFirst'
  | 'library.plays'
  | 'library.duration'
  | 'library.removeTrack'
  | 'library.confirmRemove'
  
  // Плейлисты
  | 'playlists.title'
  | 'playlists.create'
  | 'playlists.createNew'
  | 'playlists.name'
  | 'playlists.description'
  | 'playlists.public'
  | 'playlists.empty'
  | 'playlists.tracks'
  | 'playlists.addSong'
  | 'playlists.confirmRemove'
  | 'playlists.remove'
  
  // Аналитика
  | 'analytics.title'
  | 'analytics.subtitle'
  | 'analytics.totalListens'
  | 'analytics.listeningTime'
  | 'analytics.tracksListened'
  | 'analytics.avgDuration'
  | 'analytics.exportCSV'
  | 'analytics.exportPDF'
  
  // Профиль
  | 'profile.title'
  | 'profile.edit'
  | 'profile.allSettings'
  | 'profile.username'
  | 'profile.firstName'
  | 'profile.lastName'
  | 'profile.bio'
  | 'profile.avatar'
  | 'profile.myTracks'
  | 'profile.myPlaylists'
  | 'profile.favorites'
  | 'profile.registration'
  | 'profile.lastLogin'
  
  // Настройки
  | 'settings.title'
  | 'settings.subtitle'
  | 'settings.profile'
  | 'settings.password'
  | 'settings.favorites'
  | 'settings.appearance'
  | 'settings.currentPassword'
  | 'settings.newPassword'
  | 'settings.confirmPassword'
  | 'settings.changePassword'
  | 'settings.passwordHidden'
  | 'settings.forgotPassword'
  | 'settings.resetPassword'
  | 'settings.language'
  | 'settings.theme'
  | 'settings.dark'
  | 'settings.light'
  | 'settings.favoriteTracks'
  | 'settings.favoriteAlbums'
  | 'settings.favoritePlaylists'
  
  // Главная
  | 'index.hero.title'
  | 'index.hero.subtitle'
  | 'index.startListening'
  | 'index.uploadTracks'
  | 'index.totalTracks'
  | 'index.totalPlaylists'
  | 'index.weeklyListens'
  | 'index.quickActions'
  | 'index.library'
  | 'index.allTracks'
  | 'index.playlists'
  | 'index.createPlaylist'
  | 'index.uploadMusic'
  | 'index.profile'
  | 'index.addMusic'
  | 'index.startingPlayback'
  | 'index.noTracks'
  | 'index.errorLoading'
  
  // Аутентификация
  | 'auth.login'
  | 'auth.register'
  | 'auth.email'
  | 'auth.password'
  | 'auth.username'
  | 'auth.firstName'
  | 'auth.lastName'
  | 'auth.confirmPassword'
  | 'auth.forgotPassword'
  | 'auth.alreadyHaveAccount'
  | 'auth.noAccount'
  | 'auth.invalidCredentials'
  | 'auth.registrationSuccess'
  | 'auth.confirmEmail'
  
  // Альбомы и артисты
  | 'albums.title'
  | 'albums.addArtist'
  | 'albums.addAlbum'
  | 'albums.edit'
  | 'albums.confirmRemove'
  | 'albums.remove'
  | 'albums.searchArtists'
  | 'albums.searchAlbums'
  | 'albums.empty'
  | 'albums.addFirst'
  
  // Загрузка треков
  | 'upload.title'
  | 'upload.selectTrack'
  | 'upload.trackTitle'
  | 'upload.selectAlbum'
  | 'upload.selectGenre'
  | 'upload.upload'
  | 'upload.uploading'
  | 'upload.success'
  | 'upload.createAlbumFirst';

export interface Translations {
  ru: Record<TranslationKey, string>;
  en: Record<TranslationKey, string>;
}

export const translations: Translations = {
  ru: {
    // Общие
    'common.home': 'Главная',
    'common.library': 'Библиотека',
    'common.playlists': 'Плейлисты',
    'common.analytics': 'Аналитика',
    'common.profile': 'Профиль',
    'common.settings': 'Настройки',
    'common.logout': 'Выход',
    'common.search': 'Поиск',
    'common.loading': 'Загрузка...',
    'common.save': 'Сохранить',
    'common.cancel': 'Отмена',
    'common.delete': 'Удалить',
    'common.edit': 'Редактировать',
    'common.add': 'Добавить',
    'common.create': 'Создать',
    'common.close': 'Закрыть',
    'common.confirm': 'Подтвердить',
    'common.yes': 'Да',
    'common.no': 'Нет',
    'common.russian': 'Русский',
    'common.english': 'English',
    'common.loggedOut': 'Вы вышли из системы',
    
    // Библиотека
    'library.title': 'Библиотека',
    'library.tracks': 'Треки',
    'library.artistsAlbums': 'Артисты и альбомы',
    'library.albums': 'Альбомы',
    'library.searchPlaceholder': 'Поиск по названию или исполнителю...',
    'library.sortBy': 'Сортировать по',
    'library.sortByDate': 'Дате добавления',
    'library.sortByTitle': 'Названию',
    'library.sortByPlays': 'Прослушиваниям',
    'library.sortByLikes': 'Лайкам',
    'library.sortOrder': 'Порядок',
    'library.sortAsc': 'По возрастанию',
    'library.sortDesc': 'По убыванию',
    'library.empty': 'Библиотека пуста',
    'library.emptySearch': 'Треки не найдены',
    'library.emptyMessage': 'Попробуйте изменить запрос',
    'library.uploadFirst': 'Загрузите свои первые треки',
    'library.plays': 'прослушиваний',
    'library.duration': 'Длительность',
    'library.removeTrack': 'Удалить трек',
    'library.confirmRemove': 'Вы уверены, что хотите удалить этот трек?',
    'library.trackAdded': 'Трек добавлен в избранное',
    'library.trackRemoved': 'Трек удалён из избранного',
    
    // Плейлисты
    'playlists.title': 'Плейлисты',
    'playlists.create': 'Создать плейлист',
    'playlists.createNew': 'Создать новый плейлист',
    'playlists.name': 'Название',
    'playlists.description': 'Описание',
    'playlists.public': 'Публичный плейлист',
    'playlists.empty': 'Нет плейлистов',
    'playlists.tracks': 'треков',
    'playlists.addSong': 'Добавить трек',
    'playlists.confirmRemove': 'Вы уверены, что хотите удалить этот плейлист?',
    'playlists.remove': 'Удалить плейлист',
    
    // Аналитика
    'analytics.title': 'Аналитика',
    'analytics.subtitle': 'Статистика ваших прослушиваний',
    'analytics.totalListens': 'Всего прослушиваний',
    'analytics.listeningTime': 'Время прослушивания',
    'analytics.tracksListened': 'Прослушано треков',
    'analytics.avgDuration': 'Средняя длительность трека',
    'analytics.exportCSV': 'Экспорт CSV',
    'analytics.exportPDF': 'Экспорт PDF',
    
    // Профиль
    'profile.title': 'Профиль',
    'profile.edit': 'Редактировать профиль',
    'profile.allSettings': 'Все настройки',
    'profile.username': 'Имя пользователя',
    'profile.firstName': 'Имя',
    'profile.lastName': 'Фамилия',
    'profile.bio': 'О себе',
    'profile.avatar': 'Аватар',
    'profile.myTracks': 'Мои треки',
    'profile.myPlaylists': 'Мои плейлисты',
    'profile.favorites': 'В избранном',
    'profile.registration': 'Регистрация',
    'profile.lastLogin': 'Последний вход',
    
    // Настройки
    'settings.title': 'Настройки',
    'settings.subtitle': 'Управление вашим профилем и предпочтениями',
    'settings.profile': 'Профиль',
    'settings.password': 'Безопасность',
    'settings.favorites': 'Избранное',
    'settings.appearance': 'Внешний вид',
    'settings.currentPassword': 'Текущий пароль',
    'settings.newPassword': 'Новый пароль',
    'settings.confirmPassword': 'Подтвердите новый пароль',
    'settings.changePassword': 'Изменить пароль',
    'settings.passwordHidden': 'Пароль скрыт по соображениям безопасности',
    'settings.forgotPassword': 'Забыли пароль?',
    'settings.resetPassword': 'Отправить ссылку для восстановления пароля',
    'settings.language': 'Язык интерфейса',
    'settings.theme': 'Тема',
    'settings.dark': 'Тёмная',
    'settings.light': 'Светлая',
    'settings.favoriteTracks': 'Избранные треки',
    'settings.favoriteAlbums': 'Избранные альбомы',
    'settings.favoritePlaylists': 'Избранные плейлисты',
    
    // Главная
    'index.hero.title': 'Ваша музыка. Всегда с вами.',
    'index.hero.subtitle': 'Загружайте треки, создавайте плейлисты, анализируйте статистику прослушиваний. Полнофункциональный музыкальный плеер с защищённой базой данных.',
    'index.startListening': 'Начать слушать',
    'index.uploadTracks': 'Загрузить треки',
    'index.totalTracks': 'Всего треков',
    'index.totalPlaylists': 'Плейлистов',
    'index.weeklyListens': 'Прослушиваний за неделю',
    'index.quickActions': 'Быстрые действия',
    'index.library': 'Библиотека',
    'index.allTracks': 'Все треки',
    'index.playlists': 'Плейлисты',
    'index.createPlaylist': 'Создайте подборку',
    'index.uploadMusic': 'Загрузить треки',
    'index.profile': 'Профиль',
    'index.settings': 'Настройки и данные',
    'index.addMusic': 'Добавить музыку',
    'index.startingPlayback': 'Начинаем прослушивание {count} треков',
    'index.noTracks': 'Нет доступных треков для прослушивания',
    'index.errorLoading': 'Ошибка загрузки треков',
    
    // Аутентификация
    'auth.login': 'Войти',
    'auth.register': 'Зарегистрироваться',
    'auth.email': 'Email',
    'auth.password': 'Пароль',
    'auth.username': 'Имя пользователя',
    'auth.firstName': 'Имя',
    'auth.lastName': 'Фамилия',
    'auth.confirmPassword': 'Подтвердите пароль',
    'auth.forgotPassword': 'Забыли пароль?',
    'auth.alreadyHaveAccount': 'Уже есть аккаунт?',
    'auth.noAccount': 'Нет аккаунта?',
    'auth.invalidCredentials': 'Неверные данные для входа',
    'auth.registrationSuccess': 'Регистрация успешна! Проверьте email для подтверждения.',
    'auth.confirmEmail': 'Пожалуйста, подтвердите email для входа. После подтверждения вы сможете войти.',
    
    // Альбомы и артисты
    'albums.title': 'Артисты и альбомы',
    'albums.addArtist': 'Добавить артиста',
    'albums.addAlbum': 'Добавить альбом',
    'albums.edit': 'Редактировать',
    'albums.confirmRemove': 'Вы уверены, что хотите удалить этот альбом? Все треки в альбоме также будут удалены.',
    'albums.remove': 'Удалить',
    'albums.searchArtists': 'Поиск артистов...',
    'albums.searchAlbums': 'Поиск альбомов...',
    'albums.empty': 'Нет артистов',
    'albums.addFirst': 'Добавьте первого артиста',
    
    // Загрузка треков
    'upload.title': 'Загрузить трек',
    'upload.selectTrack': 'Выбрать аудио файл',
    'upload.trackTitle': 'Название трека',
    'upload.selectAlbum': 'Выберите альбом',
    'upload.selectGenre': 'Выберите жанр',
    'upload.upload': 'Загрузить',
    'upload.uploading': 'Загрузка...',
    'upload.success': 'Трек загружен успешно',
    'upload.createAlbumFirst': 'Перед загрузкой трека сначала создайте альбом в разделе "Артисты и альбомы" библиотеки',
  },
  en: {
    // Common
    'common.home': 'Home',
    'common.library': 'Library',
    'common.playlists': 'Playlists',
    'common.analytics': 'Analytics',
    'common.profile': 'Profile',
    'common.settings': 'Settings',
    'common.logout': 'Logout',
    'common.search': 'Search',
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.create': 'Create',
    'common.close': 'Close',
    'common.confirm': 'Confirm',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.russian': 'Русский',
    'common.english': 'English',
    'common.loggedOut': 'You have logged out',
    
    // Library
    'library.title': 'Library',
    'library.tracks': 'Tracks',
    'library.artistsAlbums': 'Artists & Albums',
    'library.albums': 'Albums',
    'library.searchPlaceholder': 'Search by title or artist...',
    'library.sortBy': 'Sort by',
    'library.sortByDate': 'Date added',
    'library.sortByTitle': 'Title',
    'library.sortByPlays': 'Plays',
    'library.sortByLikes': 'Likes',
    'library.sortOrder': 'Order',
    'library.sortAsc': 'Ascending',
    'library.sortDesc': 'Descending',
    'library.empty': 'Library is empty',
    'library.emptySearch': 'No tracks found',
    'library.emptyMessage': 'Try changing the query',
    'library.uploadFirst': 'Upload your first tracks',
    'library.plays': 'plays',
    'library.duration': 'Duration',
    'library.removeTrack': 'Remove track',
    'library.confirmRemove': 'Are you sure you want to delete this track?',
    'library.trackAdded': 'Track added to favorites',
    'library.trackRemoved': 'Track removed from favorites',
    
    // Playlists
    'playlists.title': 'Playlists',
    'playlists.create': 'Create Playlist',
    'playlists.createNew': 'Create new playlist',
    'playlists.name': 'Name',
    'playlists.description': 'Description',
    'playlists.public': 'Public playlist',
    'playlists.empty': 'No playlists',
    'playlists.tracks': 'tracks',
    'playlists.addSong': 'Add track',
    'playlists.confirmRemove': 'Are you sure you want to delete this playlist?',
    'playlists.remove': 'Remove playlist',
    
    // Analytics
    'analytics.title': 'Analytics',
    'analytics.subtitle': 'Your listening statistics',
    'analytics.totalListens': 'Total listens',
    'analytics.listeningTime': 'Listening time',
    'analytics.tracksListened': 'Tracks listened',
    'analytics.avgDuration': 'Average track duration',
    'analytics.exportCSV': 'Export CSV',
    'analytics.exportPDF': 'Export PDF',
    
    // Profile
    'profile.title': 'Profile',
    'profile.edit': 'Edit profile',
    'profile.allSettings': 'All settings',
    'profile.username': 'Username',
    'profile.firstName': 'First name',
    'profile.lastName': 'Last name',
    'profile.bio': 'About',
    'profile.avatar': 'Avatar',
    'profile.myTracks': 'My tracks',
    'profile.myPlaylists': 'My playlists',
    'profile.favorites': 'In favorites',
    'profile.registration': 'Registration',
    'profile.lastLogin': 'Last login',
    
    // Settings
    'settings.title': 'Settings',
    'settings.subtitle': 'Manage your profile and preferences',
    'settings.profile': 'Profile',
    'settings.password': 'Security',
    'settings.favorites': 'Favorites',
    'settings.appearance': 'Appearance',
    'settings.currentPassword': 'Current password',
    'settings.newPassword': 'New password',
    'settings.confirmPassword': 'Confirm new password',
    'settings.changePassword': 'Change password',
    'settings.passwordHidden': 'Password is hidden for security reasons',
    'settings.forgotPassword': 'Forgot password?',
    'settings.resetPassword': 'Send password recovery link',
    'settings.language': 'Interface language',
    'settings.theme': 'Theme',
    'settings.dark': 'Dark',
    'settings.light': 'Light',
    'settings.favoriteTracks': 'Favorite tracks',
    'settings.favoriteAlbums': 'Favorite albums',
    'settings.favoritePlaylists': 'Favorite playlists',
    
    // Index
    'index.hero.title': 'Your music. Always with you.',
    'index.hero.subtitle': 'Upload tracks, create playlists, analyze listening statistics. Full-featured music player with secure database.',
    'index.startListening': 'Start listening',
    'index.uploadTracks': 'Upload tracks',
    'index.totalTracks': 'Total tracks',
    'index.totalPlaylists': 'Playlists',
    'index.weeklyListens': 'Listens this week',
    'index.quickActions': 'Quick actions',
    'index.library': 'Library',
    'index.allTracks': 'All tracks',
    'index.playlists': 'Playlists',
    'index.createPlaylist': 'Create a selection',
    'index.uploadMusic': 'Upload tracks',
    'index.profile': 'Profile',
    'index.settings': 'Settings and data',
    'index.addMusic': 'Add music',
    'index.startingPlayback': 'Starting playback of {count} tracks',
    'index.noTracks': 'No tracks available for listening',
    'index.errorLoading': 'Error loading tracks',
    
    // Auth
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.username': 'Username',
    'auth.firstName': 'First name',
    'auth.lastName': 'Last name',
    'auth.confirmPassword': 'Confirm password',
    'auth.forgotPassword': 'Forgot password?',
    'auth.alreadyHaveAccount': 'Already have an account?',
    'auth.noAccount': "Don't have an account?",
    'auth.invalidCredentials': 'Invalid login credentials',
    'auth.registrationSuccess': 'Registration successful! Check your email for confirmation.',
    'auth.confirmEmail': 'Please confirm your email to log in. After confirmation, you will be able to log in.',
    
    // Albums and artists
    'albums.title': 'Artists & Albums',
    'albums.addArtist': 'Add artist',
    'albums.addAlbum': 'Add album',
    'albums.edit': 'Edit',
    'albums.confirmRemove': 'Are you sure you want to delete this album? All tracks in the album will also be deleted.',
    'albums.remove': 'Remove',
    'albums.searchArtists': 'Search artists...',
    'albums.searchAlbums': 'Search albums...',
    'albums.empty': 'No artists',
    'albums.addFirst': 'Add first artist',
    
    // Upload
    'upload.title': 'Upload track',
    'upload.selectTrack': 'Select audio file',
    'upload.trackTitle': 'Track title',
    'upload.selectAlbum': 'Select album',
    'upload.selectGenre': 'Select genre',
    'upload.upload': 'Upload',
    'upload.uploading': 'Uploading...',
    'upload.success': 'Track uploaded successfully',
    'upload.createAlbumFirst': 'Before uploading a track, first create an album in the "Artists and Albums" section of the library',
  },
};
