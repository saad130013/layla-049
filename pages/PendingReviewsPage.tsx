
import React, { useContext, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { useI18n } from '../hooks/useI18n';
import Card from '../components/ui/Card';
import { ReportStatus, InspectionReport } from '../types';
import { CheckSquare, ArrowRight, Clock, User, CheckCircle, XCircle, Eye, RotateCcw, FileEdit } from 'lucide-react';

const PendingReviewsPage: React.FC = () => {
    const { reports, getLocationById, getInspectorById, getFormById, updateReport, addNotification, user } = useContext(AppContext);
    const { t, language, formatDate, formatNumber } = useI18n();
    const navigate = useNavigate();

    const pendingReports = useMemo(() => {
        return reports
            .filter(r => r.status === ReportStatus.Submitted)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [reports]);

    const calculateScore = (report: any) => {
        const location = getLocationById(report.locationId);
        if (!location) return 0;
        const form = getFormById(location.formId);
        if (!form || form.items.length === 0) return 0;
        const maxScore = form.items.reduce((sum: number, item: any) => sum + item.maxScore, 0);
        const actualScore = report.items.reduce((sum, item: any) => sum + item.score, 0);
        return maxScore > 0 ? (actualScore / maxScore) * 100 : 0;
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-600 bg-green-100 dark:bg-green-900/20';
        if (score >= 75) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
    };

    const getStatusConfig = (status: ReportStatus) => {
        switch (status) {
            case ReportStatus.Draft:
                return { color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600', icon: FileEdit };
            case ReportStatus.Submitted:
                return { color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800', icon: Clock };
            case ReportStatus.Returned:
                return { color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800', icon: RotateCcw };
            case ReportStatus.Approved:
                return { color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800', icon: CheckCircle };
            default:
                return { color: 'bg-gray-100 text-gray-800', icon: FileEdit };
        }
    };

    // --- QUICK ACTIONS ---

    const handleQuickApprove = async (report: InspectionReport) => {
        if (!window.confirm(t('approveReport') + '?')) return;

        const updatedReport: InspectionReport = {
            ...report,
            status: ReportStatus.Approved,
            supervisorComment: 'Quick Approved via Dashboard'
        };

        await updateReport(updatedReport);

        // Notify Inspector
        addNotification({
            id: `notif-approve-${Date.now()}`,
            message: `Report ${report.referenceNumber} was Approved by Supervisor.`,
            type: 'success',
            timestamp: new Date().toISOString(),
            isRead: false,
            link: `/report/${report.id}`,
            userId: report.inspectorId
        });
    };

    const handleQuickReturn = async (report: InspectionReport) => {
        const comment = window.prompt(t('managerNotesPlaceholder')); // Use simple prompt for quick action
        if (comment === null) return; // Cancelled
        if (comment.trim() === '') {
            alert('Comment is required to return a report.');
            return;
        }

        const updatedReport: InspectionReport = {
            ...report,
            status: ReportStatus.Returned,
            supervisorComment: comment
        };

        await updateReport(updatedReport);

        // Notify Inspector
        addNotification({
            id: `notif-return-${Date.now()}`,
            message: `Report ${report.referenceNumber} Returned: "${comment}"`,
            type: 'alert',
            timestamp: new Date().toISOString(),
            isRead: false,
            link: `/report/${report.id}`,
            userId: report.inspectorId
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <CheckSquare size={28} className="text-brand-blue" />
                    <div>
                        <h1 className="text-2xl font-bold text-brand-blue-dark dark:text-gray-200">{t('pendingReviews')}</h1>
                        <p className="text-gray-500 dark:text-gray-400">{pendingReports.length} reports waiting for approval</p>
                    </div>
                </div>
            </div>

            <Card>
                {pendingReports.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <CheckSquare size={48} className="mx-auto mb-4 opacity-20" />
                        <p>{t('noNewNotifications')}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3">{t('referenceNumber')}</th>
                                    <th className="px-6 py-3">{t('date')}</th>
                                    <th className="px-6 py-3">{t('inspector')}</th>
                                    <th className="px-6 py-3">{t('location')}</th>
                                    <th className="px-6 py-3">{t('status')}</th>
                                    <th className="px-6 py-3 text-center">{t('score')}</th>
                                    <th className="px-6 py-3 text-center w-48">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {pendingReports.map(report => {
                                    const score = calculateScore(report);
                                    const location = getLocationById(report.locationId);
                                    const inspector = getInspectorById(report.inspectorId);
                                    const statusConfig = getStatusConfig(report.status);
                                    const StatusIcon = statusConfig.icon;
                                    
                                    return (
                                        <tr key={report.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-4 font-medium text-brand-blue">
                                                <Link to={`/report/${report.id}`} className="hover:underline">
                                                    {report.referenceNumber}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 flex items-center gap-2">
                                                <Clock size={14} className="text-orange-500" />
                                                {formatDate(report.date)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center text-gray-800 dark:text-gray-100 font-bold bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md w-fit">
                                                    <User size={14} className="me-2 text-brand-blue" />
                                                    {inspector?.name || 'Unknown'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">{location?.name[language]}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                                                    <StatusIcon size={12} className="me-1" />
                                                    {t(report.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${getScoreColor(score)}`}>
                                                    {formatNumber(score)}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center items-center gap-2">
                                                    <button 
                                                        onClick={() => handleQuickApprove(report)}
                                                        className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                                        title={t('approveReport')}
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleQuickReturn(report)}
                                                        className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                                        title={t('returnToInspector')}
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                    <Link 
                                                        to={`/report/${report.id}`} 
                                                        className="p-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                                        title={t('view')}
                                                    >
                                                        <Eye size={18} />
                                                    </Link>
                                                </div>
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

export default PendingReviewsPage;
