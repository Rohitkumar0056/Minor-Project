export type ModelKey = 'randomForest' | 'xgboost' | 'lstm';
export type MetricKey = 'mae' | 'rmse' | 'r2' | 'mape';
export type SplitKey = 'validation' | 'test';

export interface Metrics {
  mae: number;
  rmse: number;
  r2: number;
  mape: number;
  samples: number;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

export const modelMeta: Record<ModelKey, { label: string; color: string; short: string }> = {
  randomForest: { label: 'Random Forest', short: 'RF', color: '#3B82F6' },
  xgboost: { label: 'XGBoost', short: 'XGB', color: '#14B8A6' },
  lstm: { label: 'LSTM', short: 'LSTM', color: '#8B5CF6' },
};

export const dataset = {
  description: 'Academic Building Mains electricity consumption',
  association: 'I-BLEND building electricity dataset',
  rawRecords: 2269530,
  rawStart: '10 August 2013',
  rawEnd: '31 December 2017',
  rawRange: '10 August 2013 – 31 December 2017',
  timezone: 'Asia/Kolkata (UTC+05:30)',
  timezoneName: 'Asia/Kolkata',
  timezoneOffset: 'UTC+05:30',
  rawMeasurements: ['timestamp', 'power', 'current', 'voltage', 'frequency', 'power factor'],
  target: 'Hourly mean active power',
  targetUnit: 'W',
  hourlyRows: 38520,
  engineeredRows: 38520,
  engineeredColumns: 52,
  missingTargets: 638,
  fullyObserved: 37638,
  partiallyObserved: 244,
  zeroPowerReadings: 6623,
} as const;

export const validationMetrics: Record<ModelKey, Metrics> = {
  randomForest: { mae: 1541.73, rmse: 2627.33, r2: 0.9601, mape: 5.23, samples: 5756 },
  xgboost: { mae: 1507.65, rmse: 2458.22, r2: 0.9650, mape: 5.09, samples: 5756 },
  lstm: { mae: 2300.73, rmse: 3635.23, r2: 0.9235, mape: 7.62, samples: 5756 },
};

export const testMetrics: Record<ModelKey, Metrics> = {
  randomForest: { mae: 2763.39, rmse: 4982.39, r2: 0.9049, mape: 8.03, samples: 5660 },
  xgboost: { mae: 2574.83, rmse: 4469.55, r2: 0.9234, mape: 7.63, samples: 5660 },
  lstm: { mae: 5664.55, rmse: 9192.45, r2: 0.6761, mape: 17.32, samples: 5660 },
};

export const modelConfigurations = {
  randomForest: {
    trees: 300, maxDepth: 'Unrestricted', randomState: 42,
    trainingTime: '25.30 seconds on CPU',
  },
  xgboost: {
    estimators: 1000, learningRate: 0.03, maxDepth: 6, subsample: 0.8,
    columnSubsampling: 0.8, earlyStoppingPatience: 50, bestValidationIteration: 626,
    trainingTime: '1.88 seconds on NVIDIA GeForce RTX 4050 Laptop GPU',
  },
  lstm: {
    layers: 2, unitsPerLayer: 64, dropout: 0.2, denseUnits: 32, inputSteps: 24,
    inputFeatures: 39, optimizer: 'Adam', learningRate: 0.001, loss: 'Mean squared error',
    batchSize: 64, maximumEpochs: 50, trainingTime: '143.13 seconds on CPU',
  },
} as const;

export const featureImportance: Record<'randomForest' | 'xgboost', FeatureImportance[]> = {
  randomForest: [
    { feature: 'power_lag_1', importance: 85.62 },
    { feature: 'power_range_lag_1', importance: 3.25 },
    { feature: 'hour_cos', importance: 2.13 },
    { feature: 'power_lag_2', importance: 1.17 },
    { feature: 'power_lag_168', importance: 1.03 },
  ],
  xgboost: [
    { feature: 'power_lag_1', importance: 53.07 },
    { feature: 'energy_kwh_lag_1', importance: 20.09 },
    { feature: 'hour_cos', importance: 5.01 },
    { feature: 'power_lag_168', importance: 3.87 },
    { feature: 'hour', importance: 1.86 },
    { feature: 'hour_sin', importance: 1.81 },
    { feature: 'power_lag_2', importance: 1.78 },
    { feature: 'power_range_lag_1', importance: 1.70 },
    { feature: 'power_rolling_mean_3', importance: 1.30 },
  ],
};

export const featureDefinitions: Record<string, string> = {
  power_lag_1: 'Power in the previous hour.',
  energy_kwh_lag_1: 'Previous-hour energy consumption feature.',
  power_lag_168: 'Power from approximately one week earlier.',
  power_lag_2: 'Power two hours earlier.',
  hour_sin: 'Cyclical encoding of hour of day.',
  hour_cos: 'Cyclical encoding of hour of day.',
  power_range_lag_1: "Lagged power-range feature; exact computation follows the project's feature-engineering pipeline.",
  power_rolling_mean_3: "Rolling mean over the preceding three hours; exact computation follows the project's feature-engineering pipeline.",
  hour: "Hour-of-day descriptor; exact computation follows the project's feature-engineering pipeline.",
};

export const lstmTraining = {
  bestWeightsEpoch: 10,
  completedEpochs: 20,
  earlyStoppingPatience: 10,
  lrReductionFactor: 0.5,
  lrReductionPatience: 5,
  minimumLearningRate: 0.00001,
  hardware: 'CPU',
  trainingTimeSeconds: 143.13,
} as const;

export const lstmResiduals = {
  definition: 'Actual − Predicted',
  meanKw: 0.35,
  standardDeviationKw: 9.19,
  interpretation: 'A positive mean residual indicates slight average underprediction under this residual convention. The standard deviation indicates substantial residual variability. A high residual is not automatically a confirmed anomaly.',
} as const;

export const split = {
  training: { rows: 26964, missing: 498, evaluated: 26466, end: '6 September 2016, 11:00' },
  validation: { rows: 5778, missing: 22, evaluated: 5756, start: '6 September 2016, 12:00', end: '5 May 2017, 05:00' },
  test: { rows: 5778, missing: 118, evaluated: 5660, start: '5 May 2017, 06:00', end: '31 December 2017, 23:00' },
  timezone: 'Asia/Kolkata (UTC+05:30)',
} as const;

export const featureGroups = {
  powerLags: [1, 2, 3, 6, 12, 24, 48, 168],
  energyLags: [1, 2, 3, 6, 12, 24, 48, 168],
  rollingWindows: [3, 6, 12, 24, 168],
  cyclical: ['hour', 'weekday', 'month'],
} as const;

export const keyFindings = [
  'XGBoost achieved the best recorded test performance across MAE, RMSE, R², and MAPE.',
  'Random Forest also performed well, with a test R² of 0.9049.',
  'LSTM test R² (0.6761) is substantially lower than its validation R² (0.9235).',
  'All three models performed worse on the test set than on the validation set.',
  "The LSTM's validation-to-test degradation is especially pronounced and deserves further investigation.",
] as const;

export const limitations = [
  'Only one building/meter dataset is evaluated.',
  'There are no verified anomaly labels.',
  'The LSTM has a substantial validation-to-test performance gap.',
  'The tree models and LSTM may use slightly different temporal covariate information, so their comparison should be interpreted cautiously.',
  'The experiment uses a single chronological split.',
  'Training times were measured on different hardware.',
  'Prediction intervals and uncertainty estimates are not available.',
] as const;

export const pipeline = [
  'Minute-level electricity measurements',
  'Data inspection and preprocessing',
  'Hourly aggregation',
  'Lag and rolling-feature engineering',
  'Chronological train / validation / test split',
  'Random Forest, XGBoost, and LSTM experiments',
  'Evaluation using MAE, RMSE, R², and MAPE',
  'Model comparison and residual analysis',
] as const;

export const metricMeta: Record<MetricKey, { label: string; unit: string; description: string; better: 'lower' | 'higher' }> = {
  mae: { label: 'MAE', unit: 'W', description: 'Mean absolute error: average absolute difference between observed and predicted power.', better: 'lower' },
  rmse: { label: 'RMSE', unit: 'W', description: 'Root mean squared error: emphasizes larger prediction errors.', better: 'lower' },
  r2: { label: 'R²', unit: '', description: 'Coefficient of determination: proportion of target variance explained by the model.', better: 'higher' },
  mape: { label: 'MAPE', unit: '%', description: 'Mean absolute percentage error across evaluated samples.', better: 'lower' },
};

export const formatMetric = (key: MetricKey, value: number) => {
  if (key === 'r2') return value.toFixed(4);
  if (key === 'mape') return `${value.toFixed(2)}%`;
  return `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} W`;
};

export const bestModelForMetric = (metric: MetricKey, values: Record<ModelKey, Metrics>): ModelKey =>
  (Object.keys(values) as ModelKey[]).reduce((best, key) =>
    metricMeta[metric].better === 'lower'
      ? (values[key][metric] < values[best][metric] ? key : best)
      : (values[key][metric] > values[best][metric] ? key : best),
  'randomForest');
