import React, { useState, useEffect } from 'react';
import {
  CloudRain, Wind, Droplets, Thermometer, RefreshCw,
  AlertTriangle, CheckCircle2, MapPin, ChevronDown, ChevronUp
} from 'lucide-react';

// All 30 Official Barangays of Jamindan, Capiz with Geographic Coordinates & Hazard Profiles
const JAMINDAN_BARANGAYS = [
  { name: 'Poblacion', lat: 11.4090, lng: 122.5008, zone: 'Town Center / River Basin', hazard: 'Flood-Prone' },
  { name: 'Agambulong', lat: 11.4165, lng: 122.4950, zone: 'Northern Floodplain', hazard: 'Flood-Prone' },
  { name: 'Agbun-od', lat: 11.3840, lng: 122.4780, zone: 'Central Jamindan', hazard: 'Moderate Flood' },
  { name: 'Agcagay', lat: 11.3690, lng: 122.4890, zone: 'Southern Valley', hazard: 'Landslide / Flash Flood' },
  { name: 'Aglibacao', lat: 11.3420, lng: 122.4650, zone: 'Southern Upland', hazard: 'Landslide-Prone' },
  { name: 'Agloloway', lat: 11.3750, lng: 122.5120, zone: 'Eastern Rolling Hills', hazard: 'Moderate Risk' },
  { name: 'Bayebaye', lat: 11.3980, lng: 122.5140, zone: 'East Poblacion', hazard: 'Flood-Prone' },
  { name: 'Caridad', lat: 11.3610, lng: 122.5040, zone: 'South-Central', hazard: 'Landslide-Prone' },
  { name: 'Esperanza', lat: 11.3890, lng: 122.5230, zone: 'Eastern Sector', hazard: 'Flood-Prone' },
  { name: 'Fe', lat: 11.4020, lng: 122.4820, zone: 'West Poblacion', hazard: 'Moderate Flood' },
  { name: 'Ganzon', lat: 11.3310, lng: 122.4810, zone: 'Southern Upland', hazard: 'Landslide-Prone' },
  { name: 'Guibuangan', lat: 11.4190, lng: 122.5090, zone: 'Riverbank Basin', hazard: 'Flood-Prone' },
  { name: 'Guintas', lat: 11.4250, lng: 122.4880, zone: 'Northern Basin', hazard: 'Flood-Prone' },
  { name: 'Igang', lat: 11.3540, lng: 122.4720, zone: 'Southwestern Hills', hazard: 'Landslide-Prone' },
  { name: 'Jaena Norte', lat: 11.3480, lng: 122.4950, zone: 'Camp Peralta / Upland', hazard: 'Landslide / Flash Flood' },
  { name: 'Jaena Sur', lat: 11.3280, lng: 122.4980, zone: 'Southern Mountain', hazard: 'Landslide-Prone' },
  { name: 'Jagnaya', lat: 11.3650, lng: 122.5210, zone: 'Southeastern Crossing', hazard: 'Flash Flood' },
  { name: 'Lapaz', lat: 11.3920, lng: 122.4910, zone: 'Central Lowland', hazard: 'Flood-Prone' },
  { name: 'Linambasan', lat: 11.4120, lng: 122.4730, zone: 'Northwestern Basin', hazard: 'Flood-Prone' },
  { name: 'Lucero', lat: 11.4290, lng: 122.5030, zone: 'Northern Riverbank', hazard: 'Flood-Prone' },
  { name: 'Maantol', lat: 11.3180, lng: 122.4750, zone: 'Deep Southern Upland', hazard: 'Landslide-Prone' },
  { name: 'Masgrau', lat: 11.3790, lng: 122.4630, zone: 'Western Sector', hazard: 'Moderate Risk' },
  { name: 'Milan', lat: 11.4050, lng: 122.5280, zone: 'Eastern Highway', hazard: 'Flood-Prone' },
  { name: 'Molet', lat: 11.3580, lng: 122.5150, zone: 'Southeastern Hills', hazard: 'Landslide-Prone' },
  { name: 'Pangabat', lat: 11.3410, lng: 122.5110, zone: 'Southern Foothills', hazard: 'Landslide-Prone' },
  { name: 'Pangabuan', lat: 11.3860, lng: 122.5020, zone: 'Central River Tributary', hazard: 'Flash Flood' },
  { name: 'Pasol-o', lat: 11.3240, lng: 122.5090, zone: 'Southern Highland', hazard: 'Landslide-Prone' },
  { name: 'San Jose', lat: 11.4150, lng: 122.5180, zone: 'Northeastern Lowland', hazard: 'Flood-Prone' },
  { name: 'San Juan', lat: 11.3960, lng: 122.4690, zone: 'Western Lowland', hazard: 'Moderate Flood' },
  { name: 'San Vicente', lat: 11.4010, lng: 122.5060, zone: 'Near Poblacion', hazard: 'Flood-Prone' },
  { name: 'Santo Rosario', lat: 11.3720, lng: 122.4810, zone: 'South-Central Valley', hazard: 'Moderate Risk' }
];

