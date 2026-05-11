import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import OutOfRangeScreen from "../components/customer/OutOfRangeScreen";

interface OutOfRangeDetails {
  distance_m?: number;
  radius_m?: number;
  restaurant_name?: string;
}

export default function OutOfRangePage() {
  const navigate = useNavigate();
  const [details, setDetails] = useState<OutOfRangeDetails>({});

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("outOfRangeDetails");
      if (raw) setDetails(JSON.parse(raw) as OutOfRangeDetails);
    } catch { /* ignore */ }
  }, []);

  return (
    <OutOfRangeScreen
      distance_m={details.distance_m}
      radius_m={details.radius_m}
      restaurantName={details.restaurant_name}
      onRetry={() => {
        try { sessionStorage.removeItem("outOfRangeDetails"); } catch { /* ignore */ }
        navigate("/", { replace: true });
      }}
    />
  );
}
