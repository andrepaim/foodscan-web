import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Scanner } from "./pages/Scanner";
import { Review } from "./pages/Review";
import { Confirm } from "./pages/Confirm";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Scanner />} />
        <Route path="/review" element={<Review />} />
        <Route path="/confirm" element={<Confirm />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
