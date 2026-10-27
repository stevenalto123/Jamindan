import React, { useState, useEffect } from 'react';
import { CloudRain, Wind, Droplets, Thermometer, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';

const JAMINDAN_LAT = 11.4090;
const JAMINDAN_LNG = 122.5008;

const getWeatherDescription = (code) => {
  if (code === 0) return { label: 'Clear Sky', icon: '☀️' };
  if ([1, 2, 3].includes(code)) return { label: 'Partly Cloudy', icon: '⛅' };
  if ([45, 48].includes(code)) return { label: 'Foggy / Overcast', icon: '🌫️' };
  if ([51, 53, 55, 56, 57].includes(code)) return { label: 'Light Drizzle', icon: '🌦️' };
  if ([61, 63, 80, 81].includes(code)) return { label: 'Moderate Rain', icon: '🌧️' };
  if ([65, 66, 67, 82].includes(code)) return { label: 'Heavy Rain', icon: '⛈️' };
  if ([95, 96, 99].includes(code)) return { label: 'Thunderstorm', icon: '🌩️' };
  return { label: 'Local Weather', icon: '🌤️' };
};

const getHazardAdvisory = (rainMm, windKmh, weatherCode) => {
  if (rainMm >= 7.5 || windKmh >= 50 || [65, 82, 95, 96, 99].includes(weatherCode)) {
    return {
      level: 'RED WARNING: SEVERE WEATHER / FLOOD RISK',
      desc: 'Heavy rainfall or strong gusts detected in Jamindan. Monitor Mambusao River levels and prepare for possible pre-emptive evacuation.',
      bg: '#fef2f2',
      border: '#fca5a5',
      text: '#991b1b',
      badgeBg: '#dc2626'
    };
  }
  if (rainMm >= 2.5 || windKmh >= 30 || [61, 63, 80, 81].includes(weatherCode)) {
    return {
      level: 'YELLOW ADVISORY: MODERATE RAIN / GUSTS',
      desc: 'Moderate rain observed across Jamindan barangays. Low-lying and landslide-prone areas should remain alert.',
      bg: '#fffbeb',
      border: '#fcd34d',
      text: '#92400e',
      badgeBg: '#d97706'
    };
  }
  return {
    level: 'NORMAL MONITORING: FAVORABLE CONDITIONS',
    desc: 'No severe rainfall or typhoon-force winds currently detected in Jamindan, Capiz.',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    text: '#065f46',
    badgeBg: '#059669'
  };
};

const JamindanWeatherWidget = ({ compact = false }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWeather = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${JAMINDAN_LAT}&longitude=${JAMINDAN_LNG}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m&timezone=Asia%2FManila`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.current) {
        setWeather({
          temp: Math.round(data.current.temperature_2m),
          humidity: Math.round(data.current.relative_humidity_2m),
          precipitation: Number(data.current.precipitation || data.current.rain || 0).toFixed(1),
          wind: Math.round(data.current.wind_speed_10m || 0),
          code: data.current.weather_code,
          updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
    } catch (err) {
      console.warn('Weather fetch fallback:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(() => fetchWeather(false), 300000); // every 5 mins
    return () => clearInterval(interval);
  }, []);

  if (loading && !weather) {
    return (
      <div style={{
        background: 'var(--card-bg, #fff)',
        borderRadius: '18px',
        padding: '16px 20px',
        marginBottom: '20px',
        border: '1px solid var(--border-color, #e2e8f0)',
        fontSize: '13px',
        color: 'var(--text-light, #64748b)'
      }}>
        Loading Jamindan Live Weather & Flood Hazard Monitor...
      </div>
    );
  }

  if (!weather) return null;

  const condition = getWeatherDescription(weather.code);
  const advisory = getHazardAdvisory(parseFloat(weather.precipitation), weather.wind, weather.code);

  return (
    <div style={{
      background: 'var(--card-bg, #fff)',
      borderRadius: '20px',
      padding: compact ? '16px' : '20px',
      marginBottom: '20px',
      border: '1px solid var(--border-color, #e2e8f0)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '28px', lineHeight: 1 }}>{condition.icon}</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: '800', fontSize: '15px', color: 'var(--text-main, #0f172a)' }}>
                Jamindan Live Weather & Hazard Monitor
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
            <div style={{ fontSize: '12px', color: 'var(--text-light, #64748b)', fontWeight: '600' }}>
              {condition.label} • Coordinates: 11.4090° N, 122.5008° E • Updated {weather.updatedAt}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchWeather(true)}
          disabled={refreshing}
          style={{
            background: 'var(--bg-color, #f8fafc)',
            border: '1px solid var(--border-color, #cbd5e1)',
            borderRadius: '10px',
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

      {/* Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '10px',
        marginBottom: '14px'
      }}>
        <div style={{ background: 'var(--bg-color, #f8fafc)', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Thermometer size={18} color="#ea580c" />
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-light, #64748b)', fontWeight: '700' }}>Temperature</div>
            <div style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-main, #0f172a)' }}>{weather.temp}°C</div>
          </div>
        </div>

        <div style={{ background: 'var(--bg-color, #f8fafc)', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CloudRain size={18} color="#2563eb" />
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-light, #64748b)', fontWeight: '700' }}>Rainfall (1h)</div>
            <div style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-main, #0f172a)' }}>{weather.precipitation} mm</div>
          </div>
        </div>

        <div style={{ background: 'var(--bg-color, #f8fafc)', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Wind size={18} color="#0d9488" />
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-light, #64748b)', fontWeight: '700' }}>Wind Speed</div>
            <div style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-main, #0f172a)' }}>{weather.wind} km/h</div>
          </div>
        </div>

        <div style={{ background: 'var(--bg-color, #f8fafc)', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Droplets size={18} color="#0284c7" />
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-light, #64748b)', fontWeight: '700' }}>Humidity</div>
            <div style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-main, #0f172a)' }}>{weather.humidity}%</div>
          </div>
        </div>
      </div>

      {/* Automatic MDRRMO Advisory Banner */}
      <div style={{
        backgroundColor: advisory.bg,
        border: `1px solid ${advisory.border}`,
        borderRadius: '12px',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px'
      }}>
        {advisory.badgeBg === '#059669' ? (
          <CheckCircle2 size={18} color={advisory.badgeBg} style={{ flexShrink: 0, marginTop: '2px' }} />
        ) : (
          <AlertTriangle size={18} color={advisory.badgeBg} style={{ flexShrink: 0, marginTop: '2px' }} />
        )}
        <div>
          <div style={{ fontSize: '12px', fontWeight: '800', color: advisory.text }}>
            {advisory.level}
          </div>
          <div style={{ fontSize: '12px', color: advisory.text, opacity: 0.9, marginTop: '2px', lineHeight: 1.4 }}>
            {advisory.desc}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JamindanWeatherWidget;
