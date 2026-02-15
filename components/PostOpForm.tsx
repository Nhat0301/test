import React, { useState, useRef } from 'react';
import { PostOpRecord, VitalSigns, OrganExam, HistoryItem, ParaclinicalItem, CustomOrganExam, ChatMessage } from '../types';
import { exportPostOpToDocx } from '../services/docxService';
import { generatePostOpMedicalText } from '../services/geminiService';
import { ChatPopup } from './ChatPopup';
import { 
  FileDown, User, Activity, Stethoscope, 
  BrainCircuit, FlaskConical, Plus, Trash2,
  CheckCircle2, Eye, X, ArrowLeft, Image as ImageIcon, Table as TableIcon,
  Printer, Scissors, CalendarDays, Sparkles, Loader2, ClipboardCheck, MessageCircle
} from 'lucide-react';

interface PostOpFormProps {
  onBack: () => void;
  isAiEnabled: boolean;
}

const emptyVitals: VitalSigns = {
  pulse: '', temp: '', bp1: '', bp2: '', resp: '', spo2: '', weight: '', height: '', bmi: '', classification: ''
};

const initialData: PostOpRecord = {
  id: '',
  adminDetails: {
    fullName: '', birthYear: '', ethnicity: 'Kinh', gender: 'Nam', address: '', occupation: '', admissionDate: '', reportDate: ''
  },
  reasonForAdmission: '',
  medicalHistory: {
    preOp: {
      historyTaking: { enabled: false, informant: 'Bệnh nhân', description: '' },
      admissionVitals: { enabled: false, date: '', time: '', vitals: { ...emptyVitals } },
      generalState: { enabled: false, content: `Bệnh nhân tỉnh, tiếp xúc tốt.\nDa niêm hồng hào.\nHạch ngoại vi không sờ chạm.\nChi ấm, không phù.\nMạch quay rõ, CRT<2s.`},
      preOpParaclinical: { enabled: false, results: [] },
      preOpDiagnosis: { enabled: false, diagnosis: '' }
    },
    intraOp: {
      surgeryClassification: 'Chương trình',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      patientPosition: '',
      surgeryMethod: '',
      anesthesiaMethod: '',
      surgeryProcedure: '',
      complications: ''
    },
    postOp: {
      dailyExams: []
    }
  },
  systemReview: `Tim mạch: không đau ngực, không hồi hộp, không đánh trống ngực.
Hô hấp: không ho, không khó thở, không khò khè.
Tiêu hóa: Không đau bụng, không buồn nôn và nôn, không bí trung đại tiện.
Tiết niệu – sinh dục: không tiểu buốt/tiểu lắt nhắt, nước tiểu vàng trong.
Thần kinh: không đau đầu, không chóng mặt, không khó ngủ.
Cơ xương khớp: không giới hạn vận động, không đau nhức các khớp và cơ.`,
  pastHistory: {
    personal: { 
      custom: []
    },
    family: { enabled: true, content: '' }
  },
  examination: {
    date: '', time: '', vitals: { ...emptyVitals },
    general: `Bệnh nhân tỉnh, tiếp xúc tốt.
Da niêm hồng hào.
Hạch ngoại vi không sờ chạm.
Chi ấm, không phù.
Mạch quay rõ, CRT<2s.`,
    customOrgans: [],
  },
  postOpParaclinicalResults: [],
  summary: '',
  clinicalDiscussion: '',
  finalDiagnosis: '',
  treatmentPlan: ''
};


