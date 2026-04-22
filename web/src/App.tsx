import { Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { DatasetLabelingPage } from "./pages/DatasetLabelingPage";
import { DatasetListPage } from "./pages/DatasetListPage";
import { InfoPage } from "./pages/InfoPage";
import "./App.css";

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<InfoPage />} />
        <Route path="/info" element={<InfoPage />} />
        <Route path="/datasets" element={<DatasetListPage />} />
        <Route path="/datasets/:datasetId" element={<DatasetLabelingPage />} />
      </Route>
    </Routes>
  );
}

export default App;
