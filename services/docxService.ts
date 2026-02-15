import { PatientRecord, PostOpRecord, ParaclinicalItem } from "../types";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, TabStopType, TabStopPosition, VerticalAlign, ImageRun, ShadingType } from "docx";
import FileSaver from "file-saver";

// --- CONSTANTS ---
const FONT_FAMILY = "Times New Roman";
const FONT_SIZE_TEXT = 26; // 13pt
const FONT_SIZE_HEADER = 26; // 13pt
const FONT_SIZE_TITLE = 32; // 16pt

const LINE_SPACING = { line: 360, lineRule: "auto" }; 
const INDENT_LEVEL_0 = 0;
const INDENT_LEVEL_PLUS = 720; // 0.5 inch

// --- HELPER FUNCTIONS ---
const createHeaderTable = () => {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Đánh giá", font: FONT_FAMILY, bold: true, size: FONT_SIZE_TEXT })], spacing: { after: 120 } })], verticalAlign: VerticalAlign.CENTER }),
            new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Nhận xét", font: FONT_FAMILY, bold: true, size: FONT_SIZE_TEXT })], spacing: { after: 120 } })], verticalAlign: VerticalAlign.CENTER }),
            new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Chữ kí", font: FONT_FAMILY, bold: true, size: FONT_SIZE_TEXT })], spacing: { after: 120 } })], verticalAlign: VerticalAlign.CENTER }),
          ],
        }),
        new TableRow({ height: { value: 1500, rule: "atLeast" }, children: [new TableCell({ children: [] }), new TableCell({ children: [] }), new TableCell({ children: [] })] }),
      ],
    });
};

const createRomanHeading = (text: string) => new Paragraph({ children: [new TextRun({ text: text.toUpperCase(), font: FONT_FAMILY, bold: true, size: FONT_SIZE_HEADER })], spacing: { before: 240, after: 120, line: 360 } });
const createNumberHeading = (text: string) => new Paragraph({ children: [new TextRun({ text: text, font: FONT_FAMILY, bold: true, size: FONT_SIZE_TEXT })], spacing: { before: 120, after: 60, line: 360 } });
const createSubHeading = (text: string) => new Paragraph({ children: [new TextRun({ text, font: FONT_FAMILY, bold: true, size: FONT_SIZE_TEXT })], spacing: { before: 120, after: 60, line: 360 }});
const createDashLine = (label: string | null, value: string | undefined) => new Paragraph({ children: [new TextRun({ text: "– ", font: FONT_FAMILY, size: FONT_SIZE_TEXT }), ...(label ? [new TextRun({ text: `${label}: `, font: FONT_FAMILY, size: FONT_SIZE_TEXT })] : []), new TextRun({ text: value || "", font: FONT_FAMILY, size: FONT_SIZE_TEXT })], spacing: { after: 60, line: 360 } });

const createTextParagraphs = (text: string | undefined, mode: 'dash' | 'plus' = 'dash') => {
    if (!text || text.trim() === '') return [];
    const char = mode === 'plus' ? '+ ' : '– ';
    const indent = mode === 'plus' ? INDENT_LEVEL_PLUS : INDENT_LEVEL_0;
    
    return text.split('\n').filter(line => line.trim() !== '').map(line => 
        new Paragraph({ 
            children: [new TextRun({ text: char + line.trim(), font: FONT_FAMILY, size: FONT_SIZE_TEXT })],
            spacing: { line: 360 },
            indent: { left: indent }
        })
    );
};

