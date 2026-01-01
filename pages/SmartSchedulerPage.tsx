
import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { useI18n } from '../hooks/useI18n';
import Card from '../components/ui/Card';
import { TaskStatus, InspectionTask, UserRole } from '../types';
import { Clock, CheckCheck, FileText, Sliders, Calendar, Plus, Trash2, Save, Sparkles, ArrowRight, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { USERS } from '../constants';

const SmartSchedulerPage: React.FC = () => {
    const { tasks, locations, reports, getFormById, addTasks, updateTask, getLocationById, getInspectorById } = useContext(AppContext);
    const { t, language } = useI18n();
    const [activeTab, setActiveTab] = useState<'tracker' | 'generator'>('tracker');
    const [generatedTasks, setGeneratedTasks] = useState<InspectionTask[]>([]);
    
    // NEW: State for selected tasks
    const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());

    const sortedAllTasks = useMemo(() => {
        return [...tasks].sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
    }, [tasks]);

    // Helper to calculate progress/urgency
    const getTaskProgress = (task: InspectionTask) => {
        // Fallback for mock data without generatedDate: assume created 7 days before due date
        const due = new Date(task.dueDate);
        const created = task.generatedDate 
            ? new Date(task.generatedDate) 
            : new Date(new Date(task.dueDate).setDate(new Date(task.dueDate).getDate() - 7));
        
        const now = new Date();
        
        // If generated date is invalid or in future (edge case), default to now
        const startTime = created.getTime();
        const endTime = due.setHours(23, 59, 59, 999); // End of due day
        const currentTime = now.getTime();

        const totalDuration = endTime - startTime;
        const elapsed = currentTime - startTime;

        let percentage = 0;
        if (totalDuration > 0) {
            percentage = (elapsed / totalDuration) * 100;
        }

        const isOverdue = currentTime > endTime;
        
        // Days difference calculation
        const diffTime = endTime - currentTime;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        let statusColor = 'bg-green-500';
        let textColor = 'text-green-700 dark:text-green-400';
        let label = `${diffDays} days left`;

        if (isOverdue) {
            statusColor = 'bg-red-600';
            textColor = 'text-red-600 dark:text-red-400';
            label = `${Math.abs(diffDays)} days overdue`;
            percentage = 100; // Full bar for overdue
        } else if (diffDays <= 0) { // Due today (but not technically passed 23:59 yet)
            statusColor = 'bg-orange-500';
            textColor = 'text-orange-600 dark:text-orange-400';
            label = 'Due Today';
            percentage = 90;
        } else if (percentage > 75) {
            statusColor = 'bg-yellow-500';
            textColor = 'text-yellow-600 dark:text-yellow-400';
        }

        // Clamp percentage for CSS width
        const width = Math.min(Math.max(percentage, 5), 100);

        return { width, statusColor, textColor, label, isOverdue };
    };

    // SMART ANALYSIS & GENERATOR LOGIC
    const handleGenerate = () => {
        const proposed: InspectionTask[] = [];
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const inspectors = USERS.filter(u => u.role === UserRole.Inspector);
        const existingTaskLocIds = tasks.filter(t => t.status === TaskStatus.Pending).map(t => t.locationId);

        locations.forEach((loc, index) => {
            // Skip if there is already a pending task for this location
            if (existingTaskLocIds.includes(loc.id)) return;

            const locReports = reports.filter(r => r.locationId === loc.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const lastReport = locReports[0];
            
            let reason = '';
            let priority: 'High' | 'Normal' | 'Low' = 'Normal';
            
            if (!lastReport) {
                reason = 'notVisited';
                priority = 'Normal';
            } else if (new Date(lastReport.date) < thirtyDaysAgo) {
                reason = 'routineCheck'; // Routine Check (Overdue)
                priority = 'Normal';
            } else {
                // Calculate score
                const form = getFormById(loc.formId);
                if(form) {
                    const max = form.items.reduce((a,b) => a + b.maxScore, 0);
                    const actual = lastReport.items.reduce((a,b) => a + b.score, 0);
                    const score = max > 0 ? (actual/max)*100 : 0;
                    if(score < 75) {
                        reason = `lowScore`;
                        priority = 'High';
                    }
                }
            }

            if (reason) {
                // Round robin assignment for simple distribution
                const inspector = inspectors[index % inspectors.length];
                
                proposed.push({
                    id: `task-${Date.now()}-${index}`,
                    locationId: loc.id,
                    inspectorId: inspector.id,
                    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
                    priority,
                    reason,
                    status: TaskStatus.Pending,
                    generatedDate: new Date().toISOString()
                });
            }
        });
        
        setGeneratedTasks(proposed);
        // Auto-select all by default for convenience
        setSelectedTaskIds(new Set(proposed.map(t => t.id)));
    };

    // Modified Publish Logic to handle selection
    const handlePublish = () => {
        const tasksToPublish = generatedTasks.filter(t => selectedTaskIds.has(t.id));
        
        if (tasksToPublish.length === 0) {
            alert("Please select at least one task to publish.");
            return;
        }

        addTasks(tasksToPublish);
        
        // Remove only published tasks from the generator list, keep others
        setGeneratedTasks(prev => prev.filter(t => !selectedTaskIds.has(t.id)));
        setSelectedTaskIds(new Set()); // Clear selection
        
        setActiveTab('tracker');
        alert(`${tasksToPublish.length} tasks published successfully.`);
    };

    const handleRemoveGeneratedTask = (id: string) => {
        setGeneratedTasks(prev => prev.filter(t => t.id !== id));
        // Remove from selection if exists
        const newSet = new Set(selectedTaskIds);
        if(newSet.has(id)) {
            newSet.delete(id);
            setSelectedTaskIds(newSet);
        }
    };

    const handleUpdateGeneratedTask = (id: string, field: keyof InspectionTask, value: any) => {
        setGeneratedTasks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    const handleAddManualTask = () => {
        // Add a blank task row
        const inspectors = USERS.filter(u => u.role === UserRole.Inspector);
        const newTask: InspectionTask = {
            id: `task-manual-${Date.now()}`,
            locationId: locations[0]?.id || '',
            inspectorId: inspectors[0]?.id || '',
            dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            priority: 'Normal',
            reason: 'Manual Assignment',
            status: TaskStatus.Pending,
            generatedDate: new Date().toISOString()
        };
        setGeneratedTasks([...generatedTasks, newTask]);
        
        // Auto select the new manual task
        const newSet = new Set(selectedTaskIds);
        newSet.add(newTask.id);
        setSelectedTaskIds(newSet);
    };

    // Selection Handlers
    const toggleTaskSelection = (id: string) => {
        const newSet = new Set(selectedTaskIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedTaskIds(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedTaskIds.size === generatedTasks.length && generatedTasks.length > 0) {
            setSelectedTaskIds(new Set());
        } else {
            setSelectedTaskIds(new Set(generatedTasks.map(t => t.id)));
        }
    };

    const getPriorityColorClass = (priority: string) => {
        if (priority === 'High') return 'text-red-600 bg-red-50 border-red-200';
        if (priority === 'Low') return 'text-green-600 bg-green-50 border-green-200';
        return 'text-blue-600 bg-blue-50 border-blue-200';
    };

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-brand-blue-dark dark:text-gray-200">{t('smartScheduler')}</h1>
                <div className="flex space-x-2 rtl:space-x-reverse bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('tracker')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'tracker' ? 'bg-white dark:bg-gray-600 shadow text-brand-blue' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        {t('taskTracker')}
                    </button>
                    <button
                        onClick={() => setActiveTab('generator')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'generator' ? 'bg-white dark:bg-gray-600 shadow text-brand-blue' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        {t('scheduleGenerator')}
                    </button>
                </div>
            </div>

            {/* VIEW 1: TASK TRACKER */}
            {activeTab === 'tracker' && (
                <div className="space-y-8">
                    {/* 1. PENDING TASKS */}
                    <Card title={`${t('pendingTasks')} (${sortedAllTasks.filter(t => t.status === TaskStatus.Pending).length})`}>
                        {sortedAllTasks.filter(t => t.status === TaskStatus.Pending).length === 0 ? (
                            <p className="text-center text-gray-500 py-4">{t('noNewNotifications')}</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 uppercase text-xs">
                                        <tr>
                                            <th className="px-4 py-3 w-1/4">{t('location')}</th>
                                            <th className="px-4 py-3">{t('inspector')}</th>
                                            <th className="px-4 py-3">{t('dueDate')}</th>
                                            <th className="px-4 py-3 w-1/5">Timeline</th>
                                            <th className="px-4 py-3">{t('priority')}</th>
                                            <th className="px-4 py-3">{t('reason')}</th>
                                            <th className="px-4 py-3 text-center">{t('status')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {sortedAllTasks.filter(t => t.status === TaskStatus.Pending).map((task) => {
                                            const location = getLocationById(task.locationId);
                                            const inspector = getInspectorById(task.inspectorId);
                                            const progress = getTaskProgress(task);
                                            
                                            return (
                                                <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">
                                                        {location?.name[language]}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                                        {inspector?.name}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {new Date(task.dueDate).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="w-full">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className={`text-[10px] font-bold ${progress.textColor} uppercase flex items-center`}>
                                                                    {progress.isOverdue && <AlertTriangle size={10} className="me-1" />}
                                                                    {progress.label}
                                                                </span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                                                <div 
                                                                    className={`${progress.statusColor} h-2 rounded-full transition-all duration-500`} 
                                                                    style={{ width: `${progress.width}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <select
                                                            value={task.priority}
                                                            onChange={(e) => updateTask({...task, priority: e.target.value as any})}
                                                            className={`p-1 text-xs font-bold border rounded bg-transparent cursor-pointer ${getPriorityColorClass(task.priority)}`}
                                                        >
                                                            <option value="High">{t('High')}</option>
                                                            <option value="Normal">{t('Normal')}</option>
                                                            <option value="Low">{t('Low')}</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-gray-500">
                                                        {t(task.reason)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                            <Clock size={12} className="me-1"/>
                                                            {t('Pending')}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>

                    {/* 2. COMPLETED TASKS */}
                    <Card title={`${t('completedTasksHistory')} (${sortedAllTasks.filter(t => t.status === TaskStatus.Completed).length})`}>
                         {sortedAllTasks.filter(t => t.status === TaskStatus.Completed).length === 0 ? (
                            <p className="text-center text-gray-500 py-4">No completed tasks yet.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 uppercase text-xs">
                                        <tr>
                                            <th className="px-4 py-3">{t('location')}</th>
                                            <th className="px-4 py-3">{t('inspector')}</th>
                                            <th className="px-4 py-3">{t('dueDate')}</th>
                                            <th className="px-4 py-3">{t('reason')}</th>
                                            <th className="px-4 py-3 text-center">{t('status')}</th>
                                            <th className="px-4 py-3 text-center">{t('viewReport')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {sortedAllTasks.filter(t => t.status === TaskStatus.Completed).map((task) => {
                                            const location = getLocationById(task.locationId);
                                            const inspector = getInspectorById(task.inspectorId);
                                            
                                            return (
                                                <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">
                                                        {location?.name[language]}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                                        {inspector?.name}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-500">
                                                        {new Date(task.dueDate).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-gray-500">
                                                        {t(task.reason)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            <CheckCheck size={12} className="me-1"/>
                                                            {t('Completed')}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {task.linkedReportId ? (
                                                            <Link 
                                                                to={`/report/${task.linkedReportId}`}
                                                                className="inline-flex items-center text-xs font-bold bg-brand-blue text-white px-3 py-1.5 rounded hover:bg-brand-blue-dark transition-colors shadow-sm"
                                                            >
                                                                <FileText size={14} className="me-1"/>
                                                                {t('viewReport')}
                                                            </Link>
                                                        ) : (
                                                            <span className="text-gray-400 text-xs">-</span>
                                                        )}
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
            )}

            {/* VIEW 2: GENERATOR */}
            {activeTab === 'generator' && (
                <div className="space-y-6">
                    {generatedTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 border-dashed border-gray-300 dark:border-gray-700">
                            <Sparkles size={64} className="text-brand-yellow mb-4" />
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">{t('generateSmartSchedule')}</h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-6 text-center max-w-md">
                                The system will analyze location history, scores, and visit frequency to propose an optimized schedule for your inspectors.
                            </p>
                            <button 
                                onClick={handleGenerate}
                                className="px-6 py-3 bg-brand-teal text-white font-bold rounded-lg shadow-lg hover:bg-brand-blue-dark transition-transform transform hover:scale-105"
                            >
                                <Sliders size={20} className="inline me-2" />
                                Start Analysis & Generate
                            </button>
                        </div>
                    ) : (
                        <Card title={t('proposedSchedule')}>
                            <div className="flex justify-between items-center mb-4">
                                <p className="text-sm text-gray-500">
                                    {generatedTasks.length} tasks proposed. <span className="font-bold text-brand-blue">{selectedTaskIds.size} {t('selected')}</span>
                                </p>
                                <div className="flex gap-2">
                                    <button onClick={() => setGeneratedTasks([])} className="px-3 py-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-md text-sm transition-colors">
                                        {t('clearList')}
                                    </button>
                                    <button onClick={handleAddManualTask} className="px-3 py-1.5 text-brand-blue bg-blue-50 hover:bg-blue-100 rounded-md text-sm transition-colors flex items-center">
                                        <Plus size={16} className="me-1"/> Add Task
                                    </button>
                                </div>
                            </div>
                            
                            <div className="overflow-x-auto mb-6">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-brand-gray dark:bg-gray-700 text-gray-700 dark:text-gray-200 uppercase text-xs">
                                        <tr>
                                            <th className="px-4 py-3 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedTaskIds.size === generatedTasks.length && generatedTasks.length > 0} 
                                                    onChange={toggleSelectAll}
                                                    className="w-4 h-4 text-brand-blue rounded focus:ring-brand-blue"
                                                />
                                            </th>
                                            <th className="px-4 py-3">{t('location')}</th>
                                            <th className="px-4 py-3">{t('inspector')}</th>
                                            <th className="px-4 py-3">{t('dueDate')}</th>
                                            <th className="px-4 py-3">{t('priority')}</th>
                                            <th className="px-4 py-3">{t('reason')}</th>
                                            <th className="px-4 py-3 text-center">{t('actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {generatedTasks.map((task) => (
                                            <tr key={task.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${selectedTaskIds.has(task.id) ? 'bg-blue-50 dark:bg-blue-900/10' : 'bg-white dark:bg-gray-800'}`}>
                                                <td className="px-4 py-3 text-center">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedTaskIds.has(task.id)} 
                                                        onChange={() => toggleTaskSelection(task.id)}
                                                        className="w-4 h-4 text-brand-blue rounded focus:ring-brand-blue"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <select 
                                                        value={task.locationId} 
                                                        onChange={(e) => handleUpdateGeneratedTask(task.id, 'locationId', e.target.value)}
                                                        className="w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                                                    >
                                                        {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name[language]}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <select 
                                                        value={task.inspectorId} 
                                                        onChange={(e) => handleUpdateGeneratedTask(task.id, 'inspectorId', e.target.value)}
                                                        className="w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                                                    >
                                                        {USERS.filter(u => u.role === UserRole.Inspector).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input 
                                                        type="date" 
                                                        value={task.dueDate} 
                                                        onChange={(e) => handleUpdateGeneratedTask(task.id, 'dueDate', e.target.value)}
                                                        className="w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <select 
                                                        value={task.priority} 
                                                        onChange={(e) => handleUpdateGeneratedTask(task.id, 'priority', e.target.value)}
                                                        className={`w-full p-1 border rounded dark:bg-gray-700 dark:border-gray-600 font-bold ${getPriorityColorClass(task.priority)}`}
                                                    >
                                                        <option value="Normal">{t('Normal')}</option>
                                                        <option value="High">{t('High')}</option>
                                                        <option value="Low">{t('Low')}</option>
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3 text-gray-500 text-xs">
                                                    {t(task.reason)}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button onClick={() => handleRemoveGeneratedTask(task.id)} className="text-red-500 hover:text-red-700 p-1">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-end">
                                <button 
                                    onClick={handlePublish}
                                    disabled={selectedTaskIds.size === 0}
                                    className="px-6 py-3 bg-brand-teal text-white font-bold rounded-lg shadow-md hover:bg-brand-blue-dark transition-colors flex items-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    <Save size={20} className="me-2" />
                                    {t('publishSelectedTasks')} ({selectedTaskIds.size})
                                </button>
                            </div>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
};

export default SmartSchedulerPage;