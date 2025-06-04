import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userStatsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useTheme } from '../context/ThemeContext'; // useTheme hook'u import edildi

const StatCard = ({ title, value, icon }) => (
  <div className="bg-gray-100 p-4 rounded-lg shadow text-center">
    <div className="text-3xl mb-2">{icon}</div>
    <div className="text-2xl font-bold text-primary-600">{value}</div>
    <div className="text-sm text-gray-600">{title}</div>
  </div>
);

const ProfilePage = () => {
  const { theme, setCurrentTheme } = useTheme(); // Theme context'i kullanıldı
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      setStatsError('');
      try {
        const response = await userStatsAPI.getUserDashboardStats();
        if (response.success) {
          setDashboardStats({
            streak_days: response.streak_days || 0,
            completed_today: response.completed_today || 0,
            total_points: response.total_points || 0,
            total_questions_available: response.total_questions_available || 0,
          });
        } else {
          setStatsError(response.message || 'İstatistikler yüklenemedi.');
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        setStatsError(error.message || 'İstatistikler yüklenirken bir hata oluştu.');
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white shadow-xl rounded-lg p-6 sm:p-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-6 text-center">Profilim</h1>

        {loadingStats && (
          <div className="my-8">
            <LoadingSpinner text="İstatistikler yükleniyor..." />
          </div>
        )}
        {statsError && !loadingStats && (
          <div className="my-8 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
            <p className="text-red-700">{statsError}</p>
          </div>
        )}
        {dashboardStats && !loadingStats && !statsError && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center sm:text-left">Genel İstatistiklerim</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <StatCard title="Güncel Seri" value={`${dashboardStats.streak_days} gün`} icon="🔥" />
              <StatCard title="Bugün Tamamlanan" value={dashboardStats.completed_today} icon="🎯" />
              <StatCard title="Toplam Puan" value={dashboardStats.total_points} icon="🏆" />
            </div>
          </div>
        )}
        
        <hr className="my-8" />

        {/* Tema Seçimi Bölümü */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center sm:text-left dark:text-gray-300">Tema Ayarları</h2>
          <div className="flex flex-col sm:flex-row justify-center sm:justify-start items-center gap-4">
            <button
              onClick={() => setCurrentTheme('light')}
              className={`w-full sm:w-auto font-semibold py-2 px-4 border rounded-lg shadow-sm transition-colors duration-200 flex items-center justify-center space-x-2
                          ${theme === 'light'
                            ? 'bg-primary-500 text-white border-primary-600 ring-2 ring-primary-300'
                            : 'bg-white hover:bg-gray-100 text-gray-800 border-gray-300'}`}
              title="Gündüz Teması"
            >
              <span>☀️</span>
              <span>Gündüz Teması</span>
            </button>
            <button
              onClick={() => setCurrentTheme('dark')}
              className={`w-full sm:w-auto font-semibold py-2 px-4 border rounded-lg shadow-sm transition-colors duration-200 flex items-center justify-center space-x-2
                          ${theme === 'dark'
                            ? 'bg-slate-600 text-white border-slate-700 ring-2 ring-slate-400'
                            : 'bg-gray-700 hover:bg-gray-800 text-white border-gray-600'}`}
              title="Gece Teması"
            >
              <span>🌙</span>
              <span>Gece Teması</span>
            </button>
          </div>
        </div>

        <hr className="my-8 dark:border-gray-600" />
        
        <div className="text-center">
          <p className="text-gray-600 mb-6 dark:text-gray-400">
            Diğer profil ayarları yakında eklenecektir.
          </p>
          <Link
            to="/"
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 sm:py-3 sm:px-6 rounded-lg transition-colors duration-200 dark:bg-primary-500 dark:hover:bg-primary-600"
          >
            Anasayfaya Dön
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;