const createVitalsSection = (vitals: any, includeBMI = false) => {
    const t1 = 2500, t2 = 5000, t3 = 7500;
    const vitalLine = (content: TextRun[]) => new Paragraph({ children: content, tabStops: [{ type: TabStopType.LEFT, position: t1 }, { type: TabStopType.LEFT, position: t2 }, { type: TabStopType.LEFT, position: t3 }], indent: { left: INDENT_LEVEL_0 }, spacing: { after: 60, line: 360 } });
    const bpText = (vitals?.bp1 && vitals?.bp2) ? `${vitals.bp1}/${vitals.bp2}` : "...";
    
    const paragraphs = [
      vitalLine([new TextRun({ text: `Mạch:`, font: FONT_FAMILY, italics: true, size: FONT_SIZE_TEXT }), new TextRun({ text: `\t${vitals?.pulse || "..."}`, font: FONT_FAMILY, size: FONT_SIZE_TEXT }), new TextRun({ text: ` l/p`, font: FONT_FAMILY, size: FONT_SIZE_TEXT }), new TextRun({ text: `\tSpO2:`, font: FONT_FAMILY, italics: true, size: FONT_SIZE_TEXT }), new TextRun({ text: `\t${vitals?.spo2 || "..."}`, font: FONT_FAMILY, size: FONT_SIZE_TEXT }), new TextRun({ text: ` %`, font: FONT_FAMILY, size: FONT_SIZE_TEXT })]),
      vitalLine([new TextRun({ text: `Huyết áp:`, font: FONT_FAMILY, italics: true, size: FONT_SIZE_TEXT }), new TextRun({ text: `\t${bpText}`, font: FONT_FAMILY, size: FONT_SIZE_TEXT }), new TextRun({ text: ` mmHg`, font: FONT_FAMILY, size: FONT_SIZE_TEXT }), new TextRun({ text: `\tNhịp thở:`, font: FONT_FAMILY, italics: true, size: FONT_SIZE_TEXT }), new TextRun({ text: `\t${vitals?.resp || "..."}`, font: FONT_FAMILY, size: FONT_SIZE_TEXT }), new TextRun({ text: ` l/p`, font: FONT_FAMILY, size: FONT_SIZE_TEXT })]),
      vitalLine([new TextRun({ text: `Nhiệt độ:`, font: FONT_FAMILY, italics: true, size: FONT_SIZE_TEXT }), new TextRun({ text: `\t${vitals?.temp || "..."}`, font: FONT_FAMILY, size: FONT_SIZE_TEXT }), new TextRun({ text: ` °C`, font: FONT_FAMILY, size: FONT_SIZE_TEXT })]),
    ];

    if (includeBMI && vitals?.weight && vitals?.height) {
        paragraphs.push(
            new Paragraph({
                children: [
                    new TextRun({ text: `– Chiều cao: ${vitals.height} cm`, font: FONT_FAMILY, size: FONT_SIZE_TEXT }),
                    new TextRun({ text: `\tCân nặng: ${vitals.weight} kg`, font: FONT_FAMILY, size: FONT_SIZE_TEXT }),
                ],
                tabStops: [{ type: TabStopType.LEFT, position: 4000 }],
                spacing: { after: 60, line: 360 }
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: `→ BMI: ${vitals.bmi} kg/m² (${vitals.classification})`, font: FONT_FAMILY, size: FONT_SIZE_TEXT })
                ],
                spacing: { after: 60, line: 360 }
            })
        );
    }

    return paragraphs;
};

const createOrganSection = (data: PatientRecord | PostOpRecord) => {
    const paragraphs: Paragraph[] = [];
    let counter = 2; 

    const processOrgan = (label: string, organData: any) => {
        paragraphs.push(createNumberHeading(`${counter}. ${label}:`));
        (organData.techniques || []).forEach((tech: {name: string, content: string}) => {
            if (tech.name) {
                paragraphs.push(new Paragraph({
                    children: [new TextRun({ text: `– ${tech.name}:`, font: FONT_FAMILY, size: FONT_SIZE_TEXT })],
                    spacing: { after: 60, line: 360 }
                }));
                paragraphs.push(...createTextParagraphs(tech.content, 'plus'));
            }
        });
        paragraphs.push(...createTextParagraphs(organData.generalContent, 'dash'));
        counter++;
    };

    (data.examination.customOrgans || []).forEach(organData => {
        if (organData && organData.enabled && organData.name) {
            processOrgan(organData.name, organData);
        }
    });

    return paragraphs;
};


// --- HELPERS for Paraclinical items ---
const getImageDimensions = (base64: string): Promise<{ width: number, height: number }> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = (err) => reject(err);
        img.src = base64;
    });
};

const createParaclinicalTable = (tableData: string[][]) => {
    if (!tableData || tableData.length === 0) return null;
    return new Table({
        width: { size: 90, type: WidthType.PERCENTAGE },
        rows: tableData.map((row, rowIndex) => new TableRow({
            children: row.map(cell => new TableCell({
                children: [new Paragraph({ 
                    children: [new TextRun({ 
                        text: cell, 
                        font: FONT_FAMILY, 
                        size: 22, // 11pt
                        bold: rowIndex === 0 
                    })] 
                })],
                shading: rowIndex === 0 ? { type: ShadingType.CLEAR, fill: "E0E0E0" } : undefined,
                verticalAlign: VerticalAlign.CENTER,
            })),
        })),
    });
};

