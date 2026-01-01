
import { User, UserRole, Zone, RiskCategory, Location, InspectionForm, EvaluationItem, InspectionReport, ReportStatus, Notification, CDR, CDRStatus, CDRIncidentType, CDRServiceType, CDRManagerDecision } from './types';

export const APP_VERSION = '1.4.1';

// Updated USERS list including the Contractor
export const USERS: User[] = [
  { id: 'user1', uid: 'mock_uid_1', name: 'Mohammed Ali', username: 'mali', email: 'mali@example.com', password: 'password123', role: UserRole.Inspector },
  { id: 'user2', uid: 'mock_uid_2', name: 'Fatima Saad', username: 'fsaad', email: 'fsaad@example.com', password: 'password123', role: UserRole.Inspector },
  { id: 'user4', uid: 'mock_uid_4', name: 'ليلى العتيبي', username: 'lotaibi', email: 'lotaibi@example.com', password: 'password123', role: UserRole.Inspector },
  { id: 'user5', uid: 'mock_uid_5', name: 'Khalid Alghamdi', username: 'kghamdi', email: 'kghamdi@example.com', password: 'password123', role: UserRole.Inspector },
  { id: 'user3', uid: 'mock_uid_3', name: 'Manager Ahmed', username: 'manager', email: 'manager@example.com', password: 'admin123', role: UserRole.Supervisor },
  { id: 'user6', uid: 'mock_uid_6', name: 'ياسر الزهراني', username: 'yzahrani', email: 'yzahrani@example.com', password: 'admin456', role: UserRole.Executive },
  // ADDED CONTRACTOR HERE - THIS IS WHAT WAS MISSING
  { id: 'user7', uid: 'mock_uid_7', name: 'CleanCo Manager', username: 'contractor', email: 'clean@company.com', password: 'password123', role: UserRole.Contractor },
];

export const ZONES: Zone[] = [
  { id: 'zone_high', name: { en: 'Critical Areas', ar: 'المناطق الحرجة' }, riskCategory: RiskCategory.High },
  { id: 'zone_medium', name: { en: 'Medium Risk Areas', ar: 'المناطق متوسطة الخطورة' }, riskCategory: RiskCategory.Medium },
  { id: 'zone_low', name: { en: 'General Areas', ar: 'المناطق العامة' }, riskCategory: RiskCategory.Low },
];

const DEFECT_KEYS = ['defect_dust', 'defect_stains', 'defect_rust', 'defect_needs_cleaning', 'defect_needs_maintenance'];

const highRiskItems: EvaluationItem[] = [
    { id: 'hr_item_1', name: 'hr_item_1', maxScore: 6, predefinedDefects: DEFECT_KEYS },
    { id: 'hr_item_2', name: 'hr_item_2', maxScore: 6, predefinedDefects: DEFECT_KEYS },
    { id: 'hr_item_3', name: 'hr_item_3', maxScore: 12, predefinedDefects: DEFECT_KEYS },
    { id: 'hr_item_4', name: 'hr_item_4', maxScore: 12, predefinedDefects: DEFECT_KEYS },
    { id: 'hr_item_5', name: 'hr_item_5', maxScore: 6, predefinedDefects: DEFECT_KEYS },
    { id: 'hr_item_6', name: 'hr_item_6', maxScore: 5, predefinedDefects: DEFECT_KEYS },
    { id: 'hr_item_7', name: 'hr_item_7', maxScore: 6, predefinedDefects: DEFECT_KEYS },
    { id: 'hr_item_8', name: 'hr_item_8', maxScore: 7, predefinedDefects: DEFECT_KEYS },
    { id: 'hr_item_9', name: 'hr_item_9', maxScore: 10, predefinedDefects: DEFECT_KEYS },
    { id: 'hr_item_10', name: 'hr_item_10', maxScore: 7, predefinedDefects: DEFECT_KEYS },
    { id: 'hr_item_11', name: 'hr_item_11', maxScore: 5, predefinedDefects: DEFECT_KEYS },
    { id: 'hr_item_12', name: 'hr_item_12', maxScore: 4, predefinedDefects: DEFECT_KEYS },
    { id: 'hr_item_13', name: 'hr_item_13', maxScore: 5, predefinedDefects: DEFECT_KEYS },
    { id: 'hr_item_14', name: 'hr_item_14', maxScore: 5, predefinedDefects: DEFECT_KEYS },
    { id: 'hr_item_15', name: 'hr_item_15', maxScore: 4, predefinedDefects: DEFECT_KEYS },
];

