import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import type { DatasetInfo } from "./DatasetListPage";
import w1ClipPredictions from "../assets/predictions/w1/clip.json";
import w1GeminiPredictions from "../assets/predictions/w1/gemini.json";
import w1ResnetPredictions from "../assets/predictions/w1/resnet.json";
import w2ClipPredictions from "../assets/predictions/w2/clip.json";
import w2GeminiPredictions from "../assets/predictions/w2/gemini.json";
import w2ResnetPredictions from "../assets/predictions/w2/resnet.json";
import {
  getMockLabelsForSample,
  type DatasetId,
} from "../mock/mockUserLabels";

type ReviewPageState = {
  datasetInfo?: DatasetInfo;
  totalSamples?: number;
  reviewedSamples?: number;
};

type PredictionRow = {
  ad_id: string;
  model: string;
  status: string;
  [key: string]: string | number;
};

type ModelRecord = Record<string, PredictionRow>;

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

const PREDICTION_FILES: Record<string, Record<string, ModelRecord>> = {
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
};

const MODEL_DISPLAY: Record<string, string> = {
  clip: "CLIP",
  resnet: "ResNet",
  gemini: "VLM (Gemini)",
};

const OPTION_TO_LABEL_KEY: Record<string, string> = {
  Independence: "youth_theme_indep",
  Rebellion: "youth_theme_rebel",
  Arts: "youth_theme_arts",
  Social: "youth_theme_social",
  Sophistication: "youth_theme_sophis",
  Sex: "youth_theme_sex",
  Athletics: "youth_theme_athl",
  Contest: "youth_acad_contest",
  Cartoon: "youth_cartoon",
  Influencers: "youth_influencers",
  Vapetricks: "youth_vapetricks",
  Covert: "youth_covert",
  Humor: "youth_humor",
  Memes: "youth_memes",
  Emojis: "youth_emojis",
  Restrictions: "youth_restrict",
};

const DATASET_IMAGE_MODULES: Record<DatasetId, Record<string, string>> = {
  w1: import.meta.glob(
    "../assets/images/w1/*.{png,jpg,jpeg,gif,webp,PNG,JPG,JPEG,GIF,WEBP}",
    {
      eager: true,
      import: "default",
    },
  ) as Record<string, string>,
  w2: import.meta.glob(
    "../assets/images/w2/*.{png,jpg,jpeg,gif,webp,PNG,JPG,JPEG,GIF,WEBP}",
    {
      eager: true,
      import: "default",
    },
  ) as Record<string, string>,
};

function normalizeId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getImageForAd(datasetId: DatasetId | undefined, adId: string): string | null {
  if (!datasetId) {
    return null;
  }

  const datasetImages = Object.entries(DATASET_IMAGE_MODULES[datasetId] ?? {});
  const targetId = normalizeId(adId);

  for (const [path, imageSrc] of datasetImages) {
    const filename = path.split("/").at(-1) ?? "";
    const basename = filename.replace(/\.[^.]+$/, "");
    const normalizedBase = normalizeId(basename);

    if (
      normalizedBase === targetId ||
      normalizedBase.startsWith(targetId) ||
      targetId.startsWith(normalizedBase)
    ) {
      return imageSrc;
    }
  }

  return null;
}

function getBinaryValue(row: PredictionRow, key: string): number {
  const value = row[key];
  return value === 1 ? 1 : 0;
}

function getRevealCountStorageKey(datasetId: string): string {
  return `ai-reveal-count:${datasetId}`;
}

