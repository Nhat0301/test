import { ImageSize, PatientRecord, CustomOrganExam, PostOpRecord, ParaclinicalItem, ChatMessage } from "../types";

const WORKER_URL = "https://gemini-proxy.minhnaath.workers.dev/gemini";

async function callGemini(prompt: string): Promise<string> {

  const response = await fetch(WORKER_URL, {

    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({

      contents: [
        {
          role: "user",
          parts: [
            { text: prompt }
          ]
        }
      ]

    })

  });

  const data = await response.json();

  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

}




// --- TEXT SERVICES ---

const serializeParaclinicalResults = (results: ParaclinicalItem[]): string => {
    if (!results || results.length === 0) return "Không có";
    return results.map(r => {
        let resultString = `${r.name} (${r.date || 'N/A'}):`;
        let contentAdded = false;

        if (r.resultText && r.resultText.trim()) {
            resultString += ` ${r.resultText.replace(/\n/g, ' ')}`;
            contentAdded = true;
        }

        if (r.tableData && r.tableData.length > 0) {
            if (contentAdded) {
                resultString += " |";
            }
            const header = r.tableData[0].join(' | ');
            const rows = r.tableData.slice(1).map(row => row.join(' | ')).join('; ');
            resultString += ` Dữ liệu bảng: ${header}; ${rows}`;
        }
        return resultString;
    }).join(" || ");
};


const serializeRecord = (data: PatientRecord): string => {
  const formatOrgan = (name: string, organ: any) => {
      const techniquesStr = (organ.techniques || [])
        .filter(t => t.name && t.content)
        .map(t => `${t.name}: ${t.content.replace(/\n/g, ' ')}`)
        .join('; ');
      const generalStr = organ.generalContent ? `Mô tả chung: ${organ.generalContent.replace(/\n/g, ' ')}` : '';
      return `${name}: ${techniquesStr}${techniquesStr && generalStr ? '; ' : ''}${generalStr}`;
  };

  const customOrgans = (data.examination.customOrgans || [])
    .filter(organ => organ.enabled && organ.name)
    .map(organ => formatOrgan(organ.name, organ));

  const activeOrgans = customOrgans.join(" || ");

  const customHistory = (data.pastHistory.personal.custom || [])
    .filter(c => c.name && c.content)
    .map(c => `${c.name}: ${c.content}`)
    .join("; ");

  return JSON.stringify({
    hanh_chinh: {
        gioi_tinh: data.adminDetails.gender,
        tuoi: new Date().getFullYear() - parseInt(data.adminDetails.birthYear || '0'),
    },
    ly_do_nhap_vien: data.reasonForAdmission,
    benh_su: data.history.description,
    tinh_trang_luc_nhap_vien: data.admissionState.systemReview,
    tien_can: {
        ban_than: customHistory,
        gia_dinh: data.pastHistory.family.content
    },
    kham_lam_sang: {
        tong_trang: data.examination.general,
        kham_co_quan: activeOrgans,
        sinh_hieu: data.examination.vitals
    },
    tom_tat_benh_an: data.summary,
    problem_list: data.problemList,
    chuan_doan_so_bo: data.preliminaryDiagnosis,
    chuan_doan_phan_biet: data.differentialDiagnosis,
    ket_qua_can_lam_sang: serializeParaclinicalResults(data.paraclinicalResults)
  }, null, 2);
};

