
import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { useI18n } from '../hooks/useI18n';
import Card from '../components/ui/Card';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';

const InspectorFeedbackPage: React.FC = () => {
    const { user, reports, getLocationById } = useContext(AppContext);
    const { t, language } = useI18n();
    const navigate = useNavigate();

    const [locationFilter, setLocationFilter] = useState('');
    const [monthFilter, setMonthFilter] = useState('');
    const [sortAsc, setSortAsc] = useState(false);

    // Filter reports to show only those belonging to the current inspector that have a supervisor comment
    const feedbackReports = useMemo(() => {
        if (!user) return [];

        let filtered = reports.filter(r => 
            r.inspectorId === user.id && 
            r.supervisorComment && 
            r.supervisorComment.trim() !== ''
        );

        // Apply filters
        if (locationFilter) {
            filtered = filtered.filter(r => {
                const location = getLocationById(r.locationId);
                return location?.name[language].toLowerCase().includes(locationFilter.toLowerCase());
            });
        }

        if (monthFilter) {
            const [year, month] = monthFilter.split('-').map(Number);
            filtered = filtered.filter(r => {
                const d = new Date(r.date);
                return d.getFullYear() === year && d.getMonth() === (month - 1);
            });
        }

        // Sort
        filtered.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return sortAsc ? dateA - dateB : dateB - dateA;
        });

        return filtered;
    }, [reports, user, locationFilter, monthFilter, sortAsc, getLocationById, language]);

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-gray-500 hover:text-gray-700 cursor-pointer" onClick={() => navigate('/dashboard')}>
                <ArrowLeft size={20} />
                <span>{t('dashboard')}</span>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl font-bold text-brand-blue-dark dark:text-gray-200">{t('supervisorFeedbackList')}</h1>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative">
                        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                            <Search className="w-4 h-4 text-gray-400" />
                        </div>
                        <input 
                            type="text" 
                            placeholder={t('filterByLocation')} 
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                            className="w-full sm:w-64 ps-10 p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-brand-teal focus:border-brand-teal"
                        />
                    </div>
                    
                    <input 
                        type="month" 
                        value={monthFilter}
                        onChange={(e) => setMonthFilter(e.target.value)}
                        className="p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-brand-teal focus:border-brand-teal"
                        title={t('filterByDate')}
                    />
                </div>
            </div>

            <Card>
                {feedbackReports.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-100 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600" onClick={() => setSortAsc(!sortAsc)}>
                                        <div className="flex items-center">
                                            {t('date')}
                                            {sortAsc ? <ArrowUp size={14} className="ms-1"/> : <ArrowDown size={14} className="ms-1"/>}
                                        </div>
                                    </th>
                                    <th className="px-6 py-3">{t('location')}</th>
                                    <th className="px-6 py-3 w-1/2">{t('feedbackComment')}</th>
                                    <th className="px-6 py-3 text-center">{t('view')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {feedbackReports.map(report => {
                                    const location = getLocationById(report.locationId);
                                    return (
                                        <tr key={report.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                                                {new Date(report.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-gray-800 dark:text-gray-200">
                                                {location?.name[language]}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded-lg border border-yellow-100 dark:border-yellow-900/30 italic">
                                                    "{report.supervisorComment}"
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Link to={`/report/${report.id}`} className="inline-flex items-center justify-center p-2 text-brand-blue hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors" title={t('view')}>
                                                    <ExternalLink size={18} />
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <p>{t('noFeedbackFound')}</p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default InspectorFeedbackPage;
