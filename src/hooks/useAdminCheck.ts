import { useEffect, useState } from "react";
import { adminService } from "@/lib/services/adminService";
import { useAuth } from "./useAuth";

export const useAdminCheck = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(!!user);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const admin = await adminService.checkAdminStatus(user.uid);
        if (active) setIsAdmin(admin);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Admin check failed");
          setIsAdmin(false);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [user]);

  return { isAdmin, loading, error };
};
