import React from 'react';
import { FileText, Scissors, ArrowLeft } from 'lucide-react';

interface SurgicalChoiceProps {
  onSelect: (type: 'pre_op' | 'post_op') => void;
  onBack: () => void;
}

export const SurgicalChoice: React.FC<SurgicalChoiceProps> = ({ onSelect, onBack }) => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-fadeIn">
      <div className="mb-12 text-center relative">
        <button 
          onClick={onBack} 
          className="absolute left-0 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          aria-label="Quay lại"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-slate-300" />
        </button>
        <h1 className="text-4xl font-extrabold text-gray-800 dark:text-slate-100">
          Chọn Bệnh Án Ngoại Khoa
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Pre-Op Card */}
        <button 
          onClick={() => onSelect('pre_op')}
          className="group relative bg-white dark:bg-slate-800 rounded-3xl p-8 text-left shadow-lg hover:shadow-2xl hover:shadow-indigo-200 dark:hover:shadow-indigo-900/50 transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 dark:border-slate-700 overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <FileText className="w-32 h-32 text-indigo-600" />
          </div>
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-slate-200 mb-2">Bệnh Án Tiền Phẫu</h3>
            <div className="mt-6 flex items-center text-indigo-600 dark:text-indigo-400 font-semibold group-hover:translate-x-2 transition-transform">
              Chọn &rarr;
            </div>
          </div>
        </button>

        {/* Post-Op Card */}
        <button 
          onClick={() => onSelect('post_op')}
          className="group relative bg-white dark:bg-slate-800 rounded-3xl p-8 text-left shadow-lg hover:shadow-2xl hover:shadow-emerald-200 dark:hover:shadow-emerald-900/50 transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 dark:border-slate-700 overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <Scissors className="w-32 h-32 text-emerald-600" />
          </div>
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Scissors className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-slate-200 mb-2">Bệnh Án Hậu Phẫu</h3>
            <div className="mt-6 flex items-center text-emerald-600 dark:text-emerald-400 font-semibold group-hover:translate-x-2 transition-transform">
              Chọn &rarr;
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};