import React from 'react';
import type { LayerToggleProps } from '@types/index';

const LayerToggle: React.FC<LayerToggleProps> = ({ label, checked, onChange, count, color }) => (
  <div className="control-row">
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="slider" style={{ '--active-color': color } as React.CSSProperties} />
    </label>
    <span className="layer-label">{label}</span>
    {count !== undefined && count > 0 && <span className="layer-count">{count}</span>}
  </div>
);

export default LayerToggle;
