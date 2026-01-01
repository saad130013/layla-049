import React, { useContext, useMemo } from 'react';
import { AppContext } from '../../context/AppContext';
import { useI18n } from '../../hooks/useI18n';
import { Hospital, CheckCircle, AlertTriangle, DollarSign, ClipboardList } from 'lucide-react';
import { UserRole, PenaltyStatus } from '../../types';
import { USERS } from '../../constants';

const PrintableMonthlyManagerReport: React.FC = () => {
    const { reports, cdrs, penaltyInvoices, getLocationById, getFormById, getZoneByLocationId } = useContext(AppContext);
    const { t, language } = useI18n();

    const data = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        // Filter Data for Current Month
        const monthlyReports = reports.filter(r => {
            const d = new Date(r.date);
            return d >= startOfMonth && d <= endOfMonth;
        });

        const monthlyCDRs = cdrs.filter(c => {
            const d = new Date(c.date);
            return d >= startOfMonth && d <= endOfMonth;
        });

        const monthlyInvoices = penaltyInvoices.filter(inv => {
            const d = new Date(inv.dateGenerated);
            return d >= startOfMonth && d <= endOfMonth && inv.status === PenaltyStatus.Deducted;
        });

        // 1. Executive Summary
        const totalInspections = monthlyReports.length;
        
        const calculateScore = (report: any) => {
            const location = getLocationById(report.locationId);
            if (!location) return 0;
            const form = getFormById(location.formId);
            if (!form) return 0;
            const maxScore = form.items.reduce((sum, item) => sum + item.maxScore, 0);
            const actualScore = report.items.reduce((sum, item) => sum + item.score, 0);
            return maxScore > 0 ? (actualScore / maxScore) * 100 : 0;
        };

        const overallCompliance = totalInspections > 0 
            ? monthlyReports.reduce((sum, r) => sum + calculateScore(r), 0) / totalInspections 
            : 0;

        const totalViolations = monthlyCDRs.length;
        const totalPenaltyAmount = monthlyInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

        // 2. Inspector Performance
        const inspectors = USERS.filter(u => u.role === UserRole.Inspector);
        const inspectorStats = inspectors.map(insp => {
            const inspReports = monthlyReports.filter(r => r.inspectorId === insp.id);
            const avgScore = inspReports.length > 0 
                ? inspReports.reduce((sum, r) => sum + calculateScore(r), 0) / inspReports.length 
                : 0;
            return {
                name: insp.name,
                count: inspReports.length,
                avgScore
            };
        }).sort((a, b) => b.avgScore - a.avgScore);

        // 3. Lowest Performing Areas
        // FIX: Add type annotation to the accumulator 'acc' to ensure TypeScript correctly infers the type of locationScores.
        const locationScores = monthlyReports.reduce<Record<string, { scores: number[]; count: number }>>((acc, report) => {
            if (!acc[report.locationId]) acc[report.locationId] = { scores: [], count: 0 };
            acc[report.locationId].scores.push(calculateScore(report));
            acc[report.locationId].count++;
            return acc;
        }, {});

        const lowPerformingAreas = Object.entries(locationScores)
            // FIX: Explicitly type `data` as its properties were not being inferred correctly from Object.entries.
            .map(([id, data]: [string, { scores: number[]; count: number }]) => ({
                name: getLocationById(id)?.name[language] || 'Unknown',
                // FIX: Added a check to prevent division by zero.
                avgScore: data.count > 0 ? data.scores.reduce((a, b) => a + b, 0) / data.count : 0,
                count: data.count
            }))
            .sort((a, b) => a.avgScore - b.avgScore)
            .slice(0, 5);

        return {
            month: startOfMonth.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' }),
            totalInspections,
            overallCompliance,
            totalViolations,
            totalPenaltyAmount,
            inspectorStats,
            lowPerformingAreas
        };
    }, [reports, cdrs, penaltyInvoices, getLocationById, getFormById, language]);

    const SummaryCard = ({ title, value, icon, color }: any) => (
        <div className="border border-gray-300 p-4 rounded flex items-center justify-between break-inside-avoid">
            <div>
                <p className="text-gray-500 uppercase text-xs font-bold">{title}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
            {icon}
        </div>
    );

    return (
        // Container: A4 Dimensions for screen, Full width for print
        <div className="bg-white text-black font-sans w-full max-w-[210mm] min-h-[297mm] mx-auto p-8 shadow-2xl print:shadow-none print:w-full print:max-w-none print:min-h-0 print:p-0 print:m-0">
            {/* Header */}
            <div className="border-b-4 border-brand-blue pb-4 mb-8 flex justify-between items-center">
                <div className="flex items-center">
                    <Hospital size={48} className="text-brand-blue me-3" />
                    <div>
                        <h1 className="text-3xl font-bold text-brand-blue-dark">InspectionSys</h1>
                        <p className="text-gray-600 font-semibold">{t('monthlyKpiReport')} - Executive Summary</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xl font-bold text-gray-800">{data.month}</p>
                    <p className="text-sm text-gray-500">Generated: {new Date().toLocaleDateString()}</p>
                </div>
            </div>

            {/* Executive Summary */}
            <h2 className="text-xl font-bold text-brand-blue-dark border-b-2 border-brand-teal pb-2 mb-4 uppercase">{t('overallPerformance')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <SummaryCard 
                    title={t('totalInspections')} 
                    value={data.totalInspections} 
                    icon={<ClipboardList size={32} className="text-gray-400" />}
                    color="text-gray-800"
                />
                <SummaryCard 
                    title={t('overallCompliance')} 
                    value={`${data.overallCompliance.toFixed(1)}%`} 
                    icon={<CheckCircle size={32} className="text-green-500" />}
                    color={data.overallCompliance >= 85 ? 'text-green-600' : 'text-yellow-600'}
                />
                <SummaryCard 
                    title={t('totalViolations')} 
                    value={data.totalViolations} 
                    icon={<AlertTriangle size={32} className="text-orange-500" />}
                    color="text-orange-600"
                />
                <SummaryCard 
                    title={t('totalPenaltyAmountDue')} 
                    value={`${data.totalPenaltyAmount.toLocaleString()} SAR`} 
                    icon={<DollarSign size={32} className="text-red-500" />}
                    color="text-red-600"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Inspector Performance */}
                <div className="break-inside-avoid">
                    <h3 className="text-lg font-bold text-gray-800 mb-3 border-b border-gray-300 pb-1">{t('inspectorPerformanceReport')}</h3>
                    <table className="w-full text-sm border-collapse">
                        <thead className="bg-gray-100 text-gray-700">
                            <tr>
                                <th className="p-2 text-left border border-gray-300">{t('name')}</th>
                                <th className="p-2 text-center border border-gray-300">{t('totalReports')}</th>
                                <th className="p-2 text-center border border-gray-300">{t('averageScore')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.inspectorStats.map((insp, i) => (
                                <tr key={i}>
                                    <td className="p-2 border border-gray-300 font-medium">{insp.name}</td>
                                    <td className="p-2 border border-gray-300 text-center">{insp.count}</td>
                                    <td className={`p-2 border border-gray-300 text-center font-bold ${insp.avgScore >= 85 ? 'text-green-600' : 'text-orange-600'}`}>
                                        {insp.avgScore.toFixed(1)}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Low Performing Areas */}
                <div className="break-inside-avoid">
                    <h3 className="text-lg font-bold text-gray-800 mb-3 border-b border-gray-300 pb-1">{t('lowPerformingAreas')}</h3>
                    <table className="w-full text-sm border-collapse">
                        <thead className="bg-gray-100 text-gray-700">
                            <tr>
                                <th className="p-2 text-left border border-gray-300">{t('location')}</th>
                                <th className="p-2 text-center border border-gray-300">{t('averageScore')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.lowPerformingAreas.map((area, i) => (
                                <tr key={i}>
                                    <td className="p-2 border border-gray-300 font-medium">{area.name}</td>
                                    <td className="p-2 border border-gray-300 text-center font-bold text-red-600">
                                        {area.avgScore.toFixed(1)}%
                                    </td>
                                </tr>
                            ))}
                            {data.lowPerformingAreas.length === 0 && (
                                <tr>
                                    <td colSpan={2} className="p-4 text-center text-gray-500 border border-gray-300">No areas below 85% this month.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Signatures Footer */}
            <div className="mt-16 pt-8 border-t border-gray-400 break-inside-avoid">
                <div className="grid grid-cols-3 gap-8">
                    <div className="text-center">
                        <div className="h-16 border-b border-gray-400 mb-2"></div>
                        <p className="font-bold text-sm">{t('evsSupervisor')}</p>
                    </div>
                    <div className="text-center">
                        <div className="h-16 border-b border-gray-400 mb-2"></div>
                        <p className="font-bold text-sm">{t('facilityManager')}</p>
                    </div>
                    <div className="text-center">
                        <div className="h-16 border-b border-gray-400 mb-2"></div>
                        <p className="font-bold text-sm">Quality Assurance</p>
                    </div>
                </div>
                <div className="text-center mt-8 text-xs text-gray-500">
                    System generated report. Valid without signature.
                </div>
            </div>
        </div>
    );
};

export default PrintableMonthlyManagerReport;
