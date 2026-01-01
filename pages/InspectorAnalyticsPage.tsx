
import React, { useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useI18n } from '../hooks/useI18n';
import { AppContext } from '../context/AppContext';
import { ArrowLeft } from 'lucide-react';

const InspectorAnalyticsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { getInspectorById } = useContext(AppContext);
    const { t } = useI18n();
    const navigate = useNavigate();

    const inspector = getInspectorById(id || '');

    return (
        <div className="p-4">
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-4">
                <ArrowLeft size={18} /> {t('backToDashboard')}
            </button>
            <h1 className="text-2xl font-bold">
                {t('inspectorPerformanceAnalytics')}: {inspector ? inspector.name : id}
            </h1>
            <p className="mt-4 text-gray-600">
                This is a placeholder for the detailed Inspector Performance Analytics page.
                Daily/weekly visits, report completion rates, violations discovered, time per inspection, and area coverage for this inspector will be displayed here.
            </p>
        </div>
    );
};

export default InspectorAnalyticsPage;
