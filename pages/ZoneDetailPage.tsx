
import React, { useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useI18n } from '../hooks/useI18n';
import { AppContext } from '../context/AppContext';
import { ArrowLeft } from 'lucide-react';

const ZoneDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { zones } = useContext(AppContext);
    const { t, language } = useI18n();
    const navigate = useNavigate();

    const zone = zones.find(z => z.id === id);

    return (
        <div className="p-4">
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-4">
                <ArrowLeft size={18} /> {t('backToDashboard')}
            </button>
            <h1 className="text-2xl font-bold">
                {t('zoneDetails')}: {zone ? zone.name[language] : id}
            </h1>
            <p className="mt-4 text-gray-600">
                This is a placeholder for the detailed Zone/Area analytics page. 
                Detailed reports, location lists, compliance history, and audit logs for this zone will be displayed here.
            </p>
        </div>
    );
};

export default ZoneDetailPage;
