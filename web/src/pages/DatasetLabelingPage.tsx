import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'

const labelOptions = [
  'Contains tobacco logo',
  'Contains warning label',
  'Person present in image',
  'Outdoor scene',
  'Requires manual review',
]

export function DatasetLabelingPage() {
  const { datasetId } = useParams()

  const readableDatasetName = useMemo(() => {
    if (!datasetId) {
      return 'Unknown dataset'
    }

    return datasetId.replaceAll('-', ' ')
  }, [datasetId])

  return (
    <section className="page">
      <div className="page-heading">
        <h2>Label Dataset</h2>
        <p>
          Dataset: <strong>{readableDatasetName}</strong>
        </p>
      </div>

      <div className="labeling-layout">
        <aside className="panel">
          <h3>Label Options</h3>
          <p>Select one or more tags for the current item.</p>
          <ul className="option-list">
            {labelOptions.map((option) => (
              <li key={option}>
                <label>
                  <input type="checkbox" />
                  <span>{option}</span>
                </label>
              </li>
            ))}
          </ul>
        </aside>

        <section className="panel">
          <h3>Image + Description</h3>
          <div className="image-placeholder">
            <p>Image placeholder</p>
          </div>
          <div className="meta-placeholder">
            <p>Optional description:</p>
            <p>
              This area can include OCR text, model suggestions, source metadata,
              or quality notes for the image being labeled.
            </p>
          </div>
        </section>
      </div>

      <p className="back-link">
        <Link to="/datasets" className="inline-link">
          Back to dataset list
        </Link>
      </p>
    </section>
  )
}
