import { useEffect, useState } from "react";
import { subscribeToBarbers } from "@/lib/services/barberService";
import { BarberApplication, BarberStatus } from "@/lib/types/barber";

export const useBarbers = (status: BarberStatus | "all" = "pending") => {
  const [barbers, setBarbers] = useState<BarberApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const unsubscribe = subscribeToBarbers(
      status,
      (items) => {
        setBarbers(items);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [status]);

  return { barbers, loading, error };
};
