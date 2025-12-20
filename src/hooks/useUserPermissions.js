import { useState, useEffect } from 'react';
import sharePointService from '../services/sharePointService';

const useUserPermissions = () => {
  const [permissions, setPermissions] = useState(null); // Start with null to force loading
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('🔄 Fetching fresh user permissions...');
        const userPermissions = await sharePointService.getUserPermissions();
        console.log('✅ Permissions loaded:', userPermissions);
        setPermissions(userPermissions);
      } catch (err) {
        console.error('❌ Failed to load permissions:', err);
        setError(err);
        // Set fallback permissions on error
        setPermissions({
          isManagement: false,
          isExecutive: false,
          department: null,
          canViewAll: false,
          canEdit: false,
          canEditDepartments: [],
          userCategory: 'limited',
          allowedDepartments: ['infra']
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []); // Empty dependency array - only run once on mount

  return { permissions, loading, error };
};

export default useUserPermissions;
