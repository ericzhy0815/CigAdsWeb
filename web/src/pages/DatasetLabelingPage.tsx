import { useEffect, useMemo, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import type { DatasetInfo } from "./DatasetListPage";
import codebookPdf from "../assets/Codebook - Youth_Module_forAIstudy.pdf";
import {
  ELEMENT_OPTIONS,
  getMockLabelsForSample,
  THEME_OPTIONS,
  type DatasetId,
} from "../mock/mockUserLabels";
import w1ClipPredictions from "../assets/predictions/w1/clip.json";
import w1GeminiPredictions from "../assets/predictions/w1/gemini.json";
import w1ResnetPredictions from "../assets/predictions/w1/resnet.json";
import w2ClipPredictions from "../assets/predictions/w2/clip.json";
import w2GeminiPredictions from "../assets/predictions/w2/gemini.json";
import w2ResnetPredictions from "../assets/predictions/w2/resnet.json";

const optionSections = [
  {
    title: "Theme",
    description: "Select up to two.",
    options: THEME_OPTIONS,
  },
  {
    title: "Elements",
    description: "",
    options: ELEMENT_OPTIONS,
  },
];

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
};

type SampleLabels = {
  theme: string[];
  elements: string[];
};

type PredictionRow = {
  ad_id: string;
  model: string;
  status: string;
  [key: string]: string | number;
};

type ModelRecord = Record<string, PredictionRow>;

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

function getRevealCountStorageKey(datasetId: string): string {
  return `ai-reveal-count:${datasetId}`;
}

