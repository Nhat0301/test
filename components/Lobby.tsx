import React from 'react';
import { FileText, Plus, Clock, Layout, Scissors, Stethoscope } from 'lucide-react';

interface LobbyProps {
  onSelectForm: (type: 'surgical' | 'internal_med') => void;
}

export const Lobby: React.FC<LobbyProps> = ({ onSelectForm }) => {
  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">
          MediG
        </h1>
        <p className="text-xl text-gray-500 dark:text-slate-400 max-w-2xl mx-auto">
          Công cụ làm bệnh án nhanh gọn.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
        {/* Create New - Surgical */}
        <button 
          onClick={() => onSelectForm('surgical')}
          className="group relative bg-white dark:bg-slate-800 rounded-3xl p-8 text-left shadow-lg hover:shadow-2xl hover:shadow-blue-200 dark:hover:shadow-blue-900/50 transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 dark:border-slate-700 overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <Scissors className="w-32 h-32 text-blue-600" />
          </div>
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Plus className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-slate-200 mb-2">Bệnh Án Ngoại Khoa</h3>
            <div className="mt-6 flex items-center text-blue-600 dark:text-blue-400 font-semibold group-hover:translate-x-2 transition-transform">
              Bắt đầu ngay &rarr;
            </div>
          </div>
        </button>

        {/* Create New - Internal Med */}
        <button 
          onClick={() => onSelectForm('internal_med')}
          className="group relative bg-white dark:bg-slate-800 rounded-3xl p-8 text-left shadow-lg hover:shadow-2xl hover:shadow-rose-200 dark:hover:shadow-rose-900/50 transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 dark:border-slate-700 overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <Stethoscope className="w-32 h-32 text-rose-600" />
          </div>
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Plus className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-slate-200 mb-2">Bệnh Án Nội Khoa</h3>
            <div className="mt-6 flex items-center text-rose-600 dark:text-rose-400 font-semibold group-hover:translate-x-2 transition-transform">
              Bắt đầu ngay &rarr;
            </div>
          </div>
        </button>

        <div className="bg-gray-50 dark:bg-slate-800/50 rounded-3xl p-8 border-2 border-dashed border-gray-200 dark:border-slate-700 flex flex-col items-center justify-center text-center opacity-60">
          <Layout className="w-12 h-12 text-gray-400 dark:text-slate-500 mb-4" />
          <h3 className="text-xl font-bold text-gray-600 dark:text-slate-400">Bệnh Án Nhi Khoa</h3>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-2">Sắp ra mắt</p>
        </div>
      </div>

      <div className="mt-16 bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between">
        <div>
           <h3 className="text-lg font-bold text-gray-800 dark:text-slate-200">Hoạt động gần đây</h3>
           <p className="text-gray-500 dark:text-slate-400 text-sm">Chưa có bệnh án nào được tạo hôm nay.</p>
        </div>
        <button className="text-indigo-600 dark:text-indigo-400 font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-4 py-2 rounded-lg transition-colors">
          Xem lịch sử
        </button>
      </div>
    </div>
  );
};