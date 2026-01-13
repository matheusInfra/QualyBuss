
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import {
    SunIcon,
    MoonIcon,
    ComputerDesktopIcon,
    BellAlertIcon,
    ShieldCheckIcon,
    CheckCircleIcon,
    GlobeAltIcon,
    SpeakerWaveIcon
} from '@heroicons/react/24/outline';

const GeneralSettingsForm = () => {
    const { t, i18n } = useTranslation();
    const { theme, setTheme } = useTheme();
    const [notifications, setNotifications] = useState(() => {
        const saved = localStorage.getItem('notification_prefs');
        return saved ? JSON.parse(saved) : {
            email: true,
            push: true,
            sound: false
        };
    });
    const [feedback, setFeedback] = useState('');

    useEffect(() => {
        localStorage.setItem('notification_prefs', JSON.stringify(notifications));
    }, [notifications]);

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    const handleNotificationChange = (type) => {
        setNotifications(prev => ({
            ...prev,
            [type]: !prev[type]
        }));
    };

    const handleSave = () => {
        // Here we would save to backend. For theme/lang, context handles it.
        setFeedback(t('settings.general.save_success'));
        setTimeout(() => setFeedback(''), 3000);
    };

    // Helper for classes
    const sectionClass = "bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm";
    const titleClass = "text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2";

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl">

            {/* Feedback Toast */}
            {feedback && (
                <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg font-bold flex items-center gap-2 animate-slide-in">
                    <CheckCircleIcon className="w-5 h-5" /> {feedback}
                </div>
            )}

            {/* THEME SELECTION */}
            <div className={sectionClass}>
                <h3 className={titleClass}>
                    <SunIcon className="w-5 h-5 text-orange-500" />
                    {t('settings.general.appearance')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => setTheme('light')}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${theme === 'light' ? 'border-orange-500 bg-orange-50 text-orange-700 font-bold' : 'border-slate-200 dark:border-slate-700 hover:border-orange-300'}`}
                    >
                        <SunIcon className="w-8 h-8" />
                        {t('settings.general.theme_light')}
                    </button>
                    <button
                        onClick={() => setTheme('dark')}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${theme === 'dark' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'}`}
                    >
                        <MoonIcon className="w-8 h-8" />
                        {t('settings.general.theme_dark')}
                    </button>
                    <button
                        onClick={() => setTheme('system')}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${theme === 'system' ? 'border-slate-600 bg-slate-100 text-slate-800 font-bold' : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'}`}
                    >
                        <ComputerDesktopIcon className="w-8 h-8" />
                        {t('settings.general.theme_system')}
                    </button>
                </div>
            </div>

            {/* LANGUAGE SELECTION */}
            <div className={sectionClass}>
                <h3 className={titleClass}>
                    <GlobeAltIcon className="w-5 h-5 text-blue-500" />
                    {t('settings.general.language')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => changeLanguage('pt-BR')}
                        className={`px-4 py-3 rounded-xl border flex items-center justify-between transition-all ${i18n.language === 'pt-BR' ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'}`}
                    >
                        <span className="flex items-center gap-2"><span className="text-xl">🇧🇷</span> Português</span>
                        {i18n.language === 'pt-BR' && <CheckCircleIcon className="w-5 h-5" />}
                    </button>
                    <button
                        onClick={() => changeLanguage('en-US')}
                        className={`px-4 py-3 rounded-xl border flex items-center justify-between transition-all ${i18n.language === 'en-US' ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'}`}
                    >
                        <span className="flex items-center gap-2"><span className="text-xl">🇺🇸</span> English</span>
                        {i18n.language === 'en-US' && <CheckCircleIcon className="w-5 h-5" />}
                    </button>
                    <button
                        onClick={() => changeLanguage('es')}
                        className={`px-4 py-3 rounded-xl border flex items-center justify-between transition-all ${i18n.language === 'es' ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'}`}
                    >
                        <span className="flex items-center gap-2"><span className="text-xl">🇪🇸</span> Español</span>
                        {i18n.language === 'es' && <CheckCircleIcon className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* NOTIFICATIONS */}
            <div className={sectionClass}>
                <h3 className={titleClass}>
                    <BellAlertIcon className="w-5 h-5 text-red-500" />
                    {t('settings.general.notifications')}
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg"><BellAlertIcon className="w-5 h-5 text-slate-600" /></div>
                            <div>
                                <p className="font-bold text-slate-700 dark:text-gray-300">{t('settings.general.notifications_push')}</p>
                                <p className="text-xs text-slate-400">Notificações no navegador</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={notifications.push} onChange={() => handleNotificationChange('push')} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg"><SpeakerWaveIcon className="w-5 h-5 text-slate-600" /></div>
                            <div>
                                <p className="font-bold text-slate-700 dark:text-gray-300">{t('settings.general.notifications_sound')}</p>
                                <p className="text-xs text-slate-400">Sons de alerta e sucesso</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={notifications.sound} onChange={() => handleNotificationChange('sound')} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* SECURITY (Dummy) */}
            <div className={`${sectionClass} opacity-70`}>
                <h3 className={titleClass}>
                    <ShieldCheckIcon className="w-5 h-5 text-green-500" />
                    {t('settings.general.security')} <span className="ml-2 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Em Breve</span>
                </h3>
                <div className="flex items-center justify-between p-3">
                    <p className="font-bold text-slate-700 dark:text-gray-300">{t('settings.general.security_2fa')}</p>
                    <button disabled className="text-sm font-bold text-slate-400 border px-3 py-1 rounded-lg">Configurar</button>
                </div>
            </div>

            {/* SAVE BUTTON (Usually auto-save for prefs, but button provided for form consistency) */}
            <div className="flex justify-end pt-4">
                <button
                    onClick={handleSave}
                    className="px-8 py-3 bg-slate-800 dark:bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-slate-900 dark:hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                    Salvar Preferências
                </button>
            </div>

        </div>
    );
};

export default GeneralSettingsForm;
