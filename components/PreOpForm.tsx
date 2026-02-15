import React, { useState, useRef } from 'react';
import { PatientRecord, VitalSigns, OrganExam, HistoryItem, ChatMessage } from '../types';
import { exportToDocx } from '../services/docxService';
import { generateMedicalText } from '../services/geminiService';
import { ChatPopup } from './ChatPopup';
import { 
  FileDown, User, Activity, Stethoscope, 
  ClipboardCheck, BrainCircuit, FlaskConical, Search, Plus, Trash2,
  CheckCircle2, Eye, X, ArrowLeft, Image as ImageIcon, Table as TableIcon,
  Printer, Sparkles, Loader2, MessageCircle
} from 'lucide-react';

interface PreOpFormProps {
  onBack: () => void;
  isAiEnabled: boolean;
}

const emptyVitals: VitalSigns = {
  pulse: '', temp: '37', bp1: '', bp2: '', resp: '', spo2: '', weight: '', height: '', bmi: '', classification: ''
};

const initialData: PatientRecord = {
  id: '',
  adminDetails: {
    fullName: '', birthYear: '', ethnicity: 'Kinh', gender: 'Nam', address: '', occupation: '', admissionDate: '', reportDate: ''
  },
  reasonForAdmission: '',
  history: { informant: 'Bệnh nhân', description: '' },
admissionState: {
  vitals: { ...emptyVitals },
  systemReview: `Tim mạch: không đau ngực, không hồi hộp, không đánh trống ngực.
Hô hấp: không ho, không khó thở, không khò khè.
Tiêu hóa: Không đau bụng, không buồn nôn và nôn, không bí trung đại tiện.
Tiết niệu – sinh dục: không tiểu buốt/tiểu lắt nhắt, nước tiểu vàng trong.
Thần kinh: không đau đầu, không chóng mặt, không khó ngủ.
Cơ xương khớp: không giới hạn vận động, không đau nhức các khớp và cơ.`
},
  pastHistory: {
    personal: { 
      custom: []
    },
    family: { enabled: true, content: '' }
  },
  examination: {
    date: '',
    time: '',
    vitals: { ...emptyVitals },
    general: `Bệnh nhân tỉnh, tiếp xúc tốt.
Da niêm hồng hào.
Hạch ngoại vi không sờ chạm.
Chi ấm, không phù.
Mạch quay rõ, CRT<2s.`,
    customOrgans: [],
  },
  summary: '',
  problemList: '',
  preliminaryDiagnosis: '',
  differentialDiagnosis: '',
  clinicalDiscussion: '',
  paraclinicalRequests: '',
  paraclinicalResults: [],
  paraclinicalDiscussion: '',
  finalDiagnosis: '',
  treatmentPlan: '',
};

const CLASSES = {
  label: "block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 ml-1 tracking-wide",
  input: "w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/50 outline-none transition-all duration-200 ease-in-out shadow-sm text-base",
  textarea: "w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/50 outline-none transition-all duration-200 ease-in-out shadow-sm min-h-[120px] text-base resize-y",
  btnSecondary: "px-4 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 font-bold transition-colors border border-gray-200 dark:border-slate-700 flex items-center justify-center gap-2",
  sectionContainer: "bg-white dark:bg-slate-800/50 p-6 md:p-8 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm",
  checkbox: "w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 cursor-pointer",
  aiButton: "flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 rounded-lg text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors border border-purple-200 dark:border-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
};

const autoFormatDate = (value: string) => {
  const v = value.replace(/\D/g, '').slice(0, 8);
  if (v.length >= 5) return `${v.slice(0,2)}/${v.slice(2,4)}/${v.slice(4)}`;
  if (v.length >= 3) return `${v.slice(0,2)}/${v.slice(2)}`;
  return v;
};

const autoFormatTime = (value: string) => {
  const v = value.replace(/\D/g, '').slice(0, 4);
  if (v.length >= 3) return `${v.slice(0,2)}:${v.slice(2)}`;
  return v;
};