const mediumRiskItems: EvaluationItem[] = [
    { id: 'mr_item_1', name: 'mr_item_1', maxScore: 3, predefinedDefects: DEFECT_KEYS },
    { id: 'mr_item_2', name: 'mr_item_2', maxScore: 6, predefinedDefects: DEFECT_KEYS },
    { id: 'mr_item_3', name: 'mr_item_3', maxScore: 6, predefinedDefects: DEFECT_KEYS },
    { id: 'mr_item_4', name: 'mr_item_4', maxScore: 4, predefinedDefects: DEFECT_KEYS },
    { id: 'mr_item_5', name: 'mr_item_5', maxScore: 10, predefinedDefects: DEFECT_KEYS },
    { id: 'mr_item_6', name: 'mr_item_6', maxScore: 7, predefinedDefects: DEFECT_KEYS },
    { id: 'mr_item_7', name: 'mr_item_7', maxScore: 5, predefinedDefects: DEFECT_KEYS },
    { id: 'mr_item_8', name: 'mr_item_8', maxScore: 6, predefinedDefects: DEFECT_KEYS },
    { id: 'mr_item_9', name: 'mr_item_9', maxScore: 6, predefinedDefects: DEFECT_KEYS },
    { id: 'mr_item_10', name: 'mr_item_10', maxScore: 10, predefinedDefects: DEFECT_KEYS },
    { id: 'mr_item_11', name: 'mr_item_11', maxScore: 9, predefinedDefects: DEFECT_KEYS },
    { id: 'mr_item_12', name: 'mr_item_12', maxScore: 7, predefinedDefects: DEFECT_KEYS },
    { id: 'mr_item_13', name: 'mr_item_13', maxScore: 5, predefinedDefects: DEFECT_KEYS },
    { id: 'mr_item_14', name: 'mr_item_14', maxScore: 4, predefinedDefects: DEFECT_KEYS },
    { id: 'mr_item_15', name: 'mr_item_15', maxScore: 5, predefinedDefects: DEFECT_KEYS },
    { id: 'mr_item_16', name: 'mr_item_16', maxScore: 4, predefinedDefects: DEFECT_KEYS },
];

const lowRiskItems: EvaluationItem[] = [
    { id: 'lr_item_1', name: 'lr_item_1', maxScore: 6, predefinedDefects: DEFECT_KEYS },
    { id: 'lr_item_2', name: 'lr_item_2', maxScore: 10, predefinedDefects: DEFECT_KEYS },
    { id: 'lr_item_3', name: 'lr_item_3', maxScore: 8, predefinedDefects: DEFECT_KEYS },
    { id: 'lr_item_4', name: 'lr_item_4', maxScore: 4, predefinedDefects: DEFECT_KEYS },
    { id: 'lr_item_5', name: 'lr_item_5', maxScore: 10, predefinedDefects: DEFECT_KEYS },
    { id: 'lr_item_6', name: 'lr_item_6', maxScore: 7, predefinedDefects: DEFECT_KEYS },
    { id: 'lr_item_7', name: 'lr_item_7', maxScore: 5, predefinedDefects: DEFECT_KEYS },
    { id: 'lr_item_8', name: 'lr_item_8', maxScore: 7, predefinedDefects: DEFECT_KEYS },
    { id: 'lr_item_9', name: 'lr_item_9', maxScore: 7, predefinedDefects: DEFECT_KEYS },
    { id: 'lr_item_10', name: 'lr_item_10', maxScore: 6, predefinedDefects: DEFECT_KEYS },
    { id: 'lr_item_11', name: 'lr_item_11', maxScore: 6, predefinedDefects: DEFECT_KEYS },
    { id: 'lr_item_12', name: 'lr_item_12', maxScore: 5, predefinedDefects: DEFECT_KEYS },
    { id: 'lr_item_13', name: 'lr_item_13', maxScore: 10, predefinedDefects: DEFECT_KEYS },
    { id: 'lr_item_14', name: 'lr_item_14', maxScore: 5, predefinedDefects: DEFECT_KEYS },
    { id: 'lr_item_15', name: 'lr_item_15', maxScore: 4, predefinedDefects: DEFECT_KEYS },
];