const createParaclinicalItems = async (results: ParaclinicalItem[]): Promise<(Paragraph | Table)[]> => {
    const content: (Paragraph | Table)[] = [];
    const MAX_IMAGE_WIDTH_EMU = 6300000; // Approx 7 inches in EMU

    for (let i = 0; i < results.length; i++) {
        const item = results[i];
        content.push(createNumberHeading(`${i + 1}. ${item.name} (${item.date}):`));
        content.push(...createTextParagraphs(item.resultText, 'dash'));

        if (item.tableData) {
            const table = createParaclinicalTable(item.tableData);
            if (table) content.push(table);
        }

if (item.image) {
    try {
        const [meta, base64] = item.image.split(",");
        if (!base64) throw new Error("Invalid image format");

        const mime = meta.split(":")[1].split(";")[0];
        const type = mime.includes("png") ? "png" : "jpg";

        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);

        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }

        const { width, height } = await getImageDimensions(item.image);
        const aspectRatio = height / width;

        const maxWidth = 500;
        const scaledHeight = maxWidth * aspectRatio;

        content.push(
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new ImageRun({
                        data: bytes,
                        transformation: {
                            width: maxWidth,
                            height: scaledHeight,
                        },
                        type,
                    }),
                ],
            })
        );
    } catch (err) {
        console.error("Image error:", err);
    }
}

    }
    return content;
};

