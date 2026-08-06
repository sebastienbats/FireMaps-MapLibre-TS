import React, { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAlertStore } from '@store/alertStore';
import { useFireData } from '@hooks/useFireData';
import { useSdisData } from '@hooks/useSdisData';
import './Alerts.css';

const Alerts: React.FC = () => {
  const { alerts, isExpanded, toggleExpanded, dismissAlert, generateAlerts } = useAlertStore();
  const { data: fireData } = useFireData();
  const { data: sdisData } = useSdisData();

  useEffect(() => { if (fireData) generateAlerts(fireData, sdisData ?? null); }, [fireData, sdisData, generateAlerts]);

  useEffect(() => {
    alerts.filter(a => a.severity === 'critical').slice(0, 2).forEach(a => {
      toast.error(a.message, { duration: 8000, icon: '🚨' });
    });
  }, [alerts]);

  if (!alerts.length) return (
    <div className="alerts-panel alerts-empty">
      <div className="alerts-header"><span className="alerts-title">✅ Alertes</span><span className="alerts-status">Aucune alerte</span></div>
    </div>
  );

  return (
    <div className={`alerts-panel ${isExpanded ? 'expanded' : ''}`}>
      <div className="alerts-header" onClick={toggleExpanded}>
        <span className="alerts-title">🚨 Alertes</span>
        <span className="alerts-count">{alerts.length}</span>
        <span className="alerts-toggle">{isExpanded ? '▲' : '▼'}</span>
      </div>
      {isExpanded && (
        <div className="alerts-list">
          {alerts.map(a => (
            <div key={a.id} className={`alert-item alert-${a.severity}`}>
              <div className="alert-content">
                <div className="alert-message">{a.message}</div>
                <div className="alert-details">{a.details}</div>
                <div className="alert-time">{new Date(a.timestamp).toLocaleString('fr-FR')}</div>
              </div>
              {a.frp && <div className="alert-frp">{a.frp.toFixed(0)} MW</div>}
              <button className="alert-dismiss" onClick={() => dismissAlert(a.id)}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Alerts;
