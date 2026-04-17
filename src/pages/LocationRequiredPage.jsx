import { useNavigate } from "react-router-dom";
import LocationRequiredScreen from "../components/customer/LocationRequiredScreen";
import { locationStore } from "../store/locationStore";

export default function LocationRequiredPage() {
  const navigate = useNavigate();
  return (
    <LocationRequiredScreen
      onRetry={async () => {
        try {
          await locationStore.getState().ensureFresh(0);
          try { sessionStorage.removeItem("locationRequiredAt"); } catch { /* ignore */ }
          navigate(-1);
        } catch {
          /* keep on screen — user must fix OS-level permission */
        }
      }}
    />
  );
}
