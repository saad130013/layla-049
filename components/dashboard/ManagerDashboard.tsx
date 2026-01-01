
import React, { useContext, useMemo, useState, useCallback } from 'react';
import { AppContext } from '../../context/AppContext';
import { useI18n } from '../../hooks/useI18n';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart } from 'recharts';
import { ClipboardList, AlertTriangle, Trophy, Lightbulb, FileDown, Star, Users, FileText, AlertCircle, Send, Eye, ArrowRight, Printer, X, Bell, Check, ShieldCheck, Activity } from 'lucide-react';
import { UserRole, CDRStatus, ReportStatus } from '../../types';
import { USERS } from '../../constants';
import { Link, useNavigate } from 'react-router-dom';
import PredictiveHotspotsCard from './PredictiveHotspotsCard';
import PrintableMonthlyManagerReport from '../reports/PrintableMonthlyManagerReport';

const ManagerDashboard: React.FC = () => {
    const { reports, cdrs, notifications, getFormById, getLocationById, getInspectorById, theme } = useContext(AppContext);
    const { t, language } = useI18n();
    const navigate = useNavigate();
    
    // State for Report Preview Modal
    const [showReportModal, setShowReportModal] = useState(false);

    const calculateScore = useCallback((report: any) => {
        const location = getLocationById(report.locationId);
        if (!location) return 0;
        const form = getFormById(location.formId);
        if (!form || form.items.length === 0) return 0;
        const maxScore = form.items.reduce((sum: number, item: any) => sum + item.maxScore, 0);
        const actualScore = report.items.reduce((sum: number, item: any) => sum + item.score, 0);
        return maxScore > 0 ? (actualScore / maxScore) * 100 : 0;
    }, [getLocationById, getFormById]);

    // NEW: Identify All Critical Reports
    const allCriticalReports = useMemo(() => {
        return reports
            .filter(r => {
                const score = calculateScore(r);
                return score < 75 && r.status !== ReportStatus.Draft;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [reports, calculateScore]);

    // Slice for display (Top 3)
    const displayedCriticalReports = useMemo(() => allCriticalReports.slice(0, 3), [allCriticalReports]);

    const dashboardStats = useMemo(() => {
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        const thisMonthReports = reports.filter(r => new Date(r.date) >= startOfThisMonth);
        const lastMonthReports = reports.filter(r => new Date(r.date) >= startOfLastMonth && new Date(r.date) <= endOfLastMonth);

        const calculateAvgCompliance = (reportSet: any[]) => {
            if (reportSet.length === 0) return 0;
            const totalScore = reportSet.reduce((sum, r) => sum + calculateScore(r), 0);
            return totalScore / reportSet.length;
        };

        const overallCompliance = calculateAvgCompliance(thisMonthReports);
        const prevMonthCompliance = calculateAvgCompliance(lastMonthReports);
        const complianceTrend = overallCompliance - prevMonthCompliance;
        
        // CDR Stats
        const pendingCDRs = cdrs.filter(c => c.status === CDRStatus.Submitted).length;

        // --- INSPECTOR LOGIC ---
        const inspectors = USERS.filter(u => u.role === UserRole.Inspector);
        const inspectorActivity = inspectors.map(inspector => {
            const allInspectorReports = reports.filter(r => r.inspectorId === inspector.id);
            const monthInspectorReports = thisMonthReports.filter(r => r.inspectorId === inspector.id);
            
            const avgScoreAllTime = allInspectorReports.length > 0 
                ? allInspectorReports.reduce((sum, r) => sum + calculateScore(r), 0) / allInspectorReports.length
                : 0;

            const lastActiveDate = allInspectorReports.length > 0 
                ? new Date(Math.max(...allInspectorReports.map(r => new Date(r.date).getTime())))
                : null;

            return { 
                ...inspector, 
                avgScore: avgScoreAllTime, 
                totalReports: allInspectorReports.length,
                monthReports: monthInspectorReports.length,
                lastActive: lastActiveDate
            };
        }).sort((a, b) => b.monthReports - a.monthReports || b.totalReports - a.totalReports); 
        
        const topInspector = inspectorActivity.length > 0 && inspectorActivity[0].monthReports > 0 ? inspectorActivity[0] : null;
        
        // Location Logic (Low Performing)
        const locationScores = reports.reduce<Record<string, { scores: number[]; count: number }>>((acc, report) => {
            const locationId = report.locationId;
            if (!acc[locationId]) {
                acc[locationId] = { scores: [], count: 0 };
            }
            acc[locationId].scores.push(calculateScore(report));
            acc[locationId].count++;
            return acc;
        }, {});

        const lowPerformingAreas = Object.entries(locationScores)
            .map(([locationId, data]) => {
                const typedData = data as { scores: number[]; count: number };
                return {
                    locationId,
                    avgScore: typedData.count > 0 ? typedData.scores.reduce((a, b) => a + b, 0) / typedData.count : 0,
                };
            })
            .sort((a, b) => a.avgScore - b.avgScore)
            .slice(0, 5); // Bottom 5
        
        // AI Insights
        let aiInsight1 = `All areas are performing well.`;
        if (lowPerformingAreas.length > 0) {
            const lowestArea = lowPerformingAreas[0];
            const location = getLocationById(lowestArea.locationId);
            const lowestAreaName = location ? location.name[language] : 'N/A';
            const scoreData = locationScores[lowestArea.locationId];
            if (scoreData) {
                 aiInsight1 = `**${lowestAreaName}** recorded ${scoreData.count} low scores this week. Follow-up inspection recommended.`;
            }
        }
        
        let aiInsight2 = `Not enough data to rank inspectors.`;
        if (topInspector) {
            aiInsight2 = `**${topInspector.name}** is leading this month with ${topInspector.monthReports} inspections.`;
        }

        return {
            overallCompliance,
            complianceTrend,
            totalInspections: thisMonthReports.length,
            pendingCDRs,
            topInspector,
            inspectorActivity,
            lowPerformingAreas,
            aiInsights: [aiInsight1, aiInsight2]
        };
    }, [reports, cdrs, calculateScore, getLocationById, language]);

    // Unified Activity Feed (Reports + CDRs)
    const activityFeed = useMemo(() => {
        const reportItems = reports
            .filter(r => r.status !== ReportStatus.Draft)
            .map(r => ({
                type: 'report',
                date: new Date(r.date),
                item: r,
                id: r.id
            }));
        
        const cdrItems = cdrs
            .filter(c => c.status !== CDRStatus.Draft)
            .map(c => ({
                type: 'cdr',
                date: new Date(`${c.date}T${c.time}`),
                item: c,
                id: c.id
            }));

        return [...reportItems, ...cdrItems]
            .sort((a, b) => {
                const dateA = a.date.getTime();
                const dateB = b.date.getTime();
                if (isNaN(dateA)) return 1;
                if (isNaN(dateB)) return -1;
                return dateB - dateA;
            })
            .slice(0, 20);
    }, [reports, cdrs]);

    // Notifications
    const recentNotifications = useMemo(() => {
        return [...notifications]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 3);
    }, [notifications]);

    // Chart Data
    const performanceData = useMemo(() => {
        const dataMap = new Map<string, { scores: number[], count: number }>();
        const today = new Date();
        for (let i = 14; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!dataMap.has(dateString)) {
                dataMap.set(dateString, { scores: [], count: 0 });
            }
        }
        
        reports.forEach(r => {
            const dateString = new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (dataMap.has(dateString)) {
                const entry = dataMap.get(dateString)!;
                entry.scores.push(calculateScore(r));
                entry.count++;
            }
        });

        return Array.from(dataMap.entries()).map(([date, { scores, count }]) => ({
            date,
            score: count > 0 ? scores.reduce((a, b) => a + b, 0) / count : null,
        }));
    }, [reports, calculateScore]);

    const getComplianceColor = (score: number) => score >= 85 ? 'text-green-600' : score >= 70 ? 'text-yellow-600' : 'text-red-600';
    
    const KpiCard = ({ title, value, subValue, icon, colorClass }: any) => (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-t-4 border-transparent hover:border-brand-teal transition-all">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
                    <h3 className={`text-3xl font-bold ${colorClass}`}>{value}</h3>
                    {subValue && <p className="text-xs text-gray-400 mt-2">{subValue}</p>}
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-full text-gray-400">
                    {icon}
                </div>
            </div>
        </div>
    );

    const tickColor = theme === 'dark' ? '#9ca3af' : '#6b7280';
    
    const handleSendWarning = (inspectorName: string, locationName: string) => {
        alert(`Warning notification sent to ${inspectorName} regarding low performance at ${locationName}.`);
    };

    return (
        <div className="space-y-6">
            {/* --- HEADER --- */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl font-bold text-brand-blue-dark dark:text-gray-200">{t('dashboard')}</h1>
                <button 
                    onClick={() => setShowReportModal(true)}
                    className="flex items-center px-4 py-2 bg-brand-teal text-white font-semibold rounded-md shadow-sm hover:bg-brand-blue-dark transition-colors"
                >
                    <FileDown size={16} className="me-2" />{t('downloadMonthlyReport')}
                </button>
            </div>

            {/* --- CRITICAL ACTION CENTER --- */}
            {displayedCriticalReports.length > 0 ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="flex items-center text-lg font-bold text-red-700 dark:text-red-400">
                            <AlertTriangle size={24} className="me-2" />
                            {t('criticalIssues')} <span className="ms-2 text-sm font-normal opacity-80">Action Required ({allCriticalReports.length})</span>
                        </h2>
                        {allCriticalReports.length > 3 && (
                            <Link to="/critical-issues" className="text-sm font-semibold text-red-700 hover:underline flex items-center">
                                {t('viewAll')} <ArrowRight size={14} className="ms-1"/>
                            </Link>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {displayedCriticalReports.map(report => {
                            const score = calculateScore(report);
                            const location = getLocationById(report.locationId);
                            const inspector = getInspectorById(report.inspectorId);
                            return (
                                <div key={report.id} className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm border-s-4 border-red-500">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm line-clamp-1">{location?.name[language]}</h4>
                                            <p className="text-xs text-gray-500 mt-1">{inspector?.name}</p>
                                        </div>
                                        <span className="text-xl font-bold text-red-600">{score.toFixed(1)}%</span>
                                    </div>
                                    <div className="mt-3 flex gap-2">
                                        <button onClick={() => navigate(`/report/${report.id}`)} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded transition-colors">{t('view')}</button>
                                        <button onClick={() => handleSendWarning(inspector?.name || '', location?.name[language] || '')} className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded transition-colors">{t('warnInspector')}</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 dark:bg-green-800 rounded-full me-3">
                            <ShieldCheck size={24} className="text-green-600 dark:text-green-300" />
                        </div>
                        <div>
                            <h3 className="font-bold text-green-800 dark:text-green-300 text-lg">{t('systemHealthy')}</h3>
                            <p className="text-green-600 dark:text-green-400 text-sm">{t('noCriticalIssues')}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* --- KPI CARDS (FULL WIDTH ROW) --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard title={t('overallCompliance')} value={`${dashboardStats.overallCompliance.toFixed(1)}%`} icon={<Activity size={24}/>} colorClass={getComplianceColor(dashboardStats.overallCompliance)} />
                <KpiCard title={t('totalInspections')} value={dashboardStats.totalInspections} icon={<ClipboardList size={24}/>} colorClass="text-gray-800 dark:text-white" />
                <KpiCard title={t('pendingCDRs')} value={dashboardStats.pendingCDRs} icon={<FileText size={24}/>} colorClass="text-orange-500" subValue="Waiting Approval" />
                <KpiCard 
                    title={t('topInspector')} 
                    value={dashboardStats.topInspector ? dashboardStats.topInspector.name.split(' ')[0] : '-'} 
                    icon={<Trophy size={24}/>} 
                    colorClass="text-brand-blue"
                    subValue={dashboardStats.topInspector ? `${dashboardStats.topInspector.monthReports} Reports` : ''} 
                />
            </div>

            {/* --- MAIN DASHBOARD GRID --- */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                
                {/* LEFT COLUMN (3 SPAN) */}
                <div className="xl:col-span-3 space-y-6">
                    
                    {/* CHART */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-brand-blue-dark dark:text-brand-green">{t('performanceTrend')}</h3>
                            <select className="text-xs bg-gray-50 border-gray-300 rounded p-1 dark:bg-gray-700 dark:border-gray-600">
                                <option>Last 14 Days</option>
                            </select>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <ComposedChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#374151' : '#f0f0f0'} />
                                <XAxis dataKey="date" tick={{ fill: tickColor, fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                                <YAxis tick={{ fill: tickColor, fontSize: 12 }} unit="%" domain={[0, 100]} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                <Line type="monotone" dataKey="score" stroke="#0a9396" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>

                    {/* BOTTOM GRID (Insights & Tables) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Predictive Hotspots */}
                        <PredictiveHotspotsCard />

                        {/* AI Insights */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                            <h3 className="font-bold text-brand-blue-dark dark:text-brand-green mb-4 flex items-center">
                                <Lightbulb size={18} className="me-2 text-yellow-500" />{t('aiInsights')}
                            </h3>
                            <ul className="space-y-4">
                                {dashboardStats.aiInsights.map((insight, i) => (
                                    <li key={i} className="flex items-start bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
                                        <Star size={16} className="text-brand-teal mt-1 me-2 flex-shrink-0" />
                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed" 
                                           dangerouslySetInnerHTML={{ __html: insight.replace(/\*\*(.*?)\*\*/g, '<strong class="text-brand-blue-dark dark:text-brand-green">$1</strong>') }} 
                                        />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Inspector Activity Table */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-brand-blue-dark dark:text-brand-green flex items-center">
                                <Users size={18} className="me-2" /> {t('inspectorActivityOverview')}
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-4 py-3">Inspector</th>
                                        <th className="px-4 py-3 text-center">Total Reports</th>
                                        <th className="px-4 py-3 text-center">This Month</th>
                                        <th className="px-4 py-3 text-center">Avg Score</th>
                                        <th className="px-4 py-3 text-right">Last Active</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dashboardStats.inspectorActivity.map(inspector => (
                                        <tr key={inspector.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 last:border-0">
                                            <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200">{inspector.name}</td>
                                            <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">{inspector.totalReports}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${inspector.monthReports > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>
                                                    {inspector.monthReports}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`font-bold ${getComplianceColor(inspector.avgScore)}`}>{inspector.avgScore.toFixed(1)}%</span>
                                            </td>
                                            <td className="px-4 py-3 text-right text-xs text-gray-500">
                                                {inspector.lastActive ? inspector.lastActive.toLocaleDateString() : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN (SIDEBAR - 1 SPAN) */}
                <div className="xl:col-span-1 space-y-6">
                    
                    {/* Live Activity Feed (Timeline Style) */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-brand-blue-dark dark:text-brand-green">{t('liveActivityFeed')}</h3>
                            <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
                        </div>
                        
                        <div className="relative border-s-2 border-gray-200 dark:border-gray-700 ms-3 space-y-8 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {activityFeed.map((activity, index) => {
                                const isReport = activity.type === 'report';
                                let icon, iconBg, content, time;
                                
                                time = activity.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                                if (isReport) {
                                    const report = activity.item as any;
                                    const score = calculateScore(report);
                                    const isCritical = score < 75;
                                    const inspector = getInspectorById(report.inspectorId);
                                    const location = getLocationById(report.locationId);

                                    if (isCritical) {
                                        icon = <AlertTriangle size={12} className="text-red-600" />;
                                        iconBg = "bg-red-100 border-red-500";
                                        content = (
                                            <>
                                                <span className="text-red-600 font-bold block">Critical Low Score ({score.toFixed(1)}%)</span>
                                                <span className="text-gray-600 dark:text-gray-400 text-xs">detected at </span>
                                                <Link to={`/report/${report.id}`} className="font-semibold text-gray-800 dark:text-gray-200 hover:underline">{location?.name[language]}</Link>
                                            </>
                                        );
                                    } else {
                                        icon = <Check size={12} className="text-green-600" />;
                                        iconBg = "bg-green-100 border-green-500";
                                        content = (
                                            <>
                                                <span className="font-bold text-gray-800 dark:text-gray-200">{inspector?.name.split(' ')[0]}</span>
                                                <span className="text-gray-500 dark:text-gray-400 text-xs"> completed inspection at </span>
                                                <Link to={`/report/${report.id}`} className="font-semibold text-brand-blue hover:underline block truncate">{location?.name[language]}</Link>
                                                <span className={`text-xs font-bold ${getComplianceColor(score)}`}>Score: {score.toFixed(1)}%</span>
                                            </>
                                        );
                                    }
                                } else {
                                    const cdr = activity.item as any;
                                    const inspector = getInspectorById(cdr.employeeId);
                                    icon = <AlertCircle size={12} className="text-orange-600" />;
                                    iconBg = "bg-orange-100 border-orange-500";
                                    content = (
                                        <>
                                            <span className="text-orange-600 font-bold block">New CDR Submitted</span>
                                            <span className="text-xs text-gray-500">by {inspector?.name.split(' ')[0]}</span>
                                            <Link to={`/cdr/${cdr.id}`} className="block text-xs font-semibold text-brand-blue hover:underline mt-1">Review &gt;</Link>
                                        </>
                                    );
                                }

                                return (
                                    <div key={`${activity.type}-${activity.id}`} className="relative ps-6">
                                        <div className={`absolute -start-[9px] top-0 w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center ${iconBg}`}>
                                            {icon}
                                        </div>
                                        <div className="flex flex-col items-start -mt-1">
                                            <div className="text-sm leading-snug mb-1">{content}</div>
                                            <span className="text-[10px] text-gray-400 font-medium bg-gray-50 dark:bg-gray-700 px-1.5 py-0.5 rounded">{isReport ? 'Report' : 'CDR'} • {time}</span>
                                        </div>
                                    </div>
                                );
                            })}
                            {activityFeed.length === 0 && <p className="text-center text-gray-500 text-sm py-4">No recent activity.</p>}
                        </div>
                    </div>

                    {/* Alerts Card */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-brand-blue-dark dark:text-brand-green flex items-center">
                                <Bell size={18} className="me-2 text-brand-orange" /> {t('alerts')}
                            </h3>
                            <Link to="/alerts" className="text-xs text-brand-blue hover:underline">{t('viewAll')}</Link>
                        </div>
                        <ul className="space-y-3">
                            {recentNotifications.length > 0 ? recentNotifications.map(n => (
                                <li key={n.id} className="text-sm pb-3 border-b dark:border-gray-700 last:border-0 last:pb-0">
                                    <Link to={n.link || '#'} className={`block ${!n.isRead ? 'font-semibold' : 'text-gray-600'}`}>
                                        <span className="line-clamp-2">{n.message}</span>
                                    </Link>
                                    <span className="text-xs text-gray-400 mt-1 block">{new Date(n.timestamp).toLocaleDateString()}</span>
                                </li>
                            )) : <p className="text-xs text-gray-500 text-center">No alerts.</p>}
                        </ul>
                    </div>

                    {/* Low Performing Areas List */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                         <h3 className="font-bold text-brand-blue-dark dark:text-brand-green mb-4">{t('lowPerformingAreas')}</h3>
                         {dashboardStats.lowPerformingAreas.length > 0 ? (
                             <ul className="space-y-3">
                                {dashboardStats.lowPerformingAreas.map(({locationId, avgScore}) => {
                                    const location = getLocationById(locationId);
                                    return(
                                    <li key={locationId} className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <div className="overflow-hidden me-2">
                                            <p className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate" title={location?.name[language]}>{location?.name[language]}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <span className={`font-bold text-sm ${getComplianceColor(avgScore)}`}>{avgScore.toFixed(1)}%</span>
                                            {avgScore < 85 && <p className="text-[10px] text-red-500 font-semibold">{t('needsAttention')}</p>}
                                        </div>
                                    </li>
                                    );
                                })}
                             </ul>
                         ) : (
                             <p className="text-sm text-gray-500 text-center py-4">No data available.</p>
                         )}
                    </div>
                </div>
            </div>
            
            {/* MONTHLY REPORT PREVIEW MODAL */}
            {showReportModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm print:p-0 print:bg-white print:block print:fixed print:inset-0">
                    <div className="bg-brand-gray dark:bg-gray-900 w-full max-w-5xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:max-w-none print:max-h-none print:shadow-none print:rounded-none print:h-full print:w-full">
                        <div className="p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex justify-between items-center no-print">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">{t('monthlyKpiReport')} Preview</h3>
                            <div className="flex items-center gap-3">
                                <button onClick={() => window.print()} className="flex items-center px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-brand-blue-dark transition-colors">
                                    <Printer size={18} className="me-2"/> {t('printReport')} / PDF
                                </button>
                                <button onClick={() => setShowReportModal(false)} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>
                        <div className="overflow-y-auto p-4 md:p-8 flex-1 bg-gray-100 dark:bg-gray-900 print:overflow-visible print:p-0 print:bg-white">
                            <div className="print-force-visible">
                                <PrintableMonthlyManagerReport />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerDashboard;