export const FORMS: InspectionForm[] = [
  { id: 'form1', name: { en: 'High-Risk Area Inspection Form', ar: 'نموذج تفتيش المناطق عالية الخطورة' }, items: highRiskItems },
  { id: 'form2', name: { en: 'Medium-Risk Area Inspection Form', ar: 'نموذج تفتيش المناطق متوسطة الخطورة' }, items: mediumRiskItems },
  { id: 'form3', name: { en: 'Low-Risk Area Inspection Form', ar: 'نموذج تفتيش المناطق منخفضة الخطورة' }, items: lowRiskItems },
];

export const LOCATIONS: Location[] = [
  // High Risk
  { id: 'loc_h_1', name: { ar: 'جناح 8-7، NTCC', en: 'Ward 7-8, NTCC' }, zoneId: 'zone_high', formId: 'form1' },
  { id: 'loc_h_2', name: { ar: 'جناح 23-22، مبنى السموم', en: 'Ward 22-23, Toxicology Bldg' }, zoneId: 'zone_high', formId: 'form1' },
  { id: 'loc_h_3', name: { ar: 'جناح 6-13-14-15، منطقة الطوارئ', en: 'Ward 6-13-14-15, ER Area' }, zoneId: 'zone_high', formId: 'form1' },
  { id: 'loc_h_4', name: { ar: 'جناح 5، CSSD', en: 'Ward 5, CSSD' }, zoneId: 'zone_high', formId: 'form1' },
  { id: 'loc_h_5', name: { ar: 'جناح 24-25، منطقة الطوارئ، NTCC قسم الولادة', en: 'Ward 24-25, ER Area, NTCC Labor Rm' }, zoneId: 'zone_high', formId: 'form1' },
  { id: 'loc_h_6', name: { ar: 'جناح 17-18-20، وحدة العناية المركزة وأجنحتها', en: 'Ward 17-18-20, ICU & Wings' }, zoneId: 'zone_high', formId: 'form1' },
  
  // Medium Risk
  { id: 'loc_m_1', name: { ar: 'مركز الأميرة نورة (طابقين)', en: 'Princess Noura Center (2 Floors)' }, zoneId: 'zone_medium', formId: 'form2' },
  { id: 'loc_m_2', name: { ar: 'وحدة عناية المرأة وأجنحتها', en: 'Women\'s Care Unit & Wings' }, zoneId: 'zone_medium', formId: 'form2' },
  { id: 'loc_m_3', name: { ar: 'وحدة علاج NTCC', en: 'NTCC Treatment Unit' }, zoneId: 'zone_medium', formId: 'form2' },
  { id: 'loc_m_4', name: { ar: 'غرف العمليات الرئيسية', en: 'Main Operating Rooms' }, zoneId: 'zone_medium', formId: 'form2' },
  { id: 'loc_m_5', name: { ar: 'MC1-MC3، مركز القلب (ثلاثة طوابق)', en: 'MC1-MC3, Heart Center (3 Floors)' }, zoneId: 'zone_medium', formId: 'form2' },
  { id: 'loc_m_6', name: { ar: 'غرف العمليات الرئيسية، NTCC إصابات الحرائق', en: 'Main OR, NTCC Burns Unit' }, zoneId: 'zone_medium', formId: 'form2' },
  { id: 'loc_m_7', name: { ar: 'غرف العمليات جميع الأجنحة', en: 'All OR Wings' }, zoneId: 'zone_medium', formId: 'form2' },
  { id: 'loc_m_8', name: { ar: 'قيادة الطب العسكري الميداني', en: 'Field Military Medicine Command' }, zoneId: 'zone_medium', formId: 'form2' },
  { id: 'loc_m_9', name: { ar: 'إدارة المشاريع الداخلية', en: 'Internal Projects Dept.' }, zoneId: 'zone_medium', formId: 'form2' },
  { id: 'loc_m_10', name: { ar: 'كل الممرات والحمامات، MC4', en: 'All Corridors & Toilets, MC4' }, zoneId: 'zone_medium', formId: 'form2' },
  { id: 'loc_m_11', name: { ar: 'قسم التغذية', en: 'Nutrition Department' }, zoneId: 'zone_medium', formId: 'form2' },
  { id: 'loc_m_12', name: { ar: 'قسم التخدير', en: 'Anesthesia Department' }, zoneId: 'zone_medium', formId: 'form2' },
  { id: 'loc_m_13', name: { ar: 'قاعة الرازي', en: 'Al-Razi Hall' }, zoneId: 'zone_medium', formId: 'form2' },
  { id: 'loc_m_14', name: { ar: 'مغسلة الموتى', en: 'Morgue' }, zoneId: 'zone_medium', formId: 'form2' },
  { id: 'loc_m_15', name: { ar: 'منطقة إدارة الصيانة والمشاريع الخارجية', en: 'External Maintenance & Projects Area' }, zoneId: 'zone_medium', formId: 'form2' },
  { id: 'loc_m_16', name: { ar: 'غرف النفايات العامة', en: 'General Waste Rooms' }, zoneId: 'zone_medium', formId: 'form2' },
  { id: 'loc_m_17', name: { ar: 'مكاتب الإدارة الطبية، NTCC', en: 'Medical Admin Offices, NTCC' }, zoneId: 'zone_medium', formId: 'form2' },
  { id: 'loc_m_18', name: { ar: 'غرف الحراس والبوابات، الأشعة بجميع أنواعها', en: 'Guard Rooms, Gates, All Radiology' }, zoneId: 'zone_medium', formId: 'form2' },
  { id: 'loc_m_19', name: { ar: 'المبنى الإداري الجديد', en: 'New Admin Building' }, zoneId: 'zone_medium', formId: 'form2' },
  { id: 'loc_m_20', name: { ar: 'محطة التبريد (الأعصاب)', en: 'Chiller Plant (Neurology)' }, zoneId: 'zone_medium', formId: 'form2' },
  { id: 'loc_m_21', name: { ar: 'قسم التمريض', en: 'Nursing Department' }, zoneId: 'zone_medium', formId: 'form2' },

  // Low Risk
  { id: 'loc_l_1', name: { ar: 'جميع الحدائق بالمستشفى', en: 'All Hospital Gardens' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_2', name: { ar: 'مركز الأميرة نورة، قسم الأسنان', en: 'Princess Noura Center, Dental' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_3', name: { ar: 'جناح 16، العلاج', en: 'Ward 16, Therapy' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_4', name: { ar: 'MFUM، جناح 1-2-3-4', en: 'MFUM, Ward 1-2-3-4' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_5', name: { ar: 'الخدمة الاجتماعية والشؤون الأكاديمية', en: 'Social Service & Academic Affairs' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_6', name: { ar: 'جناح 11-12، مبنى العيادات الخارجية (ثلاثة طوابق)', en: 'Ward 11-12, Outpatient Clinics (3 Floors)' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_7', name: { ar: 'جناح 28-30-31، جراحة المسالك البولية', en: 'Ward 28-30-31, Urology' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_8', name: { ar: 'جناح الإفاقة', en: 'Recovery Ward' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_9', name: { ar: 'إدارة الرعاية الصحية', en: 'Healthcare Administration' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_10', name: { ar: 'المسجد الرئيسي', en: 'Main Mosque' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_11', name: { ar: 'الغرف التعليمية والمكتبة', en: 'Education Rooms & Library' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_12', name: { ar: 'الأشعة الرئيسية والأقسام التابعة', en: 'Main Radiology & Sub-departments' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_13', name: { ar: 'مركز التبرع بالدم', en: 'Blood Donation Center' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_14', name: { ar: 'جناح 40-41-50-51، المختبر المركزي الجديد', en: 'Ward 40-41-50-51, New Central Lab' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_15', name: { ar: 'غرف الانتظار الخارجية', en: 'External Waiting Rooms' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_16', name: { ar: 'مواقف السيارات الزوار', en: 'Visitor Parking' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_17', name: { ar: 'غرف الأطباء المناوبين رجال ونساء', en: 'On-call Doctors Rooms (M/F)' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_18', name: { ar: 'مصليات النساء', en: 'Female Prayer Rooms' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_19', name: { ar: 'CSSD - NTCC - عمليات اليوم الواحد', en: 'CSSD - NTCC - Day Surgery' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_20', name: { ar: 'قاعة الإندجاني', en: 'Al-Endijani Hall' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_21', name: { ar: 'جميع الصيدليات', en: 'All Pharmacies' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_22', name: { ar: 'مواقف السيارات المبنى الإداري', en: 'Admin Building Parking' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_23', name: { ar: 'مصليات العلاج', en: 'Therapy Prayer Rooms' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_24', name: { ar: 'PENT HOUSE', en: 'Penthouse' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_25', name: { ar: 'Pergola medical', en: 'Medical Pergola' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_26', name: { ar: 'Guest House', en: 'Guest House' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_27', name: { ar: 'الطبيعي القديم', en: 'Old Natural Therapy' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_28', name: { ar: 'مكاتب أهلية العلاج', en: 'Private Therapy Offices' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_29', name: { ar: 'الصيدلة الداخلية الرئيسية', en: 'Main Inpatient Pharmacy' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_30', name: { ar: 'إدارة المواصلات', en: 'Transportation Dept.' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_31', name: { ar: 'قسم الأعمال والتموين', en: 'Business & Catering Dept.' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_32', name: { ar: 'Pergola admin', en: 'Admin Pergola' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_33', name: { ar: 'مركز المعلومات', en: 'Information Center' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_34', name: { ar: 'بنك الدم', en: 'Blood Bank' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_35', name: { ar: 'سنترال', en: 'Central Office' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_36', name: { ar: 'Day Care', en: 'Day Care' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_37', name: { ar: 'التنسيق الطبي', en: 'Medical Coordination' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_38', name: { ar: 'مكاتب إدارة المشاريع', en: 'Project Management Offices' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_39', name: { ar: 'PHC الطب الميداني الجديد', en: 'PHC New Field Medicine' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_40', name: { ar: 'مواقف مركز الأعصاب والطوارئ', en: 'Neurology & ER Parking' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_41', name: { ar: 'إدارة MC2 والصيانة والأجهزة الطبية', en: 'MC2, Maintenance & Medical Eq. Mgmt.' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_42', name: { ar: 'مبنى المولدات (الأعصاب)', en: 'Generator Building (Neurology)' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_43', name: { ar: 'البريد والمالية والتحقيق والممتلكات والعقود', en: 'Mail, Finance, Investigation, Property, Contracts' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_44', name: { ar: 'مواقف السيارات العلاج الطبيعي', en: 'Physical Therapy Parking' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_45', name: { ar: 'مكاتب مكافحة العدوى والاتصالات', en: 'Infection Control & Comm. Offices' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_46', name: { ar: 'مسجد ومواقف العلاج الطبيعي', en: 'Physical Therapy Mosque & Parking' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_47', name: { ar: 'إسكان الحرس الوطني بجدة', en: 'National Guard Housing, Jeddah' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_48', name: { ar: 'مراكز صحية (أم السلم، الشرائع، بحرة، الطائف، جازان)', en: 'Health Centers (Umm Al-Salam, etc.)' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_49', name: { ar: 'مركز الطب الوقائي', en: 'Preventive Medicine Center' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_50', name: { ar: 'عيادة PHC', en: 'PHC Clinic' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_51', name: { ar: 'PHC supervisor\'s', en: 'PHC Supervisor\'s Office' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_52', name: { ar: 'مبنى الغلايات (الأعصاب)', en: 'Boiler Building (Neurology)' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_53', name: { ar: 'مسجد الطائف', en: 'Taif Mosque' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_54', name: { ar: 'عيادة CMC', en: 'CMC Clinic' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_55', name: { ar: 'مركز التدريب', en: 'Training Center' }, zoneId: 'zone_low', formId: 'form3' },
  { id: 'loc_l_56', name: { ar: 'مركز العيادات التخصصية الشاملة', en: 'Comprehensive Specialty Clinics Center' }, zoneId: 'zone_low', formId: 'form3' },
];

export const SERVICE_TYPES: CDRServiceType[] = Object.values(CDRServiceType);
export const MANPOWER_DISCREPANCY_OPTIONS = ['Not aware of EVS mission', 'Poor communicator / non-English-speaking staff', 'Uncooperative staff', 'Unauthorized staff / No ID badge', 'Personal hygiene', 'Not approved uniform / No uniform', 'Untrained staff / Not aware of chemical dilution', 'Shortage of staff'];
export const MATERIAL_DISCREPANCY_OPTIONS = ['Using unauthorized supplies', 'Expired items', 'Shortage of supplies', 'No MSDS on site', 'Not maintaining minimum/maximum stock'];
export const EQUIPMENT_DISCREPANCY_OPTIONS = ['Equipment not clean', 'Unauthorized / untagged equipment', 'Improper equipment handling', 'Default of equipment', 'No scheduled maintenance'];
export const ON_SPOT_ACTION_OPTIONS = ['Informing supervisor', 'Stopped procedure', 'Highlighted policy'];
export const ACTION_PLAN_OPTIONS = ['Root cause analysis', 'Process review', 'Implement', 'Involve all stakeholders'];

export const PENALTY_RATES: Record<string, number> = {
  'Failure to clean equipment daily or repair cleaning equipment properly and not following safety procedures.': 1000,
  'Delay in submitting required correspondence, reports, and documents.': 1000,
  'Failure to prepare and submit monthly employee task/area schedules on time.': 1000,
  'Failure of contractor’s staff to comply with uniform, shoes, or displaying ID badges.': 1000,
  'Failure to maintain personal hygiene (body, nails, hair, uniform).': 1000,
  'Failure to provide clearance certificate for departing employees.': 1000,
  'Failure to follow proper cleaning procedures for public areas as per policies.': 1000,
  'Failure to collect non-medical waste on time or follow instructions for transport.': 1000,
  'Delay in equipment maintenance causing work interruption.': 1000,

  'Failure to supply daily consumables/tools for each site.': 1500,
  'Failure to follow administrative directions (delivery delays, policy non-compliance, etc.).': 1500,
  'Employee absence or late arrival without approval – per hour.': 1500,
  'Failure to prepare/submit required professional training program.': 1500,
  'Failure to place warning signs during cleaning in medical areas.': 1500,
  'Failure to respond promptly to cleaning-related complaints.': 1500,
  'Employee taking leave without prior approval.': 1500,
  'Failure to collect non-medical waste from wings/medical areas.': 1500,

  'Failure to meet management & supervision competence standards.': 2000,
  'Improper handling of non-medical waste, exposing people/environment to harm.': 2000,
  'Improper handling of medical waste, exposing people/environment to harm.': 2000,
  'Failure to collect medical waste on time or follow transport procedures.': 2000,
  'Failure to respond to emergencies (floods, fire, evacuation).': 2000,
  'Use of unlicensed cleaning materials inside the facility.': 2000,
  'Providing misleading information on manpower attendance or reports.': 2000,
  'Hiring workers without approval.': 2000,
  'Failure to pay workers’ salaries.': 2000,

  'Failure to follow directives for cleaning patient rooms, ORs, and healthcare areas.': 2500,
  'Failure to wear proper PPE in required areas.': 2500,
  'Failure to inform project representative before employee exit or replacement.': 2500,
  'Failure to fill any contract-defined position – per week per position.': 2500,
  'Failure to fill vacant positions – per week per worker.': 2500,
  'Negligence causing injuries or property damage – contractor bears costs.': 2500,
  'Failure to follow infection control policies and safety procedures.': 2500,
  'Improper use of chemicals exposing staff/patients/visitors to harm.': 2500,
  'Issuing cleaning supplies or tools for non-work purposes.': 2500,

  'Not aware of EVS mission': 1000, 
  'Uncooperative staff': 1000, 
  'Poor communicator / non-English-speaking staff': 1000,
  'Unauthorized staff / No ID badge': 1000,
  'Not approved uniform / No uniform': 1000,
  'Shortage of staff': 1500,
  'Untrained staff / Not aware of chemical dilution': 2000,
  'Personal hygiene': 1000,

  'Using unauthorized supplies': 2000,
  'Expired items': 1500,
  'Shortage of supplies': 1500,
  'No MSDS on site': 2000,
  'Not maintaining minimum/maximum stock': 1500,

  'Equipment not clean': 1000,
  'Unauthorized / untagged equipment': 1000,
  'Improper equipment handling': 1000,
  'Default of equipment': 1000,
  'No scheduled maintenance': 1000,

  'Other': 500
};

export const PENALTY_KEY_MAP: Record<string, string> = {
    'Failure to clean equipment daily or repair cleaning equipment properly and not following safety procedures.': 'penalty_a1',
    'Delay in submitting required correspondence, reports, and documents.': 'penalty_a2',
    'Failure to prepare and submit monthly employee task/area schedules on time.': 'penalty_a3',
    'Failure of contractor’s staff to comply with uniform, shoes, or displaying ID badges.': 'penalty_a4',
    'Failure to maintain personal hygiene (body, nails, hair, uniform).': 'penalty_a5',
    'Failure to provide clearance certificate for departing employees.': 'penalty_a6',
    'Failure to follow proper cleaning procedures for public areas as per policies.': 'penalty_a7',
    'Failure to collect non-medical waste on time or follow instructions for transport.': 'penalty_a8',
    'Delay in equipment maintenance causing work interruption.': 'penalty_a9',

    'Failure to supply daily consumables/tools for each site.': 'penalty_b1',
    'Failure to follow administrative directions (delivery delays, policy non-compliance, etc.).': 'penalty_b2',
    'Employee absence or late arrival without approval – per hour.': 'penalty_b3',
    'Failure to prepare/submit required professional training program.': 'penalty_b4',
    'Failure to place warning signs during cleaning in medical areas.': 'penalty_b5',
    'Failure to respond promptly to cleaning-related complaints.': 'penalty_b6',
    'Employee taking leave without prior approval.': 'penalty_b7',
    'Failure to collect non-medical waste from wings/medical areas.': 'penalty_b8',

    'Failure to meet management & supervision competence standards.': 'penalty_c1',
    'Improper handling of non-medical waste, exposing people/environment to harm.': 'penalty_c2',
    'Improper handling of medical waste, exposing people/environment to harm.': 'penalty_c3',
    'Failure to collect medical waste on time or follow transport procedures.': 'penalty_c4',
    'Failure to respond to emergencies (floods, fire, evacuation).': 'penalty_c5',
    'Use of unlicensed cleaning materials inside the facility.': 'penalty_c6',
    'Providing misleading information on manpower attendance or reports.': 'penalty_c7',
    'Hiring workers without approval.': 'penalty_c8',
    'Failure to pay workers’ salaries.': 'penalty_c9',

    'Failure to follow directives for cleaning patient rooms, ORs, and healthcare areas.': 'penalty_d1',
    'Failure to wear proper PPE in required areas.': 'penalty_d2',
    'Failure to inform project representative before employee exit or replacement.': 'penalty_d3',
    'Failure to fill any contract-defined position – per week per position.': 'penalty_d4',
    'Failure to fill vacant positions – per week per worker.': 'penalty_d5',
    'Negligence causing injuries or property damage – contractor bears costs.': 'penalty_d6',
    'Failure to follow infection control policies and safety procedures.': 'penalty_d7',
    'Improper use of chemicals exposing staff/patients/visitors to harm.': 'penalty_d8',
    'Issuing cleaning supplies or tools for non-work purposes.': 'penalty_d9',
};

const generateItems = (formItems: EvaluationItem[], scoreModifier: number = 0) => {
  const lowScoreItemIndex = scoreModifier < 0 ? Math.floor(Math.random() * formItems.length) : -1;

  return formItems.map((item, index) => {
    let score = Math.max(0, item.maxScore - Math.floor(Math.random() * 2)); 
    if (scoreModifier < 0 && index === lowScoreItemIndex) {
      score = Math.max(0, item.maxScore + scoreModifier * 3);
    } else if (scoreModifier < -1) {
       score = Math.max(0, item.maxScore + scoreModifier);
    }
    
    const hasDefect = score < item.maxScore;

    return {
      itemId: item.id,
      score: score,
      comment: hasDefect ? 'Minor issue noted during inspection.' : 'All clear.',
      defects: hasDefect ? [DEFECT_KEYS[Math.floor(Math.random() * DEFECT_KEYS.length)]] : [],
      photos: [],
    };
  });
};

const generateYearlyData = () => {
    const generatedReports: InspectionReport[] = [];
    const generatedCDRs: CDR[] = [];
    const generatedNotifications: Notification[] = [];
    const inspectors = ['user1', 'user2', 'user4', 'user5'];
    let reportCounter = 1;
    let cdrCounter = 1;

    for (let month = 0; month < 12; month++) {
        const daysInMonth = new Date(2025, month + 1, 0).getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(2025, month, day);
            const dateStr = date.toISOString().split('T')[0];
            
            const numReportsToday = Math.floor(Math.random() * 4) + 1; 

            for (let i = 0; i < numReportsToday; i++) {
                const inspectorId = inspectors[Math.floor(Math.random() * inspectors.length)];
                const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
                const form = FORMS.find(f => f.id === location.formId);
                if (!form) continue;

                const qualityRoll = Math.random();
                let scoreModifier = 0;
                
                const isSummer = month >= 5 && month <= 7;
                const failureChance = isSummer ? 0.2 : 0.1;

                if (qualityRoll < failureChance) scoreModifier = -4; 
                else if (qualityRoll < (failureChance + 0.15)) scoreModifier = -2; 
                
                const newReport: InspectionReport = {
                    id: `rep_${month}_${day}_${i}`,
                    referenceNumber: `INSP-2025-${(month + 1).toString().padStart(2, '0')}-${String(reportCounter).padStart(3, '0')}`,
                    inspectorId,
                    locationId: location.id,
                    date: new Date(date.getTime() + i * 3600000 + 32400000).toISOString(),
                    status: ReportStatus.Approved,
                    items: generateItems(form.items, scoreModifier),
                    supervisorComment: scoreModifier < -1 ? 'Please improve.' : undefined
                };
                generatedReports.push(newReport);
                reportCounter++;

                const shouldGenerateCDR = scoreModifier < -1 || Math.random() > 0.95;

                if (shouldGenerateCDR) {
                    const isPenalty = Math.random() > 0.4;
                    const statusRoll = Math.random();
                    let status = CDRStatus.Approved;
                    if (statusRoll > 0.8) status = CDRStatus.Submitted;
                    else if (statusRoll > 0.95) status = CDRStatus.Draft;

                    const discrepancies = MANPOWER_DISCREPANCY_OPTIONS;
                    const randomDiscrepancy = discrepancies[Math.floor(Math.random() * discrepancies.length)];

                    const newCDR: CDR = {
                        id: `cdr_${month}_${day}_${i}`,
                        referenceNumber: `CDR-2025-${(month + 1).toString().padStart(2, '0')}-${String(cdrCounter).padStart(3, '0')}`,
                        employeeId: inspectorId,
                        date: dateStr,
                        time: '10:00',
                        locationId: location.id,
                        incidentType: Math.random() > 0.7 ? CDRIncidentType.Repetitive : CDRIncidentType.First,
                        inChargeName: 'Unit Manager',
                        inChargeId: 'U123',
                        inChargeEmail: 'unit@hospital.com',
                        serviceTypes: [CDRServiceType.Housekeeping],
                        manpowerDiscrepancy: isPenalty ? [randomDiscrepancy] : [],
                        materialDiscrepancy: [],
                        equipmentDiscrepancy: [],
                        onSpotAction: ['Informing supervisor'],
                        actionPlan: ['Training'],
                        staffComment: 'Violation noted during routine inspection.',
                        attachments: [],
                        employeeSignature: USERS.find(u => u.id === inspectorId)?.name || 'Inspector',
                        status: status,
                        managerDecision: status === CDRStatus.Approved ? (isPenalty ? CDRManagerDecision.Penalty : CDRManagerDecision.Warning) : undefined,
                        managerComment: status === CDRStatus.Approved ? 'Approved.' : undefined,
                        managerSignature: status === CDRStatus.Approved ? 'Manager Ahmed' : undefined,
                        finalizedDate: status === CDRStatus.Approved ? dateStr : undefined
                    };
                    generatedCDRs.push(newCDR);
                    cdrCounter++;

                    generatedNotifications.push({
                        id: `notif_${month}_${day}_${i}`,
                        type: status === CDRStatus.Approved ? 'info' : 'alert',
                        message: status === CDRStatus.Approved 
                            ? `CDR ${newCDR.referenceNumber} approved.` 
                            : `New CDR ${newCDR.referenceNumber} submitted by ${USERS.find(u => u.id === inspectorId)?.name}.`,
                        timestamp: new Date(date.getTime() + 40000000).toISOString(),
                        isRead: Math.random() > 0.2,
                        link: `/cdr/${newCDR.id}`
                    });
                }
            }
        }
    }
    
    generatedReports.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    generatedCDRs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    generatedNotifications.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return { generatedReports, generatedCDRs, generatedNotifications };
};

const { generatedReports, generatedCDRs, generatedNotifications } = generateYearlyData();

export const INITIAL_REPORTS: InspectionReport[] = generatedReports;
export const INITIAL_CDRS: CDR[] = generatedCDRs;
export const INITIAL_NOTIFICATIONS: Notification[] = generatedNotifications;
