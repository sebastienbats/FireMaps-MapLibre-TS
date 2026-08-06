import React, { useMemo, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import type { FireChartProps, FireFeature } from '@types/index';
import './FireChart.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const FireChart: React.FC<FireChartProps> = ({ fireData, source }) => {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [timeRange, setTimeRange] = useState<'all' | 'week' | 'month'>('all');

  const chartData = useMemo(() => {
    if (!fireData?.features?.length) return null;
    const dm: Record<string, { count: number; frp: number; max: number }> = {};
    fireData.features.forEach((f: FireFeature) => {
      const d = f.properties.acq_date || 'N/A';
      if (d === 'N/A') return;
      if (!dm[d]) dm[d] = { count: 0, frp: 0, max: 0 };
      dm[d].count++; dm[d].frp += f.properties.frp || 0; dm[d].max = Math.max(dm[d].max, f.properties.frp || 0);
    });
    let dates = Object.keys(dm).sort();
    if (timeRange === 'week') dates = dates.slice(-7);
    else if (timeRange === 'month') dates = dates.slice(-30);
    return {
      labels: dates,
      datasets: [
        { label: '🔥 Feux', data: dates.map(d => dm[d].count), borderColor: '#e74c3c', backgroundColor: 'rgba(231,76,60,.1)', fill: true, tension: 0.4, yAxisID: 'y' },
        { label: '⚡ FRP (MW)', data: dates.map(d => +dm[d].frp.toFixed(1)), borderColor: '#f39c12', backgroundColor: 'rgba(243,156,18,.1)', fill: true, tension: 0.4, yAxisID: 'y1' },
      ],
      summary: { total: fireData.features.length, frp: Object.values(dm).reduce((s, d) => s + d.frp, 0).toFixed(1), max: Math.max(...Object.values(dm).map(d => d.max)) },
    };
  }, [fireData, timeRange]);

  if (!chartData) return <div className="chart-empty"><p>📊 Aucune donnée</p></div>;

  const options = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: { legend: { position: 'top' as const }, title: { display: true, text: `Évolution - ${source}` } },
    scales: {
      y: { type: 'linear' as const, position: 'left' as const, title: { display: true, text: 'Feux' }, beginAtZero: true },
      y1: { type: 'linear' as const, position: 'right' as const, title: { display: true, text: 'FRP (MW)' }, beginAtZero: true, grid: { drawOnChartArea: false } },
      x: { title: { display: true, text: 'Date' } },
    },
  };

  return (
    <div className="fire-chart-container">
      <div className="chart-header">
        <div className="chart-summary">
          <div className="summary-item"><span>🔥 Total</span><span>{chartData.summary.total}</span></div>
          <div className="summary-item"><span>⚡ FRP</span><span>{chartData.summary.frp} MW</span></div>
        </div>
        <div className="chart-controls">
          <button className={chartType === 'line' ? 'active' : ''} onClick={() => setChartType('line')}>📈</button>
          <button className={chartType === 'bar' ? 'active' : ''} onClick={() => setChartType('bar')}>📊</button>
          <button className={timeRange === 'all' ? 'active' : ''} onClick={() => setTimeRange('all')}>Tout</button>
          <button className={timeRange === 'week' ? 'active' : ''} onClick={() => setTimeRange('week')}>7j</button>
          <button className={timeRange === 'month' ? 'active' : ''} onClick={() => setTimeRange('month')}>30j</button>
        </div>
      </div>
      <div className="chart-main">
        {chartType === 'line' ? <Line data={chartData} options={options} /> : <Bar data={chartData} options={options} />}
      </div>
    </div>
  );
};

export default FireChart;