export const generateMedicalText = async (data: PatientRecord, task: 'SUMMARY' | 'PROBLEM' | 'PRELIM_DIAGNOSIS' | 'DIFF_DIAGNOSIS' | 'CLINICAL_DISCUSSION' | 'PARACLINICAL_DISCUSSION' | 'FINAL_DIAGNOSIS' | 'PARACLINICAL_REQUESTS' | 'TREATMENT_PLAN'): Promise<string> => {
  
  let prompt = "";
  const context = serializeRecord(data);
  const age = new Date().getFullYear() - parseInt(data.adminDetails.birthYear || '0');
  const gender = data.adminDetails.gender;

  // Sử dụng Prompts chính xác theo yêu cầu người dùng
  switch(task) {
    case 'SUMMARY': // VII
      prompt = `
      Dữ liệu bệnh án:
      ${context}

      Nhiệm vụ: Bạn là một nhà tổng hợp thông tin, hãy tổng hợp thông tin bệnh án theo mẫu sau. Yêu cầu: trả lời ngắn gọn, cô đọng nhất có thể, không nói thêm gì khác, không nói lời thừa, không dùng kí tự lạ.
      - Bệnh nhân ${gender} ${age} tuổi, nhập viện vì ${data.reasonForAdmission} , qua hỏi bệnh và thăm khám ghi nhận:
      + Triệu chứng cơ năng: <những gì bệnh nhân khai là bất thường>
      + Triệu chứng thực thể: <những gì khám được cho thấy là bất thường hoặc không thoảng đáng với người bình thường>
      + Tiền căn: <Những tiền căn bệnh lý của bệnh nhân>
      `;
      break;

    case 'PROBLEM': // VIII
      prompt = `
      Dữ liệu tóm tắt bệnh án và khám lâm sàng:
      ${data.summary ? `Tóm tắt bệnh án: ${data.summary}` : context}

      Nhiệm vụ: Bạn là một bác sĩ chuyên khoa nhiều kinh nghiệm. Hãy liệt kê các vấn đề của bệnh nhân một cách ngắn gọn nhất có thể, ưu tiên gom thành hội chứng. Không giải thích, không nói lời thừa, không dùng kí tự lạ.
      `;
      break;

    case 'PRELIM_DIAGNOSIS': // IX
      prompt = `
      Các vấn đề của bệnh nhân: ${data.problemList}
      Thông tin lâm sàng khác: ${context}

      Nhiệm vụ: Bạn là một bác sĩ chuyên khoa nhiều kinh nghiệm, hãy đưa ra 1 chẩn đoán duy nhất phù hợp nhất. Không giải thích, không nói lời thừa, không dùng kí tự lạ.
      `;
      break;

    case 'DIFF_DIAGNOSIS': // X
      prompt = `
      Chẩn đoán sơ bộ: ${data.preliminaryDiagnosis}
      Các vấn đề của bệnh nhân: ${data.problemList}
      Thông tin lâm sàng: ${context}

      Nhiệm vụ: Bạn là một bác sĩ chuyên khoa nhiều kinh nghiệm, hãy liệt kê các chẩn đoán phân biệt khác. Không giải thích, không nói lời thừa, không dùng kí tự lạ.
      `;
      break;
    
    case 'CLINICAL_DISCUSSION': // XI
      prompt = `
      Chẩn đoán sơ bộ: ${data.preliminaryDiagnosis}
      Chẩn đoán phân biệt: ${data.differentialDiagnosis}
      Tóm tắt bệnh án: ${data.summary}
      
      Nhiệm vụ: Bạn là một bác sĩ chuyên khoa nhiều kinh nghiệm, hãy biện luận ngắn gọn, tập trung vào các điểm chính để bảo vệ chẩn đoán sơ bộ và loại trừ chẩn đoán phân biệt. Không dài dòng, không nói lời thừa, không dùng kí tự lạ.
      `;
      break;

    case 'PARACLINICAL_REQUESTS': // XII
      prompt = `
      Dữ liệu bệnh án:
      ${context}

      Nhiệm vụ: Bạn là một bác sĩ chuyên khoa nhiều kinh nghiệm. Dựa vào dữ liệu, hãy đề xuất danh sách cận lâm sàng cần thiết. Trả lời ngắn gọn, chỉ liệt kê, không giải thích, không dùng kí tự lạ.
      `;
      break;

    case 'PARACLINICAL_DISCUSSION': // XIV
      prompt = `
      Kết quả cận lâm sàng:
      ${serializeParaclinicalResults(data.paraclinicalResults)}
      
      Thông tin lâm sàng: ${context}

      Nhiệm vụ: Bạn là một bác sĩ chuyên khoa nhiều kinh nghiệm. Biện luận ngắn gọn các kết quả cận lâm sàng bất thường. Trình bày: Tên CLS bất thường: (Biện luận). Không nói thừa, không dùng kí tự lạ.
      `;
      break;

    case 'FINAL_DIAGNOSIS': // XV
      prompt = `
      Biện luận lâm sàng: ${data.clinicalDiscussion}
      Biện luận cận lâm sàng: ${data.paraclinicalDiscussion}
      Chẩn đoán sơ bộ: ${data.preliminaryDiagnosis}

      Nhiệm vụ: Bạn là một bác sĩ chuyên khoa nhiều kinh nghiệm. Từ tất cả dữ liệu, hãy đưa ra 1 chẩn đoán xác định cuối cùng. Trả lời cực kỳ ngắn gọn, không giải thích, không dùng kí tự lạ.
      `;
      break;

    case 'TREATMENT_PLAN': // XVI
      prompt = `
      Dữ liệu bệnh án:
      ${context}
      Chẩn đoán xác định: ${data.finalDiagnosis}

      Nhiệm vụ: Bạn là một chuyên gia lâm sàng. Đề xuất các hướng xử trí cho ca này dưới dạng gạch đầu dòng. Yêu cầu: ngắn gọn, đi thẳng vào vấn đề, không giải thích, không nói lời thừa, không dùng kí tự lạ.
      `;
      break;
  }

return await callGemini(prompt);
};

