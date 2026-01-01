
import React, { useContext, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { useI18n } from '../../hooks/useI18n';
import Card from '../ui/Card';
import { ReportStatus } from '../../types';
import { ClipboardList, AlertTriangle, ArrowRight, Clock, MapPin, CheckCircle, RefreshCw } from 'lucide-react';

const ContractorDashboard: React.FC = () => {
    const { reports, getLocationById, getFormById, forceRefresh } = useContext(AppContext);
    const { t, language, formatDate, formatNumber } = useI18n();
    const navigate = useNavigate();

    // Auto-refresh data when dashboard mounts to ensure latest reports are visible
    useEffect(() => {
        forceRefresh();
    }, [forceRefresh]);

    // Filter reports assigned to contractor for rectification
    const rectificationRequests = useMemo(() => {
        return reports
            .filter(r => r.status === ReportStatus.RectificationRequired)
            .sort((a, b) => {
                const dateA = new Date(a.date).getTime() || 0;
                const dateB = new Date(b.date).getTime() || 0;
                return dateA - dateB; // Oldest first
            });
    }, [reports]);

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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <ClipboardList size={28} className="text-brand-blue" />
                    <div>
                        <h1 className="text-2xl font-bold text-brand-blue-dark dark:text-gray-200">{t('contractorDashboard')}</h1>
                        <p className="text-gray-500 dark:text-gray-400">{t('rectificationRequests')}: {rectificationRequests.length}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={forceRefresh}
                        className="flex items-center px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
                        title={t('refreshData')}
                    >
                        <RefreshCw size={16} className="me-1" /> {t('refreshData')}
                    </button>
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full text-xs font-bold text-green-700 dark:text-green-300">
                        <CheckCircle size={12} />
                        <span>System Active</span>
                    </div>
                </div>
            </div>

            <Card>
                {rectificationRequests.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <CheckCircleIcon size={48} className="mx-auto mb-4 text-green-500 opacity-50" />
                        <p>{t('noRectificationRequests')}</p>
                        <p className="text-xs text-gray-400 mt-2">Waiting for inspectors to flag issues.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3">{t('referenceNumber')}</th>
                                    <th className="px-6 py-3">{t('date')}</th>
                                    <th className="px-6 py-3">{t('location')}</th>
                                    <th className="px-6 py-3 text-center">{t('score')}</th>
                                    <th className="px-6 py-3 text-center w-48">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {rectificationRequests.map(report => {
                                    const score = calculateScore(report);
                                    const location = getLocationById(report.locationId);
                                    
                                    return (
                                        <tr key={report.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-4 font-medium text-brand-blue">
                                                {report.referenceNumber}
                                            </td>
                                            <td className="px-6 py-4 flex items-center gap-2">
                                                <Clock size={14} className="text-orange-500" />
                                                {formatDate(report.date)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center text-gray-800 dark:text-gray-200">
                                                    <MapPin size={14} className="me-2 text-gray-400" />
                                                    {location?.name[language] || 'Unknown Location'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                                                    {formatNumber(score)}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Link 
                                                    to={`/report/${report.id}`} 
                                                    className="inline-flex items-center px-4 py-2 bg-brand-blue text-white text-xs font-bold rounded hover:bg-brand-blue-dark transition-colors shadow-sm"
                                                >
                                                    {t('fixNow')} <ArrowRight size={14} className="ms-1" />
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
};

const CheckCircleIcon = ({size, className}: {size: number, className: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
);

export default ContractorDashboard;
