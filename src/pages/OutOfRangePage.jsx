import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import OutOfRangeScreen from "../components/customer/OutOfRangeScreen";

export default function OutOfRangePage() {
  const navigate = useNavigate();
  const [details, setDetails] = useState({});

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("outOfRangeDetails");
      if (raw) setDetails(JSON.parse(raw));
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
