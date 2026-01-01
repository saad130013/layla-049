
import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { UserRole } from '../types';
import InspectorDashboard from '../components/dashboard/InspectorDashboard';
import ManagerDashboard from '../components/dashboard/ManagerDashboard';
import ExecutiveDashboard from '../components/dashboard/ExecutiveDashboard';

const Dashboard: React.FC = () => {
  const { user } = useContext(AppContext);

  if (!user) return null;

  switch(user.role) {
    case UserRole.Inspector:
        return <InspectorDashboard />;
    case UserRole.Supervisor:
        return <ManagerDashboard />;
    case UserRole.Executive:
        return <ExecutiveDashboard />;
    default:
        return <div>No dashboard available for this role.</div>;
  }
};

export default Dashboard;
