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
];

export function DatasetListPage() {
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

      <div className="placeholder-table" role="table" aria-label="Dataset list">
        <div className="table-row table-head" role="row">
          <span role="columnheader">Dataset Name</span>
          <span role="columnheader">Progress</span>
          <span role="columnheader">Action</span>
        </div>
        {datasets.map((dataset) => (
          <div className="table-row" role="row" key={dataset.id}>
            <span role="cell">{dataset.name}</span>
            <span role="cell">
              {Math.round((dataset.labeledCount / dataset.totalSamples) * 100)}%
            </span>
            <span role="cell">
              <Link
                to={`/datasets/${dataset.id}`}
                className="inline-link"
                state={{ datasetInfo: dataset }}
              >
                Open labeling view
              </Link>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
