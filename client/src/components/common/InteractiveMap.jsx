import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Compass, ExternalLink } from 'lucide-react';

/**
 * InteractiveMap component
 * Supports Google Maps API with auto-fallback to OpenStreetMap iframe/tiles.
 * 
 * @param {Object} props
 * @param {number} props.latitude
 * @param {number} props.longitude
 * @param {number} [props.zoom=15]
 * @param {string} [props.markerTitle='Location']
 * @param {string} [props.height='260px']
 * @param {Array} [props.markers=[]] e.g. [{ lat, lng, title, color }]
 * @param {Function} [props.onLocationSelect] callback when user clicks a point on the map
 * @param {boolean} [props.interactive=true]
 */
export default function InteractiveMap({
  latitude,
  longitude,
  zoom = 15,
  markerTitle = 'Service Location',
  height = '240px',
  markers = [],
  onLocationSelect,
  interactive = true,
}) {
  const defaultLat = latitude || 12.9716; // Default Bangalore/center if missing
  const defaultLng = longitude || 77.5946;
  const mapRef = useRef(null);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const apiKey = import.meta.env.VITE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey) {
      setLoadError(true);
      return;
    }

    if (window.google && window.google.maps) {
      setGoogleLoaded(true);
      return;
    }

    const scriptId = 'google-maps-script';
    let script = document.getElementById(scriptId);

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setGoogleLoaded(true);
      script.onerror = () => setLoadError(true);
      document.head.appendChild(script);
    } else {
      script.addEventListener('load', () => setGoogleLoaded(true));
      script.addEventListener('error', () => setLoadError(true));
    }
  }, [apiKey]);

  useEffect(() => {
    if (!googleLoaded || !mapRef.current || !window.google?.maps) return;

    try {
      const center = { lat: Number(defaultLat), lng: Number(defaultLng) };
      const map = new window.google.maps.Map(mapRef.current, {
        center,
        zoom,
        disableDefaultUI: !interactive,
        zoomControl: interactive,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: interactive,
      });

      // Main pin
      new window.google.maps.Marker({
        position: center,
        map,
        title: markerTitle,
        animation: window.google.maps.Animation.DROP,
      });

      // Additional markers (e.g. technician + customer)
      if (Array.isArray(markers) && markers.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(center);

        markers.forEach((m) => {
          if (m.lat && m.lng) {
            const pos = { lat: Number(m.lat), lng: Number(m.lng) };
            new window.google.maps.Marker({
              position: pos,
              map,
              title: m.title || 'Marker',
            });
            bounds.extend(pos);
          }
        });

        if (markers.length > 0) {
          map.fitBounds(bounds, { padding: 40 });
        }
      }

      // Click to choose location
      if (onLocationSelect && interactive) {
        map.addListener('click', (e) => {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          onLocationSelect({ latitude: lat, longitude: lng });
        });
      }
    } catch (err) {
      console.warn('Google Maps initialization failed, using OpenStreetMap fallback', err);
      setLoadError(true);
    }
  }, [googleLoaded, defaultLat, defaultLng, zoom, markerTitle, markers, onLocationSelect, interactive]);

  // OpenStreetMap embed fallback
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${Number(defaultLng) - 0.01}%2C${Number(defaultLat) - 0.01}%2C${Number(defaultLng) + 0.01}%2C${Number(defaultLat) + 0.01}&layer=mapnik&marker=${defaultLat}%2C${defaultLng}`;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs">
      {!loadError && apiKey ? (
        <div ref={mapRef} style={{ width: '100%', height }} />
      ) : (
        <div style={{ width: '100%', height }} className="relative bg-slate-100">
          <iframe
            title="Interactive Map"
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            marginHeight="0"
            marginWidth="0"
            src={osmEmbedUrl}
            className="w-full h-full border-0"
          />
        </div>
      )}

      {/* Floating GPS coordinates badge */}
      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-xs flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 pointer-events-none">
        <MapPin className="w-3.5 h-3.5 text-fixteal-600" />
        <span>
          {Number(defaultLat).toFixed(4)}, {Number(defaultLng).toFixed(4)}
        </span>
      </div>

      {/* External Map Link */}
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${defaultLat},${defaultLng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-2 right-2 bg-white/90 hover:bg-white backdrop-blur-md px-2 py-1 rounded-lg border border-slate-200/80 shadow-xs flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-fixblue-900 transition-colors"
      >
        <span>Open Maps</span>
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}
