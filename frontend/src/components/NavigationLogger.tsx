import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';
import { registrarNavegacao } from '../services/auditoriaService'; // This service needs to be created

const NavigationLogger = () => {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      registrarNavegacao(user.id, location.pathname, location.search);
    }
  }, [location, user]);

  return null;
};

export default NavigationLogger;
