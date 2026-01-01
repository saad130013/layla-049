
import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { useI18n } from '../hooks/useI18n';
import Card from '../components/ui/Card';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Eye, Send, ArrowUp, ArrowDown, Search } from 'lucide-react';
import { ReportStatus } from '../types';

type SortField = 'date' | 'location' | 'inspector' | 'score' | 'failedItems';

interface SortConfig {
    key: SortField;
    direction: 'asc' | 'desc';
}

const CriticalIssuesPage: React.FC = () => {
    const { reports, getLocationById, getInspectorById, getFormById } = useContext(AppContext);
    const { t, language } = useI18n();
    const navigate = useNavigate();

    const [filterText, setFilterText] = useState('');
    const [filterMonth, setFilterMonth] = useState(''); // Format: YYYY-MM
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'desc' });

    const calculateScore = (report: any) => {
        const location = getLocationById(report.locationId);
        if (!location) return 0;
        const form = getFormById(location.formId);
        if (!form || form.items.length === 0) return 0;
        const maxScore = form.items.reduce((sum, item) => sum + item.maxScore, 0);
        const actualScore = report.items.reduce((sum, item) => sum + item.score, 0);
        return maxScore > 0 ? (actualScore / maxScore) * 100 : 0;
    };

    const handleSort = (key: SortField) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleSendWarning = (inspectorName: string, locationName: string) => {
        alert(`Warning notification sent to ${inspectorName} regarding low performance at ${locationName}.`);
    };

    // 1. Process data first (calculate scores, names etc.)
    const processedReports = useMemo(() => {
        return reports
            .filter(r => r.status !== ReportStatus.Draft)
            .map(report => {
                const location = getLocationById(report.locationId);
                const inspector = getInspectorById(report.inspectorId);
                const score = calculateScore(report);
                const failedItemsCount = report.items.filter(i => i.score < 3).length;
                
                return {
                    ...report,
                    locationName: location?.name[language] || '',
                    inspectorName: inspector?.name || '',
                    score,
                    failedItemsCount
                };
            })
            // Filter for critical issues only (< 75%)
            .filter(item => item.score < 75);
    }, [reports, getLocationById, getInspectorById, getFormById, language]);

    // 2. Apply Filters & Sorting
    const displayedReports = useMemo(() => {
        let result = processedReports;

        // Filter by Text
        if (filterText) {
            const lowerText = filterText.toLowerCase();
            result = result.filter(item => 
                item.locationName.toLowerCase().includes(lowerText) || 
                item.inspectorName.toLowerCase().includes(lowerText)
            );
        }

        // Filter by Month
        if (filterMonth) {
            const [y, m] = filterMonth.split('-').map(Number);
            result = result.filter(item => {
                const d = new Date(item.date);
                return d.getFullYear() === y && d.getMonth() === (m - 1);
            });
        }

        // Sort
        return result.sort((a, b) => {
            let valA: any = a[sortConfig.key as keyof typeof a];
            let valB: any = b[sortConfig.key as keyof typeof b];

            // Handle specific fields mapping
            if (sortConfig.key === 'location') {
                valA = a.locationName;
                valB = b.locationName;
            } else if (sortConfig.key === 'inspector') {
                valA = a.inspectorName;
                valB = b.inspectorName;
            } else if (sortConfig.key === 'failedItems') {
                valA = a.failedItemsCount;
                valB = b.failedItemsCount;
            } else if (sortConfig.key === 'date') {
                valA = new Date(a.date).getTime();
                valB = new Date(b.date).getTime();
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

    }, [processedReports, filterText, filterMonth, sortConfig]);

    const SortIcon = ({ column }: { column: SortField }) => {
        if (sortConfig.key !== column) return <div className="w-4 h-4 inline-block" />;
        return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="inline-block ms-1" /> : <ArrowDown size={14} className="inline-block ms-1" />;
    };

    const HeaderCell = ({ column, label, align = 'left' }: { column: SortField, label: string, align?: string }) => (
        <th 
            className={`px-6 py-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-${align}`}
            onClick={() => handleSort(column)}
        >
            <div className={`flex items-center ${align === 'center' ? 'justify-center' : ''}`}>
                {label} <SortIcon column={column} />
            </div>
        </th>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-gray-500 hover:text-gray-700 cursor-pointer" onClick={() => navigate('/dashboard')}>
                <ArrowLeft size={20} />
                <span>{t('dashboard')}</span>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className="p-3 bg-red-100 rounded-full">
                        <AlertTriangle className="text-red-600" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('criticalIssuesList')}</h1>
                        <p className="text-gray-500 dark:text-gray-400">{displayedReports.length} {t('requiresImmediateAction')}</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    {/* Month Filter */}
                    <input
                        type="month"
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        className="p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-brand-teal focus:border-brand-teal text-gray-800 dark:text-gray-200"
                        title={t('filterByMonth')}
                    />

                    {/* Search Box */}
                    <div className="relative w-full md:w-64">
                        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                            <Search className="w-4 h-4 text-gray-400" />
                        </div>
                        <input 
                            type="text" 
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            placeholder={t('searchByNameOrLocation')}
                            className="w-full ps-10 p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-brand-teal focus:border-brand-teal text-gray-800 dark:text-gray-200"
                        />
                    </div>
                </div>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-300">
                            <tr>
                                <HeaderCell column="date" label={t('date')} />
                                <HeaderCell column="location" label={t('location')} />
                                <HeaderCell column="inspector" label={t('inspector')} />
                                <HeaderCell column="score" label={t('score')} align="center" />
                                <HeaderCell column="failedItems" label={t('failedItems')} />
                                <th className="px-6 py-3 text-center">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedReports.length > 0 ? displayedReports.map(report => (
                                <tr key={report.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">{new Date(report.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-bold text-gray-800 dark:text-gray-200">{report.locationName}</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{report.inspectorName}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-0.5 rounded border border-red-200">
                                            {report.score.toFixed(1)}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-red-600 font-medium">
                                        {report.failedItemsCount} items
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center space-x-2 rtl:space-x-reverse">
                                            <button 
                                                onClick={() => navigate(`/report/${report.id}`)}
                                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                                                title={t('view')}
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleSendWarning(report.inspectorName, report.locationName)}
                                                className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                                                title={t('warnInspector')}
                                            >
                                                <Send size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-gray-500">
                                        No critical issues found matching your criteria.
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

export default CriticalIssuesPage;