export function DatasetLabelingPage() {
  const { datasetId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const datasetInfo = (location.state as { datasetInfo?: DatasetInfo } | null)
    ?.datasetInfo;

  const readableDatasetName = useMemo(() => {
    if (!datasetId) {
      return "Unknown dataset";
    }

    return datasetId.replaceAll("-", " ");
  }, [datasetId]);

  const imageEntries = useMemo(() => {
    if (!datasetId || !datasetImageModules[datasetId]) {
      return [];
    }

    return Object.entries(datasetImageModules[datasetId]).sort(([a], [b]) =>
      a.localeCompare(b),
    );
  }, [datasetId]);

  const initialIndex = useMemo(() => {
    if (imageEntries.length === 0) {
      return 0;
    }

    const nextIndexFromDataset = datasetInfo?.nextUnlabeledIndex ?? 0;
    return Math.min(Math.max(nextIndexFromDataset, 0), imageEntries.length - 1);
  }, [datasetInfo?.nextUnlabeledIndex, imageEntries.length]);

  const sampleParam = searchParams.get("sample") ?? "";
  const activeIndex = useMemo(() => {
    if (imageEntries.length === 0) {
      return -1;
    }

    const foundBySample = imageEntries.findIndex(([path]) =>
      path.endsWith(`/${sampleParam}`),
    );
    if (foundBySample >= 0) {
      return foundBySample;
    }

    return initialIndex;
  }, [imageEntries, initialIndex, sampleParam]);

  const currentIndexLabel = Math.max(activeIndex, 0);
  const [previewImage, setPreviewImage] = useState("");
  const [labelsBySample, setLabelsBySample] = useState<
    Record<string, SampleLabels>
  >({});
  const [revealedSampleKey, setRevealedSampleKey] = useState("");

  useEffect(() => {
    if (imageEntries.length === 0 || activeIndex < 0) {
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
        return next;
      },
      { replace: true },
    );
  }, [activeIndex, imageEntries, sampleParam, setSearchParams]);

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

  const currentSampleKey =
    datasetId && currentImageName ? `${datasetId}:${currentImageName}` : "";
  const mockLabelsForCurrentSample =
    datasetId && activeIndex >= 0
      ? getMockLabelsForSample(datasetId as DatasetId, activeIndex)
      : null;
  const currentSampleLabels: SampleLabels = currentSampleKey
    ? (labelsBySample[currentSampleKey] ??
      (mockLabelsForCurrentSample
        ? {
            theme: [...mockLabelsForCurrentSample.theme],
            elements: [...mockLabelsForCurrentSample.elements],
          }
        : { theme: [], elements: [] }))
    : { theme: [], elements: [] };
  const selectedThemeOptions = currentSampleLabels.theme;
  const selectedElementOptions = currentSampleLabels.elements;
  const showAiPredictions =
    currentSampleKey.length > 0 && revealedSampleKey === currentSampleKey;

  const hasPrevious = activeIndex > 0;
  const hasNext = activeIndex < imageEntries.length - 1;
  const aiPredictionSummary = useMemo(() => {
    if (!datasetId || !currentImageName) {
      return [];
    }

    const modelRows = MODEL_PREDICTIONS[datasetId as DatasetId];
    if (!modelRows) {
      return [];
    }

    const normalizedSample = normalizeId(
      currentImageName.replace(/\.[^.]+$/, ""),
    );

    return Object.entries(modelRows).map(([modelKey, rows]) => {
      const matched = Object.values(rows).find((row) => {
        const rowId = normalizeId(String(row.ad_id || ""));
        return (
          rowId === normalizedSample ||
          rowId.startsWith(normalizedSample) ||
          normalizedSample.startsWith(rowId)
        );
      });

      if (!matched) {
        return {
          modelKey,
          modelLabel: MODEL_DISPLAY[modelKey] ?? modelKey,
          labels: [] as string[],
          found: false,
        };
      }

      const labels = LABEL_KEYS.filter(
        (labelKey) => matched[labelKey] === 1,
      ).map((labelKey) => LABEL_DISPLAY[labelKey]);

      return {
        modelKey,
        modelLabel: MODEL_DISPLAY[modelKey] ?? modelKey,
        labels,
        found: true,
      };
    });
  }, [currentImageName, datasetId]);

  const goToSampleIndex = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex > imageEntries.length - 1) {
      return;
    }

    const nextFileName = imageEntries[nextIndex]?.[0].split("/").at(-1);
    if (!nextFileName) {
      return;
    }

    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("sample", nextFileName);
      return next;
    });
  };

  const goNext = () => {
    if (hasNext) {
      goToSampleIndex(activeIndex + 1);
      return;
    }

    navigate(`/datasets/${datasetId}/review`, {
      state: {
        datasetInfo,
        totalSamples: imageEntries.length,
        reviewedSamples: activeIndex + 1,
      },
    });
  };

  const toggleThemeOption = (option: string) => {
    if (!currentSampleKey) {
      return;
    }

    setLabelsBySample((prev) => {
      const base = prev[currentSampleKey] ?? currentSampleLabels;
      const isSelected = base.theme.includes(option);
      const nextTheme = isSelected
        ? base.theme.filter((item) => item !== option)
        : base.theme.length < 2
          ? [...base.theme, option]
          : base.theme;

      return {
        ...prev,
        [currentSampleKey]: {
          ...base,
          theme: nextTheme,
        },
      };
    });
  };

  const toggleElementOption = (option: string) => {
    if (!currentSampleKey) {
      return;
    }

    setLabelsBySample((prev) => {
      const base = prev[currentSampleKey] ?? currentSampleLabels;
      const nextElements = base.elements.includes(option)
        ? base.elements.filter((item) => item !== option)
        : [...base.elements, option];

      return {
        ...prev,
        [currentSampleKey]: {
          ...base,
          elements: nextElements,
        },
      };
    });
  };

  const toggleAiPredictions = () => {
    if (!currentSampleKey) {
      return;
    }

    if (showAiPredictions) {
      setRevealedSampleKey("");
      return;
    }

    setRevealedSampleKey(currentSampleKey);

    if (datasetId) {
      const key = getRevealCountStorageKey(datasetId);
      const current = Number(localStorage.getItem(key) ?? "0");
      const next = Number.isFinite(current) ? current + 1 : 1;
      localStorage.setItem(key, String(next));
    }
  };

  return (
    <section className="page">
      <div className="page-heading">
        <h2>
          Label Dataset: <strong>{readableDatasetName}</strong>
        </h2>
      </div>

      <div className="labeling-layout">
        <aside className="panel">
          {optionSections.map((section) => (
            <div key={section.title} className="option-section">
              <h4>{section.title}</h4>
              {section.description ? <p>{section.description}</p> : null}
              <ul className="option-list">
                {section.options.map((option) => (
                  <li key={`${section.title}-${option}`}>
                    <label>
                      <input
                        type="checkbox"
                        checked={
                          section.title === "Theme"
                            ? selectedThemeOptions.includes(option)
                            : selectedElementOptions.includes(option)
                        }
                        disabled={
                          section.title === "Theme" &&
                          selectedThemeOptions.length >= 2 &&
                          !selectedThemeOptions.includes(option)
                        }
                        onChange={
                          section.title === "Theme"
                            ? () => toggleThemeOption(option)
                            : () => toggleElementOption(option)
                        }
                      />
                      <span>{option}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="image-navigation" style={{ marginTop: "40px" }}>
            <button
              type="button"
              className="nav-button"
              disabled={!hasPrevious}
              onClick={() => goToSampleIndex(activeIndex - 1)}
            >
              Previous
            </button>
            <p>
              {imageEntries.length > 0
                ? `${currentIndexLabel + 1} / ${imageEntries.length}`
                : "0 / 0"}
            </p>
            <button type="button" className="nav-button" onClick={goNext}>
              {hasNext ? "Next" : "Submit"}
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
                aria-label={`Open sample ad from ${readableDatasetName} in a new tab`}
              >
                <img
                  src={previewImage}
                  alt={`Sample ad from ${readableDatasetName}`}
                  className="labeling-preview-image"
                />
              </a>
            ) : (
              <p>No image found for this dataset.</p>
            )}
          </div>
          <div className="meta-placeholder">
            <p>
              <a
                href={codebookPdf}
                target="_blank"
                rel="noreferrer"
                className="inline-link"
              >
                Open the Youth Module codebook (PDF)
              </a>{" "}
              to review the full coding criteria and definitions.
            </p>
            <div className="ai-predictions">
              <button
                type="button"
                className="nav-button"
                onClick={toggleAiPredictions}
              >
                {showAiPredictions
                  ? "Hide AI Predictions"
                  : "Reveal AI Predictions"}
              </button>
              {showAiPredictions ? (
                <div className="ai-predictions-panel">
                  {aiPredictionSummary.map((model) => (
                    <p key={model.modelKey}>
                      <strong>{model.modelLabel}:</strong>{" "}
                      {!model.found
                        ? "No prediction found for this sample."
                        : model.labels.length > 0
                          ? model.labels.join(", ")
                          : "No positive labels"}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      <p className="back-link">
        <Link to="/datasets" className="inline-link">
          Back to dataset list
        </Link>
      </p>
    </section>
  );
}
