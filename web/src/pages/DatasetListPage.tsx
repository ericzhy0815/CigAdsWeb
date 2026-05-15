import { Link } from "react-router-dom";
import {
  getDatasetName,
  getMockLabeledCount,
  type DatasetId,
} from "../mock/mockUserLabels";

export type DatasetInfo = {
  id: DatasetId;
  name: string;
  totalSamples: number;
  labeledCount: number;
  nextUnlabeledIndex: number;
};

const datasetImageCount = {
  w1: Object.keys(
    import.meta.glob(
      "../assets/images/w1/*.{png,jpg,jpeg,gif,webp,PNG,JPG,JPEG,GIF,WEBP}",
    ),
  ).length,
  w2: Object.keys(
    import.meta.glob(
      "../assets/images/w2/*.{png,jpg,jpeg,gif,webp,PNG,JPG,JPEG,GIF,WEBP}",
    ),
  ).length,
  original: Object.keys(
    import.meta.glob(
      "../assets/images/original/*.{png,jpg,jpeg,gif,webp,PNG,JPG,JPEG,GIF,WEBP}",
    ),
  ).length,
};

const datasetBase: Omit<DatasetInfo, "nextUnlabeledIndex">[] = [
  {
    id: "w1",
    name: getDatasetName("w1"),
    totalSamples: datasetImageCount.w1,
    labeledCount: getMockLabeledCount("w1"),
  },
  {
    id: "w2",
    name: getDatasetName("w2"),
    totalSamples: datasetImageCount.w2,
    labeledCount: getMockLabeledCount("w2"),
  },
  {
    id: "original",
    name: getDatasetName("original"),
    totalSamples: datasetImageCount.original,
    labeledCount: getMockLabeledCount("original"),
  },
];

export function DatasetListPage() {
  const onAddDatasetClick = () => {
    window.alert("Add dataset action coming soon.");
  };

  const datasets: DatasetInfo[] = datasetBase.map((dataset) => ({
    ...dataset,
    nextUnlabeledIndex:
      dataset.labeledCount < dataset.totalSamples
        ? dataset.labeledCount
        : Math.max(dataset.totalSamples - 1, 0),
  }));

  return (
    <section className="page">
      <div className="page-heading">
        <h2>Dataset List</h2>
        <p>Browse datasets and monitor progress before assigning labels.</p>
      </div>

      <div className="info-actions dataset-action-row">
        <button
          type="button"
          className="dataset-action-button"
          onClick={onAddDatasetClick}
        >
          Add Dataset
        </button>
      </div>

      <div className="placeholder-table" role="table" aria-label="Dataset list">
        <div className="table-row table-head" role="row">
          <span role="columnheader">Dataset Name</span>
          <span role="columnheader">Progress</span>
        </div>
        {datasets.map((dataset) => (
          <Link
            to={`/datasets/${dataset.id}`}
            className="table-row table-row-link"
            role="row"
            key={dataset.id}
            state={{ datasetInfo: dataset }}
          >
            <span role="cell">{dataset.name}</span>
            <span role="cell">
              {Math.round((dataset.labeledCount / dataset.totalSamples) * 100)}%
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
