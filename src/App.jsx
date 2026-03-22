import CustomProvider from './CustomProvider';
import RouteProvider from './Router/RouteProvider';

function App() {
  return (
    <CustomProvider>
      <RouteProvider />
    </CustomProvider>
  );
}

export default App;
