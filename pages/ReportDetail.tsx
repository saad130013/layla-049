
import React, { useContext, useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation as useLocationRouter } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { useI18n } from '../hooks/useI18n';
import Card from '../components/ui/Card';
import { UserRole, InspectionReport, InspectionResultItem, ReportStatus, Location } from '../types';
import EvaluationItemCard from '../components/ui/EvaluationItemCard';
import { Save, Send, ShieldCheck, User as UserIcon, Calendar, MapPin, Hospital, Download, CheckCircle, XCircle, RotateCcw, AlertTriangle, Briefcase, Upload, Camera } from 'lucide-react';

const ReportDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, getReportById, getFormById, getLocationById, getInspectorById, getZoneByLocationId, submitReport, updateReport, addNotification } = useContext(AppContext);
    const { t, language } = useI18n();
    const locationHook = useLocationRouter();
    const newReportFromState = locationHook.state?.newReport as InspectionReport | undefined;

    const isNew = id === 'new';
    const formId = searchParams.get('formId');
    const locationId = searchParams.get('locationId');
    
    const [report, setReport] = useState<InspectionReport | null>(null);
    const [supervisorComment, setSupervisorComment] = useState('');
    
    // Contractor State
    const [rectificationActions, setRectificationActions] = useState('');
    const [rectificationPhotos, setRectificationPhotos] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useMemo(() => {
        const currentFormId = isNew ? formId : getLocationById(report?.locationId ?? '')?.formId;
        return currentFormId ? getFormById(currentFormId) : null;
    }, [isNew, formId, report, getLocationById, getFormById]);

    useEffect(() => {
        if (isNew && formId && locationId && user) {
            const newReport: InspectionReport = {
                id: `temp-${Date.now()}`,
                referenceNumber: 'DRAFT',
                inspectorId: user.id,
                locationId: locationId,
                date: new Date().toISOString(),
                status: ReportStatus.Draft,
                items: form?.items.map(item => ({
                    itemId: item.id,
                    score: item.maxScore,
                    comment: '',
                    defects: [],
                    photos: []
                })) ?? [],
            };
            setReport(newReport);
        } else if (id) {
            const foundReport = getReportById(id);
            if (foundReport) {
                setReport(foundReport);
                setSupervisorComment(foundReport.supervisorComment || '');
                setRectificationActions(foundReport.rectificationActions || '');
                setRectificationPhotos(foundReport.rectificationPhotos || []);
            } else if (newReportFromState && newReportFromState.id === id) {
                setReport(newReportFromState);
                setSupervisorComment(newReportFromState.supervisorComment || '');
            }
        }
    }, [id, isNew, formId, locationId, user, getReportById, form, newReportFromState]);


    const location = report ? getLocationById(report.locationId) : null;
    const inspector = report ? getInspectorById(report.inspectorId) : null;

    const batchLocations = useMemo(() => {
        if (report?.batchLocationIds && report.batchLocationIds.length > 1) {
          return report.batchLocationIds.map(id => getLocationById(id)).filter(l => l !== undefined) as Location[];
        }
        return null;
      }, [report, getLocationById]);

    const maxScore = form?.items.reduce((sum, item) => sum + item.maxScore, 0) || 0;
    const actualScore = report?.items.reduce((sum, item) => sum + item.score, 0) || 0;
    const compliance = maxScore > 0 ? ((actualScore / maxScore) * 100).toFixed(1) : '0.0';
    const complianceColor = +compliance >= 90 ? 'text-green-600' : +compliance >= 75 ? 'text-yellow-600' : 'text-red-600';

    const handleItemChange = (index: number, field: keyof InspectionResultItem, value: any) => {
        if (!report) return;
        const newItems = [...report.items];
        (newItems[index] as any)[field] = value;
        setReport({ ...report, items: newItems });
    };

    // Generic save/update logic
    const saveReportLogic = async (status: ReportStatus, commentOverride?: string) => {
        // FIX: Use local 'report' state as the authoritative source.
        // Previously, fetching from context caused local edits to be lost.
        const currentReport = report;
        
        if (!currentReport) return;
        
        const finalComment = commentOverride !== undefined ? commentOverride : supervisorComment;

        const finalReport: InspectionReport = {
            ...currentReport,
            // Explicitly preserve crucial ownership fields
            inspectorId: currentReport.inspectorId,
            locationId: currentReport.locationId,
            
            status: status,
            supervisorComment: finalComment, 
            rectificationActions: rectificationActions,
            rectificationPhotos: rectificationPhotos,
            id: isNew ? `${Date.now()}` : currentReport.id,
            referenceNumber: isNew && status === ReportStatus.Submitted ? `INSP-${Date.now().toString().slice(-4)}` : currentReport.referenceNumber
        };
        
        // Optimistic update
        setReport(finalReport);

        // Actual Save - AWAIT IS CRITICAL HERE
        if (isNew) {
            await submitReport(finalReport);
        } else {
            await updateReport(finalReport);
        }

        // --- Notifications ---
        if (status === ReportStatus.Returned) {
            addNotification({
                id: `notif-return-${Date.now()}`,
                message: `Report ${finalReport.referenceNumber} returned. Notes: "${finalComment}"`,
                type: 'alert',
                timestamp: new Date().toISOString(),
                isRead: false,
                link: `/my-inspections-list?tab=returned`,
                userId: finalReport.inspectorId
            });
        } else if (status === ReportStatus.RectificationRequired) {
             // Notify Mock Contractor (user7) explicitly
             addNotification({
                id: `notif-rectify-${Date.now()}`,
                message: `URGENT: Rectification Required for ${finalReport.referenceNumber}. Score: ${compliance}%`,
                type: 'alert',
                timestamp: new Date().toISOString(),
                isRead: false,
                link: `/report/${finalReport.id}`,
                userId: 'user7' // Ensure this matches the ID in constants.ts
            });
        } else if (status === ReportStatus.RectificationCompleted) {
             // Notify Inspector
             addNotification({
                id: `notif-rectify-done-${Date.now()}`,
                message: `Contractor submitted rectification for ${finalReport.referenceNumber}. Please review.`,
                type: 'info',
                timestamp: new Date().toISOString(),
                isRead: false,
                link: `/report/${finalReport.id}`,
                userId: finalReport.inspectorId
            });
        }
        
        // Navigation Logic
        if (user?.role === UserRole.Supervisor) {
             navigate('/pending-reviews');
        } else if (user?.role === UserRole.Contractor) {
             navigate('/dashboard');
        } else {
             if (status === ReportStatus.Submitted) {
                 // Inspector submitting
                 alert(t('reportSubmittedSuccess'));
                 navigate('/my-inspections-list');
             } else {
                 // Staying on page or other status change
                 // Force a small delay to ensure React Router sees the state update from Context
                 setTimeout(() => {
                     // If it was new, we must navigate to the NEW id, not 'new'
                     navigate(`/report/${finalReport.id}`);
                 }, 100);
             }
        }
    };

    const handleSaveDraft = () => saveReportLogic(ReportStatus.Draft);
    const handleSubmit = async () => {
        if(window.confirm(t('confirmSubmitReport'))) {
            await saveReportLogic(ReportStatus.Submitted);
        }
    };
    
    // Supervisor Actions
    const handleApprove = async () => {
        if(window.confirm('Are you sure you want to approve this report?')) {
            await saveReportLogic(ReportStatus.Approved, supervisorComment);
        }
    };

    const handleReturn = async () => {
        if(!supervisorComment || !supervisorComment.trim()) {
            alert('Please provide notes/comments before returning the report.');
            return;
        }
        if(window.confirm('Are you sure you want to return this report to the inspector?')) {
            await saveReportLogic(ReportStatus.Returned, supervisorComment);
        }
    };

    // Rectification Actions
    const handleRequestRectification = async () => {
        if(window.confirm('Send this report to the contractor for rectification?')) {
            await saveReportLogic(ReportStatus.RectificationRequired);
        }
    };

    const handleSubmitRectification = async () => {
        if(!rectificationActions.trim()) {
            alert('Please describe the actions taken.');
            return;
        }
        if(window.confirm('Submit rectification details to the inspector?')) {
            await saveReportLogic(ReportStatus.RectificationCompleted);
        }
    };

    const handleAcceptRectification = async () => {
        // Return to draft so inspector can verify and submit again
        if(window.confirm('Accept fix and return report to Draft for final review?')) {
            await saveReportLogic(ReportStatus.Draft);
        }
    };

    const handleRejectRectification = async () => {
         if(window.confirm('Reject fix and return to contractor?')) {
            await saveReportLogic(ReportStatus.RectificationRequired);
        }
    };

    // Contractor Photo Upload
    const handleContractorPhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setRectificationPhotos(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        }
        if(event.target) event.target.value = '';
    };

    // Permissions
    const isInspector = user?.role === UserRole.Inspector;
    const isContractor = user?.role === UserRole.Contractor;
    const isSupervisor = user?.role === UserRole.Supervisor;

    const isEditable = isNew || 
        ((report?.status === ReportStatus.Draft || report?.status === ReportStatus.Returned) && isInspector);
    
    // Allow contractor to edit only when status is strictly RectificationRequired
    const isContractorEditable = report?.status === ReportStatus.RectificationRequired && isContractor;

    const getFloatingIndicatorClass = (val: number) => {
        if (val >= 90) return 'border-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/40';
        if (val >= 75) return 'border-yellow-500 text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/40';
        return 'border-red-500 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/40';
    };

    if (!report || !form) return <div className="text-center p-8">{isNew ? 'Loading form...' : 'Report not found.'}</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 report-container relative">
            
            {/* ALERT for Returned Reports (Visible to Inspector) */}
            {report.status === ReportStatus.Returned && isInspector && (
                <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 mb-6 rounded shadow-md flex flex-col gap-3 no-print">
                    <div className="flex items-center text-red-800 dark:text-red-300">
                        <RotateCcw className="me-2" size={24} />
                        <h3 className="font-bold text-lg">{t('returnedReports')}</h3>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded border border-red-100 dark:border-red-800 shadow-inner">
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">{t('supervisorFeedback')}:</p>
                        <p className="text-gray-800 dark:text-gray-200 italic text-lg">"{report.supervisorComment}"</p>
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-300 font-medium mt-1">
                        Please correct the highlighted issues in the checklist below and click <span className="font-bold underline">"{t('resubmitReport')}"</span>.
                    </p>
                </div>
            )}

            {/* ALERT for Rectification (Visible to Contractor) */}
            {report.status === ReportStatus.RectificationRequired && isContractor && (
                <div className="bg-orange-50 dark:bg-orange-900/30 border-l-4 border-orange-500 p-4 mb-6 rounded shadow-md flex items-center no-print">
                    <Briefcase className="me-3 text-orange-600" size={28} />
                    <div>
                        <h3 className="font-bold text-lg text-orange-800 dark:text-orange-200">{t('rectificationRequired')}</h3>
                        <p className="text-sm text-orange-700 dark:text-orange-300">Please review low scores, take action, and submit proof below.</p>
                    </div>
                </div>
            )}

            <div className="hidden print-block printable-report-body">
                <div className="print-title-block">
                    <div className="logo-title">
                        <Hospital size={40} className="text-brand-blue" />
                        <h1 className="mx-2">InspectionSys</h1>
                    </div>
                    <div className="report-meta">
                        <h2>{t('inspectionReportTitle')}</h2>
                        <p>{report?.referenceNumber}</p>
                    </div>
                </div>
                <table className="print-summary-table">
                    <tbody>
                        <tr>
                            <td><strong>{t('inspector')}:</strong></td>
                            <td>{inspector?.name}</td>
                            <td><strong>{t('date')}:</strong></td>
                            <td>{report ? new Date(report.date).toLocaleDateString() : ''}</td>
                        </tr>
                        <tr>
                            <td><strong>{t(batchLocations ? 'locations' : 'location')}:</strong></td>
                            <td>{batchLocations ? batchLocations.map(l => l.name[language]).join(', ') : location?.name[language]}</td>
                            <td><strong>{t('status')}:</strong></td>
                            <td>{report ? t(report.status) : ''}</td>
                        </tr>
                        <tr>
                            <td><strong>{t('totalScore')}:</strong></td>
                            <td colSpan={3}><strong>{actualScore} / {maxScore} ({compliance}%)</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <Card className="no-print">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-brand-blue-dark dark:text-brand-green">{t('reportDetails')}</h2>
                        <p className="text-gray-500 dark:text-gray-400">{report.referenceNumber}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => window.print()} 
                            className="flex items-center px-4 py-2 bg-brand-blue text-white font-semibold rounded-md shadow-sm hover:bg-brand-blue-dark transition-colors"
                        >
                            <Download size={16} className="me-2" />
                            {t('downloadPdf')}
                        </button>
                        <div className={`text-4xl font-bold ${complianceColor}`}>{compliance}%</div>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm text-gray-600 dark:text-gray-300 border-t dark:border-gray-700 pt-4">
                    <div className="flex items-center"><UserIcon size={16} className="me-2 text-brand-teal"/><strong>{t('inspector')}:</strong><span className="ms-1">{inspector?.name}</span></div>
                    <div className="flex items-center"><Calendar size={16} className="me-2 text-brand-teal"/><strong>{t('date')}:</strong><span className="ms-1">{new Date(report.date).toLocaleDateString()}</span></div>
                    <div className="flex items-start md:col-span-2">
                        <MapPin size={16} className="me-2 mt-1 text-brand-teal flex-shrink-0"/>
                        <div>
                            <strong>{t(batchLocations ? 'locations' : 'location')}:</strong>
                            <div className="ms-1 flex flex-wrap gap-1 mt-1">
                                {batchLocations ? (
                                    batchLocations.map((loc) => (
                                    <span key={loc.id} className={`px-2 py-0.5 rounded-full text-xs whitespace-nowrap ${loc.id === report.locationId ? 'bg-brand-teal text-white font-semibold' : 'bg-gray-200 dark:bg-gray-600'}`}>
                                        {loc.name[language]}
                                    </span>
                                    ))
                                ) : (
                                    <span>{location?.name[language]}</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center col-span-2 md:col-span-4"><ShieldCheck size={16} className="me-2 text-brand-teal"/><strong>{t('status')}:</strong><span className="ms-1">{t(report.status)}</span></div>
                </div>
            </Card>

            <div className="space-y-6">
                {form.items.map((formItem, index) => {
                    const resultItem = report.items.find(ri => ri.itemId === formItem.id) || report.items[index];
                    return (
                        <EvaluationItemCard
                            key={formItem.id}
                            item={formItem}
                            result={resultItem}
                            index={index}
                            isEditable={isEditable}
                            onUpdate={(field, value) => handleItemChange(index, field, value)}
                        />
                    )
                })}
            </div>

            {/* --- RECTIFICATION SECTION (Visible if Contractor involved or workflow active) --- */}
            {(isContractorEditable || report.rectificationActions || report.status === ReportStatus.RectificationCompleted) && (
                <Card title={t('actionsTaken')} className="border-t-4 border-orange-500">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">{t('actionsTaken')}</label>
                            {isContractorEditable ? (
                                <textarea 
                                    className="w-full p-3 border rounded dark:bg-gray-700 dark:border-gray-600"
                                    rows={4}
                                    value={rectificationActions}
                                    onChange={e => setRectificationActions(e.target.value)}
                                    placeholder="Describe cleaning actions taken..."
                                />
                            ) : (
                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded italic">
                                    {rectificationActions || "No actions recorded yet."}
                                </div>
                            )}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-2">{t('proofPhotos')}</label>
                            <div className="flex items-center gap-4 flex-wrap">
                                {rectificationPhotos.map((photo, idx) => (
                                    <div key={idx} className="relative w-24 h-24">
                                        <img src={photo} alt="Proof" className="w-full h-full object-cover rounded shadow-sm" />
                                        {isContractorEditable && (
                                            <button 
                                                onClick={() => setRectificationPhotos(prev => prev.filter((_, i) => i !== idx))}
                                                className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5"
                                            >
                                                <XCircle size={12} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {isContractorEditable && (
                                    <>
                                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleContractorPhotoUpload} className="hidden" />
                                        <button onClick={() => fileInputRef.current?.click()} className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded hover:bg-gray-50 transition">
                                            <Camera size={24} className="text-gray-400" />
                                            <span className="text-xs text-gray-500 mt-1">{t('uploadPhoto')}</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {isContractorEditable && (
                            <div className="flex justify-end pt-4">
                                <button onClick={handleSubmitRectification} className="flex items-center px-6 py-2 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 shadow-md">
                                    <Send size={18} className="me-2" />
                                    {t('submitRectification')}
                                </button>
                            </div>
                        )}
                    </div>
                </Card>
            )}
            
            <div className="no-print">
                {/* INSPECTOR ACTION BAR */}
                {isEditable && (
                     <div className="flex justify-end space-x-4 sticky bottom-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border dark:border-gray-700 z-50">
                        <button onClick={handleSaveDraft} className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600">
                            <Save size={16} className="me-2" />{t('saveAsDraft')}
                        </button>
                        
                        {/* Request Rectification Button - Inspector to Contractor */}
                        <button onClick={handleRequestRectification} className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 shadow-md">
                            <Briefcase size={16} className="me-2" />
                            {t('requestRectification')}
                        </button>

                        <button onClick={handleSubmit} className="flex items-center px-4 py-2 bg-brand-teal text-white rounded-md hover:bg-brand-blue-dark shadow-lg">
                            <Send size={16} className="me-2" />
                            {report.status === ReportStatus.Returned ? t('resubmitReport') : t('submitReport')}
                        </button>
                    </div>
                )}

                {/* INSPECTOR REVIEW OF CONTRACTOR FIX */}
                {report.status === ReportStatus.RectificationCompleted && isInspector && (
                    <div className="sticky bottom-4 z-50 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl border-t-4 border-blue-500 flex justify-end gap-4">
                        <button onClick={handleRejectRectification} className="flex items-center px-4 py-2 bg-red-100 text-red-700 font-bold rounded hover:bg-red-200">
                            <XCircle size={18} className="me-2"/> {t('rejectRectification')}
                        </button>
                        <button onClick={handleAcceptRectification} className="flex items-center px-4 py-2 bg-green-600 text-white font-bold rounded hover:bg-green-700 shadow-md">
                            <CheckCircle size={18} className="me-2"/> {t('acceptRectification')}
                        </button>
                    </div>
                )}

                {/* SUPERVISOR ACTION BAR (Existing) */}
                {isSupervisor && report.status === ReportStatus.Submitted && (
                    <Card title={t('managerReview')} className="sticky bottom-4 z-50 shadow-2xl border-t-4 border-brand-blue bg-white dark:bg-gray-800">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    {t('supervisorFeedback')} <span className="text-red-500">*</span>
                                    <span className="text-xs font-normal text-gray-500 ms-2">(Required for returning)</span>
                                </label>
                                <textarea 
                                    value={supervisorComment} 
                                    onChange={e => setSupervisorComment(e.target.value)} 
                                    className="w-full p-3 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-brand-teal focus:border-brand-teal transition-all min-h-[100px]" 
                                    rows={3}
                                    placeholder={t('managerNotesPlaceholder')}
                                />
                            </div>
                            <div className="flex justify-between items-center gap-4 flex-wrap">
                                <div className="text-xs text-gray-500 hidden sm:block">
                                    Actions take effect immediately.
                                </div>
                                <div className="flex gap-3 w-full sm:w-auto justify-end">
                                    <button 
                                        onClick={handleReturn} 
                                        disabled={!supervisorComment.trim()}
                                        className="flex items-center px-4 py-2 bg-red-100 text-red-700 font-bold rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-red-200"
                                    >
                                        <XCircle size={18} className="me-2"/> {t('returnToInspector')}
                                    </button>
                                    <button 
                                        onClick={handleApprove} 
                                        className="flex items-center px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-lg transition-transform hover:scale-105"
                                    >
                                        <CheckCircle size={18} className="me-2"/> {t('approveReport')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Read Only Feedback Display */}
                {(!isEditable && !isSupervisor && report.supervisorComment && report.status !== ReportStatus.Returned) && (
                    <Card title={t('supervisorFeedback')}>
                        <p className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 text-yellow-800 dark:text-yellow-300 rounded">"{report.supervisorComment}"</p>
                    </Card>
                )}
            </div>

            {isEditable && (
                <div className="fixed bottom-24 left-6 z-40 transition-all duration-300 no-print animate-bounce-slow">
                    <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-full shadow-2xl border-4 backdrop-blur-md ${getFloatingIndicatorClass(+compliance)}`}>
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{t('score')}</span>
                        <span className="text-xl font-black">{compliance}%</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportDetail;
