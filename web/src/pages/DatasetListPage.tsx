import { Link } from 'react-router-dom'

const datasets = [
  { id: 'dataset-a', name: 'Campaign Batch A', progress: '35%' },
  { id: 'dataset-b', name: 'Campaign Batch B', progress: '68%' },
  { id: 'dataset-c', name: 'Campaign Batch C', progress: '12%' },
]

export function DatasetListPage() {
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
            <span role="cell">{dataset.progress}</span>
            <span role="cell">
              <Link to={`/datasets/${dataset.id}`} className="inline-link">
                Open labeling view
              </Link>
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
