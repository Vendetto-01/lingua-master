import React from 'react';
import { Link } from 'react-router-dom';

const ProfilePage = () => {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white shadow-md rounded-lg p-6 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">Profil Sayfası</h1>
        <p className="text-gray-600 mb-6">
          Bu bölüm geliştirme aşamasındadır ve yakında güncellenecektir.
        </p>
        <div className="animate-pulse mb-6">
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
        <Link 
          to="/" 
          className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 sm:py-3 sm:px-6 rounded-lg transition-colors duration-200"
        >
          Anasayfaya Dön
        </Link>
      </div>
    </div>
  );
};

export default ProfilePage;