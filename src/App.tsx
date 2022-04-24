import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import FiducialsSelectionScreen from "./screens/FiducialsSelectionScreen";
import SecondScreenTestWrapper from "./screens/SecondScreenTestWrapper";
import ThirdScreenTestWrapper from "./screens/ThirdScreenTestWrapper";

function App() {
    return (
        <>
            <Routes>
                <Route path="/" element={<Navigate to="/screen-1" replace />} />
                <Route path="/screen-1" element={<FiducialsSelectionScreen />} />
                <Route path="/screen-2" element={<SecondScreenTestWrapper />} />
                <Route path="/screen-3" element={<ThirdScreenTestWrapper />} />
            </Routes>
        </>
    );
}

export default App;
