const fs = require('fs');
let data = fs.readFileSync('frontend/src/pages/ReportIncident.jsx', 'utf8');

const targetEffect =   useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);;

const newEffect =   useEffect(() => {
    const handleOnline = async () => {
      setIsOffline(false);
      const savedPayload = localStorage.getItem('offline_incident_payload');
      if (savedPayload) {
        try {
          const payload = JSON.parse(savedPayload);
          const res = await axios.post('/api/incidents', payload);
          localStorage.removeItem('offline_incident_payload');
          alert('Your offline report has been successfully auto-submitted! (Code: ' + res.data.code + ')');
          window.location.href = '/incidents/' + res.data.incidentId;
        } catch (err) {
          console.error('Failed to sync offline report', err);
        }
      }
    };
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);;

data = data.replace(targetEffect, newEffect);

const targetCatch =       } catch (err) {
        if (!navigator.onLine || err.message === 'Network Error') {
          // Handled by Workbox Background Sync
          setSuccess('offline');
          setLoading(false);
        } else {;

const newCatch =       } catch (err) {
        if (!navigator.onLine || err.message === 'Network Error') {
          if (!isMultipart) localStorage.setItem('offline_incident_payload', JSON.stringify(payload));
          setSuccess('offline');
          setLoading(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {;

data = data.replace(targetCatch, newCatch);

fs.writeFileSync('frontend/src/pages/ReportIncident.jsx', data);