// --- POST-OP SERVICES ---

const serializePostOpRecord = (data: PostOpRecord): string => {
  const formatOrgan = (name: string, organ: any) => {
      const techniquesStr = (organ.techniques || [])
        .filter(t => t.name && t.content)
        .map(t => `${t.name}: ${t.content.replace(/\n/g, ' ')}`)
        .join('; ');
      const generalStr = organ.generalContent ? `Mô tả chung: ${organ.generalContent.replace(/\n/g, ' ')}` : '';
      return `${name}: ${techniquesStr}${techniquesStr && generalStr ? '; ' : ''}${generalStr}`;
  };

  const customOrgans = (data.examination.customOrgans || [])
    .filter(organ => organ.enabled && organ.name)
    .map(organ => formatOrgan(organ.name, organ));

  const activeOrgans = customOrgans.join(" || ");

  const customHistory = (data.pastHistory.personal.custom || [])
    .filter(c => c.name && c.content)
    .map(c => `${c.name}: ${c.content}`)
    .join("; ");
  const { intraOp } = data.medicalHistory;

  return JSON.stringify({
    hanh_chinh: {
        gioi_tinh: data.adminDetails.gender,
        tuoi: new Date().getFullYear() - parseInt(data.adminDetails.birthYear || '0'),
    },
    ly_do_nhap_vien: data.reasonForAdmission,
    qua_trinh_truoc_mo: {
        khai_benh: data.medicalHistory.preOp.historyTaking.description,
        tong_trang: data.medicalHistory.preOp.generalState.enabled ? data.medicalHistory.preOp.generalState.content : "",
        ket_qua_can_lam_sang_truoc_mo: data.medicalHistory.preOp.preOpParaclinical.enabled ? serializeParaclinicalResults(data.medicalHistory.preOp.preOpParaclinical.results) : "Không có",
        chan_doan_truoc_mo: data.medicalHistory.preOp.preOpDiagnosis.diagnosis,
    },
    qua_trinh_trong_mo: {
        phan_loai: intraOp.surgeryClassification,
        thoi_gian: `từ ${intraOp.startTime} ${intraOp.startDate} đến ${intraOp.endTime} ${intraOp.endDate}`,
        tu_the: intraOp.patientPosition,
        loai_phau_thuat: intraOp.surgeryMethod,
        phuong_phap_vo_cam: intraOp.anesthesiaMethod,
        phuong_phap_xu_ly: intraOp.surgeryProcedure,
        tai_bien: intraOp.complications,
    },
    dien_tien_sau_mo: data.medicalHistory.postOp.dailyExams.map((e, index) => `Hậu phẫu ngày ${index + 1}: ${e.content}`).join(" | "),
    luoc_qua_cac_co_quan: data.systemReview,
    tien_can: {
        ban_than: customHistory,
        gia_dinh: data.pastHistory.family.content
    },
    kham_lam_sang_hien_tai: {
        tong_trang: data.examination.general,
        kham_co_quan: activeOrgans,
        sinh_hieu: data.examination.vitals
    },
    ket_qua_can_lam_sang_sau_mo: serializeParaclinicalResults(data.postOpParaclinicalResults),
    tom_tat_benh_an: data.summary,
    chan_doan_xac_dinh: data.finalDiagnosis
  }, null, 2);
};

