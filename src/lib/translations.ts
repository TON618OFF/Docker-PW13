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
  | 'common.none'
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
  | 'playlists.track'
  | 'playlists.owner'
  | 'playlists.private'
  | 'playlists.addSong'
  | 'playlists.confirmRemove'
  | 'playlists.remove'
  | 'playlists.privacyChanged.public'
  | 'playlists.privacyChanged.private'
  | 'playlists.privacyChangeError'
  
  // Аналитика
  | 'analytics.title'
  | 'analytics.subtitle'
  | 'analytics.totalListens'
  | 'analytics.listeningTime'
  | 'analytics.tracksListened'
  | 'analytics.avgDuration'
  | 'analytics.exportCSV'
  | 'analytics.exportPDF'
  | 'analytics.charts.dailyListens'
  | 'analytics.charts.dailyDuration'
  | 'analytics.charts.topTracks'
  | 'analytics.charts.genres'
  | 'analytics.charts.listens'
  | 'analytics.charts.durationMinutes'
  | 'analytics.charts.noData'
  
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
  | 'profile.listeningHistory'
  | 'profile.listeningHistory.title'
  | 'profile.listeningHistory.empty'
  | 'profile.listeningHistory.emptyMessage'
  | 'profile.listeningHistory.loading'
  | 'profile.listeningHistory.played'
  | 'profile.listeningHistory.completed'
  | 'profile.listeningHistory.notCompleted'
  | 'profile.listeningHistory.duration'
  | 'profile.listeningHistory.error'
  
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
  | 'upload.selectArtist'
  | 'upload.trackTitle'
  | 'upload.selectAlbum'
  | 'upload.selectGenre'
  | 'upload.upload'
  | 'upload.uploading'
  | 'upload.success'
  | 'upload.createAlbumFirst'
  | 'upload.selectFile'
  | 'upload.changeFile'
  | 'upload.dragFile'
  
  // Плейлисты детали
  | 'playlists.detail.title'
  | 'playlists.detail.back'
  | 'playlists.detail.notFound'
  | 'playlists.detail.empty'
  | 'playlists.detail.addTracks'
  | 'playlists.detail.playAll'
  | 'playlists.detail.shuffle'
  | 'playlists.detail.totalPlays'
  | 'playlists.detail.totalDuration'
  | 'playlists.detail.tracksCount'
  | 'playlists.detail.removeTrack'
  | 'playlists.detail.confirmRemove'
  | 'playlists.detail.removeFromPlaylist'
  | 'playlists.detail.errorDeleteTrack'
  
  // Альбомы детали
  | 'albums.detail.back'
  | 'albums.detail.playAll'
  | 'albums.detail.shuffle'
  | 'albums.detail.totalPlays'
  | 'albums.detail.tracksCount'
  
  // Артист детали
  | 'artist.notFound'
  | 'artist.loadError'
  | 'artist.backToLibrary'
  | 'artist.profile'
  | 'artist.tracks'
  | 'artist.albums'
  | 'artist.allAlbums'
  | 'artist.playlists'
  | 'artist.allPlaylists'
  | 'artist.allTracks'
  | 'artist.emptyTracks'
  | 'artist.noTracks'
  | 'artist.noAlbum'
  | 'artist.totalPlays'
  | 'artist.playAll'
  | 'artist.shuffle'
  
  // Общие сообщения
  | 'messages.success'
  | 'messages.error'
  | 'messages.loading'
  | 'messages.noAccess'
  | 'messages.created'
  | 'messages.deleted'
  | 'messages.updated'
  | 'messages.addedToFavorites'
  | 'messages.removedFromFavorites'
  | 'messages.addToFavorites'
  | 'messages.removeFromFavorites'
  
  | 'musicPlayer.shuffleOn'
  | 'musicPlayer.shuffleOff'
  | 'musicPlayer.repeatOff'
  | 'musicPlayer.repeatOne'
  | 'musicPlayer.repeatAll'
  
  // Дополнительные ключи для компонентов
  | 'albums.manager.title'
  | 'albums.manager.empty'
  | 'albums.manager.emptySearch'
  | 'albums.manager.emptyMessage'
  | 'albums.manager.searchPlaceholder'
  | 'albums.manager.unknownArtist'
  | 'albums.manager.tracksLabel'
  | 'albums.manager.durationLabel'
  | 'albums.manager.releaseLabel'
  | 'albums.manager.notSpecified'
  | 'albums.manager.deleteConfirm'
  | 'albums.manager.deleteSuccess'
  | 'albums.manager.deleteError'
  | 'albums.manager.favoriteAdded'
  | 'albums.manager.favoriteRemoved'
  
  | 'artists.manager.title'
  | 'artists.manager.empty'
  | 'artists.manager.emptySearch'
  | 'artists.manager.emptyMessage'
  | 'artists.manager.searchPlaceholder'
  | 'artists.manager.infoMessage'
  | 'artists.manager.deleteConfirm'
  | 'artists.manager.deleteSuccess'
  
  | 'upload.error.required'
  | 'upload.error.loginRequired'
  | 'upload.error.fileFormat'
  | 'upload.error.fileSize'
  | 'upload.error.userProfile'
  | 'upload.placeholder.trackTitle'
  | 'upload.placeholder.selectArtist'
  | 'upload.placeholder.selectAlbum'
  | 'upload.placeholder.selectGenre'
  
  | 'album.create.title'
  | 'album.create.artistLabel'
  | 'album.create.nameLabel'
  | 'album.create.namePlaceholder'
  | 'album.create.releaseLabel'
  | 'album.create.descriptionLabel'
  | 'album.create.descriptionPlaceholder'
  | 'album.create.success'
  | 'album.create.error'
  | 'album.create.loginRequired'
  | 'album.create.fillAll'
  | 'album.create.noArtists'
  | 'album.create.selectArtist'
  
  | 'artist.create.title'
  | 'artist.create.nameLabel'
  | 'artist.create.namePlaceholder'
  | 'artist.create.bioLabel'
  | 'artist.create.bioPlaceholder'
  | 'artist.create.genreLabel'
  | 'artist.create.success'
  | 'artist.create.error'
  | 'artist.create.enterName'
  | 'artist.create.selectGenre'
  
  | 'artist.edit.title'
  | 'artist.edit.save'
  | 'artist.edit.success'
  | 'artist.edit.error'
  
  | 'album.edit.title'
  | 'album.edit.save'
  | 'album.edit.success'
  | 'album.edit.error'
  
  | 'playlist.create.error'
  | 'playlist.create.nameRequired'
  | 'playlist.create.nameLength'
  | 'playlist.create.loginRequired'
  
  | 'image.upload.label'
  | 'image.upload.selectImage'
  | 'image.upload.replace'
  | 'image.upload.selectFile'
  | 'image.upload.maxSize'
  | 'image.upload.success'
  | 'image.upload.error'
  | 'image.upload.loginRequired'
  | 'image.upload.bucketNotFound'
  | 'image.upload.noPermission'
  
  | 'addSong.title'
  | 'addSong.selectTrack'
  | 'addSong.searchPlaceholder'
  | 'addSong.empty'
  | 'addSong.emptySearch'
  | 'addSong.selectTrackPlaceholder'
  | 'addSong.adding'
  | 'addSong.add'
  | 'addSong.error.selectTrack'
  | 'addSong.error.loginRequired'
  | 'addSong.error.alreadyAdded'
  | 'addSong.success'
  | 'addSong.unknownArtist'
  
  | 'applications.title'
  | 'applications.searchPlaceholder'
  | 'applications.empty'
  | 'applications.emptyFiltered'
  | 'applications.status.pending'
  | 'applications.status.approved'
  | 'applications.status.rejected'
  | 'applications.approve'
  | 'applications.reject'
  | 'applications.rejectComment'
  | 'applications.rejectCommentPlaceholder'
  | 'applications.approveSuccess'
  | 'applications.approveError'
  | 'applications.rejectSuccess'
  | 'applications.rejectError'
  | 'applications.loadError'
  | 'applications.filter.all'
  | 'applications.filter.pending'
  | 'applications.filter.approved'
  | 'applications.filter.rejected'
  | 'applications.submitted'
  | 'applications.biography'
  | 'applications.genre'
  | 'applications.motivation'
  | 'applications.links'
  | 'applications.portfolio'
  | 'applications.rejectionComment'
  
  | 'becomeArtist.title'
  | 'becomeArtist.nameLabel'
  | 'becomeArtist.namePlaceholder'
  | 'becomeArtist.bioLabel'
  | 'becomeArtist.bioPlaceholder'
  | 'becomeArtist.genreLabel'
  | 'becomeArtist.portfolioLabel'
  | 'becomeArtist.socialLabel'
  | 'becomeArtist.motivationLabel'
  | 'becomeArtist.motivationPlaceholder'
  | 'becomeArtist.submit'
  | 'becomeArtist.submitting'
  | 'becomeArtist.success'
  | 'becomeArtist.error.enterName'
  | 'becomeArtist.error.pending'
  | 'becomeArtist.error.approved'
  | 'becomeArtist.error.loginRequired'
  | 'becomeArtist.alreadyRole'
  
  | 'layout.adminPanel'
  | 'layout.applications'
  
  | 'profile.usernameMinLength'
  | 'profile.saveSuccess'
  | 'profile.save'
  | 'profile.saving'
  | 'profile.user'
  | 'profile.firstNamePlaceholder'
  | 'profile.lastNamePlaceholder'
  | 'profile.bioPlaceholder'
  
  | 'settings.usernameMinLength'
  | 'settings.passwordMinLength'
  | 'settings.passwordMismatch'
  | 'settings.passwordChangeSuccess'
  | 'settings.resetPasswordSuccess'
  | 'settings.saveSuccess'
  | 'settings.save'
  | 'settings.saving'
  | 'settings.changePasswordButton'
  | 'settings.changingPassword'
  | 'settings.firstNamePlaceholder'
  | 'settings.lastNamePlaceholder'
  | 'settings.bioPlaceholder'
  | 'settings.newPasswordPlaceholder'
  | 'settings.confirmPasswordPlaceholder'
  
  | 'library.deleteSuccess'
  | 'library.deleteError'
  | 'library.loadError'
  | 'library.errorDeleteTrack'
  | 'library.errorLoad'
  
  | 'albumDetail.notFound'
  | 'albumDetail.loadError'
  | 'albumDetail.noTracks'
  | 'albumDetail.tracksTitle'
  | 'albumDetail.emptyMessage'
  | 'albumDetail.backToLibrary'
  | 'albumDetail.playAll'
  | 'albumDetail.shuffle'
  
  | 'playlistDetail.loadError'
  | 'playlistDetail.noAccess'
  
  | 'playlists.loadError'
  | 'playlists.track'
  | 'playlists.playlistAdded'
  | 'playlists.playlistRemoved'
  
  | 'analytics.loadError'
  | 'analytics.csvExportSuccess'
  | 'analytics.pdfExportSuccess'
  | 'analytics.csvHeaders.date'
  | 'analytics.csvHeaders.track'
  | 'analytics.csvHeaders.artist'
  | 'analytics.csvHeaders.album'
  | 'analytics.csvHeaders.duration'
  | 'analytics.csvHeaders.played'
  | 'analytics.csvHeaders.completed'
  | 'analytics.csvHeaders.rank'
  | 'analytics.csvHeaders.genre'
  | 'analytics.charts.duration'
  | 'analytics.charts.count'
  | 'analytics.unknown'
  | 'analytics.exporting'
  | 'analytics.reportTitle'
  | 'analytics.generatedOn'
  | 'analytics.statistics'
  | 'analytics.listeningHistory'
  | 'analytics.stats.totalListens'
  | 'analytics.stats.totalDuration'
  | 'analytics.stats.totalTracks'
  | 'analytics.stats.avgDuration'
  | 'analytics.errorExport'
  
  | 'auth.welcome'
  | 'auth.usernameLength'
  | 'auth.usernameTaken'
  | 'auth.createUserError'
  | 'auth.loginTitle'
  | 'auth.registerTitle'
  | 'auth.firstNamePlaceholder'
  | 'auth.lastNamePlaceholder'
  | 'auth.switchToRegister'
  | 'auth.switchToLogin'
  
  | 'admin.loadError'
  | 'admin.roleNotFound'
  | 'admin.roleUpdateSuccess'
  | 'admin.roleUpdateError'
  | 'admin.deleteConfirm'
  | 'admin.deleteSuccess'
  | 'admin.deleteError'
  | 'admin.searchPlaceholder'
  | 'admin.role.listener'
  | 'admin.role.distributor'
  | 'admin.role.admin'
  | 'admin.role.artist'
  | 'admin.role.moderator'
  | 'admin.title'
  | 'admin.subtitle'
  | 'admin.stats.users'
  | 'admin.stats.tracks'
  | 'admin.stats.playlists'
  | 'admin.stats.artists'
  | 'admin.stats.albums'
  | 'admin.userManagement'
  | 'admin.registration'
  | 'admin.unknownError'
  | 'admin.dbStatus.title'
  | 'admin.dbStatus.update'
  | 'admin.dbStatus.checking'
  | 'admin.dbStatus.checkingConnection'
  | 'admin.dbStatus.connected'
  | 'admin.dbStatus.notConnected'
  | 'admin.dbStatus.active'
  | 'admin.dbStatus.error'
  | 'admin.dbStatus.errorTitle'
  | 'admin.dbStatus.errorMessage'
  | 'admin.dbStatus.stats.users'
  | 'admin.dbStatus.stats.tracks'
  | 'admin.dbStatus.stats.playlists'
  | 'admin.dbStatus.stats.listenHistory'
  | 'admin.dbStatus.setup.title'
  | 'admin.dbStatus.setup.step1'
  | 'admin.dbStatus.setup.step2'
  | 'admin.dbStatus.setup.step3'
  | 'admin.dbStatus.setup.step4'
  | 'admin.dbStatus.setup.step5'
  | 'admin.dbStatus.setup.step6'
  | 'admin.storage.title'
  | 'admin.storage.check'
  | 'admin.storage.checking'
  | 'admin.storage.initialize'
  | 'admin.storage.initializing'
  | 'admin.storage.bucket.songs'
  | 'admin.storage.bucket.covers'
  | 'admin.storage.status.checking'
  | 'admin.storage.status.created'
  | 'admin.storage.status.missing'
  | 'admin.storage.warning.title'
  | 'admin.storage.warning.message'
  | 'admin.storage.success.title'
  | 'admin.storage.success.message'
  | 'admin.storage.info.title'
  | 'admin.storage.info.step1'
  | 'admin.storage.info.step2'
  | 'admin.storage.info.step3'
  | 'admin.storage.success.toast'
  | 'admin.storage.error.toast'
  | 'admin.dbViewer.title'
  | 'admin.dbViewer.searchPlaceholder'
  | 'admin.dbViewer.table'
  | 'admin.dbViewer.totalRecords'
  | 'admin.dbViewer.shown'
  | 'admin.dbViewer.loading'
  | 'admin.dbViewer.noData'
  | 'admin.dbViewer.noResults'
  | 'admin.dbViewer.error'
  | 'admin.dbViewer.tables.tracks'
  | 'admin.dbViewer.tables.playlists'
  | 'admin.dbViewer.tables.users'
  | 'admin.dbViewer.tables.listeningHistory'
  | 'admin.dbViewer.tables.playlistTracks'
  | 'admin.dbViewer.tables.artists'
  | 'admin.dbViewer.tables.albums'
  | 'admin.dbViewer.tables.roles'
  
  | 'common.track'
  | 'common.upload'
  | 'common.replace'
  | 'common.selectFile'
  | 'common.back'
  | 'common.required';

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
    'common.none': 'Не выбран',
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
    'playlists.track': 'трек',
    'playlists.owner': 'Владелец',
    'playlists.private': 'Приватный',
    'playlists.addSong': 'Добавить трек',
    'playlists.privacyChanged.public': 'Плейлист стал публичным',
    'playlists.privacyChanged.private': 'Плейлист стал приватным',
    'playlists.privacyChangeError': 'Ошибка изменения приватности: {message}',
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
    'profile.listeningHistory': 'История прослушиваний',
    'profile.listeningHistory.title': 'История прослушиваний',
    'profile.listeningHistory.empty': 'История пуста',
    'profile.listeningHistory.emptyMessage': 'Вы еще не прослушали ни одного трека',
    'profile.listeningHistory.loading': 'Загрузка истории...',
    'profile.listeningHistory.played': 'Прослушано',
    'profile.listeningHistory.completed': 'Прослушано полностью',
    'profile.listeningHistory.notCompleted': 'Не завершено',
    'profile.listeningHistory.duration': 'Длительность',
    'profile.listeningHistory.error': 'Ошибка загрузки истории',
    
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
    'settings.emailCannotChange': 'Email нельзя изменить',
    
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
    'upload.selectArtist': 'Исполнитель',
    'upload.trackTitle': 'Название трека',
    'upload.selectAlbum': 'Выберите альбом',
    'upload.selectGenre': 'Выберите жанр',
    'upload.upload': 'Загрузить',
    'upload.uploading': 'Загрузка...',
    'upload.success': 'Трек загружен успешно',
    'upload.createAlbumFirst': 'Перед загрузкой трека сначала создайте альбом в разделе "Артисты и альбомы" библиотеки',
    'upload.selectFile': 'Выбрать файл',
    'upload.changeFile': 'Выбрать другой файл',
    'upload.dragFile': 'Перетащите файл или нажмите для выбора',
    
    // Плейлисты детали
    'playlists.detail.title': 'Плейлист',
    'playlists.detail.back': 'Назад',
    'playlists.detail.notFound': 'Плейлист не найден',
    'playlists.detail.empty': 'Плейлист пуст',
    'playlists.detail.addTracks': 'Добавьте треки в этот плейлист',
    'playlists.detail.playAll': 'Играть все',
    'playlists.detail.shuffle': 'Перемешать',
    'playlists.detail.totalPlays': 'прослушиваний',
    'playlists.detail.totalDuration': 'минут',
    'playlists.detail.tracksCount': 'треков',
    'playlists.detail.removeTrack': 'Удалить трек',
    'playlists.detail.confirmRemove': 'Удалить трек из плейлиста?',
    'playlists.detail.removeFromPlaylist': 'Трек удален из плейлиста',
    'playlists.detail.errorDeleteTrack': 'Ошибка удаления трека: {message}',
    
    // Альбомы детали
    'albums.detail.back': 'Назад',
    'albums.detail.playAll': 'Играть все',
    'albums.detail.shuffle': 'Перемешать',
    'albums.detail.totalPlays': 'прослушиваний',
    'albums.detail.tracksCount': 'треков',
    
    // Артист детали
    'artist.notFound': 'Артист не найден',
    'artist.loadError': 'Ошибка загрузки артиста',
    'artist.backToLibrary': 'Назад к библиотеке',
    'artist.profile': 'Профиль',
    'artist.tracks': 'треков',
    'artist.albums': 'альбомов',
    'artist.allAlbums': 'Все альбомы',
    'artist.playlists': 'Плейлисты',
    'artist.allPlaylists': 'Все плейлисты',
    'artist.allTracks': 'Все треки',
    'artist.emptyTracks': 'У артиста пока нет треков',
    'artist.noTracks': 'Нет треков для воспроизведения',
    'artist.noAlbum': 'Без альбома',
    'artist.totalPlays': 'прослушиваний',
    'artist.playAll': 'Слушать все',
    'artist.shuffle': 'Перемешать',
    
    // Общие сообщения
    'messages.success': 'Операция выполнена успешно',
    'messages.error': 'Произошла ошибка',
    'messages.loading': 'Загрузка...',
    'messages.noAccess': 'У вас нет доступа',
    'messages.created': 'Создано успешно',
    'messages.deleted': 'Удалено успешно',
    'messages.updated': 'Обновлено успешно',
    'messages.addedToFavorites': 'Добавлено в избранное',
    'messages.removedFromFavorites': 'Удалено из избранного',
    'messages.addToFavorites': 'Добавить в избранное',
    'messages.removeFromFavorites': 'Удалить из избранного',
    
    // Альбомы менеджер
    'albums.manager.title': 'Альбомы',
    'albums.manager.empty': 'Нет альбомов',
    'albums.manager.emptySearch': 'Альбомы не найдены',
    'albums.manager.emptyMessage': 'Загрузите треки с указанием альбома',
    'albums.manager.searchPlaceholder': 'Поиск по названию альбома или исполнителю...',
    'albums.manager.unknownArtist': 'Неизвестный артист',
    'albums.manager.tracksLabel': 'Треков:',
    'albums.manager.durationLabel': 'Длительность:',
    'albums.manager.releaseLabel': 'Выпущен:',
    'albums.manager.notSpecified': 'Не указано',
    'albums.manager.deleteConfirm': 'Вы уверены, что хотите удалить этот альбом? Все треки в альбоме также будут удалены.',
    'albums.manager.deleteSuccess': 'Альбом удалён',
    'albums.manager.deleteError': 'Ошибка удаления альбома',
    'albums.manager.favoriteAdded': 'Альбом добавлен в избранное',
    'albums.manager.favoriteRemoved': 'Альбом удалён из избранного',
    
    // Артисты менеджер
    'artists.manager.title': 'Артисты',
    'artists.manager.empty': 'Нет артистов',
    'artists.manager.emptySearch': 'Артисты не найдены',
    'artists.manager.emptyMessage': 'Добавьте первого артиста',
    'artists.manager.searchPlaceholder': 'Поиск артистов...',
    'artists.manager.infoMessage': 'Артисты создаются автоматически при одобрении анкет дистрибьюторами',
    'artists.manager.deleteConfirm': 'Вы уверены, что хотите удалить этого артиста? Все альбомы и треки этого артиста также будут удалены.',
    'artists.manager.deleteSuccess': 'Артист удалён',
    
    // Загрузка ошибки
    'upload.error.required': 'Заполните все обязательные поля',
    'upload.error.loginRequired': 'Необходимо войти в систему',
    'upload.error.fileFormat': 'Неподдерживаемый формат файла',
    'upload.error.fileSize': 'Файл слишком большой (максимум 50MB)',
    'upload.error.userProfile': 'Ошибка создания профиля пользователя',
    'upload.placeholder.trackTitle': 'Название трека',
    'upload.placeholder.selectArtist': 'Выберите исполнителя',
    'upload.placeholder.selectAlbum': 'Выберите альбом',
    'upload.placeholder.selectGenre': 'Выберите жанр (необязательно)',
    
    // Создание альбома
    'album.create.title': 'Создать альбом',
    'album.create.artistLabel': 'Артист *',
    'album.create.nameLabel': 'Название альбома *',
    'album.create.namePlaceholder': 'Название альбома',
    'album.create.releaseLabel': 'Дата выпуска *',
    'album.create.descriptionLabel': 'Описание',
    'album.create.descriptionPlaceholder': 'Описание альбома',
    'album.create.success': 'Альбом создан!',
    'album.create.error': 'Ошибка создания альбома',
    'album.create.loginRequired': 'Необходимо войти в систему',
    'album.create.fillAll': 'Заполните все обязательные поля',
    'album.create.noArtists': 'Нет доступных артистов',
    'album.create.selectArtist': 'Выберите артиста',
    
    // Создание артиста
    'artist.create.title': 'Создать артиста',
    'artist.create.nameLabel': 'Имя исполнителя *',
    'artist.create.namePlaceholder': 'Имя исполнителя',
    'artist.create.bioLabel': 'Биография',
    'artist.create.bioPlaceholder': 'Краткая биография артиста',
    'artist.create.genreLabel': 'Жанр',
    'artist.create.success': 'Артист создан!',
    'artist.create.error': 'Ошибка создания артиста',
    'artist.create.enterName': 'Введите имя артиста',
    'artist.create.selectGenre': 'Выберите жанр (необязательно)',
    
    // Редактирование артиста
    'artist.edit.title': 'Редактировать артиста',
    'artist.edit.save': 'Сохранить',
    'artist.edit.success': 'Артист обновлен!',
    'artist.edit.error': 'Ошибка обновления артиста',
    
    // Редактирование альбома
    'album.edit.title': 'Редактировать альбом',
    'album.edit.save': 'Сохранить',
    'album.edit.success': 'Альбом обновлен!',
    'album.edit.error': 'Ошибка обновления альбома',
    
    // Создание плейлиста
    'playlist.create.error': 'Ошибка создания плейлиста',
    'playlist.create.nameRequired': 'Название обязательно',
    'playlist.create.nameLength': 'Название должно быть от 2 до 100 символов',
    'playlist.create.loginRequired': 'Необходимо войти в систему',
    
    // Загрузка изображений
    'image.upload.label': 'Загрузить изображение',
    'image.upload.selectImage': 'Пожалуйста, выберите изображение',
    'image.upload.replace': 'Заменить',
    'image.upload.selectFile': 'Выбрать файл',
    'image.upload.maxSize': 'Макс. {size}MB',
    'image.upload.success': 'Изображение загружено успешно',
    'image.upload.error': 'Ошибка загрузки изображения',
    'image.upload.loginRequired': 'Необходимо войти в систему',
    'image.upload.bucketNotFound': 'Bucket не найден. Убедитесь, что bucket создан в Supabase Storage.',
    'image.upload.noPermission': 'Нет прав для загрузки в bucket. Проверьте политики безопасности Storage.',
    
    // Добавление трека в плейлист
    'addSong.title': 'Добавить трек',
    'addSong.selectTrack': 'Выберите трек',
    'addSong.searchPlaceholder': 'Поиск по названию, исполнителю или альбому...',
    'addSong.empty': 'Нет доступных треков',
    'addSong.emptySearch': 'Треки не найдены',
    'addSong.selectTrackPlaceholder': 'Выберите трек для добавления',
    'addSong.adding': 'Добавление...',
    'addSong.add': 'Добавить',
    'addSong.error.selectTrack': 'Выберите трек',
    'addSong.error.loginRequired': 'Необходимо войти в систему',
    'addSong.error.alreadyAdded': 'Трек уже добавлен в плейлист',
    'addSong.error.loadTracks': 'Ошибка загрузки треков',
    'addSong.error.add': 'Ошибка добавления трека',
    'addSong.success': 'Трек добавлен в плейлист!',
    'addSong.unknownArtist': 'Неизвестный артист',
    'addSong.loadingTracks': 'Загрузка треков...',
    
    // Анкеты артистов
    'applications.title': 'Анкеты артистов',
    'applications.subtitle': 'Просмотр и рассмотрение анкет от слушателей',
    'applications.searchPlaceholder': 'Поиск по имени артиста или пользователю...',
    'applications.empty': 'Нет анкет для рассмотрения',
    'applications.emptyFiltered': 'Попробуйте изменить фильтры',
    'applications.status.pending': 'На рассмотрении',
    'applications.status.approved': 'Одобрено',
    'applications.status.rejected': 'Отклонено',
    'applications.approve': 'Одобрить',
    'applications.reject': 'Отклонить',
    'applications.rejectComment': 'Комментарий',
    'applications.rejectCommentPlaceholder': 'Укажите причину отклонения...',
    'applications.approveSuccess': 'Анкета одобрена. Артист создан автоматически.',
    'applications.approveError': 'Ошибка одобрения анкеты',
    'applications.rejectSuccess': 'Анкета отклонена',
    'applications.rejectError': 'Ошибка отклонения анкеты',
    'applications.loadError': 'Ошибка загрузки анкет',
    'applications.filter.all': 'Все',
    'applications.filter.pending': 'На рассмотрении',
    'applications.filter.approved': 'Одобренные',
    'applications.filter.rejected': 'Отклонённые',
    'applications.submitted': 'Подана:',
    'applications.biography': 'Биография:',
    'applications.genre': 'Жанр:',
    'applications.motivation': 'Мотивация:',
    'applications.links': 'Ссылки:',
    'applications.portfolio': 'Портфолио',
    'applications.rejectionComment': 'Комментарий при отклонении:',
    
    // Стать артистом
    'becomeArtist.title': 'Стать артистом',
    'becomeArtist.nameLabel': 'Имя исполнителя *',
    'becomeArtist.namePlaceholder': 'Имя исполнителя',
    'becomeArtist.bioLabel': 'Биография',
    'becomeArtist.bioPlaceholder': 'Расскажите о себе как об артисте...',
    'becomeArtist.genreLabel': 'Жанр',
    'becomeArtist.selectGenre': 'Выберите жанр',
    'becomeArtist.portfolioLabel': 'Портфолио (URL)',
    'becomeArtist.socialLabel': 'Социальные сети',
    'becomeArtist.motivationLabel': 'Мотивация',
    'becomeArtist.motivationPlaceholder': 'Почему вы хотите стать артистом на платформе?',
    'becomeArtist.submit': 'Отправить анкету',
    'becomeArtist.submitting': 'Отправка...',
    'becomeArtist.success': 'Анкета успешно отправлена на рассмотрение!',
    'becomeArtist.error.enterName': 'Введите имя артиста',
    'becomeArtist.error.pending': 'Ваша анкета уже находится на рассмотрении',
    'becomeArtist.error.approved': 'Ваша анкета уже одобрена. Вы являетесь артистом',
    'becomeArtist.error.loginRequired': 'Необходимо войти в систему',
    'becomeArtist.error.submit': 'Ошибка отправки анкеты',
    'becomeArtist.errorSubmit': 'Ошибка отправки анкеты: {message}',
    'becomeArtist.alreadyRole': 'Вы уже являетесь {role}.',
    'becomeArtist.imageLabel': 'Изображение артиста',
    'becomeArtist.portfolioLabelPlaceholder': 'Ссылка на портфолио',
    'becomeArtist.instagramLabel': 'Instagram',
    'becomeArtist.youtubeLabel': 'YouTube',
    'becomeArtist.approvedMessage': 'Поздравляем! Ваша анкета одобрена. Теперь вы артист.',
    'becomeArtist.rejectedMessage': 'Ваша анкета отклонена.',
    'becomeArtist.rejectedComment': 'Комментарий:',
    'becomeArtist.reviewedAt': 'Рассмотрено:',
    'becomeArtist.pendingMessage': 'Ваша анкета находится на рассмотрении дистрибьюторами.',
    'becomeArtist.submittedAt': 'Подана:',
    'becomeArtist.nameArtist': 'Имя артиста',
    'becomeArtist.bioArtist': 'Биография артиста',
    'becomeArtist.genreLabelPlaceholder': 'Выберите жанр (необязательно)',
    'becomeArtist.noGenre': 'Без жанра',
    
    // Layout
    'layout.adminPanel': 'Админ-панель',
    'layout.applications': 'Анкеты артистов',
    
    // Профиль
    'profile.usernameMinLength': 'Имя пользователя должно быть минимум 3 символа',
    'profile.saveSuccess': 'Профиль сохранён',
    'profile.saveError': 'Ошибка сохранения профиля',
    'profile.save': 'Сохранить изменения',
    'profile.saving': 'Сохранение...',
    'profile.user': 'Пользователь',
    'profile.firstNamePlaceholder': 'Имя',
    'profile.lastNamePlaceholder': 'Фамилия',
    'profile.bioPlaceholder': 'Расскажите о себе...',
    'profile.registration': 'Регистрация',
    'profile.lastLogin': 'Последний вход',
    'profile.myTracks': 'Мои треки',
    'profile.myPlaylists': 'Мои плейлисты',
    'profile.favorites': 'В избранном',
    'profile.edit': 'Редактировать профиль',
    'profile.avatar': 'Аватар',
    'profile.username': 'Имя пользователя',
    'profile.firstName': 'Имя',
    'profile.lastName': 'Фамилия',
    'profile.bio': 'О себе',
    'profile.allSettings': 'Все настройки',
    
    // Настройки
    'settings.usernameMinLength': 'Имя пользователя должно быть минимум 3 символа',
    'settings.passwordMinLength': 'Новый пароль должен быть минимум 6 символов',
    'settings.passwordMismatch': 'Пароли не совпадают',
    'settings.passwordChangeSuccess': 'Пароль успешно изменён',
    'settings.resetPasswordSuccess': 'Ссылка для восстановления пароля отправлена на email',
    'settings.saveError': 'Ошибка сохранения профиля',
    'settings.passwordChangeError': 'Ошибка изменения пароля',
    'settings.saveSuccess': 'Профиль сохранён',
    'settings.save': 'Сохранить изменения',
    'settings.saving': 'Сохранение...',
    'settings.changePasswordButton': 'Изменить пароль',
    'settings.changingPassword': 'Изменение...',
    'settings.firstNamePlaceholder': 'Имя',
    'settings.lastNamePlaceholder': 'Фамилия',
    'settings.bioPlaceholder': 'Расскажите о себе...',
    'settings.newPasswordPlaceholder': 'Введите новый пароль',
    'settings.confirmPasswordPlaceholder': 'Повторите новый пароль',
    'settings.title': 'Настройки',
    'settings.subtitle': 'Управление вашим профилем и предпочтениями',
    'settings.profile': 'Профиль',
    'settings.favorites': 'Избранное',
    'settings.appearance': 'Внешний вид',
    'settings.password': 'Безопасность',
    'settings.theme': 'Тема',
    'settings.dark': 'Тёмная',
    'settings.light': 'Светлая',
    'settings.language': 'Язык интерфейса',
    'settings.favoriteTracks': 'Треки',
    'settings.favoriteAlbums': 'Альбомы',
    'settings.favoritePlaylists': 'Плейлисты',
    'settings.currentPassword': 'Текущий пароль',
    'settings.newPassword': 'Новый пароль',
    'settings.confirmPassword': 'Подтвердите новый пароль',
    'settings.passwordHidden': 'Пароль скрыт по соображениям безопасности',
    'settings.forgotPassword': 'Забыли пароль?',
    'settings.resetPassword': 'Отправить ссылку для восстановления пароля',
    
    // Библиотека
    'library.deleteSuccess': 'Трек удалён',
    'library.deleteError': 'Ошибка удаления трека',
    'library.loadError': 'Ошибка загрузки библиотеки',
    'library.errorDeleteTrack': 'Ошибка удаления трека',
    'library.errorLoad': 'Ошибка загрузки библиотеки',
    
    // Детали альбома
    'albumDetail.notFound': 'Альбом не найден',
    'albumDetail.loadError': 'Ошибка загрузки альбома',
    'albumDetail.noTracks': 'Нет треков для воспроизведения',
    'albumDetail.tracksTitle': 'Треки альбома',
    'albumDetail.emptyMessage': 'В альбоме пока нет треков',
    'albumDetail.backToLibrary': 'Вернуться к библиотеке',
    'albumDetail.playAll': 'Слушать все',
    'albumDetail.shuffle': 'Перемешать',
    'albumDetail.tracks': 'треков',
    'albumDetail.listens': 'прослушиваний',
    'albumDetail.deleteError': 'Ошибка удаления трека',
    'albumDetail.deleteSuccess': 'Трек удалён',
    
    // Детали плейлиста
    'playlistDetail.loadError': 'Ошибка загрузки плейлиста',
    'playlistDetail.noAccess': 'У вас нет доступа к этому плейлисту',
    'playlistDetail.removeError': 'Ошибка удаления трека',
    
    // Плейлисты
    'playlists.loadError': 'Ошибка загрузки плейлистов',
    'playlists.track': 'трек',
    'playlists.playlistAdded': 'Плейлист добавлен в избранное',
    'playlists.playlistRemoved': 'Плейлист удалён из избранного',
    
    // Аналитика
    'analytics.loadError': 'Ошибка загрузки аналитики',
    'analytics.csvExportSuccess': 'Данные экспортированы в CSV',
    'analytics.pdfExportSuccess': 'Данные экспортированы в PDF',
    'analytics.csvHeaders.date': 'Дата',
    'analytics.csvHeaders.track': 'Трек',
    'analytics.csvHeaders.artist': 'Исполнитель',
    'analytics.csvHeaders.album': 'Альбом',
    'analytics.csvHeaders.duration': 'Длительность трека',
    'analytics.csvHeaders.played': 'Прослушано секунд',
    'analytics.csvHeaders.completed': 'Завершено',
    'analytics.csvHeaders.rank': 'Место',
    'analytics.csvHeaders.genre': 'Жанр',
    'analytics.unknown': 'Неизвестно',
    'analytics.exporting': 'Экспорт данных...',
    'analytics.reportTitle': 'Отчет по аналитике прослушиваний',
    'analytics.generatedOn': 'Сгенерировано',
    'analytics.statistics': 'Статистика',
    'analytics.listeningHistory': 'История прослушиваний',
    'analytics.stats.totalListens': 'Всего прослушиваний',
    'analytics.stats.totalDuration': 'Общая длительность',
    'analytics.stats.totalTracks': 'Всего треков',
    'analytics.stats.avgDuration': 'Средняя длительность',
    'analytics.errorExport': 'Ошибка экспорта: {message}',
    'analytics.title': 'Аналитика',
    'analytics.charts.dailyListens': 'Прослушивания по дням',
    'analytics.charts.dailyDuration': 'Время прослушивания по дням',
    'analytics.charts.topTracks': 'Топ треков',
    'analytics.charts.genres': 'Прослушивания по жанрам',
    'analytics.charts.listens': 'Прослушиваний',
    'analytics.charts.duration': 'Длительность (минуты)',
    'analytics.charts.durationMinutes': 'Минут',
    'analytics.charts.count': 'Количество',
    'analytics.charts.noData': 'Нет данных для отображения',
    'analytics.subtitle': 'Статистика ваших прослушиваний',
    'analytics.exportCSV': 'Экспорт CSV',
    'analytics.exportPDF': 'Экспорт PDF',
    'analytics.totalListens': 'Всего прослушиваний',
    'analytics.listeningTime': 'Время прослушивания',
    'analytics.tracksListened': 'Прослушано треков',
    'analytics.avgDuration': 'Средняя длительность трека',
    
    // Аутентификация
    'auth.welcome': 'Добро пожаловать!',
    'auth.usernameLength': 'Имя пользователя должно быть от 3 до 50 символов',
    'auth.usernameTaken': 'Имя пользователя уже занято',
    'auth.createUserError': 'Не удалось создать пользователя',
    'auth.loginTitle': 'Войдите в свой аккаунт',
    'auth.registerTitle': 'Создайте новый аккаунт',
    'auth.firstNamePlaceholder': 'Введите имя',
    'auth.lastNamePlaceholder': 'Введите фамилию',
    'auth.usernamePlaceholder': 'username (3-50 символов)',
    'auth.email': 'Email',
    'auth.password': 'Пароль',
    'auth.emailPlaceholder': 'your@email.com',
    'auth.passwordPlaceholder': '••••••••',
    'auth.switchToRegister': 'Нет аккаунта? Зарегистрируйтесь',
    'auth.switchToLogin': 'Уже есть аккаунт? Войдите',
    'auth.login': 'Войти',
    'auth.register': 'Зарегистрироваться',
    'auth.registrationSuccess': 'Регистрация успешна! Проверьте email для подтверждения.',
    'auth.confirmEmail': 'Пожалуйста, подтвердите email для входа. После подтверждения вы сможете войти.',
    
    // Админ панель
    'admin.loadError': 'Ошибка загрузки данных',
    'admin.roleNotFound': 'Роль не найдена',
    'admin.roleUpdateSuccess': 'Роль пользователя обновлена',
    'admin.roleUpdateError': 'Ошибка обновления роли',
    'admin.deleteConfirm': 'Вы уверены, что хотите удалить этого пользователя?',
    'admin.deleteSuccess': 'Пользователь удалён',
    'admin.deleteError': 'Ошибка удаления пользователя',
    'admin.searchPlaceholder': 'Поиск пользователей...',
    'admin.role.listener': 'Слушатель',
    'admin.role.distributor': 'Дистрибьютор',
    'admin.role.admin': 'Администратор',
    'admin.role.artist': 'Артист',
    'admin.role.moderator': 'Модератор',
    'admin.title': 'Админ-панель',
    'admin.subtitle': 'Управление пользователями и контентом',
    'admin.stats.users': 'Пользователи',
    'admin.stats.tracks': 'Треки',
    'admin.stats.playlists': 'Плейлисты',
    'admin.stats.artists': 'Артисты',
    'admin.stats.albums': 'Альбомы',
    'admin.userManagement': 'Управление пользователями',
    'admin.registration': 'Регистрация',
    'admin.unknownError': 'Неизвестная ошибка',
    'admin.dbStatus.title': 'Статус базы данных',
    'admin.dbStatus.update': 'Обновить',
    'admin.dbStatus.checking': 'Проверка...',
    'admin.dbStatus.checkingConnection': 'Проверка подключения...',
    'admin.dbStatus.connected': 'Подключено',
    'admin.dbStatus.notConnected': 'Не подключено',
    'admin.dbStatus.active': 'Активно',
    'admin.dbStatus.error': 'Ошибка',
    'admin.dbStatus.errorTitle': 'Ошибка подключения:',
    'admin.dbStatus.errorMessage': 'Проверьте настройки подключения к Supabase',
    'admin.dbStatus.stats.users': 'Пользователи',
    'admin.dbStatus.stats.tracks': 'Треки',
    'admin.dbStatus.stats.playlists': 'Плейлисты',
    'admin.dbStatus.stats.listenHistory': 'Прослушивания',
    'admin.dbStatus.setup.title': 'Как настроить Supabase:',
    'admin.dbStatus.setup.step1': 'Создайте аккаунт на',
    'admin.dbStatus.setup.step2': 'Создайте новый проект',
    'admin.dbStatus.setup.step3': 'Скопируйте URL проекта и anon key',
    'admin.dbStatus.setup.step4': 'Создайте файл .env.local в корне проекта',
    'admin.dbStatus.setup.step5': 'Добавьте переменные VITE_SUPABASE_URL и VITE_SUPABASE_PUBLISHABLE_KEY',
    'admin.dbStatus.setup.step6': 'Запустите миграции: npx supabase db push',
    'admin.storage.title': 'Инициализация Storage',
    'admin.storage.check': 'Проверить',
    'admin.storage.checking': 'Проверка...',
    'admin.storage.initialize': 'Инициализировать',
    'admin.storage.initializing': 'Инициализация...',
    'admin.storage.bucket.songs': 'Bucket "songs"',
    'admin.storage.bucket.covers': 'Bucket "covers"',
    'admin.storage.status.checking': 'Проверка...',
    'admin.storage.status.created': 'Создан',
    'admin.storage.status.missing': 'Отсутствует',
    'admin.storage.warning.title': 'Storage не настроен',
    'admin.storage.warning.message': 'Для загрузки треков необходимо создать bucket\'ы в Supabase Storage. Нажмите "Инициализировать" для автоматического создания.',
    'admin.storage.success.title': 'Storage настроен',
    'admin.storage.success.message': 'Все необходимые bucket\'ы созданы. Теперь можно загружать треки и обложки.',
    'admin.storage.info.title': 'Что делает инициализация:',
    'admin.storage.info.step1': 'Создает bucket "songs" для хранения аудио файлов (до 50MB)',
    'admin.storage.info.step2': 'Создает bucket "covers" для хранения обложек (до 5MB)',
    'admin.storage.info.step3': 'Настраивает права доступа и ограничения файлов',
    'admin.storage.success.toast': 'Storage инициализирован успешно!',
    'admin.storage.error.toast': 'Ошибка инициализации Storage',
    'admin.dbViewer.title': 'Просмотр базы данных',
    'admin.dbViewer.searchPlaceholder': 'Поиск по данным...',
    'admin.dbViewer.table': 'Таблица:',
    'admin.dbViewer.totalRecords': 'Всего записей:',
    'admin.dbViewer.shown': 'Показано:',
    'admin.dbViewer.loading': 'Загрузка данных...',
    'admin.dbViewer.noData': 'Нет данных в таблице',
    'admin.dbViewer.noResults': 'Данные не найдены',
    'admin.dbViewer.error': 'Ошибка загрузки данных',
    'admin.dbViewer.tables.tracks': 'Треки',
    'admin.dbViewer.tables.playlists': 'Плейлисты',
    'admin.dbViewer.tables.users': 'Пользователи',
    'admin.dbViewer.tables.listeningHistory': 'История прослушиваний',
    'admin.dbViewer.tables.playlistTracks': 'Треки в плейлистах',
    'admin.dbViewer.tables.artists': 'Артисты',
    'admin.dbViewer.tables.albums': 'Альбомы',
    'admin.dbViewer.tables.roles': 'Роли',
    
    // Общие
    'common.track': 'трек',
    'common.upload': 'Загрузка...',
    'common.replace': 'Заменить',
    'common.selectFile': 'Выбрать файл',
    'common.back': 'Назад',
    'common.required': '*',
    
    // Music Player
    'musicPlayer.error.invalidPath': 'Неверный путь к аудио файлу',
    'musicPlayer.error.localFiles': 'Локальные файлы не поддерживаются для воспроизведения',
    'musicPlayer.error.loadAudio': 'Ошибка загрузки аудио файла',
    'musicPlayer.error.noLink': 'Не удалось получить ссылку на аудио файл',
    'musicPlayer.error.loadTrack': 'Ошибка загрузки трека',
    'musicPlayer.error.playback': 'Ошибка воспроизведения аудио',
    'musicPlayer.error.aborted': 'Воспроизведение было прервано',
    'musicPlayer.error.network': 'Ошибка сети при загрузке аудио',
    'musicPlayer.error.decode': 'Ошибка декодирования аудио файла',
    'musicPlayer.error.unsupported': 'Формат аудио не поддерживается',
    'musicPlayer.info.loading': 'Загрузка аудио...',
    'musicPlayer.error.format': 'Формат аудио не поддерживается браузером',
    'musicPlayer.error.autoplay': 'Автовоспроизведение заблокировано браузером',
    'musicPlayer.selectTrack': 'Выберите трек для воспроизведения',
    'musicPlayer.shuffleOn': 'Включить перемешивание',
    'musicPlayer.shuffleOff': 'Выключить перемешивание',
    'musicPlayer.repeatOff': 'Повтор: Выключен',
    'musicPlayer.repeatOne': 'Повтор: Один трек',
    'musicPlayer.repeatAll': 'Повтор: Весь плейлист',
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
    'playlists.track': 'track',
    'playlists.owner': 'Owner',
    'playlists.private': 'Private',
    'playlists.addSong': 'Add track',
    'playlists.privacyChanged.public': 'Playlist is now public',
    'playlists.privacyChanged.private': 'Playlist is now private',
    'playlists.privacyChangeError': 'Error changing privacy: {message}',
    'playlists.confirmRemove': 'Are you sure you want to delete this playlist?',
    'playlists.remove': 'Remove playlist',
    
    // Analytics
    'analytics.title': 'Analytics',
    'analytics.subtitle': 'Your listening statistics',
    'analytics.totalListens': 'Total listens',
    'analytics.listeningTime': 'Listening time',
    'analytics.tracksListened': 'Tracks listened',
    'analytics.avgDuration': 'Average track duration',
    'analytics.exportError': 'Export error',
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
    'profile.listeningHistory': 'Listening History',
    'profile.listeningHistory.title': 'Listening History',
    'profile.listeningHistory.empty': 'History is empty',
    'profile.listeningHistory.emptyMessage': 'You haven\'t listened to any tracks yet',
    'profile.listeningHistory.loading': 'Loading history...',
    'profile.listeningHistory.played': 'Played',
    'profile.listeningHistory.completed': 'Completed',
    'profile.listeningHistory.notCompleted': 'Not completed',
    'profile.listeningHistory.duration': 'Duration',
    'profile.listeningHistory.error': 'Error loading history',
    
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
    'auth.error': 'Authentication error',
    
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
    'upload.selectArtist': 'Artist',
    'upload.trackTitle': 'Track title',
    'upload.selectAlbum': 'Select album',
    'upload.selectGenre': 'Select genre',
    'upload.upload': 'Upload',
    'upload.uploading': 'Uploading...',
    'upload.success': 'Track uploaded successfully',
    'upload.createAlbumFirst': 'Before uploading a track, first create an album in the "Artists and Albums" section of the library',
    'upload.selectFile': 'Select file',
    'upload.changeFile': 'Select another file',
    'upload.dragFile': 'Drag file here or click to select',
    
    // Playlists detail
    'playlists.detail.title': 'Playlist',
    'playlists.detail.back': 'Back',
    'playlists.detail.notFound': 'Playlist not found',
    'playlists.detail.empty': 'Playlist is empty',
    'playlists.detail.addTracks': 'Add tracks to this playlist',
    'playlists.detail.playAll': 'Play All',
    'playlists.detail.shuffle': 'Shuffle',
    'playlists.detail.totalPlays': 'plays',
    'playlists.detail.totalDuration': 'minutes',
    'playlists.detail.tracksCount': 'tracks',
    'playlists.detail.removeTrack': 'Remove track',
    'playlists.detail.confirmRemove': 'Remove track from playlist?',
    'playlists.detail.removeFromPlaylist': 'Track removed from playlist',
    'playlists.detail.errorDeleteTrack': 'Error deleting track: {message}',
    
    // Albums detail
    'albums.detail.back': 'Back',
    'albums.detail.playAll': 'Play All',
    'albums.detail.shuffle': 'Shuffle',
    'albums.detail.totalPlays': 'plays',
    'albums.detail.tracksCount': 'tracks',
    
    // Artist detail
    'artist.notFound': 'Artist not found',
    'artist.loadError': 'Error loading artist',
    'artist.backToLibrary': 'Back to library',
    'artist.profile': 'Profile',
    'artist.tracks': 'tracks',
    'artist.albums': 'albums',
    'artist.allAlbums': 'All albums',
    'artist.playlists': 'Playlists',
    'artist.allPlaylists': 'All playlists',
    'artist.allTracks': 'All tracks',
    'artist.emptyTracks': 'Artist has no tracks yet',
    'artist.noTracks': 'No tracks to play',
    'artist.noAlbum': 'No album',
    'artist.totalPlays': 'plays',
    'artist.playAll': 'Play all',
    'artist.shuffle': 'Shuffle',
    
    // Common messages
    'messages.success': 'Operation completed successfully',
    'messages.error': 'An error occurred',
    'messages.loading': 'Loading...',
    'messages.noAccess': 'You do not have access',
    'messages.created': 'Created successfully',
    'messages.deleted': 'Deleted successfully',
    'messages.updated': 'Updated successfully',
    'messages.addedToFavorites': 'Added to favorites',
    'messages.removedFromFavorites': 'Removed from favorites',
    'messages.addToFavorites': 'Add to favorites',
    'messages.removeFromFavorites': 'Remove from favorites',
    
    // Albums manager
    'albums.manager.title': 'Albums',
    'albums.manager.empty': 'No albums',
    'albums.manager.emptySearch': 'Albums not found',
    'albums.manager.emptyMessage': 'Upload tracks with album specified',
    'albums.manager.searchPlaceholder': 'Search by album title or artist...',
    'albums.manager.unknownArtist': 'Unknown artist',
    'albums.manager.tracksLabel': 'Tracks:',
    'albums.manager.durationLabel': 'Duration:',
    'albums.manager.releaseLabel': 'Released:',
    'albums.manager.notSpecified': 'Not specified',
    'albums.manager.deleteConfirm': 'Are you sure you want to delete this album? All tracks in the album will also be deleted.',
    'albums.manager.deleteSuccess': 'Album deleted',
    'albums.manager.deleteError': 'Error deleting album',
    'albums.manager.favoriteAdded': 'Album added to favorites',
    'albums.manager.favoriteRemoved': 'Album removed from favorites',
    
    // Artists manager
    'artists.manager.title': 'Artists',
    'artists.manager.empty': 'No artists',
    'artists.manager.emptySearch': 'Artists not found',
    'artists.manager.emptyMessage': 'Add first artist',
    'artists.manager.searchPlaceholder': 'Search artists...',
    'artists.manager.infoMessage': 'Artists are created automatically when applications are approved by distributors',
    'artists.manager.deleteConfirm': 'Are you sure you want to delete this artist? All albums and tracks by this artist will also be deleted.',
    'artists.manager.deleteSuccess': 'Artist deleted',
    
    // Upload errors
    'upload.error.required': 'Fill in all required fields',
    'upload.error.loginRequired': 'You must be logged in',
    'upload.error.fileFormat': 'Unsupported file format',
    'upload.error.fileSize': 'File too large (maximum 50MB)',
    'upload.error.userProfile': 'Error creating user profile',
    'upload.placeholder.trackTitle': 'Track title',
    'upload.placeholder.selectArtist': 'Select artist',
    'upload.placeholder.selectAlbum': 'Select album',
    'upload.placeholder.selectGenre': 'Select genre (optional)',
    
    // Album create
    'album.create.title': 'Create album',
    'album.create.artistLabel': 'Artist *',
    'album.create.nameLabel': 'Album title *',
    'album.create.namePlaceholder': 'Album title',
    'album.create.releaseLabel': 'Release date *',
    'album.create.descriptionLabel': 'Description',
    'album.create.descriptionPlaceholder': 'Album description',
    'album.create.success': 'Album created!',
    'album.create.error': 'Error creating album',
    'album.create.loginRequired': 'You must be logged in',
    'album.create.fillAll': 'Fill in all required fields',
    'album.create.noArtists': 'No available artists',
    'album.create.selectArtist': 'Select artist',
    
    // Artist create
    'artist.create.title': 'Create artist',
    'artist.create.nameLabel': 'Artist name *',
    'artist.create.namePlaceholder': 'Artist name',
    'artist.create.bioLabel': 'Biography',
    'artist.create.bioPlaceholder': 'Brief artist biography',
    'artist.create.genreLabel': 'Genre',
    'artist.create.success': 'Artist created!',
    'artist.create.error': 'Error creating artist',
    'artist.create.enterName': 'Enter artist name',
    'artist.create.selectGenre': 'Select genre (optional)',
    
    // Artist edit
    'artist.edit.title': 'Edit artist',
    'artist.edit.save': 'Save',
    'artist.edit.success': 'Artist updated!',
    'artist.edit.error': 'Error updating artist',
    
    // Album edit
    'album.edit.title': 'Edit album',
    'album.edit.save': 'Save',
    'album.edit.success': 'Album updated!',
    'album.edit.error': 'Error updating album',
    
    // Playlist create
    'playlist.create.error': 'Error creating playlist',
    'playlist.create.nameRequired': 'Name is required',
    'playlist.create.nameLength': 'Name must be between 2 and 100 characters',
    'playlist.create.loginRequired': 'You must be logged in',
    
    // Image upload
    'image.upload.label': 'Upload image',
    'image.upload.selectImage': 'Please select an image',
    'image.upload.replace': 'Replace',
    'image.upload.selectFile': 'Select file',
    'image.upload.maxSize': 'Max {size}MB',
    'image.upload.success': 'Image uploaded successfully',
    'image.upload.error': 'Error uploading image',
    'image.upload.loginRequired': 'You must be logged in',
    'image.upload.bucketNotFound': 'Bucket not found. Make sure the bucket is created in Supabase Storage.',
    'image.upload.noPermission': 'No permission to upload to bucket. Check Storage security policies.',
    
    // Add song
    'addSong.title': 'Add track',
    'addSong.selectTrack': 'Select track',
    'addSong.searchPlaceholder': 'Search by title, artist or album...',
    'addSong.empty': 'No available tracks',
    'addSong.emptySearch': 'No tracks found',
    'addSong.selectTrackPlaceholder': 'Select track to add',
    'addSong.adding': 'Adding...',
    'addSong.add': 'Add',
    'addSong.error.selectTrack': 'Select a track',
    'addSong.error.loginRequired': 'You must be logged in',
    'addSong.error.alreadyAdded': 'Track already added to playlist',
    'addSong.error.loadTracks': 'Error loading tracks',
    'addSong.error.add': 'Error adding track',
    'addSong.success': 'Track added to playlist!',
    'addSong.unknownArtist': 'Unknown artist',
    'addSong.selectTrack': 'Select track',
    'addSong.loadingTracks': 'Loading tracks...',
    
    // Applications
    'applications.title': 'Artist applications',
    'applications.subtitle': 'View and review applications from listeners',
    'applications.searchPlaceholder': 'Search by artist name or user...',
    'applications.empty': 'No applications to review',
    'applications.emptyFiltered': 'Try changing filters',
    'applications.status.pending': 'Pending',
    'applications.status.approved': 'Approved',
    'applications.status.rejected': 'Rejected',
    'applications.approve': 'Approve',
    'applications.reject': 'Reject',
    'applications.rejectComment': 'Comment',
    'applications.rejectCommentPlaceholder': 'Specify rejection reason...',
    'applications.approveSuccess': 'Application approved. Artist created automatically.',
    'applications.approveError': 'Error approving application',
    'applications.rejectSuccess': 'Application rejected',
    'applications.rejectError': 'Error rejecting application',
    'applications.loadError': 'Error loading applications',
    'applications.filter.all': 'All',
    'applications.filter.pending': 'Pending',
    'applications.filter.approved': 'Approved',
    'applications.filter.rejected': 'Rejected',
    'applications.submitted': 'Submitted:',
    'applications.biography': 'Biography:',
    'applications.genre': 'Genre:',
    'applications.motivation': 'Motivation:',
    'applications.links': 'Links:',
    'applications.portfolio': 'Portfolio',
    'applications.rejectionComment': 'Rejection comment:',
    
    // Become artist
    'becomeArtist.title': 'Become an artist',
    'becomeArtist.nameLabel': 'Artist name *',
    'becomeArtist.namePlaceholder': 'Artist name',
    'becomeArtist.bioLabel': 'Biography',
    'becomeArtist.bioPlaceholder': 'Tell us about yourself as an artist...',
    'becomeArtist.genreLabel': 'Genre',
    'becomeArtist.selectGenre': 'Select genre',
    'becomeArtist.portfolioLabel': 'Portfolio (URL)',
    'becomeArtist.socialLabel': 'Social media',
    'becomeArtist.motivationLabel': 'Motivation',
    'becomeArtist.motivationPlaceholder': 'Why do you want to become an artist on the platform?',
    'becomeArtist.submit': 'Submit application',
    'becomeArtist.submitting': 'Submitting...',
    'becomeArtist.success': 'Application successfully submitted for review!',
    'becomeArtist.error.enterName': 'Enter artist name',
    'becomeArtist.error.pending': 'Your application is already under review',
    'becomeArtist.error.approved': 'Your application has already been approved. You are an artist',
    'becomeArtist.error.loginRequired': 'You must be logged in',
    'becomeArtist.error.submit': 'Error submitting application',
    'becomeArtist.alreadyRole': 'You are already a {role}.',
    'becomeArtist.imageLabel': 'Artist image',
    'becomeArtist.portfolioLabelPlaceholder': 'Portfolio link',
    'becomeArtist.instagramLabel': 'Instagram',
    'becomeArtist.youtubeLabel': 'YouTube',
    'becomeArtist.approvedMessage': 'Congratulations! Your application has been approved. You are now an artist.',
    'becomeArtist.rejectedMessage': 'Your application has been rejected.',
    'becomeArtist.rejectedComment': 'Comment:',
    'becomeArtist.reviewedAt': 'Reviewed:',
    'becomeArtist.pendingMessage': 'Your application is under review by distributors.',
    'becomeArtist.submittedAt': 'Submitted:',
    'becomeArtist.nameArtist': 'Artist name',
    'becomeArtist.bioArtist': 'Artist biography',
    'becomeArtist.genreLabelPlaceholder': 'Select genre (optional)',
    'becomeArtist.noGenre': 'No genre',
    
    // Layout
    'layout.adminPanel': 'Admin Panel',
    'layout.applications': 'Artist applications',
    
    // Profile
    'profile.usernameMinLength': 'Username must be at least 3 characters',
    'profile.saveError': 'Profile saved',
    'profile.saveError': 'Error saving profile',
    'profile.save': 'Save changes',
    'profile.saving': 'Saving...',
    'profile.user': 'User',
    'profile.firstNamePlaceholder': 'First name',
    'profile.lastNamePlaceholder': 'Last name',
    'profile.bioPlaceholder': 'Tell us about yourself...',
    'profile.registration': 'Registration',
    'profile.lastLogin': 'Last login',
    'profile.myTracks': 'My tracks',
    'profile.myPlaylists': 'My playlists',
    'profile.favorites': 'In favorites',
    'profile.edit': 'Edit profile',
    'profile.avatar': 'Avatar',
    'profile.username': 'Username',
    'profile.firstName': 'First name',
    'profile.lastName': 'Last name',
    'profile.bio': 'About me',
    'profile.allSettings': 'All settings',
    
    // Settings
    'settings.usernameMinLength': 'Username must be at least 3 characters',
    'settings.passwordMinLength': 'New password must be at least 6 characters',
    'settings.passwordMismatch': 'Passwords do not match',
    'settings.passwordChangeSuccess': 'Password changed successfully',
    'settings.resetPasswordSuccess': 'Password recovery link sent to email',
    'settings.saveError': 'Error saving profile',
    'settings.passwordChangeError': 'Error changing password',
    'settings.saveSuccess': 'Profile saved',
    'settings.save': 'Save changes',
    'settings.saving': 'Saving...',
    'settings.changePasswordButton': 'Change password',
    'settings.changingPassword': 'Changing...',
    'settings.firstNamePlaceholder': 'First name',
    'settings.lastNamePlaceholder': 'Last name',
    'settings.bioPlaceholder': 'Tell us about yourself...',
    'settings.newPasswordPlaceholder': 'Enter new password',
    'settings.confirmPasswordPlaceholder': 'Repeat new password',
    'settings.title': 'Settings',
    'settings.subtitle': 'Manage your profile and preferences',
    'settings.profile': 'Profile',
    'settings.favorites': 'Favorites',
    'settings.appearance': 'Appearance',
    'settings.password': 'Security',
    'settings.theme': 'Theme',
    'settings.dark': 'Dark',
    'settings.light': 'Light',
    'settings.language': 'Interface language',
    'settings.favoriteTracks': 'Tracks',
    'settings.favoriteAlbums': 'Albums',
    'settings.favoritePlaylists': 'Playlists',
    'settings.currentPassword': 'Current password',
    'settings.newPassword': 'New password',
    'settings.confirmPassword': 'Confirm new password',
    'settings.passwordHidden': 'Password hidden for security reasons',
    'settings.forgotPassword': 'Forgot password?',
    'settings.resetPassword': 'Send password recovery link',
    
    // Library
    'library.deleteSuccess': 'Track deleted',
    'library.deleteError': 'Error deleting track',
    'library.loadError': 'Error loading library',
    'library.errorDeleteTrack': 'Error deleting track',
    'library.errorLoad': 'Error loading library',
    
    // Album detail
    'albumDetail.notFound': 'Album not found',
    'albumDetail.loadError': 'Error loading album',
    'albumDetail.noTracks': 'No tracks to play',
    'albumDetail.tracksTitle': 'Album tracks',
    'albumDetail.emptyMessage': 'No tracks in album yet',
    'albumDetail.backToLibrary': 'Back to library',
    'albumDetail.playAll': 'Play All',
    'albumDetail.shuffle': 'Shuffle',
    'albumDetail.tracks': 'tracks',
    'albumDetail.listens': 'listens',
    'albumDetail.deleteError': 'Error deleting track',
    'albumDetail.deleteSuccess': 'Track deleted',
    
    // Playlist detail
    'playlistDetail.loadError': 'Error loading playlist',
    'playlistDetail.noAccess': 'You do not have access to this playlist',
    'playlistDetail.removeError': 'Error removing track',
    
    // Playlists
    'playlists.loadError': 'Error loading playlists',
    'playlists.track': 'track',
    'playlists.playlistAdded': 'Playlist added to favorites',
    'playlists.playlistRemoved': 'Playlist removed from favorites',
    
    // Analytics
    'analytics.loadError': 'Error loading analytics',
    'analytics.csvExportSuccess': 'Data exported to CSV',
    'analytics.pdfExportSuccess': 'Data exported to PDF',
    'analytics.csvHeaders.date': 'Date',
    'analytics.csvHeaders.track': 'Track',
    'analytics.csvHeaders.artist': 'Artist',
    'analytics.csvHeaders.album': 'Album',
    'analytics.csvHeaders.duration': 'Track duration',
    'analytics.csvHeaders.played': 'Seconds played',
    'analytics.csvHeaders.completed': 'Completed',
    'analytics.exporting': 'Exporting data...',
    'analytics.reportTitle': 'Listening Analytics Report',
    'analytics.generatedOn': 'Generated on',
    'analytics.statistics': 'Statistics',
    'analytics.listeningHistory': 'Listening History',
    'analytics.stats.totalListens': 'Total Listens',
    'analytics.stats.totalDuration': 'Total Duration',
    'analytics.stats.totalTracks': 'Total Tracks',
    'analytics.stats.avgDuration': 'Average Duration',
    'analytics.errorExport': 'Export error: {message}',
    'analytics.unknown': 'Unknown',
    'analytics.charts.dailyListens': 'Listens by Day',
    'analytics.charts.dailyDuration': 'Listening Time by Day',
    'analytics.charts.topTracks': 'Top Tracks',
    'analytics.charts.genres': 'Listens by Genre',
    'analytics.charts.listens': 'Listens',
    'analytics.charts.duration': 'Duration (minutes)',
    'analytics.charts.durationMinutes': 'Minutes',
    'analytics.charts.count': 'Count',
    'analytics.charts.noData': 'No data to display',
    
    // Auth
    'auth.welcome': 'Welcome!',
    'auth.usernameLength': 'Username must be between 3 and 50 characters',
    'auth.usernameTaken': 'Username already taken',
    'auth.createUserError': 'Failed to create user',
    'auth.loginTitle': 'Login to your account',
    'auth.registerTitle': 'Create new account',
    'auth.firstNamePlaceholder': 'Enter first name',
    'auth.lastNamePlaceholder': 'Enter last name',
    'auth.switchToRegister': "Don't have an account? Register",
    'auth.switchToLogin': 'Already have an account? Login',
    
    // Admin panel
    'admin.loadError': 'Error loading data',
    'admin.roleNotFound': 'Role not found',
    'admin.roleUpdateSuccess': 'User role updated',
    'admin.roleUpdateError': 'Error updating role',
    'admin.deleteConfirm': 'Are you sure you want to delete this user?',
    'admin.deleteSuccess': 'User deleted',
    'admin.deleteError': 'Error deleting user',
    'admin.searchPlaceholder': 'Search users...',
    'admin.role.listener': 'Listener',
    'admin.role.distributor': 'Distributor',
    'admin.role.admin': 'Administrator',
    'admin.role.artist': 'Artist',
    'admin.role.moderator': 'Moderator',
    'admin.title': 'Admin Panel',
    'admin.subtitle': 'User and content management',
    'admin.stats.users': 'Users',
    'admin.stats.tracks': 'Tracks',
    'admin.stats.playlists': 'Playlists',
    'admin.stats.artists': 'Artists',
    'admin.stats.albums': 'Albums',
    'admin.userManagement': 'User Management',
    'admin.registration': 'Registration',
    'admin.unknownError': 'Unknown error',
    'admin.dbStatus.title': 'Database Status',
    'admin.dbStatus.update': 'Update',
    'admin.dbStatus.checking': 'Checking...',
    'admin.dbStatus.checkingConnection': 'Checking connection...',
    'admin.dbStatus.connected': 'Connected',
    'admin.dbStatus.notConnected': 'Not connected',
    'admin.dbStatus.active': 'Active',
    'admin.dbStatus.error': 'Error',
    'admin.dbStatus.errorTitle': 'Connection error:',
    'admin.dbStatus.errorMessage': 'Check Supabase connection settings',
    'admin.dbStatus.stats.users': 'Users',
    'admin.dbStatus.stats.tracks': 'Tracks',
    'admin.dbStatus.stats.playlists': 'Playlists',
    'admin.dbStatus.stats.listenHistory': 'Listens',
    'admin.dbStatus.setup.title': 'How to set up Supabase:',
    'admin.dbStatus.setup.step1': 'Create an account on',
    'admin.dbStatus.setup.step2': 'Create a new project',
    'admin.dbStatus.setup.step3': 'Copy the project URL and anon key',
    'admin.dbStatus.setup.step4': 'Create .env.local file in the project root',
    'admin.dbStatus.setup.step5': 'Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY variables',
    'admin.dbStatus.setup.step6': 'Run migrations: npx supabase db push',
    'admin.storage.title': 'Storage Initialization',
    'admin.storage.check': 'Check',
    'admin.storage.checking': 'Checking...',
    'admin.storage.initialize': 'Initialize',
    'admin.storage.initializing': 'Initializing...',
    'admin.storage.bucket.songs': 'Bucket "songs"',
    'admin.storage.bucket.covers': 'Bucket "covers"',
    'admin.storage.status.checking': 'Checking...',
    'admin.storage.status.created': 'Created',
    'admin.storage.status.missing': 'Missing',
    'admin.storage.warning.title': 'Storage not configured',
    'admin.storage.warning.message': 'To upload tracks, you need to create buckets in Supabase Storage. Click "Initialize" for automatic creation.',
    'admin.storage.success.title': 'Storage configured',
    'admin.storage.success.message': 'All required buckets are created. You can now upload tracks and covers.',
    'admin.storage.info.title': 'What initialization does:',
    'admin.storage.info.step1': 'Creates bucket "songs" for storing audio files (up to 50MB)',
    'admin.storage.info.step2': 'Creates bucket "covers" for storing covers (up to 5MB)',
    'admin.storage.info.step3': 'Configures access rights and file restrictions',
    'admin.storage.success.toast': 'Storage initialized successfully!',
    'admin.storage.error.toast': 'Storage initialization error',
    'admin.dbViewer.title': 'Database Viewer',
    'admin.dbViewer.searchPlaceholder': 'Search data...',
    'admin.dbViewer.table': 'Table:',
    'admin.dbViewer.totalRecords': 'Total records:',
    'admin.dbViewer.shown': 'Shown:',
    'admin.dbViewer.loading': 'Loading data...',
    'admin.dbViewer.noData': 'No data in table',
    'admin.dbViewer.noResults': 'No data found',
    'admin.dbViewer.error': 'Error loading data',
    'admin.dbViewer.tables.tracks': 'Tracks',
    'admin.dbViewer.tables.playlists': 'Playlists',
    'admin.dbViewer.tables.users': 'Users',
    'admin.dbViewer.tables.listeningHistory': 'Listening History',
    'admin.dbViewer.tables.playlistTracks': 'Playlist Tracks',
    'admin.dbViewer.tables.artists': 'Artists',
    'admin.dbViewer.tables.albums': 'Albums',
    'admin.dbViewer.tables.roles': 'Roles',
    
    // Common
    'common.track': 'track',
    'common.upload': 'Uploading...',
    'common.replace': 'Replace',
    'common.selectFile': 'Select file',
    'common.back': 'Back',
    'common.required': '*',
    
    // Music Player
    'musicPlayer.error.invalidPath': 'Invalid audio file path',
    'musicPlayer.error.localFiles': 'Local files are not supported for playback',
    'musicPlayer.error.loadAudio': 'Error loading audio file',
    'musicPlayer.error.noLink': 'Failed to get audio file link',
    'musicPlayer.error.loadTrack': 'Error loading track',
    'musicPlayer.error.playback': 'Audio playback error',
    'musicPlayer.error.aborted': 'Playback was aborted',
    'musicPlayer.error.network': 'Network error loading audio',
    'musicPlayer.error.decode': 'Audio decoding error',
    'musicPlayer.error.unsupported': 'Audio format not supported',
    'musicPlayer.info.loading': 'Loading audio...',
    'musicPlayer.error.format': 'Audio format not supported by browser',
    'musicPlayer.error.autoplay': 'Autoplay blocked by browser',
    'musicPlayer.selectTrack': 'Select a track to play',
    'musicPlayer.shuffleOn': 'Enable shuffle',
    'musicPlayer.shuffleOff': 'Disable shuffle',
    'musicPlayer.repeatOff': 'Repeat: Off',
    'musicPlayer.repeatOne': 'Repeat: One',
    'musicPlayer.repeatAll': 'Repeat: All',
  },
};
