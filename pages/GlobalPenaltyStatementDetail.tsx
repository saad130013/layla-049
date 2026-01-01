
import React, { useContext, useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { useI18n } from '../hooks/useI18n';
import Card from '../components/ui/Card';
import { GlobalPenaltyStatement, GlobalPenaltyStatus, GlobalPenaltyItem, PenaltyStatus, GlobalPenaltyItemStatus, CDR } from '../types';
import { Save, Printer, Trash2, CheckCheck, RefreshCw, Hospital, ArrowLeft, AlertTriangle, Plus, X, Link as LinkIcon, Calculator, List } from 'lucide-react';
import { PENALTY_RATES, PENALTY_KEY_MAP } from '../constants';

const GlobalPenaltyStatementDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { penaltyInvoices, globalPenaltyStatements, addGlobalPenaltyStatement, updateGlobalPenaltyStatement, user, cdrs } = useContext(AppContext);
    const { t, formatDate, formatCurrency, language } = useI18n();

    const isNew = id === 'new';
    const monthParam = searchParams.get('month');
    const yearParam = searchParams.get('year');

    const [statement, setStatement] = useState<GlobalPenaltyStatement | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    const generateDataFromInvoices = (month: number, year: number) => {
        const relevantInvoices = penaltyInvoices.filter(inv => {
            const d = new Date(inv.dateGenerated);
            return (
                d.getMonth() === month &&
                d.getFullYear() === year &&
                inv.status === PenaltyStatus.Deducted 
            );
        });

        const aggregatedItems: Record<string, GlobalPenaltyItem> = {};
        
        relevantInvoices.forEach(inv => {
            inv.items.forEach(invItem => {
                const key = `${invItem.description}-${invItem.amount}`;
                
                if (!aggregatedItems[key]) {
                    aggregatedItems[key] = {
                        id: `gps-item-${Date.now()}-${Math.random()}`,
                        violationName: invItem.description,
                        category: invItem.category,
                        occurrenceCount: 0,
                        penaltyPerOccurrence: invItem.amount,
                        total: 0,
                        status: GlobalPenaltyItemStatus.Approved, 
                        managerNotes: ''
                    };
                }
                
                aggregatedItems[key].occurrenceCount += 1;
                aggregatedItems[key].total += invItem.amount;
            });
        });

        const itemsArray = Object.values(aggregatedItems);
        const totalAmount = itemsArray.reduce((sum, item) => sum + item.total, 0);
        const totalViolations = itemsArray.reduce((sum, item) => sum + item.occurrenceCount, 0);
        const totalInvoices = relevantInvoices.length;

        return { items: itemsArray, totalAmount, totalViolations, totalInvoices };
    };

    useEffect(() => {
        const stateStatement = location.state?.statement as GlobalPenaltyStatement | undefined;
        if (stateStatement && stateStatement.id === id) {
            setStatement(stateStatement);
            return;
        }

        if (statement) {
            if (isNew && statement.id.startsWith('gps-')) {
                 if (monthParam && yearParam && 
                     (statement.month === parseInt(monthParam) && statement.year === parseInt(yearParam))) {
                     return; 
                 }
            } else if (!isNew && statement.id === id) {
                return;
            }
        }

        if (isNew && monthParam && yearParam) {
            const month = parseInt(monthParam);
            const year = parseInt(yearParam);
            
            const { items, totalAmount, totalViolations, totalInvoices } = generateDataFromInvoices(month, year);

            const newStatement: GlobalPenaltyStatement = {
                id: `gps-${Date.now()}`,
                referenceNumber: `GPS-${year}-${(month + 1).toString().padStart(2, '0')}-001`,
                month,
                year,
                status: GlobalPenaltyStatus.Draft,
                contractorName: 'CleanCo Services',
                generatedDate: new Date().toISOString(),
                items,
                totalAmount,
                totalViolations,
                totalInvoices,
                managerGeneralComment: ''
            };
            setStatement(newStatement);
        } 
        else if (id && !isNew) {
            const existing = globalPenaltyStatements.find(s => s.id === id);
            if (existing) {
                setStatement(existing);
            }
        }
    }, [id, isNew, monthParam, yearParam, globalPenaltyStatements, location.state]);

    const handleUpdateRow = (itemId: string, field: keyof GlobalPenaltyItem, value: any) => {
        if (!statement || statement.status === GlobalPenaltyStatus.Approved) return;
        
        const updatedItems = statement.items.map(item => {
            if (item.id === itemId) {
                const newItem = { ...item, [field]: value };
                if (newItem.status === GlobalPenaltyItemStatus.Rejected) {
                    newItem.total = 0;
                } else {
                    newItem.total = newItem.occurrenceCount * newItem.penaltyPerOccurrence;
                }
                return newItem;
            }
            return item;
        });

        recalculateAndSetStatement(updatedItems);
    };

    const handleDeleteRow = (itemId: string) => {
        if (!statement || statement.status === GlobalPenaltyStatus.Approved) return;
        if (!window.confirm(t('deleteRow') + "?")) return;

        const updatedItems = statement.items.filter(item => item.id !== itemId);
        recalculateAndSetStatement(updatedItems);
    };

    const recalculateAndSetStatement = (updatedItems: GlobalPenaltyItem[]) => {
        if (!statement) return;
        
        const totalAmount = updatedItems.reduce((sum, item) => sum + item.total, 0);
        const totalViolations = updatedItems.reduce((sum, item) => 
            item.status === GlobalPenaltyItemStatus.Rejected ? sum : sum + item.occurrenceCount, 0
        );
        
        setStatement({ ...statement, items: updatedItems, totalAmount, totalViolations });
    };
    
    const handleRefreshData = () => {
        if (!statement || statement.status === GlobalPenaltyStatus.Approved) return;
        if (!window.confirm(t('confirmRefresh'))) return;

        const { items, totalAmount, totalViolations, totalInvoices } = generateDataFromInvoices(statement.month, statement.year);
        setStatement({ ...statement, items, totalAmount, totalViolations, totalInvoices, managerGeneralComment: '' });
    };

    const handleSave = (e?: React.MouseEvent) => {
        if(e) e.preventDefault();
        if (!statement) return;

        if (isNew) {
            addGlobalPenaltyStatement(statement);
            navigate(`/global-penalty-statement/${statement.id}`, { replace: true });
        } else {
            updateGlobalPenaltyStatement(statement);
        }
        alert(t('save') + " " + t('success'));
    };

    const handleApprove = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!statement) return;
        if (!user) {
            alert(t('loginError'));
            return;
        }

        const confirmMessage = t('confirmApprove');
        if (!window.confirm(confirmMessage)) return;
        
        const approvedStmt: GlobalPenaltyStatement = {
            ...statement,
            status: GlobalPenaltyStatus.Approved,
            approvedBy: user.name,
            approvedDate: new Date().toISOString()
        };
        
        setStatement(approvedStmt);

        if (isNew) {
            addGlobalPenaltyStatement(approvedStmt);
        } else {
            updateGlobalPenaltyStatement(approvedStmt);
        }
        
        setTimeout(() => {
            alert(t('statementApprovedSuccess'));
            navigate('/global-penalty-statements', { state: { activeTab: 'approved' } });
        }, 50);
    };

    const handleAddManualItem = (violationName: string, amount: number, count: number, linkedCdrIds: string[], notes: string, category: string) => {
        if (!statement) return;

        const newItem: GlobalPenaltyItem = {
            id: `gps-manual-${Date.now()}`,
            violationName: violationName,
            category: category,
            occurrenceCount: count,
            penaltyPerOccurrence: amount,
            total: count * amount,
            status: GlobalPenaltyItemStatus.Approved,
            managerNotes: notes,
            isManual: true,
            linkedCdrIds: linkedCdrIds
        };

        const updatedItems = [...statement.items, newItem];
        recalculateAndSetStatement(updatedItems);
        setShowAddModal(false);
    };

    if (!statement) return <div className="p-8 text-center text-gray-500">Loading Statement...</div>;

    const isEditable = statement.status === GlobalPenaltyStatus.Draft;
    const months = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(2000, i, 1);
        return d.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', { month: 'long' });
    });

    const printableItems = statement.items.filter(item => item.status !== GlobalPenaltyItemStatus.Rejected);

    return (
        <div className="space-y-6">
            <div className="no-print flex items-center space-x-2 rtl:space-x-reverse text-gray-500 hover:text-gray-700 cursor-pointer" onClick={() => navigate('/global-penalty-statements')}>
                <ArrowLeft size={20} />
                <span>{t('globalPenaltyStatementsList')}</span>
            </div>

            <div className="no-print">
                <Card className={statement.status === GlobalPenaltyStatus.Approved ? 'border-t-4 border-green-500' : 'border-t-4 border-yellow-500'}>
                    <div className="flex flex-col md:flex-row justify-between items-start mb-6 border-b dark:border-gray-700 pb-4 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-brand-blue-dark dark:text-gray-200">{t('globalPenaltyStatement')}</h1>
                            <p className="text-gray-500">{months[statement.month]} {statement.year}</p>
                            <p className="text-xs text-gray-400 mt-1">Source: {statement.totalInvoices || 0} Approved Invoices</p>
                        </div>
                        <div className="text-end">
                            <span className={`px-3 py-1 rounded-full font-bold text-sm ${statement.status === GlobalPenaltyStatus.Approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {t(statement.status.toLowerCase())}
                            </span>
                            <p className="text-sm mt-1 text-gray-400">{statement.referenceNumber}</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto mb-6">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3">{t('managerDecision')}</th>
                                    <th className="px-4 py-3">{t('violationItem')}</th>
                                    <th className="px-4 py-3 text-center">{t('occurrenceCount')}</th>
                                    <th className="px-4 py-3 text-right">{t('penaltyPerOccurrence')}</th>
                                    <th className="px-4 py-3 text-right">{t('total')}</th>
                                    <th className="px-4 py-3 w-1/4">{t('managerNotes')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {statement.items.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                                            No penalties found for this month.
                                        </td>
                                    </tr>
                                ) : statement.items.map(item => (
                                    <tr key={item.id} className={`bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 ${item.status === GlobalPenaltyItemStatus.Rejected ? 'bg-red-50 dark:bg-red-900/10 opacity-75' : ''}`}>
                                         <td className="px-4 py-3">
                                            <div className="flex flex-col gap-1">
                                                {isEditable ? (
                                                    <select
                                                        value={item.status}
                                                        onChange={(e) => handleUpdateRow(item.id, 'status', e.target.value)}
                                                        className={`p-1.5 border rounded text-xs font-semibold ${item.status === GlobalPenaltyItemStatus.Approved ? 'text-green-700 bg-green-50 border-green-200' : item.status === GlobalPenaltyItemStatus.Rejected ? 'text-red-700 bg-red-50 border-red-200' : 'text-gray-700'}`}
                                                    >
                                                        <option value={GlobalPenaltyItemStatus.Approved}>{t('approve')}</option>
                                                        <option value={GlobalPenaltyItemStatus.Rejected}>{t('reject')}</option>
                                                    </select>
                                                ) : (
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${item.status === GlobalPenaltyItemStatus.Approved ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`}>
                                                        {t(item.status.toLowerCase())}
                                                    </span>
                                                )}
                                                {isEditable && (
                                                    <button onClick={() => handleDeleteRow(item.id)} className="text-red-500 hover:text-red-700 p-1 self-start" title={t('deleteRow')}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className={`px-4 py-3 font-medium ${item.status === GlobalPenaltyItemStatus.Rejected ? 'line-through text-gray-500' : ''}`}>
                                            {PENALTY_KEY_MAP[item.violationName] ? t(PENALTY_KEY_MAP[item.violationName]) : item.violationName}
                                            <div className="text-xs text-gray-400">{item.category} {item.isManual && <span className="text-brand-blue bg-blue-50 px-1 rounded ml-1 text-[10px]">{t('manualEntry')}</span>}</div>
                                            {item.linkedCdrIds && item.linkedCdrIds.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {item.linkedCdrIds.map(cdrId => {
                                                        const linkedCdr = cdrs.find(c => c.id === cdrId);
                                                        return linkedCdr ? (
                                                            <Link key={cdrId} to={`/cdr/${cdrId}`} className="text-[10px] bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-1.5 py-0.5 rounded flex items-center text-gray-600 dark:text-gray-300">
                                                                <LinkIcon size={10} className="me-1"/>
                                                                {linkedCdr.referenceNumber}
                                                            </Link>
                                                        ) : null;
                                                    })}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {isEditable && item.status !== GlobalPenaltyItemStatus.Rejected ? (
                                                <input 
                                                    type="number" 
                                                    min="0"
                                                    value={item.occurrenceCount} 
                                                    onChange={(e) => handleUpdateRow(item.id, 'occurrenceCount', parseInt(e.target.value) || 0)}
                                                    className="w-20 p-1 border rounded text-center dark:bg-gray-700 dark:border-gray-600 focus:ring-brand-teal focus:border-brand-teal"
                                                />
                                            ) : item.occurrenceCount}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                             {isEditable && item.status !== GlobalPenaltyItemStatus.Rejected ? (
                                                <input 
                                                    type="number" 
                                                    min="0"
                                                    value={item.penaltyPerOccurrence} 
                                                    onChange={(e) => handleUpdateRow(item.id, 'penaltyPerOccurrence', parseFloat(e.target.value) || 0)}
                                                    className="w-24 p-1 border rounded text-right dark:bg-gray-700 dark:border-gray-600 focus:ring-brand-teal focus:border-brand-teal"
                                                />
                                            ) : item.penaltyPerOccurrence}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-gray-700 dark:text-gray-300">
                                            {formatCurrency(item.total)}
                                        </td>
                                        <td className="px-4 py-3">
                                            {isEditable ? (
                                                <input 
                                                    type="text" 
                                                    placeholder={t('addANote')}
                                                    value={item.managerNotes || ''}
                                                    onChange={(e) => handleUpdateRow(item.id, 'managerNotes', e.target.value)}
                                                    className="w-full p-1.5 text-xs border rounded dark:bg-gray-700 dark:border-gray-600"
                                                />
                                            ) : (
                                                <span className="text-xs text-gray-500 italic">{item.managerNotes}</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                
                                <tr className="bg-gray-100 dark:bg-gray-900 font-bold">
                                    <td colSpan={2} className="px-4 py-4 text-right">
                                        {isEditable && (
                                            <button 
                                                onClick={() => setShowAddModal(true)}
                                                className="float-left flex items-center text-sm font-normal text-brand-blue hover:underline"
                                            >
                                                <Plus size={14} className="me-1"/> {t('addManualPenalty')}
                                            </button>
                                        )}
                                        {t('total')}
                                    </td>
                                    <td className="px-4 py-4 text-center text-lg">{statement.totalViolations}</td>
                                    <td className="px-4 py-4"></td>
                                    <td className="px-4 py-4 text-right text-red-600 text-xl">{formatCurrency(statement.totalAmount)}</td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t('generalComments')}</label>
                        {isEditable ? (
                            <textarea 
                                rows={3}
                                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-brand-teal focus:border-brand-teal"
                                value={statement.managerGeneralComment || ''}
                                onChange={(e) => setStatement({...statement, managerGeneralComment: e.target.value})}
                                placeholder="Add general comments regarding this month's penalty statement..."
                            />
                        ) : (
                            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-gray-700 dark:text-gray-300 italic min-h-[60px]">
                                {statement.managerGeneralComment || 'No comments.'}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap justify-end gap-4">
                        <button type="button" onClick={() => window.print()} className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
                            <Printer size={16} className="me-2"/> Print PDF
                        </button>
                        
                        {isEditable && (
                            <>
                                <button type="button" onClick={handleRefreshData} className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700">
                                    <RefreshCw size={16} className="me-2"/> {t('refreshData')}
                                </button>
                                <button type="button" onClick={handleSave} className="flex items-center px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-brand-blue-dark">
                                    <Save size={16} className="me-2"/> {t('save')}
                                </button>
                                <button type="button" onClick={handleApprove} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                                    <CheckCheck size={16} className="me-2"/> {t('approveStatement')}
                                </button>
                            </>
                        )}
                    </div>
                </Card>
            </div>

            <div className="hidden print-block p-8 bg-white text-black">
                 <div className="border-b-4 border-brand-blue pb-4 mb-6 flex justify-between items-start">
                    <div className="flex items-center">
                         <Hospital size={40} className="text-brand-blue me-3" />
                         <div>
                             <h1 className="text-2xl font-bold text-brand-blue uppercase">{t('penaltyStatementTitle')}</h1>
                             <p className="text-sm text-gray-600">{statement.contractorName} - {months[statement.month]} {statement.year}</p>
                         </div>
                    </div>
                    <div className="text-right text-sm">
                        <p><strong>{t('referenceNumber')}:</strong> {statement.referenceNumber}</p>
                        <p><strong>{t('date')}:</strong> {formatDate(statement.generatedDate)}</p>
                        <p><strong>{t('status')}:</strong> {t(statement.status.toLowerCase())}</p>
                        <p><strong>Approved Invoices:</strong> {statement.totalInvoices || 0}</p>
                    </div>
                </div>

                 <div className="mb-8">
                    <p className="text-gray-800 italic border-l-4 border-gray-300 pl-4 py-2">
                        {t('statementIntro')}
                    </p>
                </div>

                <div className="mb-8">
                     <table className="w-full text-sm border-collapse border border-gray-300">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="border border-gray-300 px-4 py-2 text-left">{t('violationItem')}</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">{t('category')}</th>
                                <th className="border border-gray-300 px-4 py-2 text-center">{t('occurrenceCount')}</th>
                                <th className="border border-gray-300 px-4 py-2 text-right">{t('penaltyPerOccurrence')}</th>
                                <th className="border border-gray-300 px-4 py-2 text-right">{t('total')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {printableItems.map(item => (
                                <tr key={item.id}>
                                    <td className="border border-gray-300 px-4 py-2">{PENALTY_KEY_MAP[item.violationName] ? t(PENALTY_KEY_MAP[item.violationName]) : item.violationName}</td>
                                    <td className="border border-gray-300 px-4 py-2">{item.category}</td>
                                    <td className="border border-gray-300 px-4 py-2 text-center">{item.occurrenceCount}</td>
                                    <td className="border border-gray-300 px-4 py-2 text-right">{item.penaltyPerOccurrence}</td>
                                    <td className="border border-gray-300 px-4 py-2 text-right font-mono">{formatCurrency(item.total)}</td>
                                </tr>
                            ))}
                            <tr className="bg-gray-200 font-bold">
                                <td colSpan={2} className="border border-gray-300 px-4 py-2 text-right">{t('total')}</td>
                                <td className="border border-gray-300 px-4 py-2 text-center">{statement.totalViolations}</td>
                                <td className="border border-gray-300 px-4 py-2"></td>
                                <td className="border border-gray-300 px-4 py-2 text-right text-lg">{formatCurrency(statement.totalAmount)}</td>
                            </tr>
                        </tbody>
                     </table>
                </div>
                
                {statement.managerGeneralComment && (
                    <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded">
                        <h4 className="font-bold text-sm uppercase mb-2">{t('generalComments')}</h4>
                        <p className="text-gray-800">{statement.managerGeneralComment}</p>
                    </div>
                )}

                 <div className="mt-16">
                     <h3 className="font-bold text-sm mb-6 uppercase border-b-2 border-gray-800 pb-1">{t('signatures')}</h3>
                     <div className="grid grid-cols-3 gap-8">
                         <div className="text-center">
                             <div className="h-16 border-b border-gray-400 mb-2"></div>
                             <p className="font-bold text-sm">{t('evsSupervisor')}</p>
                         </div>
                         <div className="text-center">
                             <div className="h-16 border-b border-gray-400 mb-2 flex items-end justify-center pb-2">
                                <span className="font-script text-xl">{statement.approvedBy || ''}</span>
                             </div>
                             <p className="font-bold text-sm">{t('facilityManager')}</p>
                         </div>
                         <div className="text-center">
                             <div className="h-16 border-b border-gray-400 mb-2"></div>
                             <p className="font-bold text-sm">{t('contractorRepresentative')}</p>
                         </div>
                     </div>
                </div>

                <div className="mt-12 text-center text-xs text-gray-500">
                    <p>InspectionSys Global Penalty Statement - Generated {formatDate(new Date())}</p>
                </div>
            </div>

            {showAddModal && statement && (
                <AddPenaltyModal 
                    onClose={() => setShowAddModal(false)}
                    onAdd={handleAddManualItem}
                    month={statement.month}
                    year={statement.year}
                    allCdrs={cdrs}
                />
            )}
        </div>
    );
};

const AddPenaltyModal: React.FC<{
    onClose: () => void;
    onAdd: (violationName: string, amount: number, count: number, linkedCdrIds: string[], notes: string, category: string) => void;
    month: number;
    year: number;
    allCdrs: CDR[];
}> = ({ onClose, onAdd, month, year, allCdrs }) => {
    const { t, formatDate } = useI18n();
    const [entryMode, setEntryMode] = useState<'manual' | 'auto'>('manual');
    const [selectedViolation, setSelectedViolation] = useState(Object.keys(PENALTY_RATES)[0]);
    const [amount, setAmount] = useState(PENALTY_RATES[Object.keys(PENALTY_RATES)[0]]);
    const [count, setCount] = useState(1);
    const [notes, setNotes] = useState('');
    const [selectedCdrs, setSelectedCdrs] = useState<string[]>([]);
    
    const [autoTotal, setAutoTotal] = useState(0);
    const [autoDescription, setAutoDescription] = useState('');
    const [cdrWarning, setCdrWarning] = useState('');

    const availableCdrs = useMemo(() => {
        return allCdrs.filter(c => {
            const d = new Date(c.date);
            return d.getMonth() === month && d.getFullYear() === year;
        });
    }, [allCdrs, month, year]);

    const violationsByArticle = useMemo(() => {
        const groups: Record<string, string[]> = {
            'Article A (1000 SAR)': [],
            'Article B (1500 SAR)': [],
            'Article C (2000 SAR)': [],
            'Article D (2500 SAR)': [],
            'Other': []
        };

        Object.entries(PENALTY_RATES).forEach(([key, val]) => {
            if (val === 1000) groups['Article A (1000 SAR)'].push(key);
            else if (val === 1500) groups['Article B (1500 SAR)'].push(key);
            else if (val === 2000) groups['Article C (2000 SAR)'].push(key);
            else if (val === 2500) groups['Article D (2500 SAR)'].push(key);
            else groups['Other'].push(key);
        });
        return groups;
    }, []);

    const calculatePenaltyFromCDR = (cdrId: string) => {
        const cdr = allCdrs.find(c => c.id === cdrId);
        if (!cdr) return { total: 0, violations: [] };

        let total = 0;
        const violations: string[] = [];
        const categories = ['manpowerDiscrepancy', 'materialDiscrepancy', 'equipmentDiscrepancy'] as const;

        categories.forEach(cat => {
            cdr[cat].forEach(violation => {
                const cost = PENALTY_RATES[violation] || 0;
                if (cost > 0) {
                    total += cost;
                    violations.push(violation);
                }
            });
        });

        return { total, violations };
    };

    useEffect(() => {
        if (entryMode === 'auto') {
            if (selectedCdrs.length === 1) {
                const { total, violations } = calculatePenaltyFromCDR(selectedCdrs[0]);
                
                if (total === 0) {
                    setCdrWarning(t('noFinancialPenaltiesInCDR'));
                    setAutoTotal(0);
                    setAutoDescription('');
                } else {
                    setCdrWarning('');
                    setAutoTotal(total);
                    const cdrRef = availableCdrs.find(c => c.id === selectedCdrs[0])?.referenceNumber;
                    setAutoDescription(`Auto-Import CDR ${cdrRef}: ${violations.length} violations`);
                    setNotes(`Includes: ${violations.join(', ')}`);
                }
            } else {
                setAutoTotal(0);
                setAutoDescription('');
                setCdrWarning('');
                setNotes('');
            }
        }
    }, [entryMode, selectedCdrs, availableCdrs, t]);

    const handleViolationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setSelectedViolation(val);
        setAmount(PENALTY_RATES[val] || 0);
    };

    const handleCdrToggle = (cdrId: string) => {
        if (entryMode === 'auto') {
            setSelectedCdrs([cdrId]);
        } else {
            setSelectedCdrs(prev => 
                prev.includes(cdrId) ? prev.filter(id => id !== cdrId) : [...prev, cdrId]
            );
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        let finalAmount = 0;
        let finalViolationName = '';
        let category = 'Manual Entry';
        let finalCount = 1;

        if (entryMode === 'manual') {
            finalAmount = amount;
            finalViolationName = selectedViolation;
            finalCount = count;
            
            if (amount === 1000) category = 'Article A - Manpower/Equipment';
            else if (amount === 1500) category = 'Article B - Materials/Response';
            else if (amount === 2000) category = 'Article C - Safety/Management';
            else if (amount === 2500) category = 'Article D - Critical Compliance';
        } else {
            if (autoTotal === 0) return;
            finalAmount = autoTotal;
            finalViolationName = autoDescription;
            finalCount = 1;
            category = 'Auto-CDR Import';
        }

        onAdd(finalViolationName, finalAmount, finalCount, selectedCdrs, notes, category);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
                <form onSubmit={handleSubmit}>
                    <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                        <h3 className="text-lg font-bold">{t('addManualPenalty')}</h3>
                        <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-5">
                        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-4">
                            <button
                                type="button"
                                onClick={() => { setEntryMode('manual'); setSelectedCdrs([]); setNotes(''); }}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${entryMode === 'manual' ? 'bg-white dark:bg-gray-600 shadow text-brand-blue' : 'text-gray-500 dark:text-gray-400'}`}
                            >
                                <List size={16} className="inline me-2"/> {t('manualEntry')}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setEntryMode('auto'); setSelectedCdrs([]); setNotes(''); }}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${entryMode === 'auto' ? 'bg-white dark:bg-gray-600 shadow text-brand-blue' : 'text-gray-500 dark:text-gray-400'}`}
                            >
                                <Calculator size={16} className="inline me-2"/> {t('autoImportCdr')}
                            </button>
                        </div>

                        {entryMode === 'manual' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('selectViolation')}</label>
                                    <select value={selectedViolation} onChange={handleViolationChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm">
                                        {Object.entries(violationsByArticle).map(([group, items]: [string, string[]]) => (
                                            items.length > 0 && (
                                                <optgroup key={group} label={group}>
                                                    {items.map(key => {
                                                        const translationKey = PENALTY_KEY_MAP[key];
                                                        const displayText = translationKey ? t(translationKey) : key;
                                                        return (
                                                            <option key={key} value={key}>{displayText}</option>
                                                        );
                                                    })}
                                                </optgroup>
                                            )
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">{t('amount')}</label>
                                        <input type="number" value={amount} readOnly className="w-full p-2 border rounded-md bg-gray-100 dark:bg-gray-600 cursor-not-allowed" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">{t('quantity')}</label>
                                        <input type="number" min="1" value={count} onChange={e => setCount(Number(e.target.value))} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                                    </div>
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                {entryMode === 'auto' ? t('selectCdrToImport') : t('linkCdrs')}
                            </label>
                            <div className="border rounded-md max-h-40 overflow-y-auto p-2 dark:bg-gray-700 dark:border-gray-600">
                                {availableCdrs.length > 0 ? availableCdrs.map(c => (
                                    <label key={c.id} className={`flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded cursor-pointer ${selectedCdrs.includes(c.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                                        <input 
                                            type={entryMode === 'auto' ? "radio" : "checkbox"}
                                            name="cdrSelector"
                                            checked={selectedCdrs.includes(c.id)} 
                                            onChange={() => handleCdrToggle(c.id)}
                                            className="rounded border-gray-300 text-brand-teal focus:ring-brand-teal"
                                        />
                                        <div className="flex-1">
                                            <span className="text-sm font-bold block">{c.referenceNumber}</span>
                                            <span className="text-xs text-gray-500">{formatDate(c.date)}</span>
                                        </div>
                                        {entryMode === 'auto' && (
                                             <Link to={`/cdr/${c.id}`} target="_blank" className="text-xs text-blue-500 hover:underline"><LinkIcon size={12}/></Link>
                                        )}
                                    </label>
                                )) : <p className="text-xs text-gray-500 p-2">{t('noCdrsFound')}</p>}
                            </div>
                        </div>

                        {entryMode === 'auto' && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">{t('calculatedPenalty')}:</span>
                                    <span className="text-xl font-bold text-blue-900 dark:text-white">{autoTotal.toLocaleString()} SAR</span>
                                </div>
                                {cdrWarning && (
                                    <p className="text-xs text-red-600 mt-2 flex items-center">
                                        <AlertTriangle size={12} className="me-1"/> {cdrWarning}
                                    </p>
                                )}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-1">{t('managerNotes')}</label>
                            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" placeholder={t('addANote')} />
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-md">{t('cancel')}</button>
                        <button 
                            type="submit" 
                            disabled={entryMode === 'auto' && autoTotal === 0}
                            className="px-4 py-2 bg-brand-teal text-white rounded-md hover:bg-brand-blue-dark disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {t('addPenalty')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GlobalPenaltyStatementDetail;
