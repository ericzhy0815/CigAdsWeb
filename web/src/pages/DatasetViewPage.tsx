import { useEffect, useMemo, useState } from "react";
import {
  Link,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import type { DatasetInfo } from "./DatasetListPage";
import { type DatasetId } from "../mock/mockUserLabels";
import w1ClipPredictions from "../assets/predictions/w1/clip.json";
import w1GeminiPredictions from "../assets/predictions/w1/gemini.json";
import w1GroundTruthCsv from "../assets/predictions/w1/ground_truth.csv?raw";
import w1ResnetPredictions from "../assets/predictions/w1/resnet.json";
import w2ClipPredictions from "../assets/predictions/w2/clip.json";
import w2GeminiPredictions from "../assets/predictions/w2/gemini.json";
import w2GroundTruthCsv from "../assets/predictions/w2/ground_truth.csv?raw";
import w2ResnetPredictions from "../assets/predictions/w2/resnet.json";
import originalClipPredictions from "../assets/predictions/original/clip.json";
import originalGeminiPredictions from "../assets/predictions/original/gemini.json";
import originalGroundTruthCsv from "../assets/predictions/original/ground_truth.csv?raw";
import originalResnetPredictions from "../assets/predictions/original/resnet.json";

type PredictionRow = {
  ad_id: string;
  model: string;
  status: string;
  [key: string]: string | number;
};

type ModelRecord = Record<string, PredictionRow>;

type FilterMode = "all" | "disagreeing" | "total_disagreement" | "agreement";

type SampleStatus = {
  index: number;
  isDisagreeing: boolean;
  isTotalDisagreement: boolean;
  isAgreement: boolean;
};

const EMPTY_LABEL_SET = new Set<string>();

const datasetImageModules: Record<
  string,
  Record<string, () => Promise<string>>
> = {
  w1: import.meta.glob(
    "../assets/images/w1/*.{png,jpg,jpeg,gif,webp,PNG,JPG,JPEG,GIF,WEBP}",
    {
      import: "default",
    },
  ) as Record<string, () => Promise<string>>,
  w2: import.meta.glob(
    "../assets/images/w2/*.{png,jpg,jpeg,gif,webp,PNG,JPG,JPEG,GIF,WEBP}",
    {
      import: "default",
    },
  ) as Record<string, () => Promise<string>>,
  original: import.meta.glob(
    "../assets/images/original/*.{png,jpg,jpeg,gif,webp,PNG,JPG,JPEG,GIF,WEBP}",
    {
      import: "default",
    },
  ) as Record<string, () => Promise<string>>,
};

const MODEL_PREDICTIONS: Record<DatasetId, Record<string, ModelRecord>> = {
  w1: {
    clip: w1ClipPredictions as ModelRecord,
    resnet: w1ResnetPredictions as ModelRecord,
    gemini: w1GeminiPredictions as ModelRecord,
  },
  w2: {
    clip: w2ClipPredictions as ModelRecord,
    resnet: w2ResnetPredictions as ModelRecord,
    gemini: w2GeminiPredictions as ModelRecord,
  },
  original: {
    clip: originalClipPredictions as ModelRecord,
    resnet: originalResnetPredictions as ModelRecord,
    gemini: originalGeminiPredictions as ModelRecord,
  },
};

const GROUND_TRUTH_CSV_BY_DATASET: Record<DatasetId, string> = {
  w1: w1GroundTruthCsv,
  w2: w2GroundTruthCsv,
  original: originalGroundTruthCsv,
};

const MODEL_DISPLAY: Record<string, string> = {
  clip: "CLIP",
  resnet: "ResNet",
  gemini: "VLM (Gemini)",
};

const LABEL_KEYS = [
  "youth_cartoon",
  "youth_theme_indep",
  "youth_theme_rebel",
  "youth_theme_arts",
  "youth_theme_social",
  "youth_theme_sophis",
  "youth_theme_sex",
  "youth_theme_athl",
  "youth_acad_contest",
  "youth_influencers",
  "youth_vapetricks",
  "youth_covert",
  "youth_humor",
  "youth_memes",
  "youth_emojis",
  "youth_restrict",
] as const;

const LABEL_DISPLAY: Record<string, string> = {
  youth_cartoon: "Cartoon",
  youth_theme_indep: "Theme: Independence",
  youth_theme_rebel: "Theme: Rebellion",
  youth_theme_arts: "Theme: Arts",
  youth_theme_social: "Theme: Social",
  youth_theme_sophis: "Theme: Sophistication",
  youth_theme_sex: "Theme: Sex",
  youth_theme_athl: "Theme: Athletics",
  youth_acad_contest: "Theme: Contest",
  youth_influencers: "Influencers",
  youth_vapetricks: "Vapetricks",
  youth_covert: "Covert",
  youth_humor: "Humor",
  youth_memes: "Memes",
  youth_emojis: "Emojis",
  youth_restrict: "Restrictions",
};

function normalizeId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseGroundTruthCsv(csvContent: string): Record<string, Set<string>> {
  const lines = csvContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return {};
  }

  const headers = lines[0].split(",");
  const adIdIndex = headers.indexOf("ad_id");
  const labelIndexes = LABEL_KEYS.map((key) => headers.indexOf(key));

  if (adIdIndex < 0) {
    return {};
  }

  const output: Record<string, Set<string>> = {};

  for (const line of lines.slice(1)) {
    const cells = line.split(",");
    const adId = cells[adIdIndex] ?? "";
    if (!adId) {
      continue;
    }

    const normalizedAdId = normalizeId(adId);
    const positives = new Set<string>();

    LABEL_KEYS.forEach((labelKey, index) => {
      const cellIndex = labelIndexes[index];
      if (cellIndex < 0) {
        return;
      }
      const value = cells[cellIndex]?.trim();
      if (value === "1" || value === "1.0") {
        positives.add(labelKey);
      }
    });

    output[normalizedAdId] = positives;
  }

  return output;
}

