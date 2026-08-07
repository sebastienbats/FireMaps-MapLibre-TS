import React from 'react';
import type { LayerToggleProps } from '@types/index';

// ✅ P3 : Ajout de la prop disabled pour l'exclusion mutuelle
interface ExtendedLayerToggleProps extends LayerToggleProps {
  disabled?: boolean;
}

const LayerToggle: React.FC<ExtendedLayerToggleProps> = ({
  label,
  checked,
  onChange,
  count,
  color,
  disabled = false,
}) => (
  <div className={`control-row ${disabled ? 'disabled' : ''}`}>
    <label className="switch">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <span className="slider" style={{ '--active-color': color } as React.CSSProperties} />
    </label>
    <span className="layer-label">{label}</span>
    {count !== undefined && count > 0 && <span className="layer-count">{count}</span>}
  </div>
);

export default LayerToggle;
