
"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Chief } from '@/lib/data';
import { useEffect } from 'react';

// Fix for default Leaflet icon issue with Webpack
const icon = L.icon({
  iconUrl: "/marker-icon.png",
  iconRetinaUrl: "/marker-icon-2x.png",
  shadowUrl: "/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});


interface MapComponentProps {
  chiefs: Chief[];
}

// Component to recenter map when chiefs data changes
function MapRecenter({ chiefs }: { chiefs: Chief[] }) {
    const map = useMap();
    useEffect(() => {
        if (chiefs && chiefs.length > 0) {
            const firstChief = chiefs[0];
            if (firstChief.latitude && firstChief.longitude) {
                 map.setView([firstChief.latitude, firstChief.longitude], 8);
            }
        }
    }, [chiefs, map]);
    return null;
}

export default function MapComponent({ chiefs }: MapComponentProps) {
  const position: L.LatLngExpression = [7.539989, -5.54708]; // Default center on Ivory Coast

  return (
    <MapContainer center={position} zoom={7} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {chiefs.map(chief => (
        (chief.latitude && chief.longitude) && (
          <Marker 
            key={chief.id} 
            position={[chief.latitude, chief.longitude]}
            icon={icon}
          >
            <Popup>
              <div className="font-sans">
                <h3 className="font-bold text-base mb-1">{chief.name}</h3>
                <p className="text-sm text-muted-foreground m-0">{chief.title}</p>
                <p className="text-sm m-0">{chief.village}, {chief.region}</p>
                {chief.contact && <p className="text-sm m-0">Contact: {chief.contact}</p>}
              </div>
            </Popup>
          </Marker>
        )
      ))}
      <MapRecenter chiefs={chiefs} />
    </MapContainer>
  );
}