export function DatasetViewPage() {
  const { datasetId } = useParams();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const datasetInfo = (location.state as { datasetInfo?: DatasetInfo } | null)
    ?.datasetInfo;

  const imageEntries = useMemo(() => {
    if (!datasetId || !datasetImageModules[datasetId]) {
      return [];
    }

    return Object.entries(datasetImageModules[datasetId]).sort(([a], [b]) =>
      a.localeCompare(b),
    );
  }, [datasetId]);

  const modelPredictions = datasetId
    ? MODEL_PREDICTIONS[datasetId as DatasetId]
    : undefined;
  const modelNames = useMemo(
    () => Object.keys(modelPredictions ?? {}),
    [modelPredictions],
  );
  const [hiddenModelNames, setHiddenModelNames] = useState<string[]>([]);
  const groundTruthRows = useMemo(() => {
    if (!datasetId) {
      return {};
    }
    return parseGroundTruthCsv(
      GROUND_TRUTH_CSV_BY_DATASET[datasetId as DatasetId] ?? "",
    );
  }, [datasetId]);
  const modelLabelRowsById = useMemo(() => {
    const output: Record<string, Record<string, Set<string>>> = {};

    for (const modelName of modelNames) {
      const rows = Object.values(modelPredictions?.[modelName] ?? {});
      const modelRowsById: Record<string, Set<string>> = {};

      for (const row of rows) {
        const rowId = normalizeId(String(row.ad_id || ""));
        if (!rowId) {
          continue;
        }
        modelRowsById[rowId] = new Set(
          LABEL_KEYS.filter((labelKey) => row[labelKey] === 1),
        );
      }

      output[modelName] = modelRowsById;
    }

    return output;
  }, [modelNames, modelPredictions]);

  const initialIndex = useMemo(() => {
    if (imageEntries.length === 0) {
      return 0;
    }
    const idx = datasetInfo?.nextUnlabeledIndex ?? 0;
    return Math.min(Math.max(idx, 0), imageEntries.length - 1);
  }, [datasetInfo?.nextUnlabeledIndex, imageEntries.length]);

  const selectedModelNames = useMemo(
    () => modelNames.filter((modelName) => !hiddenModelNames.includes(modelName)),
    [hiddenModelNames, modelNames],
  );

  const [previewImage, setPreviewImage] = useState("");
  const filter = (searchParams.get("filter") as FilterMode | null) ?? "all";
  const sampleParam = searchParams.get("sample") ?? "";

  const sampleStatuses: SampleStatus[] = useMemo(() => {
    if (!datasetId) {
      return [];
    }

    return imageEntries.map(([path], index) => {
      const fileName = path.split("/").at(-1) ?? "";
      const sampleId = normalizeId(fileName.replace(/\.[^.]+$/, ""));
      const userSet = groundTruthRows[sampleId] ?? EMPTY_LABEL_SET;

      const modelDisagreementFlags = selectedModelNames.map((modelName) => {
        const modelSet =
          modelLabelRowsById[modelName]?.[sampleId] ?? EMPTY_LABEL_SET;

        for (const labelKey of LABEL_KEYS) {
          if (userSet.has(labelKey) !== modelSet.has(labelKey)) {
            return true;
          }
        }
        return false;
      });

      const disagreementCount = modelDisagreementFlags.filter(Boolean).length;
      const comparedModelsCount = selectedModelNames.length;
      return {
        index,
        isDisagreeing: disagreementCount > 0,
        isTotalDisagreement:
          comparedModelsCount > 0 && disagreementCount === comparedModelsCount,
        isAgreement: comparedModelsCount > 0 && disagreementCount === 0,
      };
    });
  }, [
    datasetId,
    groundTruthRows,
    imageEntries,
    modelLabelRowsById,
    selectedModelNames,
  ]);

  const filteredIndices = useMemo(() => {
    if (sampleStatuses.length === 0) {
      return [];
    }

    if (filter === "all") {
      return sampleStatuses.map((item) => item.index);
    }
    if (filter === "disagreeing") {
      return sampleStatuses
        .filter((item) => item.isDisagreeing)
        .map((item) => item.index);
    }
    if (filter === "total_disagreement") {
      return sampleStatuses
        .filter((item) => item.isTotalDisagreement)
        .map((item) => item.index);
    }
    return sampleStatuses
      .filter((item) => item.isAgreement)
      .map((item) => item.index);
  }, [filter, sampleStatuses]);

  const activeIndex = useMemo(() => {
    if (filteredIndices.length === 0) {
      return -1;
    }
    const sampleIndex = imageEntries.findIndex(([path]) =>
      path.endsWith(`/${sampleParam}`),
    );
    if (sampleIndex >= 0 && filteredIndices.includes(sampleIndex)) {
      return sampleIndex;
    }
    if (filteredIndices.includes(initialIndex)) {
      return initialIndex;
    }
    return filteredIndices[0];
  }, [filteredIndices, imageEntries, sampleParam, initialIndex]);

  useEffect(() => {
    if (activeIndex < 0) {
      return;
    }
    const expectedFileName = imageEntries[activeIndex]?.[0].split("/").at(-1);
    if (!expectedFileName || sampleParam === expectedFileName) {
      return;
    }
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("sample", expectedFileName);
        next.set("filter", filter);
        return next;
      },
      { replace: true },
    );
  }, [activeIndex, filter, imageEntries, sampleParam, setSearchParams]);

  useEffect(() => {
    let isMounted = true;
    const loadCurrentImage = async () => {
      const currentLoader = imageEntries[activeIndex]?.[1];
      if (!currentLoader) {
        if (isMounted) {
          setPreviewImage("");
        }
        return;
      }
      const loadedImage = await currentLoader();
      if (isMounted) {
        setPreviewImage(loadedImage);
      }
    };
    void loadCurrentImage();
    return () => {
      isMounted = false;
    };
  }, [activeIndex, imageEntries]);

  const currentImageName = useMemo(() => {
    const imagePath = imageEntries[activeIndex]?.[0];
    if (!imagePath) {
      return "";
    }
    return imagePath.split("/").at(-1) ?? "";
  }, [activeIndex, imageEntries]);

  const currentPosition = filteredIndices.findIndex(
    (idx) => idx === activeIndex,
  );
  const hasPrevious = currentPosition > 0;
  const hasNext =
    currentPosition >= 0 && currentPosition < filteredIndices.length - 1;

  const groundTruthLabelKeys = useMemo(() => {
    if (!datasetId || activeIndex < 0) {
      return new Set<string>();
    }
    const fileName = imageEntries[activeIndex]?.[0].split("/").at(-1) ?? "";
    const sampleId = normalizeId(fileName.replace(/\.[^.]+$/, ""));
    return groundTruthRows[sampleId] ?? EMPTY_LABEL_SET;
  }, [activeIndex, datasetId, groundTruthRows, imageEntries]);

  const modelLabelKeySets = useMemo(() => {
    if (!datasetId || selectedModelNames.length === 0 || !currentImageName) {
      return [];
    }

    const sampleId = normalizeId(currentImageName.replace(/\.[^.]+$/, ""));
    return selectedModelNames.map((modelName) => {
      const modelSet =
        modelLabelRowsById[modelName]?.[sampleId] ?? EMPTY_LABEL_SET;
      return {
        modelName,
        modelLabel: MODEL_DISPLAY[modelName] ?? modelName,
        labels: modelSet,
      };
    });
  }, [currentImageName, datasetId, modelLabelRowsById, selectedModelNames]);

  const toggleModelSelection = (modelName: string) => {
    setHiddenModelNames((prev) =>
      prev.includes(modelName)
        ? prev.filter((name) => name !== modelName)
        : [...prev, modelName],
    );
  };

  const goToFilteredPosition = (position: number) => {
    const nextIndex = filteredIndices[position];
    if (nextIndex === undefined) {
      return;
    }
    const nextFileName = imageEntries[nextIndex]?.[0].split("/").at(-1);
    if (!nextFileName) {
      return;
    }
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("sample", nextFileName);
      next.set("filter", filter);
      return next;
    });
  };

  const onFilterChange = (mode: FilterMode) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("filter", mode);
      next.delete("sample");
      return next;
    });
  };

  return (
    <section className="page">
      <div className="page-heading">
        <h2>
          View Dataset: <strong>{datasetInfo?.name ?? datasetId}</strong>
        </h2>
      </div>

      <div className="view-filters">
        <div className="model-filter-row">
          <span>Models:</span>
          {modelNames.map((modelName) => (
            <label key={modelName} className="inline-checkbox">
              <input
                type="checkbox"
                checked={selectedModelNames.includes(modelName)}
                onChange={() => toggleModelSelection(modelName)}
              />
              {MODEL_DISPLAY[modelName] ?? modelName}
            </label>
          ))}
        </div>
        <label htmlFor="sample-filter">Filter samples:</label>
        <select
          id="sample-filter"
          value={filter}
          onChange={(event) => onFilterChange(event.target.value as FilterMode)}
        >
          <option value="all">All</option>
          <option value="disagreeing">Disagreeing samples</option>
          <option value="total_disagreement">Total disagreement</option>
          <option value="agreement">Agreement</option>
        </select>
        <span>
          Showing {filteredIndices.length} / {imageEntries.length}
        </span>
      </div>

      <div className="labeling-layout">
        <aside className="panel">
          <h3>Label Comparison</h3>
          <div className="label-matrix-wrap">
            <div
              className="label-matrix"
              role="table"
              aria-label="Label comparison matrix"
            >
              <div className="label-matrix-row label-matrix-head" role="row">
                <span role="columnheader">Label</span>
                <span role="columnheader">Ground Truth</span>
                {modelLabelKeySets.map((column) => (
                  <span key={column.modelName} role="columnheader">
                    {column.modelLabel}
                  </span>
                ))}
              </div>
              {LABEL_KEYS.map((labelKey) => (
                <div className="label-matrix-row" role="row" key={labelKey}>
                  <span role="cell">{LABEL_DISPLAY[labelKey]}</span>
                  <span role="cell">
                    <input
                      type="checkbox"
                      checked={groundTruthLabelKeys.has(labelKey)}
                      readOnly
                      disabled
                    />
                  </span>
                  {modelLabelKeySets.map((column) => (
                    <span role="cell" key={`${column.modelName}-${labelKey}`}>
                      <input
                        type="checkbox"
                        checked={column.labels.has(labelKey)}
                        readOnly
                        disabled
                      />
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="image-navigation">
            <button
              type="button"
              className="nav-button"
              disabled={!hasPrevious}
              onClick={() => goToFilteredPosition(currentPosition - 1)}
            >
              Previous
            </button>
            <p>
              {filteredIndices.length > 0
                ? `${currentPosition + 1} / ${filteredIndices.length}`
                : "0 / 0"}
            </p>
            <button
              type="button"
              className="nav-button"
              disabled={!hasNext}
              onClick={() => goToFilteredPosition(currentPosition + 1)}
            >
              Next
            </button>
          </div>
        </aside>

        <section className="panel">
          <h3>{currentImageName || "Sample"}</h3>
          <div className="image-placeholder">
            {previewImage ? (
              <a
                href={previewImage}
                target="_blank"
                rel="noreferrer"
                className="image-link"
              >
                <img
                  src={previewImage}
                  alt={`Sample ad from ${datasetInfo?.name ?? datasetId}`}
                  className="labeling-preview-image"
                />
              </a>
            ) : (
              <p>No image found for this sample.</p>
            )}
          </div>
        </section>
      </div>

      <p className="back-link">
        <Link
          to={`/datasets/${datasetId}`}
          className="inline-link"
          state={location.state}
        >
          Back to dataset info
        </Link>
      </p>
    </section>
  );
}
