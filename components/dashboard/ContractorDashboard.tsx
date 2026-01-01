
import React, { useContext, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { useI18n } from '../../hooks/useI18n';
import Card from '../ui/Card';
import { ReportStatus, PenaltyStatus, CDRStatus, CDRManagerDecision } from '../../types';
import { ClipboardList, ArrowRight, Clock, MapPin, CheckCircle, RefreshCw, Receipt, FileWarning, AlertCircle, Info } from 'lucide-react';

const ContractorDashboard: React.FC = () => {
    const { reports, penaltyInvoices, cdrs, getLocationById, getFormById, forceRefresh } = useContext(AppContext);
    const { t, language, formatDate, formatNumber, formatCurrency } = useI18n();

    useEffect(() => {
        forceRefresh();
    }, [forceRefresh]);

    // 1. طلبات التصحيح الميدانية (من التقارير اليومية)
    const rectificationRequests = useMemo(() => {
        return reports
            .filter(r => r.status === ReportStatus.RectificationRequired)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [reports]);

    // 2. الغرامات المالية المعتمدة (بعد اعتماد المدير للـ CDR)
    const approvedPenalties = useMemo(() => {
        return penaltyInvoices
            .sort((a, b) => new Date(b.dateGenerated).getTime() - new Date(a.dateGenerated).getTime());
    }, [penaltyInvoices]);

    // 3. التنبيهات الإدارية المعتمدة (CDRs المعتمدة كـ Warning أو Attention)
    const adminNotices = useMemo(() => {
        return cdrs.filter(c => 
            c.status === CDRStatus.Approved && 
            (c.managerDecision === CDRManagerDecision.Warning || c.managerDecision === CDRManagerDecision.Attention)
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [cdrs]);

    const calculateScore = (report: any) => {
        const location = getLocationById(report.locationId);
        if (!location) return 0;
        const form = getFormById(location.formId);
        if (!form || form.items.length === 0) return 0;
        const maxScore = form.items.reduce((sum, item) => sum + item.maxScore, 0);
        const actualScore = report.items.reduce((sum, item) => sum + item.score, 0);
        return maxScore > 0 ? (actualScore / maxScore) * 100 : 0;
    };

    return (
        <div className="space-y-8 pb-10">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className="p-3 bg-brand-blue rounded-xl text-white shadow-lg">
                        <ClipboardList size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-brand-blue-dark dark:text-gray-200">{t('contractorDashboard')}</h1>
                        <p className="text-gray-500 dark:text-gray-400">{t('welcome')}, {t('contractorRepresentative')}</p>
                    </div>
                </div>
                <button onClick={forceRefresh} className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 shadow-sm">
                    <RefreshCw size={16} className="me-2" /> {t('refreshData')}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SummaryMiniCard title={t('rectificationRequests')} count={rectificationRequests.length} color="border-orange-500 text-orange-600" icon={<Clock size={20}/>} />
                <SummaryMiniCard title={t('approvedPenalties') || 'Approved Penalties'} count={approvedPenalties.length} color="border-red-500 text-red-600" icon={<Receipt size={20}/>} />
                <SummaryMiniCard title={t('adminNotices') || 'Admin Notices'} count={adminNotices.length} color="border-blue-500 text-blue-600" icon={<Info size={20}/>} />
            </div>

            {/* SECTION 1: RECTIFICATION REQUESTS */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <AlertCircle className="text-orange-500" size={22} />
                    {t('rectificationRequests')}
                </h2>
                <Card className="border-t-4 border-orange-500">
                    {rectificationRequests.length === 0 ? (
                        <p className="text-center py-6 text-gray-500">{t('noRectificationRequests')}</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-3">{t('referenceNumber')}</th>
                                        <th className="px-6 py-3">{t('location')}</th>
                                        <th className="px-6 py-3 text-center">{t('score')}</th>
                                        <th className="px-6 py-3 text-center">{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {rectificationRequests.map(report => (
                                        <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-4 font-bold">{report.referenceNumber}</td>
                                            <td className="px-6 py-4">{getLocationById(report.locationId)?.name[language]}</td>
                                            <td className="px-6 py-4 text-center font-bold text-red-600">{formatNumber(calculateScore(report))}%</td>
                                            <td className="px-6 py-4 text-center">
                                                <Link to={`/report/${report.id}`} className="bg-orange-600 text-white px-4 py-2 rounded-md text-xs font-bold hover:bg-orange-700 transition-colors">
                                                    {t('fixNow')}
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>

            {/* SECTION 2: APPROVED PENALTIES (Financial) */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Receipt className="text-red-500" size={22} />
                    {t('penaltyInvoices')}
                </h2>
                <Card className="border-t-4 border-red-500">
                    {approvedPenalties.length === 0 ? (
                        <p className="text-center py-6 text-gray-500">{t('noInvoices')}</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-3">{t('invoiceId')}</th>
                                        <th className="px-6 py-3">{t('cdrId')}</th>
                                        <th className="px-6 py-3 text-right">{t('amount')}</th>
                                        <th className="px-6 py-3 text-center">{t('view')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {approvedPenalties.map(inv => (
                                        <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-4 font-mono text-xs">{inv.id}</td>
                                            <td className="px-6 py-4 font-bold">{inv.cdrReference}</td>
                                            <td className="px-6 py-4 text-right font-black text-red-700">{formatCurrency(inv.totalAmount)}</td>
                                            <td className="px-6 py-4 text-center">
                                                <Link to={`/penalty-invoice/${inv.id}`} className="text-brand-blue hover:text-brand-teal p-1 inline-block">
                                                    <ArrowRight size={18} />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>

            {/* SECTION 3: ADMIN NOTICES (Non-Financial Warnings) */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <FileWarning className="text-blue-500" size={22} />
                    {t('adminNotices') || 'Official Notices & Warnings'}
                </h2>
                <Card className="border-t-4 border-blue-500">
                    {adminNotices.length === 0 ? (
                        <p className="text-center py-6 text-gray-500">No official warnings recorded.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-3">{t('referenceNumber')}</th>
                                        <th className="px-6 py-3">{t('date')}</th>
                                        <th className="px-6 py-3">{t('managerDecision')}</th>
                                        <th className="px-6 py-3 text-center">{t('view')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {adminNotices.map(cdr => (
                                        <tr key={cdr.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-4 font-bold">{cdr.referenceNumber}</td>
                                            <td className="px-6 py-4">{formatDate(cdr.date)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${cdr.managerDecision === CDRManagerDecision.Warning ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                                                    {t(cdr.managerDecision || '')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Link to={`/cdr/${cdr.id}`} className="text-brand-blue hover:text-brand-teal p-1 inline-block">
                                                    <ArrowRight size={18} />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

const SummaryMiniCard = ({ title, count, color, icon }: any) => (
    <div className={`bg-white dark:bg-gray-800 p-4 rounded-xl border-l-4 shadow-sm flex items-center justify-between ${color}`}>
        <div>
            <p className="text-xs font-bold uppercase opacity-70">{title}</p>
            <p className="text-2xl font-black">{count}</p>
        </div>
        <div className="opacity-40">{icon}</div>
    </div>
);

export default ContractorDashboard;
