

export interface VitalSigns {
  pulse: string; // Mạch (lần/phút)
  temp: string; // Nhiệt độ (độ C)
  bp1: string; // Huyết áp Tâm thu (mmHg)
  bp2: string; // Huyết áp Tâm trương (mmHg)
  resp: string; // Nhịp thở (lần/phút)
  spo2: string; // SpO2 (%)
  weight: string; // Cân nặng (kg)
  height: string; // Chiều cao (cm)
  bmi: string; // Auto-calculated
  classification: string; // IDI & WPRO
}

export interface ExaminationTechnique {
  id: string;
  name: string;
  content: string;
}

export interface OrganExam {
  enabled: boolean; // Tick to use
  techniques?: ExaminationTechnique[];
  generalContent: string;
}

export interface CustomOrganExam extends OrganExam {
  id: string;
  name: string;
}


// New interface for toggleable history items
export interface HistoryItem {
  enabled: boolean;
  content: string;
}

export interface ParaclinicalItem {
  id: string;
  name: string;
  date: string;
  image?: string; // Base64
  tableData?: string[][]; // Simple rows/cols
  resultText: string;
}

export interface PatientRecord {
  id: string;
  // I. HÀNH CHÍNH
  adminDetails: {
    fullName: string;
    birthYear: string;
    ethnicity: string;
    gender: 'Nam' | 'Nữ' | 'Khác';
    address: string;
    occupation: string;
    admissionDate: string; // Ngày vào viện
    reportDate: string; // Ngày làm bệnh án
  };
  
  // II. LÝ DO VÀO VIỆN
  reasonForAdmission: string;

  // III. BỆNH SỬ
  history: {
    informant: string; // Người khai bệnh
    description: string;
  };

  // IV. TÌNH TRẠNG LÚC NHẬP VIỆN
  admissionState: {
    vitals: VitalSigns;
    systemReview: string; // Lược qua các cơ quan
  };

  // V. TIỀN CĂN
  pastHistory: {
    personal: {
      custom?: Array<{ id: string; name: string; content: string; }>; // For user-added items
    };
    family: HistoryItem;
  };

  // VI. KHÁM BỆNH
  examination: {
    date: string; // Ngày khám dd/mm/yyyy
    time: string; // Giờ khám hh:mm
    vitals: VitalSigns;
    general: string; // Tổng trạng text
    customOrgans?: CustomOrganExam[];
  };

  // VII. TÓM TẮT BỆNH ÁN
  summary: string;

  // VIII. ĐẶT VẤN ĐỀ
  problemList: string;

  // IX. CHUẨN ĐOÁN SƠ BỘ
  preliminaryDiagnosis: string;

  // X. CHUẨN ĐOÁN PHÂN BIỆT
  differentialDiagnosis: string;

  // XI. BIỆN LUẬN LÂM SÀNG
  clinicalDiscussion: string;

  // XII. ĐỀ NGHỊ CẬN LÂM SÀNG
  paraclinicalRequests: string;

  // XIII. KẾT QUẢ CẬN LÂM SÀNG
  paraclinicalResults: ParaclinicalItem[];

  // XIV. BIỆN LUẬN CẬN LÂM SÀNG
  paraclinicalDiscussion: string;

  // XV. CHUẨN ĐOÁN XÁC ĐỊNH
  finalDiagnosis: string;

  // XVI. HƯỚNG XỬ TRÍ
  treatmentPlan: string;
}

export interface DailyPostOpExam {
  id: string;
  content: string;
}

export interface PostOpRecord {
  id: string;
  // I. HÀNH CHÍNH
  adminDetails: PatientRecord['adminDetails'];
  
  // II. LÝ DO VÀO VIỆN
  reasonForAdmission: string;

  // III. BỆNH SỬ
  medicalHistory: {
    // A. Quá trình trước mổ
    preOp: {
      historyTaking: { enabled: boolean; informant: string; description: string; };
      admissionVitals: { enabled: boolean; date: string; time: string; vitals: VitalSigns; };
      generalState: { enabled: boolean; content: string; };
      preOpParaclinical: { enabled: boolean; results: ParaclinicalItem[]; };
      preOpDiagnosis: { enabled: boolean; diagnosis: string; };
    };
    // B. Quá trình trong mổ (Tường trình phẫu thuật)
    intraOp: {
      surgeryClassification: 'Chương trình' | 'Cấp cứu';
      startDate: string;
      startTime: string;
      endDate: string;
      endTime: string;
      patientPosition: string;
      surgeryMethod: string; // "Loại phẩu thuật"
      anesthesiaMethod: string;
      surgeryProcedure: string; // "Phương pháp xử lý"
      complications: string; // "Tai biến"
    };
    // C. Quá trình sau mổ
    postOp: {
      dailyExams: DailyPostOpExam[];
    };
  };

  // IV. LƯỢC QUA CÁC CƠ QUAN
  systemReview: string;

  // V. TIỀN CĂN
  pastHistory: PatientRecord['pastHistory'];

  // VI. KHÁM LÂM SÀNG (Hiện tại)
  examination: PatientRecord['examination'];

  // VII. CẬN LÂM SÀNG SAU MỔ
  postOpParaclinicalResults: ParaclinicalItem[];
  
  // VIII. TÓM TẮT BỆNH ÁN
  summary: string;

  // IX. BIỆN LUẬN LÂM SÀNG
  clinicalDiscussion: string;
  
  // X. CHẨN ĐOÁN XÁC ĐỊNH
  finalDiagnosis: string;
  
  // XI. HƯỚNG XỬ TRÍ
  treatmentPlan: string;
}


export type ViewState = 'LOBBY' | 'SURGICAL_CHOICE' | 'FORM_PRE_OP' | 'FORM_POST_OP' | 'FORM_INTERNAL_MED';

export enum ImageSize {
  Resolution_1K = "1K",
  Resolution_2K = "2K",
  Resolution_4K = "4K"
}

export interface GeneratedImage {
  url: string;
  type: 'generated' | 'edited';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
