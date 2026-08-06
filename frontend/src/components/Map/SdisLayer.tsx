import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import type { SdisLayerProps } from '@types/index';

const SdisLayer: React.FC<SdisLayerProps> = ({ map, sdisData }) => {
  const markers = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!map || !sdisData?.features?.length) return;
    markers.current.forEach(m => m.remove());
    markers.current = [];

    sdisData.features.forEach(f => {
      const color = f.properties.type === 'principal' ? '#3498db' : '#9b59b6';
      const el = document.createElement('div');
      el.style.cssText = `width:16px;height:16px;background:${color};border:2px solid white;border-radius:3px;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.3)`;

      markers.current.push(
        new maplibregl.Marker({ element: el })
          .setLngLat(f.geometry.coordinates)
          .setPopup(new maplibregl.Popup({ offset: 15 }).setHTML(
            `<div style="padding:8px"><h3 style="margin:0 0 8px;color:${color}">🚒 ${f.properties.name}</h3><p><b>Département:</b> ${f.properties.department}</p><p><b>Type:</b> ${f.properties.type}</p></div>`
          ))
          .addTo(map)
      );
    });

    return () => { markers.current.forEach(m => m.remove()); markers.current = []; };
  }, [map, sdisData]);

  return null;
};

export default SdisLayer;