const isRainingCode = (code, rainMm) => {
  return rainMm > 0 || [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code);
};

const getWeatherDescription = (code) => {
  if (code === 0) return { label: 'Clear Sky', icon: '☀️' };
  if ([1, 2, 3].includes(code)) return { label: 'Partly Cloudy', icon: '⛅' };
  if ([45, 48].includes(code)) return { label: 'Foggy / Overcast', icon: '🌫️' };
  if ([51, 53, 55, 56, 57].includes(code)) return { label: 'Light Drizzle', icon: '🌦️' };
  if ([61, 63, 80, 81].includes(code)) return { label: 'Moderate Rain', icon: '🌧️' };
  if ([65, 66, 67, 82].includes(code)) return { label: 'Heavy Rain', icon: '⛈️' };
  if ([95, 96, 99].includes(code)) return { label: 'Thunderstorm', icon: '🌩️' };
  return { label: 'Partly Cloudy', icon: '🌤️' };
};

const getHazardAdvisory = (rainMm, windKmh, weatherCode, rainingBrgys = [], selectedBrgyName = 'Poblacion') => {
  const rainingNames = rainingBrgys.map(b => b.name);
  const brgySummary = rainingNames.length > 0
    ? (rainingNames.length === JAMINDAN_BARANGAYS.length
        ? `All ${rainingNames.length} barangays in Jamindan`
        : `${rainingNames.slice(0, 6).join(', ')}${rainingNames.length > 6 ? ` + ${rainingNames.length - 6} more barangays` : ''}`)
    : `Brgy. ${selectedBrgyName}`;

  if (rainMm >= 7.5 || windKmh >= 50 || [65, 82, 95, 96, 99].includes(weatherCode)) {
    return {
      level: 'RED WARNING: SEVERE WEATHER / FLOOD & LANDSLIDE RISK',
      desc: `Active thunderstorm or heavy rain detected in ${brgySummary}. Monitor flood-prone river basins (Poblacion, Agambulong, Lucero, Guibuangan) and upland landslide zones (Jaena Norte, Aglibacao, Ganzon).`,
      bg: 'rgba(239, 68, 68, 0.08)',
      border: 'rgba(239, 68, 68, 0.3)',
      text: '#dc2626',
      badgeBg: '#dc2626'
    };
  }
  if (rainMm >= 0.1 || windKmh >= 30 || [51, 53, 55, 61, 63, 80, 81].includes(weatherCode)) {
    return {
      level: 'YELLOW ADVISORY: RAIN SHOWERS DETECTED',
      desc: `Rainfall currently observed in ${brgySummary}. Low-lying floodplains and upland barangays should remain on standby.`,
      bg: 'rgba(245, 158, 11, 0.08)',
      border: 'rgba(245, 158, 11, 0.3)',
      text: '#d97706',
      badgeBg: '#d97706'
    };
  }
  return {
    level: 'NORMAL MONITORING: NO ACTIVE RAIN ACROSS BARANGAYS',
    desc: 'Clear to partly cloudy skies across Jamindan barangays. No severe rainfall or typhoon-force winds currently detected.',
    bg: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.3)',
    text: '#059669',
    badgeBg: '#059669'
  };
};