// --- STYLES & HELPERS ---
const CLASSES = {
  label: "block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 ml-1 tracking-wide",
  input: "w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/50 outline-none transition-all duration-200 ease-in-out shadow-sm text-base",
  textarea: "w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/50 outline-none transition-all duration-200 ease-in-out shadow-sm min-h-[120px] text-base resize-y",
  btnSecondary: "px-4 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 font-bold transition-colors border border-gray-200 dark:border-slate-700 flex items-center justify-center gap-2",
  sectionContainer: "bg-white dark:bg-slate-800/50 p-6 md:p-8 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm",
  subSectionContainer: "border p-4 rounded-xl transition-all",
  checkboxContainer: "flex items-center gap-3 mb-3 cursor-pointer p-3 rounded-lg",
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

// --- PREVIEW MODAL HELPER COMPONENTS ---
const NumberHeader = ({ text }: { text: string }) => <div className="font-bold text-[13pt] mb-1 leading-[1.5] break-after-avoid text-left">{text}</div>;
const FormattedText = ({ text, mode = 'dash' }: { text: string, mode?: 'dash' | 'plus' }) => {
    if (!text) return null;
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const indentClass = mode === 'plus' ? 'pl-8' : '';
    const bulletChar = mode === 'plus' ? '+' : '–';
    return <div className={`text-[13pt] leading-[1.5] text-left break-words ${indentClass}`}>{lines.map((line, idx) => <div key={idx} className="flex items-start"><span className="mr-2 min-w-[10px] select-none font-medium">{bulletChar}</span><span className="flex-1">{line.trim()}</span></div>)}</div>;
};
const ParaclinicalResultDisplay: React.FC<{ item: ParaclinicalItem; index: number; }> = ({ item, index }) => (
    <div className="mb-2 break-inside-avoid">
        <NumberHeader text={`${index + 1}. ${item.name} (${item.date}):`} />
        <FormattedText text={item.resultText} mode="dash" />
        {item.tableData && (
            <div className="pl-8 my-2">
                <table className="w-full border-collapse border border-black text-sm">
                    <tbody>
                        {item.tableData.map((row, rIdx) => (
                            <tr key={rIdx}>
                                {row.map((cell, cIdx) => (
                                    <td key={cIdx} className={`border border-black p-1 ${rIdx === 0 ? 'font-bold bg-gray-200 text-center' : ''}`}>{cell}</td>
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
);


// --- PREVIEW MODAL ---
const PreviewModal: React.FC<{ data: PostOpRecord; onClose: () => void }> = ({ data, onClose }) => {
    const { medicalHistory: mh } = data;
    const currentYear = new Date().getFullYear();
    const age = data.adminDetails.birthYear ? currentYear - parseInt(data.adminDetails.birthYear) : '';

    const handlePrint = () => window.print();

    const RomanHeader = ({ text }: { text: string }) => <h3 className="font-bold text-[13pt] mt-4 mb-2 uppercase leading-[1.5] break-after-avoid text-left">{text}</h3>;
    const SubHeading = ({ text }: { text: string }) => <h4 className="font-bold text-[13pt] mt-3 mb-1 leading-[1.5] break-after-avoid text-left">{text}</h4>;
    
    const DashLine = ({ label, value }: { label?: string, value: any }) => <div className="flex items-start text-[13pt] leading-[1.5] mb-1"><span className="min-w-[20px] select-none font-medium">–</span><span className="flex-1 text-left break-words">{label && <span>{label}: </span>}{value}</span></div>;
    const VitalsDisplay = ({ vitals }: { vitals: VitalSigns }) => (
      <div className="pl-0 text-[13pt] leading-[1.5] mb-2 text-left">
          <div className="grid grid-cols-2 gap-y-1 gap-x-4">
              <div><span className="italic">Mạch:</span> <span className="">{vitals?.pulse || "..."}</span> l/phút</div>
              <div><span className="italic">SpO2:</span> <span className="">{vitals?.spo2 || "..."}</span> %</div>
              <div><span className="italic">Huyết áp:</span> <span className="">{vitals?.bp1}/{vitals?.bp2}</span> mmHg</div>
              <div><span className="italic">Nhịp thở:</span> <span className="">{vitals?.resp || "..."}</span> l/phút</div>
              <div className="col-span-2"><span className="italic">Nhiệt độ:</span> <span className="">{vitals?.temp || "..."}</span> °C</div>
          </div>
          {vitals?.weight && vitals?.height && (
              <div className="mt-1 text-[13pt]">
                  <div className="flex gap-4"><span>– Chiều cao: {vitals.height} cm</span><span>– Cân nặng: {vitals.weight} kg</span></div>
                  <div>→ BMI: <span>{vitals.bmi}</span> kg/m² ({vitals.classification})</div>
              </div>
          )}
      </div>
    );
  
    const renderOrganSection = () => {
        let counter = 2;
        const renderSingleOrgan = (label: string, item: OrganExam) => (
            <div className="break-inside-avoid mt-2">
                <NumberHeader text={`${counter++}. ${label}:`} />
                {(item.techniques || []).map((tech: any) => tech.name && <div key={tech.id} className="mt-1"><div className="text-[13pt] leading-[1.5] flex items-start"><span className="mr-2 min-w-[10px] select-none font-medium">–</span><span className="flex-1">{tech.name}:</span></div><FormattedText text={tech.content} mode="plus" /></div>)}
                <div className="pl-0"><FormattedText text={item.generalContent} mode="dash" /></div>
            </div>
        );
        return <>{(data.examination.customOrgans || []).map(item => item?.enabled && item.name ? <div key={item.id}>{renderSingleOrgan(item.name, item)}</div> : null)}</>;
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-gray-900/90 backdrop-blur-sm">
            <style>{`@media print {@page { margin: 0; size: auto; } body > *:not(#print-modal-container) { display: none; } #print-modal-container { position: absolute; inset: 0; background: white; z-index: 9999; display: block; } #print-content { width: 100% !important; box-shadow: none !important; margin: 0 !important; padding: 20mm !important; } #print-controls { display: none !important; }}`}</style>
            <div id="print-controls" className="flex justify-between items-center px-6 py-4 bg-white border-b border-gray-200 shadow-md z-10 flex-shrink-0">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Eye className="w-6 h-6 text-blue-600" /> Xem trước Bệnh Án Hậu Phẫu</h2>
                <div className="flex gap-3"><button onClick={handlePrint} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-all"><Printer className="w-5 h-5" /> In</button><button onClick={onClose} className="p-2.5 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"><X className="w-6 h-6" /></button></div>
            </div>
            <div className="flex-1 overflow-auto bg-gray-800/50 p-4 md:p-8" id="print-modal-container">
                <div className="min-w-fit min-h-full flex justify-center items-start">
                    <div id="print-content" className="bg-white shadow-2xl flex-shrink-0 text-black box-border" style={{ width: '210mm', minHeight: '297mm', padding: '20mm', fontFamily: '"Times New Roman", Times, serif' }}>
                        <h1 className="text-center font-bold text-[18pt] mb-8 mt-4 uppercase">BỆNH ÁN HẬU PHẪU</h1>
                        
                        <RomanHeader text="I. HÀNH CHÍNH:" />
                        <DashLine label="Họ và tên" value={<span className="font-bold">{data.adminDetails.fullName.toUpperCase()}</span>} />
                        <DashLine label="Năm sinh" value={`${data.adminDetails.birthYear} (${age} tuổi)`} />
                        <DashLine label="Giới tính" value={data.adminDetails.gender} />
                        <DashLine label="Địa chỉ" value={data.adminDetails.address} />
                        <DashLine label="Nghề nghiệp" value={data.adminDetails.occupation} />
                        <DashLine label="Ngày nhập viện" value={data.adminDetails.admissionDate} />
                        <DashLine label="Ngày làm bệnh án" value={data.adminDetails.reportDate} />

                        <RomanHeader text="II. LÝ DO NHẬP VIỆN:" /><FormattedText text={data.reasonForAdmission} mode="dash" />

                        <RomanHeader text="III. BỆNH SỬ:" />
                        <SubHeading text="A. Quá trình trước mổ" />
                        {mh.preOp.historyTaking.enabled && <>
                            <SubHeading text="Khai bệnh" />
                            <DashLine label="Người khai bệnh" value={mh.preOp.historyTaking.informant} />
                            <FormattedText text={mh.preOp.historyTaking.description} mode="dash" />
                        </>}
                        {mh.preOp.admissionVitals?.enabled && <>
                            <SubHeading text="Sinh hiệu:" />
                            <DashLine label="Thời gian" value={`${mh.preOp.admissionVitals.time} ngày ${mh.preOp.admissionVitals.date}`} />
                            <VitalsDisplay vitals={mh.preOp.admissionVitals.vitals} />
                        </>}
                         {mh.preOp.generalState?.enabled && <>
                            <SubHeading text="Tổng trạng:" />
                            <FormattedText text={mh.preOp.generalState.content} mode="dash" />
                        </>}
                        {mh.preOp.preOpParaclinical.enabled && mh.preOp.preOpParaclinical.results.length > 0 && <>
                            <SubHeading text="Cận lâm sàng đã làm" />
                            {mh.preOp.preOpParaclinical.results.map((item, i) => <ParaclinicalResultDisplay item={item} index={i} key={item.id}/>)}
                        </>}
                        {mh.preOp.preOpDiagnosis.enabled && <>
                            <SubHeading text="Chẩn đoán trước mổ" />
                            <FormattedText text={mh.preOp.preOpDiagnosis.diagnosis} mode="dash" />
                        </>}

                        <SubHeading text="B. Quá trình trong mổ (Tường trình phẫu thuật)" />
                        <DashLine label="Phân loại" value={`Mổ ${mh.intraOp.surgeryClassification}`} />
                        <DashLine label="Thời gian phẫu thuật" value={`từ ${mh.intraOp.startTime || '...'} ${mh.intraOp.startDate || '...'} đến ${mh.intraOp.endTime || '...'} ${mh.intraOp.endDate || '...'}`} />
                        <DashLine label="Tư thế bệnh nhân" value={mh.intraOp.patientPosition} />
                        <DashLine label="Phương pháp vô cảm" value={mh.intraOp.anesthesiaMethod} />
                        <DashLine label="Loại phẫu thuật" value={mh.intraOp.surgeryMethod} />
                        <DashLine label="Phương pháp xử lý" value={mh.intraOp.surgeryProcedure} />
                        <DashLine label="Tai biến" value={mh.intraOp.complications} />

                        <SubHeading text="C. Quá trình sau mổ" />
                        {mh.postOp.dailyExams.map((exam, index) => {
                           if (!exam.content) return null;
                           return (
                              <div key={exam.id} className="break-inside-avoid mt-2">
                                <DashLine value={`Hậu phẫu ngày ${index + 1}:`} />
                                <FormattedText text={exam.content} mode="plus" />
                              </div>
                           );
                        })}

                        <RomanHeader text="IV. LƯỢC QUA CÁC CƠ QUAN:" />
                        <FormattedText text={data.systemReview} mode="dash" />

                        <RomanHeader text="V. TIỀN CĂN:" />
                        <NumberHeader text="1. Tiền căn cá nhân:" />
                        {(data.pastHistory.personal.custom || []).map(item => item.name && <div key={item.id}><DashLine value={`${item.name}:`} /><FormattedText text={item.content} mode="plus" /></div>)}
                        <NumberHeader text="2. Tiền căn gia đình:" /><FormattedText text={data.pastHistory.family.content || "Chưa ghi nhận bất thường"} mode="dash" />

                        <RomanHeader text="VI. KHÁM LÂM SÀNG:" />
                        <DashLine label="Thời gian khám" value={`${data.examination.time || '...'} ngày ${data.examination.date || '...'}`} />
                        <NumberHeader text="1. Tổng trạng:" /><VitalsDisplay vitals={data.examination.vitals} />
                        <FormattedText text={data.examination.general} mode="dash" />
                        {renderOrganSection()}

                        <RomanHeader text="VII. CẬN LÂM SÀNG SAU MỔ:" />
                        {data.postOpParaclinicalResults.map((item, i) => <ParaclinicalResultDisplay item={item} index={i} key={item.id}/>)}

                        <RomanHeader text="VIII. TÓM TẮT BỆNH ÁN:" /><FormattedText text={data.summary} mode="dash" />
                        <RomanHeader text="IX. BIỆN LUẬN LÂM SÀNG:" /><FormattedText text={data.clinicalDiscussion} mode="dash" />
                        <RomanHeader text="X. CHẨN ĐOÁN XÁC ĐỊNH:" /><p className="text-[13pt] font-bold">{data.finalDiagnosis}</p>
                        <RomanHeader text="XI. HƯỚNG XỬ TRÍ:" /><FormattedText text={data.treatmentPlan} mode="dash" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const RenderTextArea = ({ label, value, onChange, placeholder, aiTask, isGenerating, onAIGenerate, isAiEnabled }: { 
  label?: string; 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; 
  placeholder?: string;
  aiTask?: string;
  isGenerating?: boolean;
  onAIGenerate?: () => void;
  isAiEnabled?: boolean;
}) => (
  <div>
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
    <textarea className={CLASSES.textarea} value={value || ''} onChange={onChange} placeholder={placeholder} />
  </div>
);

// --- MAIN COMPONENT ---
export const PostOpForm: React.FC<PostOpFormProps> = ({ onBack, isAiEnabled }) => {
  const [data, setData] = useState<PostOpRecord>(initialData);
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
         const v = next.examination.vitals;
         if (v.weight && v.height) {
            const w = parseFloat(v.weight), h = parseFloat(v.height);
            if (!isNaN(w) && !isNaN(h) && h > 0) {
               const bmi = (w / ((h/100) * (h/100))).toFixed(2);
               v.bmi = bmi;
               const bmiVal = parseFloat(bmi);
               if (bmiVal < 18.5) v.classification = "Nhẹ cân theo IDI & WPRO";
               else if (bmiVal < 23) v.classification = "Bình thường theo IDI & WPRO";
               else if (bmiVal < 25) v.classification = "Thừa cân theo IDI & WPRO";
               else if (bmiVal < 30) v.classification = "Béo phì độ I theo IDI & WPRO";
               else v.classification = "Béo phì độ II theo IDI & WPRO";
            } else {
               v.bmi = '';
               v.classification = '';
            }
         }
      }
      return next;
    });
  };
  
  const handleAIGenerate = async (task: any, fieldPath: string) => {
    setAiLoading(task);
    try {
      const result = await generatePostOpMedicalText(data, task);
      update(fieldPath, result);
    } catch (error) {
      console.error(error);
      alert("Lỗi khi gọi AI: " + error);
    } finally {
      setAiLoading(null);
    }
  };

  const calculatedAge = data.adminDetails.birthYear ? `${new Date().getFullYear() - parseInt(data.adminDetails.birthYear)} tuổi` : '';

  const handleImageClick = (index: number, contextType: 'preOp' | 'postOp') => {
    setActiveUploadIndex(contextType === 'preOp' ? index : index + 1000); 
    if (fileInputRef.current) { fileInputRef.current.value = ''; fileInputRef.current.click(); }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeUploadIndex !== null) {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (activeUploadIndex >= 1000) { // Post-op
                const realIndex = activeUploadIndex - 1000;
                const newResults = [...data.postOpParaclinicalResults];
                newResults[realIndex].image = reader.result as string;
                update('postOpParaclinicalResults', newResults);
            } else { // Pre-op
                const newResults = [...data.medicalHistory.preOp.preOpParaclinical.results];
                newResults[activeUploadIndex].image = reader.result as string;
                update('medicalHistory.preOp.preOpParaclinical.results', newResults);
            }
            setActiveUploadIndex(null);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleAddTable = (index: number, contextType: 'preOp' | 'postOp') => {
      const path = contextType === 'postOp' ? 'postOpParaclinicalResults' : 'medicalHistory.preOp.preOpParaclinical.results';
      const results = contextType === 'postOp' ? data.postOpParaclinicalResults : data.medicalHistory.preOp.preOpParaclinical.results;
      const newResults = [...results];
      if (!newResults[index].tableData) {
          newResults[index].tableData = [['Tên xét nghiệm', 'Kết quả', 'Trị số tham chiếu', 'Đơn vị'],['', '', '', '']];
          update(path, newResults);
      }
  };

  const updateTableData = (resultIndex: number, rowIndex: number, colIndex: number, val: string, contextType: 'preOp' | 'postOp') => {
       const path = contextType === 'postOp' ? 'postOpParaclinicalResults' : 'medicalHistory.preOp.preOpParaclinical.results';
       const results = contextType === 'postOp' ? data.postOpParaclinicalResults : data.medicalHistory.preOp.preOpParaclinical.results;
       const newResults = [...results];
       if (newResults[resultIndex].tableData) {
           newResults[resultIndex].tableData![rowIndex][colIndex] = val;
           update(path, newResults);
       }
  };
  
  const addTableRow = (resultIndex: number, contextType: 'preOp' | 'postOp') => {
      const path = contextType === 'postOp' ? 'postOpParaclinicalResults' : 'medicalHistory.preOp.preOpParaclinical.results';
      const results = contextType === 'postOp' ? data.postOpParaclinicalResults : data.medicalHistory.preOp.preOpParaclinical.results;
      const newResults = [...results];
      if (newResults[resultIndex].tableData) {
          const cols = newResults[resultIndex].tableData![0].length;
          newResults[resultIndex].tableData!.push(new Array(cols).fill(''));
          update(path, newResults);
      }
  };
  
  const removeTableRow = (resultIndex: number, rowIndex: number, contextType: 'preOp' | 'postOp') => {
      const path = contextType === 'postOp' ? 'postOpParaclinicalResults' : 'medicalHistory.preOp.preOpParaclinical.results';
      const results = contextType === 'postOp' ? data.postOpParaclinicalResults : data.medicalHistory.preOp.preOpParaclinical.results;
      const newResults = [...results];
      if (newResults[resultIndex]?.tableData) {
          newResults[resultIndex].tableData!.splice(rowIndex, 1);
          update(path, newResults);
      }
  };

  const removeTable = (idx: number, contextType: 'preOp' | 'postOp') => { 
      const path = contextType === 'postOp' ? 'postOpParaclinicalResults' : 'medicalHistory.preOp.preOpParaclinical.results';
      const results = contextType === 'postOp' ? data.postOpParaclinicalResults : data.medicalHistory.preOp.preOpParaclinical.results;
      const newResults = [...results];
      delete newResults[idx].tableData; 
      update(path, newResults); 
  };
  const removeImage = (idx: number, contextType: 'preOp' | 'postOp') => { 
      const path = contextType === 'postOp' ? 'postOpParaclinicalResults' : 'medicalHistory.preOp.preOpParaclinical.results';
      const results = contextType === 'postOp' ? data.postOpParaclinicalResults : data.medicalHistory.preOp.preOpParaclinical.results;
      const newResults = [...results];
      delete newResults[idx].image; 
      update(path, newResults); 
  };
  
  return (
    <div className="max-w-5xl mx-auto pb-20">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 sticky top-0 bg-gray-50/95 dark:bg-slate-900/95 backdrop-blur-md z-40 py-4 border-b border-gray-200 dark:border-slate-800 shadow-sm px-1 rounded-b-xl">
        <div className="flex items-center gap-3"><button onClick={onBack} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full"><ArrowLeft className="w-6 h-6 text-gray-600 dark:text-slate-300" /></button><div><h1 className="text-2xl font-bold text-gray-800 dark:text-slate-200">Bệnh Án Hậu Phẫu</h1></div></div>
        <div className="flex gap-3"><button onClick={() => setShowPreview(true)} className={CLASSES.btnSecondary}><Eye className="w-4 h-4" /> Xem trước</button><button onClick={() => exportPostOpToDocx(data)} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-indigo-300 font-bold shadow-lg flex items-center gap-2 transition-transform active:scale-95"><FileDown className="w-4 h-4" /> Xuất Word</button></div>
      </div>

      <div className="space-y-6">
        {/* I. HÀNH CHÍNH */}
        <div className={CLASSES.sectionContainer}><h2 className="text-lg font-bold text-indigo-700 dark:text-indigo-400 mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-2"><User className="w-5 h-5" /> I. HÀNH CHÍNH</h2>
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
        <div className={CLASSES.sectionContainer}><h2 className="text-lg font-bold text-indigo-700 dark:text-indigo-400 mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-2"><Activity className="w-5 h-5" /> II. LÝ DO NHẬP VIỆN</h2>
            <textarea className={CLASSES.textarea} value={data.reasonForAdmission} onChange={e => update('reasonForAdmission', e.target.value)} placeholder="VD: Đau bụng..." />
        </div>

        {/* III. BỆNH SỬ */}
        <div className={CLASSES.sectionContainer}><h2 className="text-lg font-bold text-indigo-700 dark:text-indigo-400 mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-2"><CalendarDays className="w-5 h-5" /> III. BỆNH SỬ</h2>
            <div className="space-y-4">
                <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50"><h3 className="font-bold text-gray-800 dark:text-slate-200 mb-3 text-base">A. Quá trình trước mổ</h3><div className="space-y-3">
                    <div className={`${CLASSES.subSectionContainer} ${data.medicalHistory.preOp.historyTaking.enabled ? 'border-indigo-300 dark:border-indigo-500/50 bg-indigo-50/30 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/20'}`}>
                        <div className={`${CLASSES.checkboxContainer}`} onClick={() => update('medicalHistory.preOp.historyTaking.enabled', !data.medicalHistory.preOp.historyTaking.enabled)}>
                            <input type="checkbox" checked={data.medicalHistory.preOp.historyTaking.enabled} readOnly className="w-4 h-4 rounded" />
                            <h4 className="font-bold text-sm text-gray-800 dark:text-slate-200">Khai bệnh</h4>
                        </div>
                        {data.medicalHistory.preOp.historyTaking.enabled && <div className="pl-4 pt-2 border-t border-indigo-100 dark:border-indigo-500/30">
                            <div className="mb-2"><label className={CLASSES.label}>Người khai bệnh</label><input className={CLASSES.input} value={data.medicalHistory.preOp.historyTaking.informant} onChange={e => update('medicalHistory.preOp.historyTaking.informant', e.target.value)} /></div>
                            <RenderTextArea value={data.medicalHistory.preOp.historyTaking.description} onChange={e => update('medicalHistory.preOp.historyTaking.description', e.target.value)} placeholder="Diễn tiến bệnh..." isAiEnabled={isAiEnabled} />
                        </div>}
                    </div>

                    <div className={`${CLASSES.subSectionContainer} ${data.medicalHistory.preOp.admissionVitals.enabled ? 'border-indigo-300 dark:border-indigo-500/50 bg-indigo-50/30 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/20'}`}>
                        <div className={`${CLASSES.checkboxContainer}`} onClick={() => update('medicalHistory.preOp.admissionVitals.enabled', !data.medicalHistory.preOp.admissionVitals.enabled)}>
                           <input type="checkbox" checked={data.medicalHistory.preOp.admissionVitals.enabled} readOnly className="w-4 h-4 rounded" />
                            <h4 className="font-bold text-sm text-gray-800 dark:text-slate-200">Sinh hiệu</h4>
                        </div>
                        {data.medicalHistory.preOp.admissionVitals.enabled && <div className="pl-4 pt-2 border-t border-indigo-100 dark:border-indigo-500/30">
                           <div className="grid grid-cols-2 gap-4 mb-4">
                                <div><label className={CLASSES.label}>Giờ</label><input className={CLASSES.input} value={data.medicalHistory.preOp.admissionVitals.time} onChange={e => update('medicalHistory.preOp.admissionVitals.time', autoFormatTime(e.target.value))} placeholder="hh:mm" /></div>
                                <div><label className={CLASSES.label}>Ngày</label><input className={CLASSES.input} value={data.medicalHistory.preOp.admissionVitals.date} onChange={e => update('medicalHistory.preOp.admissionVitals.date', autoFormatDate(e.target.value))} placeholder="dd/mm/yyyy" /></div>
                           </div>
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[ { k: 'pulse', l: 'Mạch (l/p)' }, { k: 'temp', l: 'Nhiệt độ (°C)' }, { k: 'resp', l: 'Nhịp thở (l/p)' }, { k: 'spo2', l: 'SpO2 (%)' } ].map(({k, l}) => (
                                  <div key={k}>
                                     <label className="text-xs uppercase font-bold text-gray-500 dark:text-slate-400 mb-1 block">{l}</label>
                                     <input className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900" type="number" value={(data.medicalHistory.preOp.admissionVitals.vitals as any)[k]} onChange={e => update(`medicalHistory.preOp.admissionVitals.vitals.${k}`, e.target.value)} />
                                  </div>
                                ))}
                                 <div className="md:col-span-2">
                                     <label className="text-xs uppercase font-bold text-gray-500 dark:text-slate-400 mb-1 block">Huyết áp</label>
                                     <div className="flex gap-2 items-center">
                                        <input className="w-full p-2.5 rounded-lg border dark:border-slate-600 bg-white dark:bg-slate-900" type="number" placeholder="Tâm thu" value={data.medicalHistory.preOp.admissionVitals.vitals.bp1} onChange={e => update('medicalHistory.preOp.admissionVitals.vitals.bp1', e.target.value)} />
                                        <span className="text-gray-400 font-bold">/</span>
                                        <input className="w-full p-2.5 rounded-lg border dark:border-slate-600 bg-white dark:bg-slate-900" type="number" placeholder="Tâm trương" value={data.medicalHistory.preOp.admissionVitals.vitals.bp2} onChange={e => update('medicalHistory.preOp.admissionVitals.vitals.bp2', e.target.value)} />
                                     </div>
                                </div>
                             </div>
                        </div>}
                    </div>
                    <div className={`${CLASSES.subSectionContainer} ${data.medicalHistory.preOp.generalState.enabled ? 'border-indigo-300 dark:border-indigo-500/50 bg-indigo-50/30 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/20'}`}>
                        <div className={`${CLASSES.checkboxContainer}`} onClick={() => update('medicalHistory.preOp.generalState.enabled', !data.medicalHistory.preOp.generalState.enabled)}>
                            <input type="checkbox" checked={data.medicalHistory.preOp.generalState.enabled} readOnly className="w-4 h-4 rounded" />
                            <h4 className="font-bold text-sm text-gray-800 dark:text-slate-200">Tổng trạng</h4>
                        </div>
                        {data.medicalHistory.preOp.generalState.enabled && <div className="pl-4 pt-2 border-t border-indigo-100 dark:border-indigo-500/30">
                           <RenderTextArea value={data.medicalHistory.preOp.generalState.content} onChange={e => update('medicalHistory.preOp.generalState.content', e.target.value)} isAiEnabled={isAiEnabled} />
                        </div>}
                    </div>

                    <div className={`${CLASSES.subSectionContainer} ${data.medicalHistory.preOp.preOpParaclinical.enabled ? 'border-indigo-300 dark:border-indigo-500/50 bg-indigo-50/30 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/20'}`}>
                        <div className={`${CLASSES.checkboxContainer}`} onClick={() => update('medicalHistory.preOp.preOpParaclinical.enabled', !data.medicalHistory.preOp.preOpParaclinical.enabled)}>
                            <input type="checkbox" checked={data.medicalHistory.preOp.preOpParaclinical.enabled} readOnly className="w-4 h-4 rounded" />
                            <h4 className="font-bold text-sm text-gray-800 dark:text-slate-200">Cận lâm sàng đã làm</h4>
                        </div>
                        {data.medicalHistory.preOp.preOpParaclinical.enabled && <div className="pl-4 pt-2 border-t border-indigo-100 dark:border-indigo-500/30">
                            {/* ... (CLS implementation here) ... */}
                        </div>}
                    </div>
                    
                    <div className={`${CLASSES.subSectionContainer} ${data.medicalHistory.preOp.preOpDiagnosis.enabled ? 'border-indigo-300 dark:border-indigo-500/50 bg-indigo-50/30 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/20'}`}>
                        <div className={`${CLASSES.checkboxContainer}`} onClick={() => update('medicalHistory.preOp.preOpDiagnosis.enabled', !data.medicalHistory.preOp.preOpDiagnosis.enabled)}>
                             <input type="checkbox" checked={data.medicalHistory.preOp.preOpDiagnosis.enabled} readOnly className="w-4 h-4 rounded" />
                            <h4 className="font-bold text-sm text-gray-800 dark:text-slate-200">Chẩn đoán trước mổ</h4>
                        </div>
                        {data.medicalHistory.preOp.preOpDiagnosis.enabled && <div className="pl-4 pt-2 border-t border-indigo-100 dark:border-indigo-500/30">
                            <RenderTextArea value={data.medicalHistory.preOp.preOpDiagnosis.diagnosis} onChange={e => update('medicalHistory.preOp.preOpDiagnosis.diagnosis', e.target.value)} isAiEnabled={isAiEnabled}/>
                        </div>}
                    </div>
                </div></div>
                
                <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-gray-800 dark:text-slate-200 mb-3 text-base">B. Quá trình trong mổ (Tường trình phẫu thuật)</h3>
                    <div className="space-y-4">
                        <div>
                            <label className={CLASSES.label}>Phân loại phẫu thuật</label>
                            <select className={CLASSES.input} value={data.medicalHistory.intraOp.surgeryClassification} onChange={e => update('medicalHistory.intraOp.surgeryClassification', e.target.value)}>
                                <option value="Chương trình">Mổ chương trình</option>
                                <option value="Cấp cứu">Mổ cấp cứu</option>
                            </select>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className={CLASSES.label}>Thời gian bắt đầu</label>
                                <div className="flex gap-2">
                                    <input className={CLASSES.input} type="text" placeholder="hh:mm" value={data.medicalHistory.intraOp.startTime} onChange={e => update('medicalHistory.intraOp.startTime', autoFormatTime(e.target.value))} />
                                    <input className={CLASSES.input} type="text" placeholder="dd/mm/yyyy" value={data.medicalHistory.intraOp.startDate} onChange={e => update('medicalHistory.intraOp.startDate', autoFormatDate(e.target.value))} />
                                </div>
                            </div>
                            <div>
                                <label className={CLASSES.label}>Thời gian kết thúc</label>
                                <div className="flex gap-2">
                                    <input className={CLASSES.input} type="text" placeholder="hh:mm" value={data.medicalHistory.intraOp.endTime} onChange={e => update('medicalHistory.intraOp.endTime', autoFormatTime(e.target.value))} />
                                    <input className={CLASSES.input} type="text" placeholder="dd/mm/yyyy" value={data.medicalHistory.intraOp.endDate} onChange={e => update('medicalHistory.intraOp.endDate', autoFormatDate(e.target.value))} />
                                </div>
                            </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div><label className={CLASSES.label}>Tư thế bệnh nhân</label><input className={CLASSES.input} value={data.medicalHistory.intraOp.patientPosition} onChange={e => update('medicalHistory.intraOp.patientPosition', e.target.value)} /></div>
                            <div><label className={CLASSES.label}>Phương pháp vô cảm</label><input className={CLASSES.input} value={data.medicalHistory.intraOp.anesthesiaMethod} onChange={e => update('medicalHistory.intraOp.anesthesiaMethod', e.target.value)} /></div>
                        </div>
                        <div><label className={CLASSES.label}>Loại phẫu thuật</label><input className={CLASSES.input} value={data.medicalHistory.intraOp.surgeryMethod} onChange={e => update('medicalHistory.intraOp.surgeryMethod', e.target.value)} /></div>
                        <RenderTextArea label="Phương pháp xử lý" value={data.medicalHistory.intraOp.surgeryProcedure} onChange={e => update('medicalHistory.intraOp.surgeryProcedure', e.target.value)} isAiEnabled={isAiEnabled} />
                        <RenderTextArea label="Tai biến" value={data.medicalHistory.intraOp.complications} onChange={e => update('medicalHistory.intraOp.complications', e.target.value)} isAiEnabled={isAiEnabled} />
                    </div>
                </div>

                <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50"><h3 className="font-bold text-gray-800 dark:text-slate-200 mb-3 text-base">C. Quá trình sau mổ</h3>
                    <div className="space-y-3">
                        {data.medicalHistory.postOp.dailyExams.map((exam, idx) => (
                            <div key={exam.id} className="p-3 border-dashed border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 relative">
                                <button onClick={() => {const n = data.medicalHistory.postOp.dailyExams.filter(e => e.id !== exam.id); update('medicalHistory.postOp.dailyExams', n)}} className="absolute top-2 right-2 text-red-500"><Trash2 className="w-4 h-4"/></button>
                                <RenderTextArea label={`Hậu phẫu ngày ${idx + 1}`} value={exam.content} onChange={e => {const n = [...data.medicalHistory.postOp.dailyExams]; n[idx].content = e.target.value; update('medicalHistory.postOp.dailyExams', n)}} placeholder="Diễn tiến trong ngày..." isAiEnabled={isAiEnabled} />
                            </div>
                        ))}
                    </div>
                    <button onClick={() => update('medicalHistory.postOp.dailyExams', [...data.medicalHistory.postOp.dailyExams, {id: Date.now().toString(), content: ''}])} className="mt-3 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm"><Plus className="w-4 h-4" /> Thêm khám hậu phẫu</button>
                </div>
            </div>
        </div>
        {/* ... Other sections ... */}
        <div className={CLASSES.sectionContainer}><h2 className="text-lg font-bold text-indigo-700 dark:text-indigo-400 mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-2"><BrainCircuit className="w-5 h-5" /> VIII. TÓM TẮT BỆNH ÁN</h2>
            <RenderTextArea 
                value={data.summary} 
                onChange={e => update('summary', e.target.value)}
                placeholder="Tóm tắt: Bệnh nhân nam/nữ... hậu phẫu ngày thứ..."
                aiTask="SUMMARY"
                isGenerating={aiLoading === 'SUMMARY'}
                onAIGenerate={() => handleAIGenerate('SUMMARY', 'summary')}
                isAiEnabled={isAiEnabled}
            />
        </div>
        
        <div className={CLASSES.sectionContainer}><h2 className="text-lg font-bold text-indigo-700 dark:text-indigo-400 mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-2"><BrainCircuit className="w-5 h-5" /> IX. BIỆN LUẬN LÂM SÀNG</h2>
            <RenderTextArea 
                value={data.clinicalDiscussion} 
                onChange={e => update('clinicalDiscussion', e.target.value)}
                placeholder="Biện luận các vấn đề hiện tại của bệnh nhân..."
                aiTask="CLINICAL_DISCUSSION"
                isGenerating={aiLoading === 'CLINICAL_DISCUSSION'}
                onAIGenerate={() => handleAIGenerate('CLINICAL_DISCUSSION', 'clinicalDiscussion')}
                isAiEnabled={isAiEnabled}
            />
        </div>
        
        <div className={CLASSES.sectionContainer}><h2 className="text-lg font-bold text-indigo-700 dark:text-indigo-400 mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-2"><BrainCircuit className="w-5 h-5" /> X. CHẨN ĐOÁN XÁC ĐỊNH</h2>
            <RenderTextArea 
                value={data.finalDiagnosis} 
                onChange={e => update('finalDiagnosis', e.target.value)}
                placeholder="Chẩn đoán xác định sau mổ..."
                aiTask="FINAL_DIAGNOSIS"
                isGenerating={aiLoading === 'FINAL_DIAGNOSIS'}
                onAIGenerate={() => handleAIGenerate('FINAL_DIAGNOSIS', 'finalDiagnosis')}
                isAiEnabled={isAiEnabled}
            />
        </div>

        <div className={CLASSES.sectionContainer}><h2 className="text-lg font-bold text-indigo-700 dark:text-indigo-400 mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-2"><FlaskConical className="w-5 h-5" /> XI. HƯỚNG XỬ TRÍ</h2>
            <RenderTextArea 
                value={data.treatmentPlan} 
                onChange={e => update('treatmentPlan', e.target.value)}
                placeholder="Đề xuất hướng xử trí tiếp theo..."
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
          formType="post-op"
          messages={chatMessages}
          setMessages={setChatMessages}
        />
      )}
      
      {showPreview && <PreviewModal data={data} onClose={() => setShowPreview(false)} />}
    </div>
  );
};