export function ReviewPage() {
  const { datasetId } = useParams();
  const location = useLocation();
  const state = (location.state as ReviewPageState | null) ?? {};
  const modelPredictions = PREDICTION_FILES[datasetId ?? ""] ?? {};
  const modelNames = Object.keys(modelPredictions);
  const [selectedModel, setSelectedModel] = useState(modelNames[0] ?? "clip");

  const datasetName = state.datasetInfo?.name ?? datasetId ?? "Unknown dataset";
  const totalSamples =
    state.totalSamples ??
    state.datasetInfo?.totalSamples ??
    Object.keys(modelPredictions[modelNames[0] ?? ""] ?? {}).length;
  const reviewedSamples = state.reviewedSamples ?? 0;
  const aiRevealCount = datasetId
    ? Number(localStorage.getItem(getRevealCountStorageKey(datasetId)) ?? "0")
    : 0;

  const modelSummary = modelNames.map((modelName) => {
    const rows = Object.values(modelPredictions[modelName] ?? {});
    const totalPredictions = rows.length * LABEL_KEYS.length;
    const positivePredictions = rows.reduce((sum, row) => {
      const rowPositiveCount = LABEL_KEYS.reduce(
        (labelSum, labelKey) => labelSum + getBinaryValue(row, labelKey),
        0,
      );
      return sum + rowPositiveCount;
    }, 0);

    const positiveRate =
      totalPredictions > 0 ? positivePredictions / totalPredictions : 0;

    return {
      name: modelName,
      label: MODEL_DISPLAY[modelName] ?? modelName,
      positiveRate,
    };
  });

  const sharedAdIds = Object.keys(
    modelPredictions[modelNames[0] ?? ""] ?? {},
  ).filter((adId) =>
    modelNames.every((modelName) => modelPredictions[modelName]?.[adId]),
  );

  const disagreementExamples =
    selectedModel && modelPredictions[selectedModel]
      ? sharedAdIds
          .map((adId, sampleIndex) => {
            const aiRow = modelPredictions[selectedModel][adId];
            const userMock = getMockLabelsForSample(
              (datasetId as DatasetId | undefined) ?? "w1",
              sampleIndex,
            );

            const userPositiveKeys = new Set<string>(
              [
                ...(userMock?.theme ?? []),
                ...(userMock?.elements ?? []),
              ]
                .map((option) => OPTION_TO_LABEL_KEY[option])
                .filter(Boolean),
            );

            const aiPositiveKeys = new Set<string>(
              LABEL_KEYS.filter((labelKey) => getBinaryValue(aiRow, labelKey) === 1),
            );

            const disagreeingLabels = LABEL_KEYS.filter(
              (labelKey) =>
                aiPositiveKeys.has(labelKey) !== userPositiveKeys.has(labelKey),
            );

            const userLabelNames = LABEL_KEYS.filter((labelKey) =>
              userPositiveKeys.has(labelKey),
            ).map((labelKey) => LABEL_DISPLAY[labelKey]);

            const aiLabelNames = LABEL_KEYS.filter((labelKey) =>
              aiPositiveKeys.has(labelKey),
            ).map((labelKey) => LABEL_DISPLAY[labelKey]);

            return {
              adId,
              disagreeingLabels,
              userLabelNames,
              aiLabelNames,
              imageSrc: getImageForAd(datasetId as DatasetId | undefined, adId),
            };
          })
          .sort((a, b) => b.disagreeingLabels.length - a.disagreeingLabels.length)
          .slice(0, 5)
      : [];

  const labelPrevalenceRows = LABEL_KEYS.map((labelKey) => {
    const rates = modelNames.map((modelName) => {
      const rows = Object.values(modelPredictions[modelName] ?? {});
      if (rows.length === 0) {
        return { modelName, rate: 0 };
      }

      const positives = rows.reduce(
        (sum, row) => sum + getBinaryValue(row, labelKey),
        0,
      );
      return { modelName, rate: positives / rows.length };
    });

    return {
      labelKey,
      label: LABEL_DISPLAY[labelKey],
      rates,
    };
  });

  return (
    <section className="page">
      <div className="page-heading">
        <h2>Review</h2>
        <p>
          Agreement summary for <strong>{datasetName}</strong>
        </p>
      </div>

      <div className="cards-grid">
        <article className="placeholder-card">
          <p className="label">Samples Reviewed</p>
          <p className="value">
            {reviewedSamples} / {totalSamples}
          </p>
        </article>
        <article className="placeholder-card">
          <p className="label">Models Loaded</p>
          <p className="value">{modelNames.length}</p>
        </article>
        <article className="placeholder-card">
          <p className="label">Shared Sample IDs</p>
          <p className="value">{sharedAdIds.length}</p>
        </article>
        <article className="placeholder-card">
          <p className="label">AI Reveal Clicks</p>
          <p className="value">{Number.isFinite(aiRevealCount) ? aiRevealCount : 0}</p>
        </article>
      </div>

      <article className="research-overview">
        <h3>Model Positive Rate Overview</h3>
        <div className="review-bars">
          {modelSummary.map((model) => (
            <div className="review-bar-row" key={model.name}>
              <span>{model.label}</span>
              <div className="review-bar-track">
                <div
                  className="review-bar-fill"
                  style={{ width: `${Math.round(model.positiveRate * 100)}%` }}
                />
              </div>
              <strong>{Math.round(model.positiveRate * 100)}%</strong>
            </div>
          ))}
        </div>
      </article>

      <article className="research-overview">
        <h3>Per-Label Positive Prevalence</h3>
        <div
          className="review-table"
          role="table"
          aria-label="Per-label prevalence by model"
        >
          <div className="review-table-row review-table-head" role="row">
            <span role="columnheader">Label</span>
            {modelSummary.map((model) => (
              <span key={model.name} role="columnheader">
                {model.label}
              </span>
            ))}
          </div>
          {labelPrevalenceRows.map((row) => (
            <div className="review-table-row" role="row" key={row.labelKey}>
              <span role="cell">{row.label}</span>
              {row.rates.map((rateItem) => (
                <span key={`${row.labelKey}-${rateItem.modelName}`} role="cell">
                  {Math.round(rateItem.rate * 100)}%
                </span>
              ))}
            </div>
          ))}
        </div>
      </article>

      <article className="research-overview">
        <h3>Top 5 Disagreement Examples</h3>
        <div className="review-controls">
          <label htmlFor="model-select">AI model:</label>
          <select
            id="model-select"
            value={selectedModel}
            onChange={(event) => setSelectedModel(event.target.value)}
          >
            {modelNames.map((modelName) => (
              <option key={modelName} value={modelName}>
                {MODEL_DISPLAY[modelName] ?? modelName}
              </option>
            ))}
          </select>
        </div>
        <ul className="disagreement-list">
          {disagreementExamples.map((example) => (
            <li key={example.adId}>
              <div className="disagreement-item">
                {example.imageSrc ? (
                  <a href={example.imageSrc} target="_blank" rel="noreferrer">
                    <img
                      src={example.imageSrc}
                      alt={`Ad sample ${example.adId}`}
                      className="disagreement-thumb"
                    />
                  </a>
                ) : (
                  <div className="disagreement-thumb disagreement-thumb--empty">
                    No image
                  </div>
                )}
                <div>
                  <p>
                    <strong>{example.adId}</strong> -{" "}
                    {example.disagreeingLabels.length} disagreeing labels
                  </p>
                  <p>
                    {example.disagreeingLabels.length > 0
                      ? example.disagreeingLabels
                          .slice(0, 5)
                          .map((labelKey) => LABEL_DISPLAY[labelKey])
                          .join(", ")
                      : "No disagreements across loaded models"}
                  </p>
                  <p>
                    <strong>User labels:</strong>{" "}
                    {example.userLabelNames.length > 0
                      ? example.userLabelNames.join(", ")
                      : "None"}
                  </p>
                  <p>
                    <strong>{MODEL_DISPLAY[selectedModel] ?? selectedModel} labels:</strong>{" "}
                    {example.aiLabelNames.length > 0
                      ? example.aiLabelNames.join(", ")
                      : "None"}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </article>

      <p className="back-link">
        <Link to="/datasets" className="inline-link">
          Back to dataset list
        </Link>
      </p>
    </section>
  );
}
