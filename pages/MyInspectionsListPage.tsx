import React, { useContext, useMemo, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { useI18n } from '../hooks/useI18n';
import Card from '../components/ui/Card';
import { ReportStatus } from '../types';
import { Filter, Search, ArrowRight, ClipboardList, BarChart2, AlertTriangle, Eye, Edit3, CheckCircle, RotateCcw, RefreshCw, Clock, FileEdit, Send } from 'lucide-react';

const MyInspectionsListPage: React.FC = () => {
    const { user, reports, getLocationById, getFormById, forceRefresh } = useContext(AppContext);
    const { t, language, formatDate, formatNumber } = useI18n();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [searchText, setSearchText] = React.useState('');

    const calculateScore = (report: any) => {
        const location = getLocationById(report.locationId);
        if (!location) return 0;
        const form = getFormById(location.formId);
        if (!form || form.items.length === 0) return 0;
        const maxScore = form.items.reduce((sum: number, item: any) => sum + item.maxScore, 0);
        const actualScore = report.items.reduce((sum, item: any) => sum + item.score, 0);
        return maxScore > 0 ? (actualScore / maxScore) * 100 : 0;
    };

    const allMyReports = useMemo(() => {
        if (!user) return [];
        return reports
            .filter(r => r.inspectorId === user.id)
            .map(r => ({
                ...r,
                score: calculateScore(r),
                locationName: getLocationById(r.locationId)?.name[language] || ''
            }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [reports, user, getLocationById, getFormById, language]);

    const counts = useMemo(() => {
        return {
            returned: allMyReports.filter(r => r.status === ReportStatus.Returned).length,
            draft: allMyReports.filter(r => r.status === ReportStatus.Draft).length,
            submitted: allMyReports.filter(r => r.status === ReportStatus.Submitted).length,
            approved: allMyReports.filter(r => r.status === ReportStatus.Approved).length,
        }
    }, [allMyReports]);

    // Determine active tab from URL or Default
    const activeTab = useMemo(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam && ['returned', 'draft', 'submitted', 'approved'].includes(tabParam)) {
            return tabParam as 'returned' | 'draft' | 'submitted' | 'approved';
        }
        // Default Logic if no param
        if (counts.returned > 0) return 'returned';
        if (counts.draft > 0) return 'draft';
        return 'returned'; // Fallback
    }, [searchParams, counts]);

    // Sync tab changes to URL
    const handleTabChange = (newTab: string) => {
        setSearchParams({ tab: newTab });
    };

    const filteredReports = useMemo(() => {
        return allMyReports.filter(r => {
            let matchesStatus = false;
            
            // Explicitly check enum values to ensure matching
            if (activeTab === 'returned') {
                matchesStatus = r.status === ReportStatus.Returned;
            } else if (activeTab === 'draft') {
                matchesStatus = r.status === ReportStatus.Draft;
            } else if (activeTab === 'submitted') {
                matchesStatus = r.status === ReportStatus.Submitted;
            } else if (activeTab === 'approved') {
                matchesStatus = r.status === ReportStatus.Approved;
            }

            const matchesSearch = 
                r.referenceNumber.toLowerCase().includes(searchText.toLowerCase()) ||
                r.locationName.toLowerCase().includes(searchText.toLowerCase());
                
            return matchesStatus && matchesSearch;
        });
    }, [allMyReports, activeTab, searchText]);

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

    const tabs = [
        { id: 'returned', label: t('returnedReports'), icon: RotateCcw, count: counts.returned, color: 'text-red-600', activeClass: 'border-red-500 text-red-600 bg-red-50' },
        { id: 'draft', label: t('Draft'), icon: Edit3, count: counts.draft, color: 'text-gray-600', activeClass: 'border-brand-blue text-brand-blue bg-white' },
        { id: 'submitted', label: t('Submitted'), icon: ArrowRight, count: counts.submitted, color: 'text-blue-600', activeClass: 'border-brand-blue text-brand-blue bg-white' },
        { id: 'approved', label: t('completedReports'), icon: CheckCircle, count: counts.approved, color: 'text-green-600', activeClass: 'border-brand-blue text-brand-blue bg-white' },
    ] as const;

    const globalReturnedCount = reports.filter(r => r.status === ReportStatus.Returned).length;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-brand-blue-dark dark:text-gray-200">{t('myInspectionsList')}</h1>
                <div className="flex gap-2">
                    <button 
                        onClick={forceRefresh}
                        className="flex items-center px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
                        title={t('refreshData')}
                    >
                        <RefreshCw size={16} />
                    </button>
                    <button 
                        onClick={() => navigate('/new-inspection')}
                        className="flex items-center px-4 py-2 bg-brand-teal text-white font-semibold rounded-md shadow-sm hover:bg-brand-blue-dark transition-colors"
                    >
                        {t('newInspection')} <ArrowRight size={16} className="ms-2"/>
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    // Special styling for Returned tab to make it pop if it has items
                    const isReturnedAndHasItems = tab.id === 'returned' && tab.count > 0;
                    
                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all border-2 ${
                                isActive 
                                ? `${tab.activeClass} shadow-md` 
                                : `bg-gray-100 dark:bg-gray-700 border-transparent text-gray-500 hover:bg-white dark:hover:bg-gray-600`
                            } ${isReturnedAndHasItems && !isActive ? 'animate-pulse border-red-300 bg-red-50 text-red-600' : ''}`}
                        >
                            <Icon size={18} className={`me-2 ${isActive ? '' : tab.color}`} />
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`ms-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                                    tab.id === 'returned' 
                                    ? 'bg-red-600 text-white' 
                                    : isActive ? 'bg-brand-blue text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                                }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute start-3 top-2.5 text-gray-400 w-5 h-5" />
                <input 
                    type="text" 
                    placeholder={t('searchByNameOrLocation')} 
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="w-full ps-10 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm focus:ring-brand-teal focus:border-brand-teal"
                />
            </div>

            {/* List */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3">{t('view')}</th>
                                {/* Show Feedback Column prominently for Returned reports */}
                                {activeTab === 'returned' && <th className="px-6 py-3 w-1/3">{t('supervisorFeedback')}</th>}
                                <th className="px-6 py-3">{t('status')}</th>
                                <th className="px-6 py-3 text-center">{t('score')}</th>
                                <th className="px-6 py-3">{t('location')}</th>
                                <th className="px-6 py-3">{t('date')}</th>
                                <th className="px-6 py-3">{t('referenceNumber')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReports.length > 0 ? filteredReports.map(report => {
                                const statusConfig = getStatusConfig(report.status);
                                const StatusIcon = statusConfig.icon;
                                
                                return (
                                <tr key={report.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 text-center">
                                        <Link 
                                            to={`/report/${report.id}`} 
                                            className={`inline-flex items-center justify-center px-4 py-2 rounded-md transition-colors text-xs font-bold ${
                                                activeTab === 'returned'
                                                ? 'bg-red-600 text-white hover:bg-red-700 shadow-md'
                                                : activeTab === 'draft' 
                                                ? 'bg-brand-blue text-white hover:bg-brand-blue-dark' 
                                                : 'text-brand-blue hover:bg-blue-50'
                                            }`}
                                        >
                                            {activeTab === 'returned' ? t('resubmitReport') : activeTab === 'draft' ? <Edit3 size={16} /> : <Eye size={18} />}
                                        </Link>
                                    </td>
                                    {activeTab === 'returned' && (
                                        <td className="px-6 py-4">
                                            <div className="text-xs text-red-700 font-semibold bg-red-50 p-2 rounded border border-red-200">
                                                <AlertTriangle size={12} className="inline me-1"/>
                                                "{report.supervisorComment || 'Check notes inside'}"
                                            </div>
                                        </td>
                                    )}
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                                            <StatusIcon size={12} className="me-1" />
                                            {t(report.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${getScoreColor(report.score)}`}>
                                            {formatNumber(report.score)}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">{report.locationName}</td>
                                    <td className="px-6 py-4 text-gray-500">{formatDate(report.date)}</td>
                                    <td className="px-6 py-4 font-medium">{report.referenceNumber}</td>
                                </tr>
                            )}) : (
                                <tr>
                                    <td colSpan={activeTab === 'returned' ? 7 : 6} className="text-center py-12 text-gray-500">
                                        {t('noReportsFound')}
                                        {/* Debug Hint: If 0 personal reports found but global reports exist */}
                                        {activeTab === 'returned' && globalReturnedCount > 0 && (
                                            <p className="text-xs text-gray-400 mt-2 bg-gray-100 dark:bg-gray-800 p-2 rounded inline-block">
                                                (Note: There are {globalReturnedCount} returned reports in the system for other inspectors. Ensure you are logged in as the correct user who owns the report.)
                                            </p>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default MyInspectionsListPage;