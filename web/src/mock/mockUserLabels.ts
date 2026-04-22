export const THEME_OPTIONS = [
  "Independence",
  "Rebellion",
  "Arts",
  "Social",
  "Sophistication",
  "Sex",
  "Athletics",
  "Contest",
] as const;

export const ELEMENT_OPTIONS = [
  "Cartoon",
  "Influencers",
  "Vapetricks",
  "Covert",
  "Humor",
  "Memes",
  "Emojis",
  "Restrictions",
] as const;

export type DatasetId = "w1" | "w2";

export type MockSampleLabels = {
  theme: string[];
  elements: string[];
};

const MOCK_LABELED_COUNTS: Record<DatasetId, number> = {
  w1: 179,
  w2: 104,
};

const DATASET_NAMES: Record<DatasetId, string> = {
  w1: "BWF Wave 1",
  w2: "BWF Wave 2",
};

function pickTheme(index: number): string[] {
  const first = THEME_OPTIONS[index % THEME_OPTIONS.length];
  const second = THEME_OPTIONS[(index * 3 + 1) % THEME_OPTIONS.length];

  if (first === second) {
    return [first];
  }

  return [first, second];
}

function pickElements(index: number): string[] {
  const first = ELEMENT_OPTIONS[index % ELEMENT_OPTIONS.length];
  const second = ELEMENT_OPTIONS[(index * 5 + 2) % ELEMENT_OPTIONS.length];
  const third = ELEMENT_OPTIONS[(index * 7 + 3) % ELEMENT_OPTIONS.length];

  return Array.from(new Set([first, second, third]));
}

function generateMockSampleLabels(index: number): MockSampleLabels {
  return {
    theme: pickTheme(index),
    elements: pickElements(index),
  };
}

export function getMockLabeledCount(datasetId: DatasetId): number {
  return MOCK_LABELED_COUNTS[datasetId];
}

export function getDatasetName(datasetId: DatasetId): string {
  return DATASET_NAMES[datasetId];
}

export function getMockLabelsForSample(
  datasetId: DatasetId,
  sampleIndex: number,
): MockSampleLabels | null {
  if (sampleIndex < 0) {
    return null;
  }

  if (sampleIndex >= MOCK_LABELED_COUNTS[datasetId]) {
    return null;
  }

  return generateMockSampleLabels(sampleIndex);
}