// --- COMPONENT: RENDER TEXT AREA ---
const RenderTextArea = ({ label, value, onChange, placeholder, aiTask, isGenerating, onAIGenerate, isAiEnabled }: any) => (
  <div className="mb-4">
    <div className="flex justify-between items-center mb-2">
       {label && <label className={CLASSES.label}>{label}</label>}
       {isAiEnabled && aiTask && (
           <button 
              onClick={onAIGenerate}
              disabled={isGenerating}
              className={`${CLASSES.aiButton} ${isGenerating ? 'opacity-70' : ''}`}
              title="Tự động viết dựa trên dữ liệu đã nhập"
           >
              {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              {isGenerating ? 'Đang viết...' : 'Hỗ trợ AI'}
           </button>
       )}
    </div>
    <textarea 
      className={CLASSES.textarea} 
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
    />
  </div>
);

// --- PREVIEW MODAL ---
const PreviewModal: React.FC<{ data: PatientRecord; onClose: () => void }> = ({ data, onClose }) => {
  const currentYear = new Date().getFullYear();
  const age = data.adminDetails.birthYear ? currentYear - parseInt(data.adminDetails.birthYear) : '';

  const handlePrint = () => {
    window.print();
  };

  const RomanHeader = ({ text }: { text: string }) => (
    <h3 className="font-bold text-[13pt] mt-4 mb-2 uppercase leading-[1.5] break-after-avoid text-left">{text}</h3>
  );

  const NumberHeader = ({ text }: { text: string }) => (
    <div className="font-bold text-[13pt] mb-1 leading-[1.5] break-after-avoid text-left">{text}</div>
  );

  const FormattedText = ({ text, mode = 'dash' }: { text: string, mode?: 'dash' | 'plus' }) => {
    if (!text) return null;
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const indentClass = mode === 'plus' ? 'pl-8' : 'pl-0';
    const bulletChar = mode === 'plus' ? '+' : '–';

    return (
      <div className={`text-[13pt] leading-[1.5] text-left break-words ${indentClass}`}>
        {lines.map((line, idx) => (
          <div key={idx} className="flex items-start">
             <span className="mr-2 min-w-[10px] select-none font-medium">{bulletChar}</span>
             <span className="flex-1">{line.trim()}</span>
          </div>
        ))}
      </div>
    );
  };

  const BulletLine = ({ bullet, label, value, indentClass = "pl-0" }: { bullet: string, label?: string, value: any, indentClass?: string }) => (
    <div className={`flex items-start text-[13pt] leading-[1.5] ${indentClass} mb-1`}>
      <span className="min-w-[20px] select-none font-medium">{bullet}</span>
      <span className="flex-1 text-left break-words">
        {label && <span className="">{label}: </span>}
        {value}
      </span>
    </div>
  );

  const DashLine = ({ label, value }: { label?: string, value: any }) => (
    <BulletLine bullet="–" label={label} value={value} />
  );

  const VitalsDisplay = ({ vitals }: { vitals: VitalSigns }) => (
    <div className="pl-0 text-[13pt] leading-[1.5] mb-2 text-left">
      <div className="grid grid-cols-2 gap-y-1 gap-x-4">
        <div><span className="italic">Mạch:</span> <span className="">{vitals?.pulse || "..."}</span> lần/phút</div>
        <div><span className="italic">SpO2:</span> <span className="">{vitals?.spo2 || "..."}</span> %(KT)</div>
        <div><span className="italic">Huyết áp:</span> <span className="">{vitals?.bp1}/{vitals?.bp2}</span> mmHg</div>
        <div><span className="italic">Nhịp thở:</span> <span className="">{vitals?.resp || "..."}</span> lần/phút</div>
        <div className="col-span-2"><span className="italic">Nhiệt độ:</span> <span className="">{vitals?.temp || "..."}</span> °C</div>
      </div>
      {vitals?.weight && vitals?.height && (
          <div className="mt-1 text-[13pt]">
             <div className="flex gap-4">
                <span>– Chiều cao: {vitals.height} cm</span>
                <span>– Cân nặng: {vitals.weight} kg</span>
             </div>
             <div className="ml-0">→ BMI: <span className="">{vitals.bmi}</span> kg/m² ({vitals.classification})</div>
          </div>
      )}
    </div>
  );

  const renderOrganSection = () => {
    let counter = 2;
    
    const renderSingleOrgan = (label: string, item: OrganExam) => (
      <div className="break-inside-avoid mt-2">
         <NumberHeader text={`${counter++}. ${label}:`} />
          {(item.techniques || []).map((tech: any) => tech.name && (
              <div key={tech.id} className="mt-1">
                  <div className="text-[13pt] leading-[1.5] flex items-start">
                     <span className="mr-2 min-w-[10px] select-none font-medium">–</span>
                     <span className="flex-1">{tech.name}:</span>
                  </div>
                  <FormattedText text={tech.content} mode="plus" />
              </div>
          ))}
         <div className="pl-0"><FormattedText text={item.generalContent} mode="dash" /></div>
      </div>
    );

    return (
      <>
        {(data.examination.customOrgans || []).map(item => {
           return (item && item.enabled && item.name) ? <div key={item.id}>{renderSingleOrgan(item.name, item)}</div> : null;
        })}
      </>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-gray-900/90 backdrop-blur-sm">
      <style>{`
        @media print {
          @page { margin: 0; size: auto; }
          body > *:not(#print-modal-container) { display: none; }
          #print-modal-container { position: absolute; inset: 0; background: white; z-index: 9999; display: block; }
          #print-content { width: 100% !important; box-shadow: none !important; margin: 0 !important; padding: 20mm !important; }
          #print-controls { display: none !important; }
        }
      `}</style>
      <div id="print-controls" className="flex justify-between items-center px-6 py-4 bg-white border-b border-gray-200 shadow-md z-10 flex-shrink-0">
          <div className="flex flex-col">
             <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
               <Eye className="w-6 h-6 text-blue-600" /> Xem trước Bệnh Án
             </h2>
             <span className="text-sm text-gray-500 ml-8 font-medium">Khổ giấy A4 (21cm x 29.7cm)</span>
          </div>
          <div className="flex gap-3">
            <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-all shadow-lg hover:shadow-blue-200 active:scale-95">
               <Printer className="w-5 h-5" /> In Ngay
            </button>
            <button onClick={onClose} className="p-2.5 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
               <X className="w-6 h-6" />
            </button>
          </div>
      </div>
      <div className="flex-1 overflow-auto bg-gray-800/50 p-4 md:p-8 print-scroll-container" id="print-modal-container">
         <div className="min-w-fit min-h-full flex justify-center items-start">
            <div id="print-content" className="bg-white shadow-2xl flex-shrink-0 text-black box-border origin-top" style={{ width: '210mm', minHeight: '297mm', padding: '20mm', fontFamily: '"Times New Roman", Times, serif' }}>
              
              <table className="w-full border-collapse border border-black mb-6 text-[13pt] break-inside-avoid table-fixed">
                <thead>
                  <tr>
                    <th className="border border-black p-2 w-[20%] text-center font-bold align-middle">Đánh giá</th>
                    <th className="border border-black p-2 w-[60%] text-center font-bold align-middle">Nhận xét</th>
                    <th className="border border-black p-2 w-[20%] text-center font-bold align-middle">Chữ kí</th>
                  </tr>
                </thead>
                <tbody>
                   <tr className="h-[100px]">
                     <td className="border border-black"></td><td className="border border-black"></td><td className="border border-black"></td>
                   </tr>
                </tbody>
              </table>

              <h1 className="text-center font-bold text-[18pt] mb-8 mt-4 uppercase leading-[1.5]">BỆNH ÁN TIỀN PHẪU</h1>
              <div className="space-y-2 text-left">
                <div className="break-inside-avoid">
                    <RomanHeader text="I. HÀNH CHÍNH:" />
                    <DashLine label="Họ và tên" value={<span className="font-bold">{data.adminDetails.fullName.toUpperCase()}</span>} />
                    <DashLine label="Năm sinh" value={`${data.adminDetails.birthYear} (${age} tuổi)`} />
                    <DashLine label="Giới tính" value={data.adminDetails.gender} />
                    <DashLine label="Dân tộc" value={data.adminDetails.ethnicity} />
                    <DashLine label="Địa chỉ" value={data.adminDetails.address} />
                    <DashLine label="Nghề nghiệp" value={data.adminDetails.occupation} />
                    <DashLine label="Ngày nhập viện" value={data.adminDetails.admissionDate} />
                    <DashLine label="Ngày làm bệnh án" value={data.adminDetails.reportDate} />
                </div>
                <div className="break-inside-avoid pt-2"><RomanHeader text="II. LÝ DO NHẬP VIỆN:" /><FormattedText text={data.reasonForAdmission} mode="dash" /></div>
                <div className="break-inside-avoid pt-2">
                    <RomanHeader text="III. BỆNH SỬ:" />
                    <DashLine label="Người khai bệnh" value={data.history.informant} />
                    <div className="pl-0 mt-1"><FormattedText text={data.history.description} mode="dash" /></div>
                </div>
                
                <div className="break-inside-avoid pt-2">
                    <RomanHeader text="IV. TÌNH TRẠNG LÚC NHẬP VIỆN:" />
                    <NumberHeader text="1. Sinh hiệu:" /><VitalsDisplay vitals={data.admissionState.vitals} />
                    <NumberHeader text="2. Lược qua các cơ quan:" /><div className="pl-0"><FormattedText text={data.admissionState.systemReview} mode="dash" /></div>
                </div>

                <div className="break-inside-avoid pt-2">
                    <RomanHeader text="V. TIỀN CĂN:" />
                    <NumberHeader text="1. Tiền căn cá nhân:" />
                    {(data.pastHistory.personal.custom || []).map(item => item.name && (
                        <div key={item.id}>
                            <div className="text-[13pt] leading-[1.5] flex items-start mt-1">
                               <span className="mr-2 min-w-[10px] select-none font-medium">–</span>
                               <span className="flex-1">{item.name}:</span>
                            </div>
                            <FormattedText text={item.content} mode="plus" />
                        </div>
                    ))}

                    <NumberHeader text="2. Tiền căn gia đình:" />
                    <FormattedText text={data.pastHistory.family.content || "Chưa ghi nhận bất thường"} mode="dash" />
                </div>

                <div className="pt-2">
                    <RomanHeader text="VI. KHÁM LÂM SÀNG:" />
                    <div className="break-inside-avoid">
                        <DashLine label="Thời gian khám" value={`${data.examination.time || '...'} ngày ${data.examination.date || '...'}`} />
                        <NumberHeader text="1. Tổng trạng:" /><VitalsDisplay vitals={data.examination.vitals} />
                        <div className="pl-0 mb-2"><FormattedText text={data.examination.general} mode="dash" /></div>
                    </div>
                    <div className="mt-1">{renderOrganSection()}</div>
                </div>

                <div className="break-inside-avoid pt-2"><RomanHeader text="VII. TÓM TẮT BỆNH ÁN:" /><FormattedText text={data.summary} mode="dash" /></div>
                <div className="break-inside-avoid pt-2"><RomanHeader text="VIII. ĐẶT VẤN ĐỀ:" /><FormattedText text={data.problemList} mode="dash" /></div>
                <div className="break-inside-avoid pt-2"><RomanHeader text="IX. CHẨN ĐOÁN SƠ BỘ:" /><FormattedText text={data.preliminaryDiagnosis} mode="dash" /></div>
                <div className="break-inside-avoid pt-2"><RomanHeader text="X. CHẨN ĐOÁN PHÂN BIỆT:" /><FormattedText text={data.differentialDiagnosis} mode="dash" /></div>
                <div className="break-inside-avoid pt-2"><RomanHeader text="XI. BIỆN LUẬN LÂM SÀNG:" /><FormattedText text={data.clinicalDiscussion} mode="dash" /></div>
                <div className="break-inside-avoid pt-2"><RomanHeader text="XII. ĐỀ NGHỊ CẬN LÂM SÀNG:" /><FormattedText text={data.paraclinicalRequests} mode="dash" /></div>
                
                <div className="break-inside-avoid pt-2">
                    <RomanHeader text="XIII. KẾT QUẢ CẬN LÂM SÀNG:" />
                    {(data.paraclinicalResults || []).map((item, i) => (
                      <div key={item.id} className="mb-2">
                        <NumberHeader text={`${i+1}. ${item.name} (${item.date}):`} />
                        <FormattedText text={item.resultText} mode="dash" />
                        {item.tableData && (
                            <div className="pl-8 mb-2">
                              <table className="w-full border-collapse border border-black text-sm">
                                  <tbody>
                                      {item.tableData.map((row, rIdx) => (
                                          <tr key={rIdx}>
                                              {row.map((cell, cIdx) => (
                                                  <td key={cIdx} className={`border border-black p-1 ${rIdx===0 ? 'font-bold bg-gray-200 text-center' : ''}`}>{cell}</td>
                                              ))}
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                            </div>
                        )}
                        {item.image && (
                            <div className="pl-8 w-full mt-2">
                                <img src={item.image} alt="CLS" className="w-full object-contain border border-gray-300" />
                            </div>
                        )}
                      </div>
                    ))}
                </div>

                <div className="break-inside-avoid pt-2"><RomanHeader text="XIV. BIỆN LUẬN CẬN LÂM SÀNG:" /><FormattedText text={data.paraclinicalDiscussion} mode="dash" /></div>
                <div className="break-inside-avoid pt-2"><RomanHeader text="XV. CHẨN ĐOÁN XÁC ĐỊNH:" /><p className="text-[13pt] font-bold leading-[1.5] text-left break-words">{data.finalDiagnosis}</p></div>
                <div className="break-inside-avoid pt-2"><RomanHeader text="XVI. HƯỚNG XỬ TRÍ:" /><FormattedText text={data.treatmentPlan} mode="dash" /></div>
              </div>
           </div>
         </div>
      </div>
    </div>
  );
};

export const PreOpForm: React.FC<PreOpFormProps> = ({ onBack, isAiEnabled }) => {
  const [data, setData] = useState<PatientRecord>(initialData);
  const [showPreview, setShowPreview] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadIndex, setActiveUploadIndex] = useState<number | null>(null);

  const update = (path: string, value: any) => {
    setData(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let current = next;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;

      if (path === 'examination.vitals.weight' || path === 'examination.vitals.height') {
         const wStr = next.examination.vitals.weight;
         const hStr = next.examination.vitals.height;
         const w = parseFloat(wStr);
         const h = parseFloat(hStr);
         if (!isNaN(w) && !isNaN(h) && h > 0) {
            const hM = h / 100;
            const bmi = (w / (hM * hM)).toFixed(2);
            const bmiVal = parseFloat(bmi);
            next.examination.vitals.bmi = bmi;
            if (bmiVal < 18.5) next.examination.vitals.classification = "Nhẹ cân theo IDI & WPRO";
            else if (bmiVal < 23) next.examination.vitals.classification = "Bình thường theo IDI & WPRO";
            else if (bmiVal < 25) next.examination.vitals.classification = "Thừa cân theo IDI & WPRO";
            else if (bmiVal < 30) next.examination.vitals.classification = "Béo phì độ I theo IDI & WPRO";
            else next.examination.vitals.classification = "Béo phì độ II theo IDI & WPRO";
         } else {
             next.examination.vitals.bmi = '';
             next.examination.vitals.classification = '';
         }
      }

      return next;
    });
  };

  const calculatedAge = data.adminDetails.birthYear 
      ? `${new Date().getFullYear() - parseInt(data.adminDetails.birthYear)} tuổi` 
      : '';

  const handleAIGenerate = async (task: any, fieldPath: string) => {
    setAiLoading(task);
    try {
      const result = await generateMedicalText(data, task);
      update(fieldPath, result);
    } catch (error) {
      console.error(error);
      alert("Lỗi khi gọi AI: " + error);
    } finally {
      setAiLoading(null);
    }
  };

  const handleImageClick = (index: number) => {
    setActiveUploadIndex(index);
    if (fileInputRef.current) { fileInputRef.current.value = ''; fileInputRef.current.click(); }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeUploadIndex !== null) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const newResults = [...data.paraclinicalResults];
            newResults[activeUploadIndex].image = reader.result as string;
            update('paraclinicalResults', newResults);
            setActiveUploadIndex(null);
        };
        reader.readAsDataURL(file);
    }
  };
  const handleAddTable = (index: number) => {
      const newResults = [...data.paraclinicalResults];
      if (!newResults[index].tableData) {
          newResults[index].tableData = [['Tên xét nghiệm', 'Kết quả', 'Trị số tham chiếu', 'Đơn vị'],['', '', '', '']];
          update('paraclinicalResults', newResults);
      }
  };
  const updateTableData = (resultIndex: number, rowIndex: number, colIndex: number, val: string) => {
      const newResults = [...data.paraclinicalResults];
      if (newResults[resultIndex].tableData) {
          newResults[resultIndex].tableData![rowIndex][colIndex] = val;
          update('paraclinicalResults', newResults);
      }
  };
  const addTableRow = (resultIndex: number) => {
      const newResults = [...data.paraclinicalResults];
      if (newResults[resultIndex].tableData) {
          const cols = newResults[resultIndex].tableData![0].length;
          newResults[resultIndex].tableData!.push(new Array(cols).fill(''));
          update('paraclinicalResults', newResults);
      }
  };
  const removeTableRow = (resultIndex: number, rowIndex: number) => {
      const newResults = [...data.paraclinicalResults];
      if (newResults[resultIndex]?.tableData) {
          newResults[resultIndex].tableData!.splice(rowIndex, 1);
          update('paraclinicalResults', newResults);
      }
  };
  const removeTable = (idx: number) => { const n = [...data.paraclinicalResults]; delete n[idx].tableData; update('paraclinicalResults', n); };
  const removeImage = (idx: number) => { const n = [...data.paraclinicalResults]; delete n[idx].image; update('paraclinicalResults', n); };


  return (
    <div className="max-w-5xl mx-auto pb-20">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 sticky top-0 bg-gray-50/95 dark:bg-slate-900/95 backdrop-blur-md z-40 py-4 border-b border-gray-200 dark:border-slate-800 shadow-sm px-1 rounded-b-xl">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors group">
            <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-slate-100" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-200 tracking-tight">Bệnh Án Tiền Phẫu</h1>
          </div>
        </div>
        <div className="flex gap-3">
           <button onClick={() => setShowPreview(true)} className={CLASSES.btnSecondary}>
             <Eye className="w-4 h-4" /> Xem trước
           </button>
           <button onClick={() => exportToDocx(data)} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-indigo-300 font-bold shadow-lg flex items-center gap-2 transition-transform active:scale-95">
             <FileDown className="w-4 h-4" /> Xuất Word
           </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* I. HÀNH CHÍNH */}
        <div className={CLASSES.sectionContainer}>
           <h2 className="text-lg font-bold text-indigo-700 dark:text-indigo-400 mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-2">
             <User className="w-5 h-5" /> I. HÀNH CHÍNH
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={CLASSES.label}>Họ và tên</label>
                <input className={CLASSES.input} value={data.adminDetails.fullName} onChange={e => update('adminDetails.fullName', e.target.value)} placeholder="Nguyễn Văn A" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={CLASSES.label}>Năm sinh</label>
                  <div className="relative">
                      <input className={CLASSES.input} type="number" value={data.adminDetails.birthYear} onChange={e => update('adminDetails.birthYear', e.target.value)} placeholder="1960" />
                      {calculatedAge && <span className="absolute right-3 top-3 text-gray-500 dark:text-slate-400 font-medium text-sm bg-gray-100 dark:bg-slate-700 px-2 rounded">{calculatedAge}</span>}
                  </div>
                </div>
                <div>
                   <label className={CLASSES.label}>Giới tính</label>
                   <select className={CLASSES.input} value={data.adminDetails.gender} onChange={e => update('adminDetails.gender', e.target.value)}>
                     <option value="Nam">Nam</option>
                     <option value="Nữ">Nữ</option>
                   </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className={CLASSES.label}>Dân tộc</label>
                   <input className={CLASSES.input} value={data.adminDetails.ethnicity} onChange={e => update('adminDetails.ethnicity', e.target.value)} />
                </div>
                <div>
                   <label className={CLASSES.label}>Nghề nghiệp</label>
                   <input className={CLASSES.input} value={data.adminDetails.occupation} onChange={e => update('adminDetails.occupation', e.target.value)} />
                </div>
              </div>
              <div className="md:col-span-2">
                 <label className={CLASSES.label}>Địa chỉ</label>
                 <input className={CLASSES.input} value={data.adminDetails.address} onChange={e => update('adminDetails.address', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={CLASSES.label}>Ngày nhập viện</label>
                    <input className={CLASSES.input} type="text" placeholder="dd/mm/yyyy" value={data.adminDetails.admissionDate} onChange={e => update('adminDetails.admissionDate', autoFormatDate(e.target.value))} />
                  </div>
                  <div>
                    <label className={CLASSES.label}>Ngày làm bệnh án</label>
                    <input className={CLASSES.input} type="text" placeholder="dd/mm/yyyy" value={data.adminDetails.reportDate} onChange={e => update('adminDetails.reportDate', autoFormatDate(e.target.value))} />
                  </div>
              </div>
           </div>
        </div>

        {/* II. LÝ DO NHẬP VIỆN */}
        <div className={CLASSES.sectionContainer}>
          <h2 className="text-lg font-bold text-indigo-700 dark:text-indigo-400 mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-2">
             <Activity className="w-5 h-5" /> II. LÝ DO NHẬP VIỆN
          </h2>
          <textarea className={CLASSES.textarea} value={data.reasonForAdmission} onChange={e => update('reasonForAdmission', e.target.value)} placeholder="VD: Đau bụng..." />
        </div>

        {/* III. BỆNH SỬ */}
        <div className={CLASSES.sectionContainer}>
           <h2 className="text-lg font-bold text-indigo-700 dark:text-indigo-400 mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-2">
             <ClipboardCheck className="w-5 h-5" /> III. BỆNH SỬ
           </h2>
           <div className="mb-4">
              <label className={CLASSES.label}>Người khai bệnh</label>
              <input className={CLASSES.input} value={data.history.informant} onChange={e => update('history.informant', e.target.value)} />
           </div>
           <RenderTextArea 
              label="Diễn tiến bệnh" 
              value={data.history.description} 
              onChange={(e: any) => update('history.description', e.target.value)} 
              placeholder="Mô tả..." 
              isAiEnabled={isAiEnabled}
           />
        </div>

        {/* IV. TÌNH TRẠNG LÚC NHẬP VIỆN */}
        <div className={CLASSES.sectionContainer}>
           <h2 className="text-lg font-bold text-indigo-700 dark:text-indigo-400 mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-2">
             <Activity className="w-5 h-5" /> IV. TÌNH TRẠNG LÚC NHẬP VIỆN
           </h2>
           <div className="mb-6 bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-500/20">
             <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-3 text-sm uppercase tracking-wider">Sinh hiệu</h3>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { k: 'pulse', l: 'Mạch (l/p)' },
                  { k: 'temp', l: 'Nhiệt độ (°C)' },
                  { k: 'resp', l: 'Nhịp thở (l/p)' },
                  { k: 'spo2', l: 'SpO2 (%)' }
                ].map(({k, l}) => (
                  <div key={k}>
                     <label className="text-xs uppercase font-bold text-gray-500 dark:text-slate-400 mb-1 block">{l}</label>
                     <input className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-200 outline-none" type="number" value={(data.admissionState.vitals as any)[k]} onChange={e => update(`admissionState.vitals.${k}`, e.target.value)} />
                  </div>
                ))}
                 <div className="md:col-span-2">
                     <label className="text-xs uppercase font-bold text-gray-500 dark:text-slate-400 mb-1 block">Huyết áp</label>
                     <div className="flex gap-2 items-center">
                        <input className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none" type="number" placeholder="Tâm thu" value={data.admissionState.vitals.bp1} onChange={e => update('admissionState.vitals.bp1', e.target.value)} />
                        <span className="text-gray-400 font-bold">/</span>
                        <input className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none" type="number" placeholder="Tâm trương" value={data.admissionState.vitals.bp2} onChange={e => update('admissionState.vitals.bp2', e.target.value)} />
                     </div>
                </div>
             </div>
           </div>
           <RenderTextArea label="Lược qua các cơ quan" value={data.admissionState.systemReview} onChange={(e: any) => update('admissionState.systemReview', e.target.value)} placeholder="Tỉnh, tiếp xúc tốt..." isAiEnabled={isAiEnabled} />
        </div>

        {/* V. TIỀN CĂN */}
        <div className={CLASSES.sectionContainer}>
            <h2 className="text-lg font-bold text-indigo-700 dark:text-indigo-400 mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-2">
               <Activity className="w-5 h-5" /> V. TIỀN CĂN
            </h2>
            <div className="space-y-4">
               {(data.pastHistory.personal.custom || []).map((item, index) => (
                    <div key={item.id} className="border p-4 rounded-xl border-dashed border-gray-400 dark:border-slate-600 bg-gray-50/50 dark:bg-slate-800 relative">
                        <button 
                           onClick={() => {
                               const newCustom = [...(data.pastHistory.personal.custom || [])];
                               newCustom.splice(index, 1);
                               update('pastHistory.personal.custom', newCustom);
                           }}
                           className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                           title="Xóa mục này"
                        >
                           <Trash2 className="w-3 h-3" />
                        </button>
                        <div className="flex flex-col md:flex-row gap-4">
                           <input 
                              className="w-full md:w-1/3 p-2 text-sm border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg font-bold"
                              value={item.name}
                              onChange={e => {
                                 const newCustom = [...(data.pastHistory.personal.custom || [])];
                                 newCustom[index].name = e.target.value;
                                 update('pastHistory.personal.custom', newCustom);
                              }}
                              placeholder="Tiền căn (Vd: Nội khoa)"
                           />
                           <textarea 
                              className="w-full md:w-2/3 p-2 text-sm border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg min-h-[60px]"
                              value={item.content}
                              onChange={e => {
                                 const newCustom = [...(data.pastHistory.personal.custom || [])];
                                 newCustom[index].content = e.target.value;
                                 update('pastHistory.personal.custom', newCustom);
                              }}
                              placeholder="Nhập nội dung tiền căn..."
                           />
                        </div>
                    </div>
                ))}
                <button 
                  onClick={() => {
                     const newCustom = [...(data.pastHistory.personal.custom || []), { id: Date.now().toString(), name: '', content: '' }];
                     update('pastHistory.personal.custom', newCustom);
                  }}
                  className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:underline"
                >
                  <Plus className="w-4 h-4" /> Thêm tiền căn
                </button>
                <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                   <label className="font-bold text-sm text-gray-700 dark:text-slate-300 mb-2 block">Tiền căn gia đình</label>
                   <textarea className="w-full p-2 text-sm border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg min-h-[80px]" value={data.pastHistory.family.content} onChange={e => update('pastHistory.family.content', e.target.value)} placeholder="Nhập tiền căn gia đình..." />
                </div>
            </div>
        </div>

        {/* VI. KHÁM LÂM SÀNG */}
        <div className={CLASSES.sectionContainer}>
           <h2 className="text-lg font-bold text-indigo-700 dark:text-indigo-400 mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-2">
             <Stethoscope className="w-5 h-5" /> VI. KHÁM LÂM SÀNG
           </h2>
           <div className="mb-4 grid grid-cols-2 gap-4">
              <div>
                  <label className={CLASSES.label}>Giờ khám</label>
                  <input className={CLASSES.input} value={data.examination.time} onChange={e => update('examination.time', autoFormatTime(e.target.value))} placeholder="hh:mm" />
              </div>
              <div>
                  <label className={CLASSES.label}>Ngày khám</label>
                  <input className={CLASSES.input} value={data.examination.date} onChange={e => update('examination.date', autoFormatDate(e.target.value))} placeholder="dd/mm/yyyy" />
              </div>
           </div>
           <div className="mb-6 bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-500/20">
             <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-3 text-sm uppercase tracking-wider">Sinh hiệu hiện tại</h3>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { k: 'pulse', l: 'Mạch (l/p)' },
                  { k: 'temp', l: 'Nhiệt độ (°C)' },
                  { k: 'resp', l: 'Nhịp thở (l/p)' },
                  { k: 'height', l: 'Chiều cao (cm)' },
                  { k: 'weight', l: 'Cân nặng (kg)' },
                  { k: 'spo2', l: 'SpO2 (%)' }
                ].map(({k, l}) => (
                  <div key={k}>
                     <label className="text-xs uppercase font-bold text-gray-500 dark:text-slate-400 mb-1 block">{l}</label>
                     <input className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-200 outline-none" type="number" value={(data.examination.vitals as any)[k]} onChange={e => update(`examination.vitals.${k}`, e.target.value)} />
                  </div>
                ))}
                 <div className="md:col-span-2">
                     <label className="text-xs uppercase font-bold text-gray-500 dark:text-slate-400 mb-1 block">Huyết áp</label>
                     <div className="flex gap-2 items-center">
                        <input className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none" type="number" placeholder="Tâm thu" value={data.examination.vitals.bp1} onChange={e => update('examination.vitals.bp1', e.target.value)} />
                        <span className="text-gray-400 font-bold">/</span>
                        <input className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none" type="number" placeholder="Tâm trương" value={data.examination.vitals.bp2} onChange={e => update('examination.vitals.bp2', e.target.value)} />
                     </div>
                </div>
                {data.examination.vitals.weight && data.examination.vitals.height && (
                  <div className="md:col-span-4 bg-white dark:bg-slate-700/50 p-3 rounded-lg border dark:border-slate-600 mt-2">
                     <div className="text-sm">
                       <span className="font-bold text-indigo-600 dark:text-indigo-400">BMI: {data.examination.vitals.bmi} kg/m²</span>
                       <span className="ml-2 text-gray-500 dark:text-slate-400">({data.examination.vitals.classification})</span>
                     </div>
                  </div>
                )}
             </div>
           </div>
           
           <RenderTextArea label="1. Tổng trạng" value={data.examination.general} onChange={(e: any) => update('examination.general', e.target.value)} isAiEnabled={isAiEnabled} />

           <div className="space-y-4 mt-6">
              <div className="grid grid-cols-1 gap-4">
                {(data.examination.customOrgans || []).map((item, index) => (
                    <div key={item.id} className="border border-indigo-300 dark:border-indigo-500/40 border-dashed rounded-xl overflow-hidden relative">
                       <button onClick={() => {
                           const newCustomOrgans = [...(data.examination.customOrgans || [])];
                           newCustomOrgans.splice(index, 1);
                           update('examination.customOrgans', newCustomOrgans);
                       }} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 z-10"><Trash2 className="w-4 h-4"/></button>
                       <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20">
                          <input 
                             className="w-full text-lg font-bold text-indigo-900 dark:text-indigo-200 bg-transparent outline-none placeholder-indigo-400"
                             value={item.name}
                             onChange={e => {
                                 const newCustomOrgans = [...(data.examination.customOrgans || [])];
                                 newCustomOrgans[index].name = e.target.value;
                                 update('examination.customOrgans', newCustomOrgans);
                             }}
                             placeholder="Khám cơ quan (Vd: Khám Bụng)"
                          />
                       </div>
                       <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 space-y-3">
                         {(item.techniques || []).map((tech: any, techIndex: number) => (
                             <div key={tech.id} className="border p-3 rounded-lg border-dashed dark:border-slate-600 relative bg-gray-50/50 dark:bg-slate-900/30">
                                 <button onClick={() => {
                                     const newCustomOrgans = [...(data.examination.customOrgans || [])];
                                     (newCustomOrgans[index].techniques || []).splice(techIndex, 1);
                                     update('examination.customOrgans', newCustomOrgans);
                                 }} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"><Trash2 className="w-3 h-3"/></button>
                                 <input 
                                    className="w-full p-1.5 border-b mb-2 font-bold text-sm outline-none focus:border-indigo-500 dark:bg-slate-900/30 dark:border-slate-600 dark:focus:border-indigo-400"
                                    value={tech.name}
                                    onChange={e => {
                                      const newCustomOrgans = [...(data.examination.customOrgans || [])];
                                      (newCustomOrgans[index].techniques || [])[techIndex].name = e.target.value;
                                      update('examination.customOrgans', newCustomOrgans);
                                    }}
                                    placeholder="Tên kỹ thuật (vd: Nhìn, Sờ...)"
                                 />
                                 <textarea 
                                    className="w-full p-1.5 text-sm border-gray-200 dark:border-slate-600 rounded min-h-[50px] outline-none focus:border-indigo-500 border dark:bg-slate-900/30"
                                    value={tech.content}
                                    onChange={e => {
                                      const newCustomOrgans = [...(data.examination.customOrgans || [])];
                                      (newCustomOrgans[index].techniques || [])[techIndex].content = e.target.value;
                                      update('examination.customOrgans', newCustomOrgans);
                                    }}
                                    placeholder="Nội dung"
                                 />
                             </div>
                         ))}
                         <button onClick={() => {
                             const newCustomOrgans = [...(data.examination.customOrgans || [])];
                             if (!newCustomOrgans[index].techniques) {
                                newCustomOrgans[index].techniques = [];
                             }
                             (newCustomOrgans[index].techniques || []).push({ id: Date.now().toString(), name: '', content: '' });
                             update('examination.customOrgans', newCustomOrgans);
                         }} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"><Plus className="w-3 h-3"/>Thêm kỹ thuật khám</button>
                         <textarea className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg text-sm min-h-[100px] focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/50 outline-none mt-4 dark:bg-slate-900" value={item.generalContent} onChange={e => {
                             const newCustomOrgans = [...(data.examination.customOrgans || [])];
                             newCustomOrgans[index].generalContent = e.target.value;
                             update('examination.customOrgans', newCustomOrgans);
                         }} placeholder={`Mô tả chung/Kết luận về ${item.name.toLowerCase() || 'cơ quan này'}...`} />
                       </div>
                    </div>
                ))}
              </div>
              <button onClick={() => {
                  const newCustomOrgans = [...(data.examination.customOrgans || []), { id: Date.now().toString(), name: '', enabled: true, techniques: [], generalContent: '' }];
                  update('examination.customOrgans', newCustomOrgans);
              }} className="mt-4 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:underline"><Plus className="w-4 h-4"/> Thêm khám khác</button>
           </div>
        </div>

        {/* VII. TÓM TẮT BỆNH ÁN */}
        <div className={CLASSES.sectionContainer}>
           <h2 className="text-lg font-bold text-indigo-700 dark:text-indigo-400 mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-2">
             <BrainCircuit className="w-5 h-5" /> VII. TÓM TẮT BỆNH ÁN
           </h2>
           <RenderTextArea 
             value={data.summary} 
             onChange={(e: any) => update('summary', e.target.value)} 
             placeholder="Tóm tắt: Bệnh nhân nam/nữ... Nhập viện vì..." 
             aiTask="SUMMARY"
             isGenerating={aiLoading === 'SUMMARY'}
             onAIGenerate={() => handleAIGenerate('SUMMARY', 'summary')}
             isAiEnabled={isAiEnabled}
           />
        </div>

        {/* VIII. ĐẶT VẤN ĐỀ */}
        <div className={CLASSES.sectionContainer}>
           <h2 className="text-lg font-bold text-indigo-700 dark:text-indigo-400 mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-2">
             <BrainCircuit className="w-5 h-5" /> VIII. ĐẶT VẤN ĐỀ
           </h2>
           <RenderTextArea 
             value={data.problemList} 
             onChange={(e: any) => update('problemList', e.target.value)} 
             placeholder="Liệt kê các vấn đề tồn tại..." 
             aiTask="PROBLEM"
             isGenerating={aiLoading === 'PROBLEM'}
             onAIGenerate={() => handleAIGenerate('PROBLEM', 'problemList')}
             isAiEnabled={isAiEnabled}
           />
        </div>

        {/* IX. CHẨN ĐOÁN SƠ BỘ */}
        <div className={CLASSES.sectionContainer}>
           <h2 className="text-lg font-bold text-indigo-700 dark:text-indigo-400 mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-2">
             <BrainCircuit className="w-5 h-5" /> IX. CHẨN ĐOÁN SƠ BỘ
           </h2>
           <RenderTextArea 
             value={data.preliminaryDiagnosis} 
             onChange={(e: any) => update('preliminaryDiagnosis', e.target.value)} 
             placeholder="Chẩn đoán sơ bộ..." 
             aiTask="PRELIM_DIAGNOSIS"
             isGenerating={aiLoading === 'PRELIM_DIAGNOSIS'}
             onAIGenerate={() => handleAIGenerate('PRELIM_DIAGNOSIS', 'preliminaryDiagnosis')}
             isAiEnabled={isAiEnabled}
           />
        </div>

        {/* X. CHẨN ĐOÁN PHÂN BIỆT */}
        <div className={CLASSES.sectionContainer}>
           <h2 className="text-lg font-bold text-indigo-700 dark:text-indigo-400 mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-2">
             <BrainCircuit className="w-5 h-5" /> X. CHẨN ĐOÁN PHÂN BIỆT
           </h2>
           <RenderTextArea 
             value={data.differentialDiagnosis} 
             onChange={(e: any) => update('differentialDiagnosis', e.target.value)} 
             placeholder="Chẩn đoán phân biệt..." 
             aiTask="DIFF_DIAGNOSIS"
             isGenerating={aiLoading === 'DIFF_DIAGNOSIS'}
             onAIGenerate={() => handleAIGenerate('DIFF_DIAGNOSIS', 'differentialDiagnosis')}
             isAiEnabled={isAiEnabled}
           />
        </div>

        {/* XI. BIỆN LUẬN LÂM SÀNG */}
        <div className={CLASSES.sectionContainer}>
           <h2 className="text-lg font-bold text-indigo-700 dark:text-indigo-400 mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-2">
             <BrainCircuit className="w-5 h-5" /> XI. BIỆN LUẬN LÂM SÀNG
           </h2>
           <RenderTextArea 
             value={data.clinicalDiscussion} 
             onChange={(e: any) => update('clinicalDiscussion', e.target.value)} 
             placeholder="Biện luận..." 
             aiTask="CLINICAL_DISCUSSION"
             isGenerating={aiLoading === 'CLINICAL_DISCUSSION'}
             onAIGenerate={() => handleAIGenerate('CLINICAL_DISCUSSION', 'clinicalDiscussion')}
             isAiEnabled={isAiEnabled}
           />
        </div>

        {/* XII. ĐỀ NGHỊ CẬN LÂM SÀNG */}
        <div className={CLASSES.sectionContainer}>
           <h2 className="text-lg font-bold text-indigo-700 dark:text-indigo-400 mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-2">
             <FlaskConical className="w-5 h-5" /> XII. ĐỀ NGHỊ CẬN LÂM SÀNG
           </h2>
           <RenderTextArea 
            value={data.paraclinicalRequests} 
            onChange={(e: any) => update('paraclinicalRequests', e.target.value)} 
            placeholder="Đề nghị..."
            aiTask="PARACLINICAL_REQUESTS"
            isGenerating={aiLoading === 'PARACLINICAL_REQUESTS'}
            onAIGenerate={() => handleAIGenerate('PARACLINICAL_REQUESTS', 'paraclinicalRequests')}
            isAiEnabled={isAiEnabled}
           />
        </div>

        {/* XIII. KẾT QUẢ CẬN LÂM SÀNG */}
        <div className={CLASSES.sectionContainer}>
           <h2 className="text-lg font-bold text-indigo-700 dark:text-indigo-400 mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-2">
             <FlaskConical className="w-5 h-5" /> XIII. KẾT QUẢ CẬN LÂM SÀNG
           </h2>
           <div className="space-y-4">
                 {data.paraclinicalResults.map((res, idx) => (
                    <div key={res.id} className="p-4 bg-white dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm relative">
                       <div className="flex justify-between items-start mb-2">
                          <div className="w-1/2">
                            <input className="font-bold text-indigo-800 dark:text-indigo-300 border-none w-full outline-none placeholder-indigo-300 bg-transparent" value={res.name} onChange={(e) => { const n = [...data.paraclinicalResults]; n[idx].name = e.target.value; update('paraclinicalResults', n); }} placeholder="Tên xét nghiệm / CLS" />
                            <input className="text-xs text-gray-400 dark:text-slate-400 border-none w-full outline-none bg-transparent" value={res.date} onChange={(e) => { const n = [...data.paraclinicalResults]; n[idx].date = e.target.value; update('paraclinicalResults', n); }} placeholder="Ngày thực hiện" />
                          </div>
                          <button onClick={() => { const n = data.paraclinicalResults.filter(x => x.id !== res.id); update('paraclinicalResults', n); }} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50 p-1.5 rounded-full"><Trash2 className="w-4 h-4" /></button>
                       </div>
                       <textarea className="w-full p-2 border rounded mb-2 text-sm dark:bg-slate-800 dark:border-slate-600" value={res.resultText} onChange={(e) => { const n = [...data.paraclinicalResults]; n[idx].resultText = e.target.value; update('paraclinicalResults', n); }} placeholder="Kết quả..." />
                       
                       {res.image && <div className="relative inline-block mt-2 w-full"><img src={res.image} className="w-full rounded-lg border dark:border-slate-700 shadow-sm object-contain" /><button onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"><X className="w-3 h-3"/></button></div>}
                       
                       <div className="flex gap-2 mt-2">
                          {!res.image && <button onClick={() => handleImageClick(idx)} className="text-xs bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex items-center gap-1"><ImageIcon className="w-3 h-3"/> Ảnh</button>}
                          {!res.tableData && <button onClick={() => handleAddTable(idx)} className="text-xs bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors flex items-center gap-1"><TableIcon className="w-3 h-3"/> Bảng</button>}
                       </div>

                       {res.tableData && (
                           <div className="mt-2 overflow-x-auto border dark:border-slate-600 rounded-lg">
                             <table className="w-full text-xs border-collapse">
                               <tbody>
                                 {res.tableData.map((r, ri) => (
                                   <tr key={ri}>{r.map((c, ci) => (<td key={ci} className={`border dark:border-slate-600 p-0 min-w-[80px] ${ri===0 ? 'bg-gray-100 dark:bg-slate-700 font-bold' : ''}`}><input className="w-full p-1.5 bg-transparent outline-none" value={c} onChange={(e) => updateTableData(idx, ri, ci, e.target.value)} /></td>))}
                                     <td className="border dark:border-slate-600 p-0 w-[40px] text-center">
                                        {ri > 0 && (<button onClick={() => removeTableRow(idx, ri)} className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 p-1 rounded-full transition-colors" title="Xóa hàng"><X className="w-3 h-3" /></button>)}
                                     </td>
                                   </tr>
                                 ))}
                               </tbody>
                             </table>
                             <div className="flex gap-1 p-1 bg-gray-50 dark:bg-slate-700/50 border-t dark:border-slate-600">
                               <button onClick={() => addTableRow(idx)} className="text-[10px] bg-white dark:bg-slate-800 border dark:border-slate-600 px-2 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-slate-600">+ Hàng</button>
                               <button onClick={() => removeTable(idx)} className="text-[10px] text-red-500 bg-red-50 dark:bg-red-900/50 border border-red-100 dark:border-red-500/30 px-2 py-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/80 ml-auto">Xoá bảng</button>
                             </div>
                           </div>
                       )}
                    </div>
                 ))}
                 <button className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:underline" onClick={() => update('paraclinicalResults', [...data.paraclinicalResults, { id: Date.now().toString(), name: '', resultText: '', date: '' }])}><Plus className="w-4 h-4" /> Thêm kết quả CLS</button>
              </div>
        </div>

        {/* XIV. BIỆN LUẬN CẬN LÂM SÀNG */}
        <div className={CLASSES.sectionContainer}>
           <h2 className="text-lg font-bold text-indigo-700 dark:text-indigo-400 mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-2">
             <BrainCircuit className="w-5 h-5" /> XIV. BIỆN LUẬN CẬN LÂM SÀNG
           </h2>
           <RenderTextArea 
             value={data.paraclinicalDiscussion} 
             onChange={(e: any) => update('paraclinicalDiscussion', e.target.value)} 
             placeholder="Biện luận kết quả CLS..." 
             aiTask="PARACLINICAL_DISCUSSION"
             isGenerating={aiLoading === 'PARACLINICAL_DISCUSSION'}
             onAIGenerate={() => handleAIGenerate('PARACLINICAL_DISCUSSION', 'paraclinicalDiscussion')}
             isAiEnabled={isAiEnabled}
           />
        </div>
        
        {/* XV. CHẨN ĐOÁN XÁC ĐỊNH */}
        <div className={CLASSES.sectionContainer}>
           <h2 className="text-lg font-bold text-indigo-700 dark:text-indigo-400 mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-2">
             <BrainCircuit className="w-5 h-5" /> XV. CHẨN ĐOÁN XÁC ĐỊNH
           </h2>
           <RenderTextArea 
             value={data.finalDiagnosis} 
             onChange={(e: any) => update('finalDiagnosis', e.target.value)} 
             placeholder="Chẩn đoán xác định..." 
             aiTask="FINAL_DIAGNOSIS"
             isGenerating={aiLoading === 'FINAL_DIAGNOSIS'}
             onAIGenerate={() => handleAIGenerate('FINAL_DIAGNOSIS', 'finalDiagnosis')}
             isAiEnabled={isAiEnabled}
           />
        </div>

        {/* XVI. HƯỚNG XỬ TRÍ */}
        <div className={CLASSES.sectionContainer}>
           <h2 className="text-lg font-bold text-indigo-700 dark:text-indigo-400 mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-2">
             <FlaskConical className="w-5 h-5" /> XVI. HƯỚNG XỬ TRÍ
           </h2>
           <RenderTextArea 
             value={data.treatmentPlan} 
             onChange={(e: any) => update('treatmentPlan', e.target.value)} 
             placeholder="Đề xuất hướng xử trí..." 
             aiTask="TREATMENT_PLAN"
             isGenerating={aiLoading === 'TREATMENT_PLAN'}
             onAIGenerate={() => handleAIGenerate('TREATMENT_PLAN', 'treatmentPlan')}
             isAiEnabled={isAiEnabled}
           />
        </div>

      </div>

      {isAiEnabled && (
        <button 
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-8 right-8 bg-gradient-to-r from-purple-600 to-indigo-600 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-40"
          title="Trò chuyện với AI"
        >
          <MessageCircle className="w-8 h-8"/>
        </button>
      )}

      {isAiEnabled && (
        <ChatPopup 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)} 
          patientData={data}
          formType="pre-op"
          messages={chatMessages}
          setMessages={setChatMessages}
        />
      )}
      
      {showPreview && <PreviewModal data={data} onClose={() => setShowPreview(false)} />}
    </div>
  );
};