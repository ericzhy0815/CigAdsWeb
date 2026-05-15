import { Link, useLocation, useParams } from "react-router-dom";
import type { DatasetInfo } from "./DatasetListPage";

export function DatasetInfoPage() {
  const { datasetId } = useParams();
  const location = useLocation();
  const datasetInfo = (location.state as { datasetInfo?: DatasetInfo } | null)
    ?.datasetInfo;
  const onAddClick = () => {
    window.alert("Add action coming soon.");
  };

  const datasetName = datasetInfo?.name ?? datasetId ?? "Unknown dataset";
  const totalSamples = datasetInfo?.totalSamples ?? 0;
  const labeledCount = datasetInfo?.labeledCount ?? 0;
  const progress =
    totalSamples > 0 ? Math.round((labeledCount / totalSamples) * 100) : 0;

  return (
    <section className="page">
      <div>
        <Link to="/datasets" className="nav-button">
          Back
        </Link>
      </div>
      <div className="page-heading dataset-info-hero">
        <h2>{datasetName}</h2>
        <p>Dataset metadata and available actions</p>
      </div>

      <div className="cards-grid">
        <article className="placeholder-card">
          <p className="label">Dataset ID</p>
          <p className="value">{datasetInfo?.id ?? datasetId}</p>
        </article>
        <article className="placeholder-card">
          <p className="label">Total Samples</p>
          <p className="value">{totalSamples}</p>
        </article>
        <article className="placeholder-card">
          <p className="label">Progress</p>
          <p className="value">{progress}%</p>
        </article>
      </div>

      <article className="research-overview">
        <h3>Description</h3>
        <p>
          This dataset contains youth-targeted ad samples prepared for coding
          and model comparison. Use labeling mode to annotate examples and use
          view mode to inspect agreement analytics and disagreement cases.
        </p>
      </article>

      <div className="info-actions dataset-action-row">
        <Link
          to={`/datasets/${datasetId}/view`}
          className="dataset-action-button"
          state={location.state}
        >
          View
        </Link>
        <Link
          to={`/datasets/${datasetId}/label`}
          className="dataset-action-button"
          state={location.state}
        >
          Label
        </Link>
        <Link
          to={`/datasets/${datasetId}/review`}
          className="dataset-action-button"
          state={location.state}
        >
          Review
        </Link>
        <button
          type="button"
          className="dataset-action-button"
          onClick={onAddClick}
        >
          Add
        </button>
      </div>
    </section>
  );
}
