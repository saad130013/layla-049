
import React, { useContext, useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { useI18n } from '../hooks/useI18n';
import Card from '../components/ui/Card';
import { CDR, CDRStatus, CDRIncidentType, CDRManagerDecision, UserRole, PenaltyInvoice, PenaltyStatus } from '../types';
import { SERVICE_TYPES, MANPOWER_DISCREPANCY_OPTIONS, MATERIAL_DISCREPANCY_OPTIONS, EQUIPMENT_DISCREPANCY_OPTIONS, ON_SPOT_ACTION_OPTIONS, ACTION_PLAN_OPTIONS, PENALTY_RATES } from '../constants';
import { Save, Send, ShieldCheck, Printer, Upload, CheckCircle, Hospital, X, ArrowLeft } from 'lucide-react';

const Section: React.FC<{title: string, children: React.ReactNode, className?: string}> = ({title, children, className}) => {
    const { t } = useI18n();
    return (
        <div className={`border dark:border-gray-700 rounded-lg p-4 ${className}`}>
            <h3 className="text-lg font-semibold text-brand-blue-dark dark:text-brand-green mb-4 border-b dark:border-gray-600 pb-2">{t(title)}</h3>
            <div className="space-y-4">{children}</div>
        </div>
    );
};

const CDRDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, getCDRById, addCDR, updateCDR, locations, getLocationById, getInspectorById, addPenaltyInvoice } = useContext(AppContext);
    const { t, language } = useI18n();

    const isNew = id === 'new';
    const [cdr, setCdr] = useState<CDR | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isNew) {
            if (user && !cdr) {
                setCdr({
                    id: `temp-${Date.now()}`,
                    referenceNumber: 'DRAFT',
                    employeeId: user.id,
                    date: new Date().toISOString().split('T')[0],
                    time: new Date().toTimeString().slice(0, 5),
                    locationId: '',
                    incidentType: CDRIncidentType.First,
                    inChargeName: '',
                    inChargeId: '',
                    inChargeEmail: '',
                    serviceTypes: [],
                    manpowerDiscrepancy: [],
                    materialDiscrepancy: [],
                    equipmentDiscrepancy: [],
                    onSpotAction: [],
                    actionPlan: [],
                    staffComment: '',
                    attachments: [],
                    employeeSignature: '',
                    status: CDRStatus.Draft,
                });
            }
        } else if (id) {
            const foundCDR = getCDRById(id);
            if (foundCDR) setCdr(foundCDR);
        }
    }, [id, isNew, user, getCDRById]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        if (!cdr) return;
        const { name, value } = e.target;
        setCdr({ ...cdr, [name]: value });
    };

    const handleCheckboxChange = (category: keyof CDR, value: string) => {
        if (!cdr) return;
        const currentValues = cdr[category] as string[];
        const newValues = currentValues.includes(value)
            ? currentValues.filter(v => v !== value)
            : [...currentValues, value];
        setCdr({ ...cdr, [category]: newValues });
    };

    const handleAttachmentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!cdr) return;
        if (event.target.files) {
            for (let i = 0; i < event.target.files.length; i++) {
                const file = event.target.files[i];
                if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        if (reader.result) {
                            setCdr(prevCdr => {
                                if (!prevCdr) return null;
                                return { 
                                    ...prevCdr, 
                                    attachments: [...prevCdr.attachments, reader.result as string] 
                                };
                            });
                        }
                    };
                    reader.readAsDataURL(file);
                }
            }
            if(event.target) event.target.value = '';
        }
    };

    const handleRemoveAttachment = (index: number) => {
        if (!cdr) return;
        const newAttachments = cdr.attachments.filter((_, i) => i !== index);
        setCdr({ ...cdr, attachments: newAttachments });
    };


    const handleSave = (status: CDRStatus) => {
        if (!cdr || !user) return;
        const finalCDR: CDR = {
            ...cdr,
            employeeSignature: user.name,
            status,
            id: isNew ? `cdr-${Date.now()}` : cdr.id,
            referenceNumber: isNew && status === CDRStatus.Submitted ? `CDR-${Date.now().toString().slice(-4)}` : cdr.referenceNumber,
        };

        if (isNew) {
            addCDR(finalCDR);
        } else {
            updateCDR(finalCDR);
        }
        navigate(`/cdr/${finalCDR.id}`);
    };
    
    const handleManagerApproval = () => {
        if (!cdr || !user) return;
        if (!cdr.managerDecision) {
            alert(t('pleaseSelectManagerDecision'));
            return;
        }

        const finalCDR: CDR = {
            ...cdr,
            managerSignature: user.name,
            finalizedDate: new Date().toISOString(),
            status: CDRStatus.Approved,
        };
        
        if (finalCDR.managerDecision === CDRManagerDecision.Penalty) {
            const invoiceItems: any[] = [];
            finalCDR.manpowerDiscrepancy.forEach(d => {
                invoiceItems.push({ description: d, category: 'Manpower Discrepancy', amount: PENALTY_RATES[d] || PENALTY_RATES['Other'] });
            });
            finalCDR.materialDiscrepancy.forEach(d => {
                invoiceItems.push({ description: d, category: 'Material Discrepancy', amount: PENALTY_RATES[d] || PENALTY_RATES['Other'] });
            });
            finalCDR.equipmentDiscrepancy.forEach(d => {
                invoiceItems.push({ description: d, category: 'Equipment Discrepancy', amount: PENALTY_RATES[d] || PENALTY_RATES['Other'] });
            });

            const totalAmount = invoiceItems.reduce((sum, item) => sum + item.amount, 0);

            if (totalAmount > 0) {
                const location = getLocationById(cdr.locationId);
                const inspector = getInspectorById(cdr.employeeId);
                
                const newInvoice: PenaltyInvoice = {
                    id: `inv-${Date.now()}`,
                    cdrId: finalCDR.id,
                    cdrReference: finalCDR.referenceNumber,
                    dateGenerated: new Date().toISOString(),
                    locationName: location?.name[language] || 'Unknown Location',
                    inspectorName: inspector?.name || 'Unknown Inspector',
                    items: invoiceItems,
                    totalAmount,
                    status: PenaltyStatus.Pending,
                };
                addPenaltyInvoice(newInvoice);
                alert(`Report Approved. Penalty Invoice generated for ${totalAmount} SAR.`);
            }
        } else {
            alert(`Report Approved with decision: ${t(finalCDR.managerDecision || '')}.`);
        }

        updateCDR(finalCDR);
        setCdr(finalCDR);
    };
    
    const renderCheckboxes = (title: string, options: string[], category: keyof CDR, isEditable: boolean) => (
        <Section title={title}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {options.map(opt => (
                <label key={opt} className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer">
                    <input
                        type="checkbox"
                        checked={(cdr?.[category] as string[])?.includes(opt)}
                        onChange={() => handleCheckboxChange(category, opt)}
                        disabled={!isEditable}
                        className="h-5 w-5 rounded border-gray-300 text-brand-teal focus:ring-brand-teal disabled:cursor-not-allowed"
                    />
                    <span>{opt}</span>
                </label>
            ))}
            </div>
        </Section>
    );
    
    if (!cdr) return <div>Loading CDR...</div>;
    
    // صلاحيات الأدوار
    const isInspector = user?.role === UserRole.Inspector;
    const isSupervisor = user?.role === UserRole.Supervisor;
    const isContractor = user?.role === UserRole.Contractor;

    const isEmployeeEditable = isInspector && cdr.status === CDRStatus.Draft && user?.id === cdr.employeeId;
    const isManagerEditable = isSupervisor && cdr.status === CDRStatus.Submitted;
    const isEditableOnScreen = isEmployeeEditable || isManagerEditable;

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full no-print">
                            <ArrowLeft size={20} />
                        </button>
                        <h2 className="text-2xl font-bold text-brand-blue-dark dark:text-brand-green">
                            {isNew ? t('newCDR') : `${t('cdr')} - ${cdr.referenceNumber}`}
                        </h2>
                    </div>
                     {!isNew && (
                        <button onClick={() => window.print()} className="flex items-center px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-brand-blue-dark no-print">
                            <Printer size={16} className="me-2"/> {t('printReport')}
                        </button>
                     )}
                </div>
            </Card>
            
            {/* إخطار بقرار المدير - هام جداً للمقاول */}
            {cdr.status === CDRStatus.Approved && (
                <div className={`p-6 rounded-lg border-l-8 shadow-md flex items-center justify-between no-print ${
                    cdr.managerDecision === CDRManagerDecision.Penalty ? 'bg-red-50 border-red-500' : 'bg-blue-50 border-blue-500'
                }`}>
                    <div>
                        <p className="text-sm font-bold uppercase opacity-60">{t('managerDecision')}</p>
                        <h3 className={`text-2xl font-black ${cdr.managerDecision === CDRManagerDecision.Penalty ? 'text-red-700' : 'text-blue-700'}`}>
                            {t(cdr.managerDecision || '')}
                        </h3>
                        {cdr.managerComment && <p className="mt-2 italic text-gray-700">"{cdr.managerComment}"</p>}
                    </div>
                    <CheckCircle size={48} className={cdr.managerDecision === CDRManagerDecision.Penalty ? 'text-red-300' : 'text-blue-300'} />
                </div>
            )}

            <div className="no-print space-y-6">
                <Section title="basicIncidentInformation">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputField label="dateOfIncident" name="date" type="date" value={cdr.date} onChange={handleInputChange} disabled={!isEmployeeEditable} />
                        <InputField label="timeOfIncident" name="time" type="time" value={cdr.time} onChange={handleInputChange} disabled={!isEmployeeEditable} />
                        <SelectField label="wardLocation" name="locationId" value={cdr.locationId} onChange={handleInputChange} disabled={!isEmployeeEditable} options={locations.map(l => ({ value: l.id, label: l.name[language] }))} />
                        <SelectField label="typeOfIncident" name="incidentType" value={cdr.incidentType} onChange={handleInputChange} disabled={!isEmployeeEditable} options={Object.values(CDRIncidentType).map(v => ({ value: v, label: t(v) }))} />
                    </div>
                </Section>
                <Section title="inCharge">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputField label="name" name="inChargeName" value={cdr.inChargeName} onChange={handleInputChange} disabled={!isEmployeeEditable} />
                        <InputField label="idNo" name="inChargeId" value={cdr.inChargeId} onChange={handleInputChange} disabled={!isEmployeeEditable} />
                        <InputField label="email" name="inChargeEmail" type="email" value={cdr.inChargeEmail} onChange={handleInputChange} disabled={!isEmployeeEditable} />
                    </div>
                </Section>

                {renderCheckboxes("serviceType", SERVICE_TYPES, 'serviceTypes', isEmployeeEditable)}
                {renderCheckboxes("manpowerDiscrepancy", MANPOWER_DISCREPANCY_OPTIONS, 'manpowerDiscrepancy', isEmployeeEditable)}
                {renderCheckboxes("materialDiscrepancy", MATERIAL_DISCREPANCY_OPTIONS, 'materialDiscrepancy', isEmployeeEditable)}
                {renderCheckboxes("equipmentDiscrepancy", EQUIPMENT_DISCREPANCY_OPTIONS, 'equipmentDiscrepancy', isEmployeeEditable)}
                {renderCheckboxes("onSpotAction", ON_SPOT_ACTION_OPTIONS, 'onSpotAction', isEmployeeEditable)}
                {renderCheckboxes("actionPlan", ACTION_PLAN_OPTIONS, 'actionPlan', isEmployeeEditable)}

                <Section title="staffComment">
                    <textarea name="staffComment" value={cdr.staffComment} onChange={handleInputChange} disabled={!isEmployeeEditable} rows={5} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                </Section>

                {isEmployeeEditable && (
                    <div className="flex justify-end space-x-4 mt-6">
                        <button onClick={() => handleSave(CDRStatus.Draft)} className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"><Save size={16} className="me-2" />{t('saveAsDraft')}</button>
                        <button onClick={() => handleSave(CDRStatus.Submitted)} className="flex items-center px-4 py-2 bg-brand-teal text-white rounded-md hover:bg-brand-blue-dark"><Send size={16} className="me-2" />{t('submitToManager')}</button>
                    </div>
                )}
                
                {isManagerEditable && (
                    <Section title="managerReview" className="bg-yellow-50 border-yellow-200">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="font-bold text-gray-800">{t('managerDecision')}</label>
                                <div className="flex flex-wrap gap-6 bg-white p-4 rounded-md border border-yellow-100">
                                    {Object.values(CDRManagerDecision).map(decision => (
                                        <label key={decision} className="flex items-center space-x-2 cursor-pointer group">
                                            <input type="radio" name="managerDecision" value={decision} checked={cdr.managerDecision === decision} onChange={handleInputChange} className="w-5 h-5 text-brand-blue focus:ring-brand-blue border-gray-300" />
                                            <span className="font-semibold group-hover:text-brand-blue transition-colors">{t(decision)}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="font-bold block mb-1">{t('managerComment')}</label>
                                <textarea name="managerComment" value={cdr.managerComment || ''} onChange={handleInputChange} rows={3} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" placeholder="Add official feedback here..." />
                            </div>
                            <div className="text-end">
                                <button onClick={handleManagerApproval} className="flex items-center px-6 py-2 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 shadow-md"><ShieldCheck size={18} className="me-2" />{t('approveAndFinalize')}</button>
                            </div>
                        </div>
                    </Section>
                )}
            </div>

            {/* نسخة الطباعة - تظهر دائماً للمقاول والمدير */}
            <div className="hidden print-block">
                <ReadOnlyPrintView cdr={cdr} />
            </div>
        </div>
    );
};

const ReadOnlyPrintView = ({ cdr }: { cdr: CDR }) => {
    const { t, language } = useI18n();
    const { getLocationById } = useContext(AppContext);
    const location = getLocationById(cdr.locationId);

    return (
        <div className="bg-white p-6 rounded-lg cdr-print-view text-black">
            <div className="flex justify-between items-center mb-8 border-b-4 border-brand-blue pb-4">
                <div className="flex items-center">
                    <Hospital size={40} className="text-brand-blue" />
                    <h1 className="text-2xl font-bold mx-2">InspectionSys - CDR</h1>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold uppercase">Environmental Discrepancy Report</h2>
                    <p className="text-sm font-mono">{cdr.referenceNumber}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="border p-3 rounded">
                    <p className="text-xs uppercase text-gray-500 font-bold mb-1">{t('basicIncidentInformation')}</p>
                    <p><strong>{t('date')}:</strong> {new Date(cdr.date).toLocaleDateString()}</p>
                    <p><strong>{t('location')}:</strong> {location?.name[language]}</p>
                    <p><strong>{t('typeOfIncident')}:</strong> {t(cdr.incidentType)}</p>
                </div>
                <div className="border p-3 rounded">
                    <p className="text-xs uppercase text-gray-500 font-bold mb-1">{t('inCharge')}</p>
                    <p><strong>{t('name')}:</strong> {cdr.inChargeName}</p>
                    <p><strong>{t('idNo')}:</strong> {cdr.inChargeId}</p>
                </div>
            </div>

            <div className="border p-3 rounded mb-6">
                <p className="text-xs uppercase text-gray-500 font-bold mb-2">{t('discrepancyCategories')}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    {[...cdr.serviceTypes, ...cdr.manpowerDiscrepancy, ...cdr.materialDiscrepancy, ...cdr.equipmentDiscrepancy].map(item => (
                        <div key={item} className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                            {t(item)}
                        </div>
                    ))}
                </div>
            </div>

            <div className="border p-3 rounded mb-6 min-h-[100px]">
                <p className="text-xs uppercase text-gray-500 font-bold mb-1">{t('staffComment')}</p>
                <p className="text-sm italic">{cdr.staffComment}</p>
            </div>

            {cdr.status === CDRStatus.Approved && (
                <div className={`border-2 p-4 rounded mb-8 ${cdr.managerDecision === CDRManagerDecision.Penalty ? 'border-red-300 bg-red-50' : 'border-blue-300 bg-blue-50'}`}>
                    <h3 className="font-bold text-lg mb-1">{t('managerDecision')}: {t(cdr.managerDecision!)}</h3>
                    {cdr.managerComment && <p className="text-sm italic">"{cdr.managerComment}"</p>}
                </div>
            )}

             <div className="mt-10 grid grid-cols-2 gap-20">
                <div className="text-center">
                    <div className="h-16 border-b border-gray-400 mb-2 flex items-end justify-center pb-2">
                        <span className="font-mono">{cdr.employeeSignature}</span>
                    </div>
                    <p className="font-bold text-xs uppercase">{t('employeeSignature')}</p>
                </div>
                 <div className="text-center">
                    <div className="h-16 border-b border-gray-400 mb-2 flex items-end justify-center pb-2">
                        <span className="font-mono">{cdr.managerSignature || '---'}</span>
                    </div>
                    <p className="font-bold text-xs uppercase">{t('managerSignature')}</p>
                </div>
            </div>
        </div>
    );
};

const InputField: React.FC<{label: string, name: string, value: string, onChange: any, disabled: boolean, type?: string}> = ({label, name, value, onChange, disabled, type="text"}) => {
    const { t } = useI18n();
    return (
    <div>
        <label className="block text-sm font-bold mb-1">{t(label)}</label>
        <input type={type} name={name} value={value} onChange={onChange} disabled={disabled} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-800" />
    </div>
);
};

const SelectField: React.FC<{label: string, name: string, value: string, onChange: any, disabled: boolean, options: {value: string, label: string}[]}> = ({label, name, value, onChange, disabled, options}) => {
    const {t} = useI18n();
    return(
    <div>
        <label className="block text-sm font-bold mb-1">{t(label)}</label>
        <select name={name} value={value} onChange={onChange} disabled={disabled} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-800">
             <option value="">-- {t('pleaseSelect')} --</option>
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
)};

export default CDRDetail;