// --- EXPORT FUNCTION FOR PRE-OP (EXISTING) ---
export const exportToDocx = async (data: PatientRecord) => {
  const paraclinicalContent = await createParaclinicalItems(data.paraclinicalResults || []);

  const doc = new Document({
    sections: [{
        properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
        children: [
          new Paragraph({ children: [new TextRun({ text: "Sinh viên: .......................................   MSSV: ....................", font: FONT_FAMILY, size: 22 })], spacing: { after: 200 } }),
          createHeaderTable(),
          new Paragraph({ text: "", spacing: { after: 400 } }), 
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300, line: 360 }, children: [new TextRun({ text: "BỆNH ÁN TIỀN PHẪU", font: FONT_FAMILY, bold: true, size: FONT_SIZE_TITLE })] }),
          
          createRomanHeading("I.\tHÀNH CHÍNH:"),
          createDashLine("Họ và tên", data.adminDetails?.fullName.toUpperCase()),
          createDashLine("Năm sinh", `${data.adminDetails?.birthYear} (${new Date().getFullYear() - parseInt(data.adminDetails?.birthYear || '0')} tuổi)`),
          createDashLine("Giới tính", data.adminDetails?.gender),
          createDashLine("Dân tộc", data.adminDetails?.ethnicity),
          createDashLine("Địa chỉ", data.adminDetails?.address),
          createDashLine("Nghề nghiệp", data.adminDetails?.occupation),
          createDashLine("Ngày nhập viện", data.adminDetails?.admissionDate),
          
          createRomanHeading("II.\tLÝ DO NHẬP VIỆN:"),
          ...createTextParagraphs(data.reasonForAdmission, 'dash'),

          createRomanHeading("III.\tBỆNH SỬ:"),
          createDashLine("Người khai bệnh", data.history?.informant),
          ...createTextParagraphs(data.history?.description, 'dash'),

          createRomanHeading("IV.\tTÌNH TRẠNG LÚC NHẬP VIỆN:"),
          createNumberHeading("1. Sinh hiệu:"), ...createVitalsSection(data.admissionState?.vitals, false),
          createNumberHeading("2. Lược qua các cơ quan:"), ...createTextParagraphs(data.admissionState?.systemReview || "Bệnh nhân tỉnh, tiếp xúc tốt.", 'dash'),

          createRomanHeading("V.\tTIỀN CĂN:"),
          createNumberHeading("1. Tiền căn cá nhân:"),
          
          ...(data.pastHistory?.personal?.custom || []).flatMap(item => item.name ? [
             new Paragraph({ children: [new TextRun({ text: `– ${item.name}:`, font: FONT_FAMILY, size: FONT_SIZE_TEXT })], spacing: { after: 60, line: 360 } }),
             ...createTextParagraphs(item.content, 'plus')
          ] : []),

          createNumberHeading("2. Tiền căn gia đình:"),
          ...createTextParagraphs(data.pastHistory?.family?.content || "Chưa ghi nhận bất thường", 'dash'),

          createRomanHeading("VI.\tKHÁM LÂM SÀNG:"),
          createDashLine("Thời gian khám", `${data.examination?.time || ''} ngày ${data.examination?.date || ''}`),
          createNumberHeading("1. Tổng trạng:"), ...createVitalsSection(data.examination?.vitals, true),
          ...createTextParagraphs(data.examination?.general, 'dash'),
          ...createOrganSection(data),

          createRomanHeading("VII.\tTÓM TẮT BỆNH ÁN:"), ...createTextParagraphs(data.summary, 'dash'),
          createRomanHeading("VIII.\tĐẶT VẤN ĐỀ:"), ...createTextParagraphs(data.problemList, 'dash'),
          createRomanHeading("IX.\tCHẨN ĐOÁN SƠ BỘ:"), ...createTextParagraphs(data.preliminaryDiagnosis, 'dash'),
          createRomanHeading("X.\tCHẨN ĐOÁN PHÂN BIỆT:"), ...createTextParagraphs(data.differentialDiagnosis, 'dash'),
          createRomanHeading("XI.\tBIỆN LUẬN LÂM SÀNG:"), ...createTextParagraphs(data.clinicalDiscussion, 'dash'),
          createRomanHeading("XII.\tĐỀ NGHỊ CẬN LÂM SÀNG:"), ...createTextParagraphs(data.paraclinicalRequests, 'dash'),
          
          createRomanHeading("XIII.\tKẾT QUẢ CẬN LÂM SÀNG:"),
          ...paraclinicalContent,

          createRomanHeading("XIV.\tBIỆN LUẬN CẬN LÂM SÀNG:"), ...createTextParagraphs(data.paraclinicalDiscussion, 'dash'),
          createRomanHeading("XV.\tCHẨN ĐOÁN XÁC ĐỊNH:"), new Paragraph({ children: [new TextRun({ text: data.finalDiagnosis || "", font: FONT_FAMILY, bold: true, size: FONT_SIZE_TEXT })], spacing: { line: 360 } }),
          createRomanHeading("XVI.\tHƯỚNG XỬ TRÍ:"), ...createTextParagraphs(data.treatmentPlan, 'dash'),
        ],
    }]
  });
  const blob = await Packer.toBlob(doc);
  const saveAs = (FileSaver as any).saveAs || FileSaver;
  saveAs(blob, `BenhAn_TienPhau_${(data.adminDetails?.fullName || 'Untitled').replace(/\s+/g, '_')}.docx`);
};

