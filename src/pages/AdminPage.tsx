import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminPage() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to settings - admin is now managed there
    navigate('/settings', { replace: true });
  }, [navigate]);

  return null;
}
