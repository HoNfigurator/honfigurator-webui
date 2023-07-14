// hooks/useFetchUserRoles.js
import { useState, useEffect } from 'react';
import { createAxiosInstanceServer } from '../Security/axiosRequestFormat'; // Import your axios instance

export const useFetchUserRoles = (shouldFetch, server, port) => {
  const [rolesAndPerms, setRolesAndPerms] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRolesAndPerms = async () => {
      setLoading(true);
      try {
        const axiosInstanceServer = createAxiosInstanceServer(server, port);
        const response = await axiosInstanceServer.get('/user');
        const roles = response.data.roles;
        const perms = response.data.perms;
        setRolesAndPerms({ roles, perms });
      } catch (error) {
        console.error("Error fetching role permissions:", error);
        const roles = ["Not available"];
        const perms = ["Not available"];
        setRolesAndPerms({ roles, perms });
      } finally {
        setLoading(false);
      }
    };

    if (shouldFetch) {
      fetchRolesAndPerms();
    }
  }, [shouldFetch, server, port]);

  return { rolesAndPerms, loading };
};