// --- EXPORT FUNCTION FOR POST-OP (REWRITTEN) ---
export const exportPostOpToDocx = async (data: PostOpRecord) => {
    const { medicalHistory: mh } = data;

    const preOpParaclinicalContent = await createParaclinicalItems(mh.preOp.preOpParaclinical.results || []);
    const postOpParaclinicalContent = await createParaclinicalItems(data.postOpParaclinicalResults || []);

    const sections: (Paragraph | Table)[] = [
        new Paragraph({ children: [new TextRun({ text: "Sinh viên: .......................................   MSSV: ....................", font: FONT_FAMILY, size: 22 })], spacing: { after: 200 } }),
        createHeaderTable(),
        new Paragraph({ text: "", spacing: { after: 400 } }), 
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300, line: 360 }, children: [new TextRun({ text: "BỆNH ÁN HẬU PHẪU", font: FONT_FAMILY, bold: true, size: FONT_SIZE_TITLE })] }),
        
        // I. HÀNH CHÍNH
        createRomanHeading("I.\tHÀNH CHÍNH:"),
        createDashLine("Họ và tên", data.adminDetails?.fullName.toUpperCase()),
        createDashLine("Năm sinh", `${data.adminDetails?.birthYear} (${new Date().getFullYear() - parseInt(data.adminDetails?.birthYear || '0')} tuổi)`),
        createDashLine("Giới tính", data.adminDetails?.gender),
        createDashLine("Địa chỉ", data.adminDetails?.address),
        createDashLine("Nghề nghiệp", data.adminDetails?.occupation),
        createDashLine("Ngày nhập viện", data.adminDetails?.admissionDate),
        createDashLine("Ngày làm bệnh án", data.adminDetails?.reportDate),

        // II. LÝ DO NHẬP VIỆN
        createRomanHeading("II.\tLÝ DO NHẬP VIỆN:"),
        ...createTextParagraphs(data.reasonForAdmission, 'dash'),

        // III. BỆNH SỬ
        createRomanHeading("III.\tBỆNH SỬ:"),
        // A. Quá trình trước mổ
        createSubHeading("A. Quá trình trước mổ:"),
    ];

    if (mh.preOp.historyTaking.enabled) {
        sections.push(createSubHeading("Khai bệnh:"));
        sections.push(createDashLine("Người khai bệnh", mh.preOp.historyTaking.informant));
        sections.push(...createTextParagraphs(mh.preOp.historyTaking.description, 'dash'));
    }

    if (mh.preOp.admissionVitals?.enabled) {
        sections.push(createSubHeading("Sinh hiệu:"));
        sections.push(createDashLine("Thời gian", `${mh.preOp.admissionVitals?.time || ''} ngày ${mh.preOp.admissionVitals?.date || ''}`));
        sections.push(...createVitalsSection(mh.preOp.admissionVitals.vitals, false));
    }

    if (mh.preOp.generalState?.enabled) {
        sections.push(createSubHeading("Tổng trạng:"));
        sections.push(...createTextParagraphs(mh.preOp.generalState.content, 'dash'));
    }

    if (mh.preOp.preOpParaclinical.enabled && mh.preOp.preOpParaclinical.results.length > 0) {
        sections.push(createSubHeading("Cận lâm sàng đã làm:"));
        sections.push(...preOpParaclinicalContent);
    }
    if (mh.preOp.preOpDiagnosis.enabled) {
        sections.push(createSubHeading("Chẩn đoán trước mổ:"));
        sections.push(...createTextParagraphs(mh.preOp.preOpDiagnosis.diagnosis, 'dash'));
    }

    // B. Quá trình trong mổ
    sections.push(createSubHeading("B. Quá trình trong mổ (Tường trình phẫu thuật):"));
    sections.push(createDashLine("Phân loại", `Mổ ${mh.intraOp.surgeryClassification}`));
    const surgeryTime = `từ ${mh.intraOp.startTime || '...'} ${mh.intraOp.startDate || '...'} đến ${mh.intraOp.endTime || '...'} ${mh.intraOp.endDate || '...'}`;
    sections.push(createDashLine("Thời gian phẫu thuật", surgeryTime));
    sections.push(createDashLine("Tư thế bệnh nhân", mh.intraOp.patientPosition));
    sections.push(createDashLine("Phương pháp vô cảm", mh.intraOp.anesthesiaMethod));
    sections.push(createDashLine("Loại phẫu thuật", mh.intraOp.surgeryMethod));
    sections.push(createDashLine("Phương pháp xử lý", mh.intraOp.surgeryProcedure));
    sections.push(createDashLine("Tai biến", mh.intraOp.complications));


    // C. Quá trình sau mổ
    sections.push(createSubHeading("C. Quá trình sau mổ:"));
    mh.postOp.dailyExams.forEach((exam, index) => {
        if (exam.content) {
            sections.push(createDashLine(null, `Hậu phẫu ngày ${index + 1}:`));
            sections.push(...createTextParagraphs(exam.content, 'plus'));
        }
    });
    
    // IV. Lược qua các cơ quan
    sections.push(
      createRomanHeading("IV.\tLƯỢC QUA CÁC CƠ QUAN:"),
      ...createTextParagraphs(data.systemReview, 'dash')
    );

    // V. TIỀN CĂN
    const personalHistoryItems = (data.pastHistory?.personal?.custom || []).flatMap(item => item.name ? [
        new Paragraph({ children: [new TextRun({ text: `– ${item.name}:`, font: FONT_FAMILY, size: FONT_SIZE_TEXT })], spacing: { after: 60, line: 360 } }),
        ...createTextParagraphs(item.content, 'plus')
    ] : []);

    sections.push(
        createRomanHeading("V.\tTIỀN CĂN:"),
        createNumberHeading("1. Tiền căn cá nhân:"),
        ...personalHistoryItems,
        createNumberHeading("2. Tiền căn gia đình:"),
        ...createTextParagraphs(data.pastHistory?.family?.content || "Chưa ghi nhận bất thường", 'dash')
    );

    // VI. KHÁM LÂM SÀNG
    const customOrganParagraphs: Paragraph[] = [];
    let counter = 2;
    const processOrgan = (label: string, organData: any) => {
        const paragraphs: Paragraph[] = [];
        paragraphs.push(createNumberHeading(`${counter}. ${label}:`));
        (organData.techniques || []).forEach((tech: {name: string, content: string}) => {
            if (tech.name) {
                paragraphs.push(new Paragraph({
                    children: [new TextRun({ text: `– ${tech.name}:`, font: FONT_FAMILY, size: FONT_SIZE_TEXT })],
                    spacing: { after: 60, line: 360 }
                }));
                paragraphs.push(...createTextParagraphs(tech.content, 'plus'));
            }
        });
        paragraphs.push(...createTextParagraphs(organData.generalContent, 'dash'));
        counter++;
        return paragraphs;
    };
    (data.examination.customOrgans || []).forEach(organData => {
        if (organData && organData.enabled && organData.name) {
            customOrganParagraphs.push(...processOrgan(organData.name, organData));
        }
    });


    sections.push(
        createRomanHeading("VI.\tKHÁM LÂM SÀNG:"),
        createDashLine("Thời gian khám", `${data.examination?.time || ''} ngày ${data.examination?.date || ''}`),
        createNumberHeading("1. Tổng trạng:"), ...createVitalsSection(data.examination?.vitals, true),
        ...createTextParagraphs(data.examination?.general, 'dash'),
        ...customOrganParagraphs
    );

    // VII. Cận lâm sàng sau mổ
    sections.push(createRomanHeading("VII.\tCẬN LÂM SÀNG SAU MỔ:"));
    if (data.postOpParaclinicalResults.length > 0) {
       sections.push(...postOpParaclinicalContent);
    }

    // VIII. Tóm tắt, IX. Biện luận, X. Chẩn đoán, XI. Hướng xử trí
    sections.push(
        createRomanHeading("VIII.\tTÓM TẮT BỆNH ÁN:"), ...createTextParagraphs(data.summary, 'dash'),
        createRomanHeading("IX.\tBIỆN LUẬN LÂM SÀNG:"), ...createTextParagraphs(data.clinicalDiscussion, 'dash'),
        createRomanHeading("X.\tCHẨN ĐOÁN XÁC ĐỊNH:"), new Paragraph({ children: [new TextRun({ text: data.finalDiagnosis || "", font: FONT_FAMILY, bold: true, size: FONT_SIZE_TEXT })], spacing: { line: 360 } }),
        createRomanHeading("XI.\tHƯỚNG XỬ TRÍ:"), ...createTextParagraphs(data.treatmentPlan, 'dash')
    );


    const doc = new Document({
      sections: [{
          properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
          children: sections,
      }]
    });
    const blob = await Packer.toBlob(doc);
    const saveAs = (FileSaver as any).saveAs || FileSaver;
    saveAs(blob, `BenhAn_HauPhau_${(data.adminDetails?.fullName || 'Untitled').replace(/\s+/g, '_')}.docx`);
};

