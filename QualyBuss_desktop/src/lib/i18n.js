
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
    'pt-BR': {
        translation: {
            settings: {
                title: 'Centro de Controle',
                subtitle: 'Gerencie todos os aspectos do sistema QualyBuss.',
                tabs: {
                    companies: 'Empresas',
                    companies_desc: 'Cadastro de Lojas e Filiais',
                    users: 'Usuários',
                    users_desc: 'Acesso e Permissões',
                    ai: 'Inteligência Artificial',
                    ai_desc: 'Configuração do Assistente',
                    general: 'Configurações Gerais',
                    general_desc: 'Sistema e Aparência'
                },
                general: {
                    title: 'Preferências Globais',
                    appearance: 'Aparência',
                    theme_light: 'Claro',
                    theme_dark: 'Escuro',
                    theme_system: 'Sistema',
                    language: 'Idioma',
                    notifications: 'Notificações',
                    notifications_email: 'Alertas por Email',
                    notifications_push: 'Notificações Push',
                    notifications_sound: 'Sons do Sistema',
                    security: 'Segurança',
                    security_2fa: 'Autenticação em Dois Fatores (2FA)',
                    save_success: 'Preferências salvas com sucesso!',
                    save_error: 'Erro ao salvar preferências.'
                }
            }
        }
    },
    'en-US': {
        translation: {
            settings: {
                title: 'Control Center',
                subtitle: 'Manage all aspects of the QualyBuss system.',
                tabs: {
                    companies: 'Companies',
                    companies_desc: 'Stores and Branches Registration',
                    users: 'Users',
                    users_desc: 'Access and Permissions',
                    ai: 'Artificial Intelligence',
                    ai_desc: 'Assistant Configuration',
                    general: 'General Settings',
                    general_desc: 'System and Appearance'
                },
                general: {
                    title: 'Global Preferences',
                    appearance: 'Appearance',
                    theme_light: 'Light',
                    theme_dark: 'Dark',
                    theme_system: 'System',
                    language: 'Language',
                    notifications: 'Notifications',
                    notifications_email: 'Email Alerts',
                    notifications_push: 'Push Notifications',
                    notifications_sound: 'System Sounds',
                    security: 'Security',
                    security_2fa: 'Two-Factor Authentication (2FA)',
                    save_success: 'Preferences saved successfully!',
                    save_error: 'Error saving preferences.'
                }
            }
        }
    },
    'es': {
        translation: {
            settings: {
                title: 'Centro de Control',
                subtitle: 'Administre todos los aspectos del sistema QualyBuss.',
                tabs: {
                    companies: 'Empresas',
                    companies_desc: 'Registro de Tiendas y Sucursales',
                    users: 'Usuarios',
                    users_desc: 'Acceso y Permisos',
                    ai: 'Inteligencia Artificial',
                    ai_desc: 'Configuración del Asistente',
                    general: 'Configuraciones Generales',
                    general_desc: 'Sistema y Apariencia'
                },
                general: {
                    title: 'Preferencias Globales',
                    appearance: 'Apariencia',
                    theme_light: 'Claro',
                    theme_dark: 'Oscuro',
                    theme_system: 'Sistema',
                    language: 'Idioma',
                    notifications: 'Notificaciones',
                    notifications_email: 'Alertas por Correo',
                    notifications_push: 'Notificaciones Push',
                    notifications_sound: 'Sonidos del Sistema',
                    security: 'Seguridad',
                    security_2fa: 'Autenticación de Dos Factores (2FA)',
                    save_success: '¡Preferencias guardadas con éxito!',
                    save_error: 'Error al guardar las preferencias.'
                }
            }
        }
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'pt-BR',
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
