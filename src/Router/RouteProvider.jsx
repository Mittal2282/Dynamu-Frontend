import { BrowserRouter } from "react-router-dom";
import Routes from "./Routes";

export default function RouteProvider() {
  return (
    <BrowserRouter>
      <Routes />
    </BrowserRouter>
  );
}