// --- NEW EXPORT FUNCTION FOR INTERNAL MEDICINE ---
export const exportInternalMedToDocx = async (data: PatientRecord) => {
  const paraclinicalContent = await createParaclinicalItems(data.paraclinicalResults || []);

  const doc = new Document({
    sections: [{
        properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
        children: [
          new Paragraph({ children: [new TextRun({ text: "Sinh viên: .......................................   MSSV: ....................", font: FONT_FAMILY, size: 22 })], spacing: { after: 200 } }),
          createHeaderTable(),
          new Paragraph({ text: "", spacing: { after: 400 } }), 
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300, line: 360 }, children: [new TextRun({ text: "BỆNH ÁN NỘI KHOA", font: FONT_FAMILY, bold: true, size: FONT_SIZE_TITLE })] }),
          
          createRomanHeading("I.\tHÀNH CHÍNH:"),
          createDashLine("Họ và tên", data.adminDetails?.fullName.toUpperCase()),
          createDashLine("Năm sinh", `${data.adminDetails?.birthYear} (${new Date().getFullYear() - parseInt(data.adminDetails?.birthYear || '0')} tuổi)`),
          createDashLine("Giới tính", data.adminDetails?.gender),
          createDashLine("Dân tộc", data.adminDetails?.ethnicity),
          createDashLine("Địa chỉ", data.adminDetails?.address),
          createDashLine("Nghề nghiệp", data.adminDetails?.occupation),
          createDashLine("Ngày nhập viện", data.adminDetails?.admissionDate),
          
          createRomanHeading("II.\tLÝ DO NHẬP VIỆN:"),
          ...createTextParagraphs(data.reasonForAdmission, 'dash'),

          createRomanHeading("III.\tBỆNH SỬ:"),
          createDashLine("Người khai bệnh", data.history?.informant),
          ...createTextParagraphs(data.history?.description, 'dash'),

          createRomanHeading("IV.\tTÌNH TRẠNG LÚC NHẬP VIỆN:"),
          createNumberHeading("1. Sinh hiệu:"), ...createVitalsSection(data.admissionState?.vitals, false),
          createNumberHeading("2. Lược qua các cơ quan:"), ...createTextParagraphs(data.admissionState?.systemReview || "Bệnh nhân tỉnh, tiếp xúc tốt.", 'dash'),

          createRomanHeading("V.\tTIỀN CĂN:"),
          createNumberHeading("1. Tiền căn cá nhân:"),
          
          ...(data.pastHistory?.personal?.custom || []).flatMap(item => item.name ? [
             new Paragraph({ children: [new TextRun({ text: `– ${item.name}:`, font: FONT_FAMILY, size: FONT_SIZE_TEXT })], spacing: { after: 60, line: 360 } }),
             ...createTextParagraphs(item.content, 'plus')
          ] : []),

          createNumberHeading("2. Tiền căn gia đình:"),
          ...createTextParagraphs(data.pastHistory?.family?.content || "Chưa ghi nhận bất thường", 'dash'),

          createRomanHeading("VI.\tKHÁM LÂM SÀNG:"),
          createDashLine("Thời gian khám", `${data.examination?.time || ''} ngày ${data.examination?.date || ''}`),
          createNumberHeading("1. Tổng trạng:"), ...createVitalsSection(data.examination?.vitals, true),
          ...createTextParagraphs(data.examination?.general, 'dash'),
          ...createOrganSection(data),

          createRomanHeading("VII.\tTÓM TẮT BỆNH ÁN:"), ...createTextParagraphs(data.summary, 'dash'),
          createRomanHeading("VIII.\tĐẶT VẤN ĐỀ:"), ...createTextParagraphs(data.problemList, 'dash'),
          createRomanHeading("IX.\tCHẨN ĐOÁN SƠ BỘ:"), ...createTextParagraphs(data.preliminaryDiagnosis, 'dash'),
          createRomanHeading("X.\tCHẨN ĐOÁN PHÂN BIỆT:"), ...createTextParagraphs(data.differentialDiagnosis, 'dash'),
          createRomanHeading("XI.\tBIỆN LUẬN LÂM SÀNG:"), ...createTextParagraphs(data.clinicalDiscussion, 'dash'),
          createRomanHeading("XII.\tĐỀ NGHỊ CẬN LÂM SÀNG:"), ...createTextParagraphs(data.paraclinicalRequests, 'dash'),
          
          createRomanHeading("XIII.\tKẾT QUẢ CẬN LÂM SÀNG:"),
          ...paraclinicalContent,

          createRomanHeading("XIV.\tBIỆN LUẬN CẬN LÂM SÀNG:"), ...createTextParagraphs(data.paraclinicalDiscussion, 'dash'),
          createRomanHeading("XV.\tCHẨN ĐOÁN XÁC ĐỊNH:"), new Paragraph({ children: [new TextRun({ text: data.finalDiagnosis || "", font: FONT_FAMILY, bold: true, size: FONT_SIZE_TEXT })], spacing: { line: 360 } }),
          createRomanHeading("XVI.\tHƯỚNG XỬ TRÍ:"), ...createTextParagraphs(data.treatmentPlan, 'dash'),
        ],
    }]
  });
  const blob = await Packer.toBlob(doc);
  const saveAs = (FileSaver as any).saveAs || FileSaver;
  saveAs(blob, `BenhAn_NoiKhoa_${(data.adminDetails?.fullName || 'Untitled').replace(/\s+/g, '_')}.docx`);
};