export const generatePostOpMedicalText = async (data: PostOpRecord, task: 'SUMMARY' | 'CLINICAL_DISCUSSION' | 'FINAL_DIAGNOSIS' | 'TREATMENT_PLAN'): Promise<string> => {
  
  let prompt = "";
  const context = serializePostOpRecord(data);
  const age = new Date().getFullYear() - parseInt(data.adminDetails.birthYear || '0');
  const gender = data.adminDetails.gender;
  
  const surgeryDay = (() => {
    if (!data.medicalHistory.intraOp.startDate) return new Date();
    const parts = data.medicalHistory.intraOp.startDate.split('/');
    if (parts.length === 3) {
        // parts are dd, mm, yyyy -> new Date(year, monthIndex, day)
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return new Date();
  })();

  const reportDay = data.adminDetails.reportDate ? new Date(data.adminDetails.reportDate) : new Date();
  const postOpDay = Math.ceil((reportDay.getTime() - surgeryDay.getTime()) / (1000 * 60 * 60 * 24));


  switch(task) {
    case 'SUMMARY':
      prompt = `
      Dữ liệu bệnh án hậu phẫu:
      ${context}

      Nhiệm vụ: Bạn là một nhà tổng hợp thông tin, hãy tóm tắt bệnh án hậu phẫu theo mẫu sau. Yêu cầu: trả lời ngắn gọn, cô đọng nhất có thể, không nói thêm gì khác, không nói lời thừa, không dùng kí tự lạ.
      - Bệnh nhân ${gender} ${age} tuổi, hậu phẫu ngày thứ ${postOpDay} phẫu thuật [${data.medicalHistory.intraOp.surgeryMethod}] vì [${data.medicalHistory.preOp.preOpDiagnosis.diagnosis}], qua hỏi bệnh và thăm khám ghi nhận:
      + Triệu chứng cơ năng hiện tại: <những triệu chứng bệnh nhân khai sau mổ>
      + Triệu chứng thực thể hiện tại: <những gì khám được sau mổ>
      + Tóm tắt quá trình mổ và hậu phẫu: <diễn tiến chính>
      + Tiền căn: <Những tiền căn bệnh lý của bệnh nhân>
      `;
      break;

    case 'CLINICAL_DISCUSSION':
      prompt = `
      Dữ liệu bệnh án hậu phẫu:
      ${context}
      
      Nhiệm vụ: Bạn là một bác sĩ chuyên khoa nhiều kinh nghiệm. Biện luận lâm sàng ngắn gọn dựa trên toàn bộ quá trình bệnh lý, tập trung vào vấn đề hiện tại. Không dài dòng, không nói lời thừa, không dùng kí tự lạ.
      `;
      break;

    case 'FINAL_DIAGNOSIS':
      prompt = `
      Dữ liệu bệnh án hậu phẫu:
      ${context}
      Biện luận lâm sàng: ${data.clinicalDiscussion}

      Nhiệm vụ: Bạn là một bác sĩ chuyên khoa nhiều kinh nghiệm. Dựa trên dữ liệu, đưa ra 1 chẩn đoán xác định cuối cùng (bao gồm tình trạng hậu phẫu). Trả lời cực kỳ ngắn gọn, không giải thích, không dùng kí tự lạ.
      `;
      break;

    case 'TREATMENT_PLAN':
      prompt = `
      Dữ liệu bệnh án hậu phẫu:
      ${context}
      Chẩn đoán xác định: ${data.finalDiagnosis}

      Nhiệm vụ: Bạn là một chuyên gia lâm sàng. Đề xuất các hướng xử trí (thuốc, chăm sóc, dinh dưỡng,...) dưới dạng gạch đầu dòng. Yêu cầu: ngắn gọn, đi thẳng vào vấn đề, không giải thích, không nói lời thừa, không dùng kí tự lạ.
      `;
      break;
  }

return await callGemini(prompt);

};

// --- CHAT SERVICE ---
export const generateChatResponse = async (
  patientData: PatientRecord | PostOpRecord,
  history: ChatMessage[],
  formType: 'pre-op' | 'post-op' | 'internal-med'
): Promise<string> => {

  const context = ('medicalHistory' in patientData)
    ? serializePostOpRecord(patientData as PostOpRecord)
    : serializeRecord(patientData as PatientRecord);

  const systemInstruction = `Bạn là MediG, một trợ lý AI y tế chuyên sâu. Nhiệm vụ của bạn là phân tích hồ sơ bệnh án được cung cấp và trả lời câu hỏi của các chuyên gia y tế.

**QUY TẮC QUAN TRỌNG:**
1.  **CỰC KỲ NGẮN GỌN:** Luôn luôn trả lời một cách súc tích và đi thẳng vào vấn đề. Tránh giải thích dài dòng, lặp lại thông tin không cần thiết.
2.  **THÔNG MINH & HỮU ÍCH:**
    *   Phân tích, tổng hợp và suy luận từ dữ liệu để đưa ra nhận định chuyên môn.
    *   Nếu thiếu dữ liệu, hãy chủ động đề xuất các thông tin cần thu thập thêm.
    *   Phát hiện và chỉ ra các điểm mâu thuẫn hoặc thiếu sót nếu có.

Hãy duy trì giọng văn chuyên nghiệp, hợp tác. Người dùng hiện đang xem một hồ sơ bệnh án ${formType}. Đây là dữ liệu bệnh nhân ở định dạng JSON:\n\n${context}`;

  const fullPrompt = `
${systemInstruction}

${history.map(h =>
  `${h.role === "user" ? "User" : "Assistant"}: ${h.text}`
).join("\n")}

Assistant:
`;

  return await callGemini(fullPrompt);

};