const JamindanWeatherWidget = ({ compact = false }) => {
  const [brgyWeatherList, setBrgyWeatherList] = useState([]);
  const [selectedBrgy, setSelectedBrgy] = useState('Poblacion');
  const [showAllBrgys, setShowAllBrgys] = useState(false);
  const [updatedAt, setUpdatedAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWeather = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const lats = JAMINDAN_BARANGAYS.map(b => b.lat).join(',');
      const lngs = JAMINDAN_BARANGAYS.map(b => b.lng).join(',');
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m&timezone=Asia%2FManila`;
      const res = await fetch(url);
      const data = await res.json();

      const resultsArray = Array.isArray(data) ? data : [data];
      const mapped = JAMINDAN_BARANGAYS.map((brgy, idx) => {
        const item = resultsArray[idx] || resultsArray[0] || {};
        const cur = item.current || {};
        const precip = Number(cur.precipitation ?? cur.rain ?? 0);
        const code = cur.weather_code ?? 0;
        return {
          ...brgy,
          temp: Math.round(cur.temperature_2m ?? 28),
          humidity: Math.round(cur.relative_humidity_2m ?? 80),
          precipitation: precip.toFixed(1),
          rainVal: precip,
          wind: Math.round(cur.wind_speed_10m ?? 5),
          code,
          isRaining: isRainingCode(code, precip)
        };
      });

      setBrgyWeatherList(mapped);
      setUpdatedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.warn('Weather fetch fallback:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(() => fetchWeather(false), 300000);
    return () => clearInterval(interval);
  }, []);

  if (loading && brgyWeatherList.length === 0) {
    return (
      <div style={{
        background: 'var(--card-bg, #fff)',
        borderRadius: '14px',
        padding: '16px 20px',
        marginBottom: '20px',
        border: '1px solid var(--border-color, #e2e8f0)',
        fontSize: '13px',
        color: 'var(--text-light, #64748b)'
      }}>
        Loading Jamindan Barangay Weather & Flood Telemetry...
      </div>
    );
  }

  if (brgyWeatherList.length === 0) return null;

  const activeData = brgyWeatherList.find(b => b.name === selectedBrgy) || brgyWeatherList[0];
  const rainingBrgys = brgyWeatherList.filter(b => b.isRaining);
  const condition = getWeatherDescription(activeData.code);
  const advisory = getHazardAdvisory(activeData.rainVal, activeData.wind, activeData.code, rainingBrgys, activeData.name);

  return (
    <div style={{
      background: 'var(--card-bg, #fff)',
      borderRadius: '14px',
      padding: compact ? '16px' : '18px 20px',
      marginBottom: '20px',
      border: '1px solid var(--border-color, #e2e8f0)'
    }}>
      {/* ─── Header Row with Barangay Selector & Refresh ───────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '26px', lineHeight: 1 }}>{condition.icon}</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: '800', fontSize: '15px', color: 'var(--text-main, #0f172a)' }}>
                Jamindan Live Weather & Barangay Rain Monitor
              </span>
              <span style={{
                fontSize: '10px',
                fontWeight: '800',
                padding: '2px 8px',
                borderRadius: '999px',
                backgroundColor: advisory.badgeBg,
                color: '#fff',
                letterSpacing: '0.4px'
              }}>
                LIVE TELEMETRY
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-light, #64748b)', fontWeight: '600', marginTop: '2px' }}>
              Brgy. <strong>{activeData.name}</strong> ({activeData.zone}) • {condition.label} • {activeData.lat.toFixed(4)}° N, {activeData.lng.toFixed(4)}° E • Updated {updatedAt}
            </div>
          </div>
        </div>

        {/* Barangay Dropdown + Refresh Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--card-alt, #f8fafc)', border: '1px solid var(--border-color, #cbd5e1)', borderRadius: '8px', padding: '4px 10px' }}>
            <MapPin size={13} color="var(--primary-color)" />
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>Barangay:</span>
            <select
              value={selectedBrgy}
              onChange={(e) => setSelectedBrgy(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '12px',
                fontWeight: '700',
                color: 'var(--text-main)',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {brgyWeatherList.map(b => (
                <option key={b.name} value={b.name} style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-main)' }}>
                  Brgy. {b.name} {b.isRaining ? `🌧️ (${b.precipitation}mm)` : '☀️'}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => fetchWeather(true)}
            disabled={refreshing}
            style={{
              background: 'var(--card-alt, #f8fafc)',
              border: '1px solid var(--border-color, #cbd5e1)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '700',
              color: 'var(--text-main, #334155)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={13} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
            {refreshing ? 'Updating...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ─── Metrics Row for Selected Barangay ─────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '10px',
        marginBottom: '12px'
      }}>
        <div style={{ background: 'var(--card-alt, #f8fafc)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-color, #e2e8f0)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Thermometer size={18} color="#ea580c" />
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-light, #64748b)', fontWeight: '600' }}>Temperature</div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main, #0f172a)' }}>{activeData.temp}°C</div>
          </div>
        </div>

        <div style={{ background: 'var(--card-alt, #f8fafc)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-color, #e2e8f0)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CloudRain size={18} color="#2563eb" />
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-light, #64748b)', fontWeight: '600' }}>Rainfall (1h)</div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main, #0f172a)' }}>{activeData.precipitation} mm</div>
          </div>
        </div>

        <div style={{ background: 'var(--card-alt, #f8fafc)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-color, #e2e8f0)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Wind size={18} color="#0d9488" />
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-light, #64748b)', fontWeight: '600' }}>Wind Speed</div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main, #0f172a)' }}>{activeData.wind} km/h</div>
          </div>
        </div>

        <div style={{ background: 'var(--card-alt, #f8fafc)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-color, #e2e8f0)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Droplets size={18} color="#0284c7" />
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-light, #64748b)', fontWeight: '600' }}>Humidity</div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main, #0f172a)' }}>{activeData.humidity}%</div>
          </div>
        </div>
      </div>

      {/* ─── Barangay Rain Status Strip ────────────────────────────── */}
      <div style={{
        backgroundColor: 'var(--card-alt, #f8fafc)',
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: '10px',
        padding: '10px 14px',
        marginBottom: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <CloudRain size={14} color={rainingBrgys.length > 0 ? '#2563eb' : '#10b981'} />
              Barangays Currently Raining:
            </span>
            {rainingBrgys.length === 0 ? (
              <span style={{ fontSize: '12px', color: '#059669', fontWeight: '700' }}>
                None (0 of {brgyWeatherList.length} barangays have active rain)
              </span>
            ) : (
              <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: '700' }}>
                {rainingBrgys.length} of {brgyWeatherList.length} Barangays Affected
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowAllBrgys(!showAllBrgys)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '11px',
              fontWeight: '700',
              color: 'var(--primary-color)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: 0
            }}
          >
            {showAllBrgys ? <>Hide Barangay Map Grid <ChevronUp size={13} /></> : <>View All {brgyWeatherList.length} Barangays <ChevronDown size={13} /></>}
          </button>
        </div>

        {/* Active Raining Barangay Pills (Always visible when it's raining in any barangay) */}
        {rainingBrgys.length > 0 && !showAllBrgys && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
            {rainingBrgys.map(b => {
              const cond = getWeatherDescription(b.code);
              const isSelected = b.name === selectedBrgy;
              return (
                <button
                  key={b.name}
                  type="button"
                  onClick={() => setSelectedBrgy(b.name)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    border: isSelected ? '1px solid #2563eb' : '1px solid var(--border-color)',
                    backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.12)' : 'var(--card-bg)',
                    color: 'var(--text-main)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <span>{cond.icon}</span>
                  <span>{b.name}</span>
                  <span style={{ color: '#2563eb', fontWeight: '800' }}>{b.precipitation}mm</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Full 30+ Barangay Grid when expanded */}
        {showAllBrgys && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
            gap: '6px',
            marginTop: '10px',
            maxHeight: '210px',
            overflowY: 'auto',
            paddingRight: '2px'
          }}>
            {brgyWeatherList.map(b => {
              const cond = getWeatherDescription(b.code);
              const isSelected = b.name === selectedBrgy;
              return (
                <button
                  key={b.name}
                  type="button"
                  onClick={() => setSelectedBrgy(b.name)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: isSelected ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
                    backgroundColor: isSelected ? 'var(--card-bg)' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '6px'
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cond.icon} {b.name}
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {b.hazard}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: b.isRaining ? '#2563eb' : 'var(--text-light)' }}>
                      {b.precipitation}mm
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                      {b.temp}°C
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Automatic MDRRMO Advisory Banner ──────────────────────── */}
      <div style={{
        backgroundColor: advisory.bg,
        border: `1px solid ${advisory.border}`,
        borderRadius: '10px',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px'
      }}>
        {advisory.badgeBg === '#059669' ? (
          <CheckCircle2 size={17} color={advisory.badgeBg} style={{ flexShrink: 0, marginTop: '2px' }} />
        ) : (
          <AlertTriangle size={17} color={advisory.badgeBg} style={{ flexShrink: 0, marginTop: '2px' }} />
        )}
        <div>
          <div style={{ fontSize: '12px', fontWeight: '800', color: advisory.text }}>
            {advisory.level}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-main)', opacity: 0.9, marginTop: '2px', lineHeight: 1.45 }}>
            {advisory.desc}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JamindanWeatherWidget;
