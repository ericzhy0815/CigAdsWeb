import { Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { DatasetInfoPage } from "./pages/DatasetInfoPage";
import { DatasetLabelingPage } from "./pages/DatasetLabelingPage";
import { DatasetListPage } from "./pages/DatasetListPage";
import { DatasetViewPage } from "./pages/DatasetViewPage";
import { InfoPage } from "./pages/InfoPage";
import { ReviewPage } from "./pages/ReviewPage";
import "./App.css";

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<InfoPage />} />
        <Route path="/info" element={<InfoPage />} />
        <Route path="/datasets" element={<DatasetListPage />} />
        <Route path="/datasets/:datasetId" element={<DatasetInfoPage />} />
        <Route path="/datasets/:datasetId/view" element={<DatasetViewPage />} />
        <Route path="/datasets/:datasetId/label" element={<DatasetLabelingPage />} />
        <Route path="/datasets/:datasetId/review" element={<ReviewPage />} />
      </Route>
    </Routes>
  );
}

export default App;
