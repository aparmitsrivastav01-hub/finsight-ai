import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import FinGPT from "./pages/FinGPT";

function App() {
  return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/fingpt" element={<FinGPT />} />
      </Routes>
  );
}

export default App;