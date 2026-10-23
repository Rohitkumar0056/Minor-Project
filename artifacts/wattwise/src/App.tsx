import { useState, type CSSProperties, type ReactNode } from 'react';
import { Link, Route, Switch, useLocation } from 'wouter';
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowRight, BarChart3,
  BookOpen, Check, ChevronRight, CircleHelp, Clock3, Database, Gauge, GitBranch,
  Layers3, Menu, Network, ScanSearch, Table2, X, Zap,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  bestModelForMetric, dataset, featureDefinitions, featureGroups, featureImportance,
  formatMetric, keyFindings, limitations, lstmResiduals, lstmTraining, metricMeta,
  modelConfigurations, modelMeta, pipeline, split, testMetrics, validationMetrics,
  type MetricKey, type ModelKey, type Metrics,
} from '@/data/projectData';

const navItems = [
  { href: '/', label: 'Overview', icon: Gauge, title: 'Research overview', subtitle: 'A concise view of the completed forecasting experiment.' },
  { href: '/comparison', label: 'Model Comparison', icon: BarChart3, title: 'Model comparison', subtitle: 'Recorded validation and held-out test performance across three models.' },
  { href: '/forecast', label: 'Forecast Analysis', icon: Activity, title: 'Forecast analysis', subtitle: 'Test metrics and prediction-series availability for the selected model.' },
  { href: '/features', label: 'Feature Importance', icon: Layers3, title: 'Feature importance', subtitle: 'Recorded tree-model feature rankings and their interpretation.' },
  { href: '/lstm', label: 'LSTM Analysis', icon: Network, title: 'LSTM analysis', subtitle: 'Architecture, training facts, and validation-to-test generalization.' },
  { href: '/anomalies', label: 'Anomaly Analysis', icon: ScanSearch, title: 'Residual exploration', subtitle: 'Research status and verified residual statistics—not a validated detector.' },
  { href: '/methodology', label: 'Methodology', icon: BookOpen, title: 'Study methodology', subtitle: 'Dataset preparation, chronological evaluation, and limitations.' },
];

const modelKeys: ModelKey[] = ['randomForest', 'xgboost', 'lstm'];
const metricKeys: MetricKey[] = ['mae', 'rmse', 'r2', 'mape'];

function Tip({ active, payload, label, unit = '', explanation }: { active?: boolean; payload?: Array<{ name?: string; value?: number; color?: string; payload?: Record<string, unknown> }>; label?: string; unit?: string; explanation?: string }) {
  if (!active || !payload?.length) return null;
  return <div className="plot-tooltip"><strong>{label ?? String(payload[0].payload?.model ?? '')}</strong>{payload.map((item, i) => <span key={`${item.name}-${i}`} style={{ display: 'block', marginTop: 3 }}>{item.name}: {typeof item.value === 'number' ? item.value.toLocaleString('en-US', { maximumFractionDigits: 4 }) : item.value}{unit ? ` ${unit}` : ''}</span>)}{explanation && <span className="tooltip-explanation">{explanation}</span>}</div>;
}

function LegendDots({ keys = modelKeys }: { keys?: ModelKey[] }) {
  return <div className="chart-caption">{keys.map(key => <span key={key} className="legend-item"><i className="legend-dot" style={{ background: modelMeta[key].color }} />{modelMeta[key].label}</span>)}</div>;
}

function PageIntro({ eyebrow, title, text, extra }: { eyebrow: string; title: string; text: string; extra?: ReactNode }) {
  return <div className="page-intro reveal"><div><div className="eyebrow">{eyebrow}</div><h1 className="h1">{title}</h1><p className="lede">{text}</p></div>{extra}</div>;
}

function Card({ title, note, right, children, className = '' }: { title: string; note?: string; right?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}><div className="card-head"><div><h2 className="card-title">{title}</h2>{note && <p className="card-note">{note}</p>}</div>{right}</div>{children}</section>;
}

function ModelMark({ model }: { model: ModelKey }) {
  return <span className="model-name"><i className="model-chip" style={{ background: modelMeta[model].color }} />{modelMeta[model].label}</span>;
}

function Select({ label, value, onChange, options, testId }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; testId: string }) {
  return <label className="select-wrap">{label}<select aria-label={label} data-testid={testId} value={value} onChange={event => onChange(event.target.value)}>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

function MetricBars({ metrics, metric, height = 238 }: { metrics: Record<ModelKey, Metrics>; metric: MetricKey; height?: number }) {
  const data = modelKeys.map(model => ({ model: modelMeta[model].label, value: metrics[model][metric], color: modelMeta[model].color }));
  const isR2 = metric === 'r2';
  return <div className="chart-wrap" style={{ height }} data-testid={`chart-${metric}`}>
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 7, right: 12, left: 0, bottom: 5 }} barCategoryGap="34%">
        <CartesianGrid stroke="#e9edf2" vertical={false} />
        <XAxis dataKey="model" tick={{ fill: '#718096', fontSize: 10 }} axisLine={{ stroke: '#dfe5ec' }} tickLine={false} />
        <YAxis domain={isR2 ? [0, 1] : [0, 'auto']} tick={{ fill: '#8a97a8', fontSize: 9 }} axisLine={false} tickLine={false} width={42} />
        <Tooltip content={<Tip unit={metricMeta[metric].unit} explanation={metricMeta[metric].description} />} cursor={{ fill: '#f2f6fa' }} />
        <Bar dataKey="value" name={metricMeta[metric].label} radius={[5, 5, 0, 0]} maxBarSize={50}>
          {data.map(item => <Cell key={item.model} fill={item.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>;
}

function SelectedModelErrorChart({ model }: { model: ModelKey }) {
  const metrics = testMetrics[model];
  const data = [
    { metric: 'MAE', value: metrics.mae },
    { metric: 'RMSE', value: metrics.rmse },
  ];
  return <div className="chart-wrap" style={{ height: 210 }} data-testid="chart-selected-model-errors">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 6, right: 22, left: 5, bottom: 4 }}>
        <CartesianGrid stroke="#e9edf2" horizontal={false} />
        <XAxis type="number" tick={{ fill: '#8a97a8', fontSize: 9 }} axisLine={{ stroke: '#dfe5ec' }} tickLine={false} />
        <YAxis dataKey="metric" type="category" width={55} tick={{ fill: '#627187', fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip content={<Tip unit="W" explanation="Both measures are test-set power errors; RMSE places more weight on larger errors." />} cursor={{ fill: '#f2f6fa' }} />
        <Bar dataKey="value" name="Test error" fill={modelMeta[model].color} radius={[0, 5, 5, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  </div>;
}

function R2GroupedChart() {
  const data = modelKeys.map(model => ({
    model: modelMeta[model].label,
    Validation: validationMetrics[model].r2,
    Test: testMetrics[model].r2,
    color: modelMeta[model].color,
  }));
  return <div className="chart-wrap compact" data-testid="chart-validation-test-r2"><ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} margin={{ top: 8, right: 10, left: -5, bottom: 4 }} barCategoryGap="25%">
      <CartesianGrid stroke="#e9edf2" vertical={false} />
      <XAxis dataKey="model" tick={{ fill: '#718096', fontSize: 9 }} axisLine={{ stroke: '#dfe5ec' }} tickLine={false} />
      <YAxis domain={[0, 1]} tick={{ fill: '#8a97a8', fontSize: 9 }} axisLine={false} tickLine={false} width={34} />
      <Tooltip content={<Tip explanation={metricMeta.r2.description} />} cursor={{ fill: '#f2f6fa' }} />
      <Bar dataKey="Validation" name="Validation R²" radius={[4, 4, 0, 0]} maxBarSize={22}>{data.map(d => <Cell key={d.model} fill={d.color} opacity={0.55} />)}</Bar>
      <Bar dataKey="Test" name="Test R²" radius={[4, 4, 0, 0]} maxBarSize={22}>{data.map(d => <Cell key={d.model} fill={d.color} />)}</Bar>
    </BarChart>
  </ResponsiveContainer></div>;
}

function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const page = navItems.find(item => item.href === location) ?? navItems[0];
  const Nav = ({ mobile = false }: { mobile?: boolean }) => <nav className={mobile ? 'mobile-nav' : 'nav-list'} aria-label="Primary navigation">
    {navItems.map(item => {
      const Icon = item.icon;
      return <Link key={item.href} href={item.href} className={`nav-link ${location === item.href ? 'active' : ''}`} data-testid={`link-nav-${item.href === '/' ? 'overview' : item.href.slice(1)}`} onClick={() => setMenuOpen(false)}>
        <Icon size={15} strokeWidth={1.9} /><span>{item.label}</span>
      </Link>;
    })}
  </nav>;
  return <div className="app-frame">
    <aside className="sidebar">
      <Link href="/" className="brand" aria-label="WattWise overview">
        <span className="brand-mark"><Zap size={19} fill="currentColor" /></span>
        <span><span className="brand-name">WattWise</span><span className="brand-sub">Research instrument</span></span>
      </Link>
      <div className="nav-caption">Experiment workspace</div>
      <Nav />
      <div className="side-bottom">
        <div className="side-study">
          <div className="side-study-label">Study status</div>
          <div className="side-study-title">Electricity consumption forecasting</div>
          <div className="side-study-tag"><i className="live-dot" />Results fixed · local dataset</div>
        </div>
      </div>
    </aside>
    <div className="main-wrap">
      <header className="topbar">
        <div className="topbar-left">
          <button className="mobile-menu" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} data-testid="button-mobile-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={17} /> : <Menu size={17} />}</button>
          <div><h2 className="page-title">{page.title}</h2><p className="page-subtitle">{page.subtitle}</p></div>
        </div>
        <div className="project-state"><i className="live-dot" />Experiment results <span aria-hidden="true">·</span> 3 models evaluated</div>
        {menuOpen && <Nav mobile />}
      </header>
      <main className="content">{children}</main>
      <footer className="footer"><span><strong>WattWise</strong> · Electricity Consumption Forecasting and Anomaly Detection Using Machine Learning and Deep Learning</span><span className="footer-mark"><Zap size={12} /> Machine Learning Research Dashboard</span></footer>
    </div>
  </div>;
}

function Overview() {
  const [metric, setMetric] = useState<MetricKey>('mae');
  const kpis = [
    { label: 'Raw records', value: `${(dataset.rawRecords / 1_000_000).toFixed(2)}M`, foot: 'Minute-level observations', icon: Database, tint: '#edf4ff', color: '#3b82f6' },
    { label: 'Hourly records', value: dataset.hourlyRows.toLocaleString('en-US'), foot: 'Modeling dataset rows', icon: Activity, tint: '#e9f8f4', color: '#14b8a6' },
    { label: 'Models evaluated', value: String(modelKeys.length), foot: 'RF · XGBoost · LSTM', icon: GitBranch, tint: '#f3efff', color: '#8b5cf6' },
    { label: 'Best test MAE', value: formatMetric('mae', testMetrics[bestModelForMetric('mae', testMetrics)].mae), foot: modelMeta[bestModelForMetric('mae', testMetrics)].label, icon: ArrowDownRight, tint: '#edf4ff', color: '#3b82f6' },
    { label: 'Best test RMSE', value: formatMetric('rmse', testMetrics[bestModelForMetric('rmse', testMetrics)].rmse), foot: modelMeta[bestModelForMetric('rmse', testMetrics)].label, icon: ArrowDownRight, tint: '#e9f8f4', color: '#14b8a6' },
    { label: 'Best test R²', value: formatMetric('r2', testMetrics[bestModelForMetric('r2', testMetrics)].r2), foot: modelMeta[bestModelForMetric('r2', testMetrics)].label, icon: Check, tint: '#f3efff', color: '#8b5cf6' },
  ];
  const testR2 = modelKeys.map(model => ({ model: modelMeta[model].label, value: testMetrics[model].r2, fill: modelMeta[model].color }));
  return <>
    <section className="hero reveal">
      <div>
        <div className="hero-kicker"><Zap size={13} /> Research results · I-BLEND building electricity</div>
        <h1>Electricity Consumption Intelligence</h1>
        <p>Forecasting power demand with machine learning and deep learning. A presentation of fixed experimental results, observed in watts and evaluated chronologically.</p>
        <div className="hero-badge"><i className="live-dot" />Experiment Results · 3 Models Evaluated</div>
      </div>
      <div className="hero-chart" aria-label="Abstract model comparison visual, not a consumption time series">
        <span className="hero-bars-caption">MODEL SIGNALS / TEST</span>
        {[0,1,2,3,4,5,6].map(index => <i className="hero-bar" key={index} />)}
      </div>
    </section>
    <section className="grid kpi-grid" aria-label="Study key performance indicators">{kpis.map(item => {
      const Icon = item.icon;
      return <article className="kpi" key={item.label} style={{ '--tint': item.tint } as CSSProperties} data-testid={`metric-${item.label.toLowerCase().replaceAll(' ', '-')}`}>
        <div className="kpi-label"><Icon size={13} color={item.color} />{item.label}</div><div className="kpi-value">{item.value}</div><div className="kpi-foot">{item.foot}</div>
      </article>;
    })}</section>
    <div className="two-col">
      <Card title="Test model performance" note="Compare one error metric at a time; lower values indicate smaller error." right={<Select label="Metric" value={metric} onChange={value => setMetric(value as MetricKey)} testId="select-overview-metric" options={metricKeys.map(key => ({ value: key, label: metricMeta[key].label }))} />}>
        <MetricBars metrics={testMetrics} metric={metric} />
        <p className="small-muted">{metricMeta[metric].description} Values are test-set results.</p>
      </Card>
      <Card title="Test R² comparison" note="Coefficient of determination · fixed axis range from 0 to 1">
        <div className="chart-wrap compact" data-testid="chart-test-r2"><ResponsiveContainer width="100%" height="100%">
          <BarChart data={testR2} layout="vertical" margin={{ top: 4, right: 22, left: 8, bottom: 4 }}>
            <CartesianGrid stroke="#e9edf2" horizontal={false} />
            <XAxis type="number" domain={[0, 1]} tick={{ fill: '#8a97a8', fontSize: 9 }} axisLine={{ stroke: '#dfe5ec' }} tickLine={false} />
            <YAxis dataKey="model" type="category" width={94} tick={{ fill: '#627187', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<Tip />} cursor={{ fill: '#f2f6fa' }} />
            <Bar dataKey="value" name="Test R²" radius={[0, 5, 5, 0]} maxBarSize={20} label={{ position: 'right', fill: '#46566c', fontSize: 9, formatter: (value: number) => value.toFixed(4) }}>
              {testR2.map(d => <Cell key={d.model} fill={d.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer></div>
      </Card>
    </div>
    <div className="section-title">Validation-to-test view</div>
    <Card title="R² by model and evaluation split" note="Each model keeps its color; lighter bars indicate validation and solid bars indicate test.">
      <R2GroupedChart />
      <LegendDots />
    </Card>
    <div className="section-title">What the results say</div>
    <div className="three-col">
      <Finding icon={<BarChart3 size={15} />} title="XGBoost leads this test evaluation" text="It recorded the lowest test MAE, RMSE and MAPE, and the highest test R² in this experiment." />
      <Finding icon={<Layers3 size={15} />} title="A strong tree-based baseline" text={`Random Forest reached a test R² of ${testMetrics.randomForest.r2.toFixed(4)} and offers a strong comparison point.`} />
      <Finding icon={<AlertTriangle size={15} />} title="LSTM generalization merits review" text={`LSTM test R² (${testMetrics.lstm.r2.toFixed(4)}) is substantially below its validation R² (${validationMetrics.lstm.r2.toFixed(4)}). The cause is not established.`} />
    </div>
    <div className="section-title">Dataset at a glance</div>
    <div className="two-col">
      <Card title="Study dataset" note={dataset.association}>
        <div className="metric-strip">
          <MiniStat label="Raw observations" value={dataset.rawRecords.toLocaleString('en-US')} foot="Minute-level records" />
          <MiniStat label="Modeling rows" value={dataset.hourlyRows.toLocaleString('en-US')} foot="Hourly dataset" />
          <MiniStat label="Target" value={dataset.targetUnit} foot={dataset.target} />
        <MiniStat label="Timezone" value={dataset.timezoneOffset} foot={dataset.timezoneName} />
        </div>
        <div className="chart-caption"><Clock3 size={12} />{dataset.rawRange}</div>
      </Card>
      <Card title="Data quality summary" note="Target completeness in the hourly dataset">
        <div className="metric-strip">
          <MiniStat label="Fully observed" value={dataset.fullyObserved.toLocaleString('en-US')} foot="Hourly target rows" />
          <MiniStat label="Missing targets" value={dataset.missingTargets.toLocaleString('en-US')} foot="Hourly power targets" />
          <MiniStat label="Partial hours" value={dataset.partiallyObserved.toLocaleString('en-US')} foot="Partially observed" />
          <MiniStat label="Zero-power readings" value={dataset.zeroPowerReadings.toLocaleString('en-US')} foot="Minute-level" />
        </div>
      </Card>
    </div>
  </>;
}

function Finding({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <article className="finding"><div className="finding-icon">{icon}</div><div><h3>{title}</h3><p>{text}</p></div></article>;
}

function MiniStat({ label, value, foot }: { label: string; value: string; foot: string }) {
  return <div className="mini-stat"><div className="mini-stat-label">{label}</div><div className="mini-stat-value">{value}</div><div className="mini-stat-foot">{foot}</div></div>;
}

function Comparison() {
  const [splitKey, setSplitKey] = useState<'validation' | 'test'>('test');
  const metrics = splitKey === 'test' ? testMetrics : validationMetrics;
  const chartMetricData = (metric: MetricKey) => modelKeys.map(model => ({ model: modelMeta[model].label, value: metrics[model][metric], fill: modelMeta[model].color }));
  const deltaData = modelKeys.map(model => ({ model: modelMeta[model].label, change: testMetrics[model].r2 - validationMetrics[model].r2, fill: modelMeta[model].color }));
  const configCards = [
    { model: 'randomForest' as const, title: 'Random Forest', items: [`${modelConfigurations.randomForest.trees} trees`, `Maximum depth: ${modelConfigurations.randomForest.maxDepth}`, `Random state: ${modelConfigurations.randomForest.randomState}`, `Training: ${modelConfigurations.randomForest.trainingTime}`] },
    { model: 'xgboost' as const, title: 'XGBoost', items: [`${modelConfigurations.xgboost.estimators} estimators · learning rate ${modelConfigurations.xgboost.learningRate}`, `Maximum depth: ${modelConfigurations.xgboost.maxDepth} · subsample ${modelConfigurations.xgboost.subsample} · column subsampling ${modelConfigurations.xgboost.columnSubsampling}`, `Early stopping patience ${modelConfigurations.xgboost.earlyStoppingPatience} · best validation iteration ${modelConfigurations.xgboost.bestValidationIteration}`, `Training: ${modelConfigurations.xgboost.trainingTime}`] },
    { model: 'lstm' as const, title: 'LSTM', items: [`Two layers × ${modelConfigurations.lstm.unitsPerLayer} units · dropout ${modelConfigurations.lstm.dropout} after each`, `Dense ${modelConfigurations.lstm.denseUnits} (ReLU) → output 1 (linear)`, `Input ${modelConfigurations.lstm.inputSteps} time steps × ${modelConfigurations.lstm.inputFeatures} features`, `Adam · learning rate ${modelConfigurations.lstm.learningRate} · MSE · batch ${modelConfigurations.lstm.batchSize} · max ${modelConfigurations.lstm.maximumEpochs} epochs`, `Training: ${modelConfigurations.lstm.trainingTime}`, `Best weights restored at epoch ${lstmTraining.bestWeightsEpoch}; ${lstmTraining.completedEpochs} epochs completed`] },
  ];
  return <>
    <PageIntro eyebrow="Results / model comparison" title="Performance across evaluation splits" text="Compare the recorded metrics without blending validation and test outcomes. The selected split controls both the table and each metric chart." extra={<Select label="Evaluation split" value={splitKey} onChange={value => setSplitKey(value as 'validation' | 'test')} testId="select-comparison-split" options={[{ value: 'validation', label: 'Validation' }, { value: 'test', label: 'Test' }]} />} />
    <Card title={`${splitKey === 'test' ? 'Test' : 'Validation'} metrics`} note={`${metrics.randomForest.samples.toLocaleString('en-US')} evaluation samples per model · power errors are in watts`}>
      <div className="table-wrap"><table aria-label={`${splitKey} model metrics`} data-testid="table-model-metrics">
        <thead><tr><th>Model</th><th>MAE</th><th>RMSE</th><th>R²</th><th>MAPE</th><th>Samples</th></tr></thead>
        <tbody>{modelKeys.map(model => <tr key={model}><td><ModelMark model={model} /></td>{metricKeys.map(metric => <td key={metric} className={bestModelForMetric(metric, metrics) === model ? 'best-cell' : ''}>{formatMetric(metric, metrics[model][metric])}{bestModelForMetric(metric, metrics) === model && <span aria-label="best for this metric"> · best</span>}</td>)}<td>{metrics[model].samples.toLocaleString('en-US')}</td></tr>)}</tbody>
      </table></div>
      <div className="chart-caption"><Check size={12} color="#18856f" />Best model is highlighted independently for each metric using the appropriate direction.</div>
    </Card>
    <div className="section-title">Metric-by-metric inspection</div>
    <div className="two-col">{metricKeys.map(metric => <Card key={metric} title={`${metricMeta[metric].label} comparison`} note={metricMeta[metric].description}>
      <div className="chart-wrap compact"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartMetricData(metric)} margin={{ top: 5, right: 12, left: 0, bottom: 3 }}>
         <CartesianGrid stroke="#e9edf2" vertical={false} /><XAxis dataKey="model" tick={{ fill: '#718096', fontSize: 9 }} axisLine={{ stroke: '#dfe5ec' }} tickLine={false} /><YAxis domain={metric === 'r2' ? [0, 1] : [0, 'auto']} tick={{ fill: '#8a97a8', fontSize: 9 }} axisLine={false} tickLine={false} width={42} /><Tooltip content={<Tip unit={metricMeta[metric].unit} explanation={metricMeta[metric].description} />} /><Bar dataKey="value" name={metricMeta[metric].label} radius={[4, 4, 0, 0]} maxBarSize={44}>{chartMetricData(metric).map(d => <Cell key={d.model} fill={d.fill} />)}</Bar>
      </BarChart></ResponsiveContainer></div><LegendDots />
    </Card>)}</div>
    <div className="two-col" style={{ marginTop: 15 }}>
      <Card title="Validation-to-test R² change" note="Test R² minus validation R²; negative values indicate lower R² on test.">
        <div className="chart-wrap compact" data-testid="chart-r2-change"><ResponsiveContainer width="100%" height="100%"><BarChart data={deltaData} margin={{ top: 8, right: 12, left: 0, bottom: 5 }}>
          <CartesianGrid stroke="#e9edf2" vertical={false} /><ReferenceLine y={0} stroke="#9aa8b9" /><XAxis dataKey="model" tick={{ fill: '#718096', fontSize: 9 }} axisLine={{ stroke: '#dfe5ec' }} tickLine={false} /><YAxis tick={{ fill: '#8a97a8', fontSize: 9 }} axisLine={false} tickLine={false} width={42} /><Tooltip content={<Tip explanation="Test R² minus validation R²; a negative change means lower test R²." />} /><Bar dataKey="change" name="R² change" radius={[4, 4, 0, 0]}>{deltaData.map(d => <Cell key={d.model} fill={d.fill} />)}</Bar>
        </BarChart></ResponsiveContainer></div><LegendDots />
      </Card>
      <Card title="Reading the split comparison" note="This is one recorded chronological evaluation, not a universal model ranking.">
        <ul className="list-bullet">{keyFindings.map(item => <li key={item}>{item}</li>)}</ul>
      </Card>
    </div>
    <div className="section-title">Recorded model configurations</div>
    <div className="three-col">{configCards.map(card => <Card key={card.model} title={card.title} right={<i className="model-chip" style={{ background: modelMeta[card.model].color }} />}>
      <ul className="list-bullet">{card.items.map(item => <li key={item}>{item}</li>)}</ul>
    </Card>)}</div>
    <div className="note-box" style={{ marginTop: 15 }}>Training times were measured on different hardware: CPU for Random Forest and LSTM, and an NVIDIA GeForce RTX 4050 Laptop GPU for XGBoost. They are not a fair standalone speed benchmark.</div>
  </>;
}

function Forecast() {
  const [model, setModel] = useState<ModelKey>('xgboost');
  const metrics = testMetrics[model];
  return <>
    <PageIntro eyebrow="Analysis / predictions" title="Forecast analysis" text="Inspect actual test-set model metrics and the boundary between the recorded evaluation and unavailable timestamp-level prediction series." extra={<Select label="Model" value={model} onChange={value => setModel(value as ModelKey)} testId="select-forecast-model" options={modelKeys.map(key => ({ value: key, label: modelMeta[key].label }))} />} />
    <div className="metric-strip" style={{ marginBottom: 15 }} data-testid="selected-model-test-metrics">
      <MiniStat label="Test MAE" value={formatMetric('mae', metrics.mae)} foot="Mean absolute error" />
      <MiniStat label="Test RMSE" value={formatMetric('rmse', metrics.rmse)} foot="Root mean squared error" />
      <MiniStat label="Test R²" value={formatMetric('r2', metrics.r2)} foot="Coefficient of determination" />
      <MiniStat label="Test MAPE" value={formatMetric('mape', metrics.mape)} foot={`${metrics.samples.toLocaleString('en-US')} evaluation samples`} />
    </div>
    <div className="two-col">
      <Card title={`${modelMeta[model].label} · test error profile`} note="Recorded errors in watts; RMSE places more weight on larger prediction errors.">
        <SelectedModelErrorChart model={model} />
        <div className="chart-caption"><i className="legend-dot" style={{ background: modelMeta[model].color }} />Both values belong to {modelMeta[model].label}.</div>
      </Card>
      <Card title="What an actual-vs-predicted view would show" note="Conceptual explanation only — not a generated chart">
        <div className="info-box">A timestamp-level forecast comparison would align observed hourly mean active power (W) with the model’s predicted power (W) at each timestamp, then inspect how the two traces diverge across the held-out test period.</div>
        <div className="section-title" style={{ marginTop: 17 }}>What is available now</div>
        <ul className="list-bullet"><li>Fixed aggregate test metrics for all three models.</li><li>Recorded sample counts for the held-out test set.</li><li>Verified LSTM residual summary statistics.</li></ul>
      </Card>
    </div>
    <div className="section-title">Timestamp-series visualization</div>
    <section className="card">
      <div className="card-head"><div><h2 className="card-title">Actual vs. predicted hourly power</h2><p className="card-note">Series data was not embedded in the project’s fixed research values.</p></div><span className="tag orange"><CircleHelp size={11} />Unavailable</span></div>
      <div className="empty-series" data-testid="status-timestamp-series-unavailable"><div className="empty-series-inner"><div className="empty-icon"><Activity size={17} /></div><h3>Timestamp-level predictions are not available here</h3><p>The complete timestamp-by-timestamp prediction series is not supplied. No synthetic timestamps, actual readings, or forecast lines are generated for this dashboard.</p></div></div>
    </section>
    <div className="section-title">Verified residual context</div>
    <div className="two-col">
      <Card title="LSTM test residual summary" note={`Residual convention: ${lstmResiduals.definition}. Summary is in kW.`}>
        <div className="metric-strip"><MiniStat label="Mean residual" value={`+${lstmResiduals.meanKw.toFixed(2)} kW`} foot="Slight average underprediction" /><MiniStat label="Residual std. dev." value={`${lstmResiduals.standardDeviationKw.toFixed(2)} kW`} foot="Substantial variability" /></div>
        <p className="small-muted" style={{ marginTop: 13 }}>{lstmResiduals.interpretation}</p>
      </Card>
      <Card title="Metric scale reference" note="Test errors shown for all three models">
        <div className="chart-wrap compact"><ResponsiveContainer width="100%" height="100%"><BarChart data={modelKeys.map(key => ({ model: modelMeta[key].label, MAE: testMetrics[key].mae, RMSE: testMetrics[key].rmse }))} margin={{ top: 6, right: 10, left: 0, bottom: 3 }}>
          <CartesianGrid stroke="#e9edf2" vertical={false} /><XAxis dataKey="model" tick={{ fill: '#718096', fontSize: 9 }} axisLine={{ stroke: '#dfe5ec' }} tickLine={false} /><YAxis tick={{ fill: '#8a97a8', fontSize: 9 }} axisLine={false} tickLine={false} width={48} /><Tooltip content={<Tip unit="W" explanation="MAE is average absolute error; RMSE emphasizes larger errors." />} /><Legend wrapperStyle={{ fontSize: 9, color: '#718096' }} /><Bar dataKey="MAE" fill="#3B82F6" radius={[4,4,0,0]} /><Bar dataKey="RMSE" fill="#14B8A6" radius={[4,4,0,0]} />
        </BarChart></ResponsiveContainer></div>
      </Card>
    </div>
  </>;
}

function Features() {
  const [model, setModel] = useState<'randomForest' | 'xgboost'>('xgboost');
  const [limit, setLimit] = useState<'5' | '10'>('10');
  const features = featureImportance[model].slice(0, Number(limit));
  return <>
    <PageIntro eyebrow="Interpretability / tree models" title="Feature importance" text="Recorded importance values from fitted Random Forest and XGBoost models. Rankings describe model-specific predictive relationships, not causation." extra={<div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}><Select label="Model" value={model} onChange={value => setModel(value as 'randomForest' | 'xgboost')} testId="select-feature-model" options={[{ value: 'randomForest', label: 'Random Forest' }, { value: 'xgboost', label: 'XGBoost' }]} /><Select label="Show ranks" value={limit} onChange={value => setLimit(value as '5' | '10')} testId="select-feature-count" options={[{ value: '5', label: 'Top 5' }, { value: '10', label: 'Top 10' }]} /></div>} />
    <div className="two-col">
      <Card title={`${modelMeta[model].label} recorded ranking`} note={`Showing ${features.length} listed features · descending importance (%)`}>
        <div className="chart-wrap tall" data-testid="chart-feature-importance"><ResponsiveContainer width="100%" height="100%"><BarChart data={features} layout="vertical" margin={{ top: 3, right: 35, left: 15, bottom: 2 }}>
          <CartesianGrid stroke="#e9edf2" horizontal={false} /><XAxis type="number" tick={{ fill: '#8a97a8', fontSize: 9 }} axisLine={{ stroke: '#dfe5ec' }} tickLine={false} /><YAxis dataKey="feature" type="category" width={142} tick={{ fill: '#52637a', fontSize: 9, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} /><Tooltip content={({ active, payload }) => active && payload?.[0] ? <div className="plot-tooltip"><strong>{payload[0].payload.feature}</strong><span>{Number(payload[0].value).toFixed(2)}% importance</span></div> : null} /><Bar dataKey="importance" name="Importance (%)" fill={modelMeta[model].color} radius={[0, 4, 4, 0]} barSize={19} label={{ position: 'right', fill: '#56667b', fontSize: 9, formatter: (value: number) => `${value.toFixed(2)}%` }} />
        </BarChart></ResponsiveContainer></div><div className="chart-caption"><i className="legend-dot" style={{ background: modelMeta[model].color }} />{modelMeta[model].label} · importance (%)</div>
      </Card>
      <Card title="Ranked feature table" note="Only recorded feature values are listed; no missing ranks are inferred.">
        <div className="table-wrap"><table aria-label={`${modelMeta[model].label} feature importance`} data-testid="table-feature-importance"><thead><tr><th>Rank</th><th>Feature</th><th>Importance</th></tr></thead><tbody>{features.map((item, index) => <tr key={item.feature} data-testid={`row-feature-${item.feature}`}><td>{String(index + 1).padStart(2, '0')}</td><td><code className="feature-label">{item.feature}</code></td><td className="best-cell">{item.importance.toFixed(2)}%</td></tr>)}</tbody></table></div>
        <div className="note-box" style={{ marginTop: 13 }}>Importance reflects relationships learned by this fitted model; it does not establish that a feature causes electricity demand.</div>
      </Card>
    </div>
    <div className="section-title">Interpretation guide</div>
    <Card title="What the listed features represent" note="Definitions follow the supplied project descriptions; remaining computation details follow the feature-engineering pipeline.">
      <div className="definition-list">{features.map(item => <div className="definition" key={item.feature}><code>{item.feature}</code><span>{featureDefinitions[item.feature] ?? "Definition follows the project's feature-engineering pipeline."}</span></div>)}</div>
    </Card>
    <div className="section-title">Model-level observations</div>
    <div className="three-col">
      <Finding icon={<Clock3 size={15} />} title="Recent history matters" text="Both tree models assign strong importance to recent consumption history, especially power_lag_1." />
      <Finding icon={<BarChart3 size={15} />} title="Random Forest concentrates" text={`Random Forest assigns ${featureImportance.randomForest[0].importance.toFixed(2)}% importance to power_lag_1.`} />
      <Finding icon={<Layers3 size={15} />} title="XGBoost spreads importance" text="XGBoost distributes more importance across the recent lag, energy lag, and time-related features." />
    </div>
    <p className="small-muted" style={{ marginTop: 12 }}>Feature importance values are not available for the LSTM and are not shown as LSTM importance.</p>
  </>;
}

function Lstm() {
  const validation = validationMetrics.lstm;
  const test = testMetrics.lstm;
  const r2Data = [{ split: 'Validation', value: validation.r2 }, { split: 'Test', value: test.r2 }];
  const arch = [
    { title: 'Input sequence', detail: `${modelConfigurations.lstm.inputSteps} historical time steps × ${modelConfigurations.lstm.inputFeatures} features`, type: 'primary' },
    { title: 'LSTM', detail: `${modelConfigurations.lstm.unitsPerLayer} units · return sequences`, type: 'violet' },
    { title: 'Dropout', detail: `${modelConfigurations.lstm.dropout}`, type: '' },
    { title: 'LSTM', detail: `${modelConfigurations.lstm.unitsPerLayer} units`, type: 'violet' },
    { title: 'Dropout', detail: `${modelConfigurations.lstm.dropout}`, type: '' },
    { title: 'Dense', detail: `${modelConfigurations.lstm.denseUnits} units · ReLU`, type: 'primary' },
    { title: 'Output', detail: '1 unit · linear', type: 'primary' },
    { title: 'Prediction', detail: 'Hourly power (W)', type: 'output' },
  ];
  return <>
    <PageIntro eyebrow="Deep learning / model analysis" title="LSTM architecture & generalization" text="The recurrent model used historical feature sequences. Its validation result is materially stronger than its held-out test result; the experiment does not establish why." />
    <Card title="Recorded model architecture" note="Explanatory network flow based on the configured LSTM; architecture diagram is not a training trace.">
      <div className="architecture" data-testid="lstm-architecture">{arch.map((node, index) => <div style={{ display: 'contents' }} key={`${node.title}-${index}`}><div className={`arch-node ${node.type}`}><b>{node.title}</b><span>{node.detail}</span></div>{index < arch.length - 1 && <div className="arch-arrow"><ChevronRight size={15} /></div>}</div>)}</div>
    </Card>
    <div className="section-title">Recorded evaluation metrics</div>
    <Card title="Validation and test results" note="Both sets have their own evaluation sample counts; errors are in W.">
      <div className="table-wrap"><table aria-label="LSTM validation and test metrics"><thead><tr><th>Split</th><th>MAE</th><th>RMSE</th><th>R²</th><th>MAPE</th><th>Samples</th></tr></thead><tbody><tr><td><span className="tag violet">Validation</span></td><td>{formatMetric('mae', validation.mae)}</td><td>{formatMetric('rmse', validation.rmse)}</td><td>{formatMetric('r2', validation.r2)}</td><td>{formatMetric('mape', validation.mape)}</td><td>{validation.samples.toLocaleString('en-US')}</td></tr><tr><td><span className="tag orange">Test</span></td><td>{formatMetric('mae', test.mae)}</td><td>{formatMetric('rmse', test.rmse)}</td><td>{formatMetric('r2', test.r2)}</td><td>{formatMetric('mape', test.mape)}</td><td>{test.samples.toLocaleString('en-US')}</td></tr></tbody></table></div>
    </Card>
    <div className="two-col" style={{ marginTop: 15 }}>
      <Card title="R² generalization comparison" note="Fixed axis from 0 to 1; validation versus held-out test">
        <div className="chart-wrap" data-testid="chart-lstm-generalization"><ResponsiveContainer width="100%" height="100%"><BarChart data={r2Data} margin={{ top: 12, right: 20, left: 2, bottom: 5 }}>
          <CartesianGrid stroke="#e9edf2" vertical={false} /><XAxis dataKey="split" tick={{ fill: '#718096', fontSize: 10 }} axisLine={{ stroke: '#dfe5ec' }} tickLine={false} /><YAxis domain={[0, 1]} tick={{ fill: '#8a97a8', fontSize: 9 }} axisLine={false} tickLine={false} width={35} /><Tooltip content={<Tip explanation={metricMeta.r2.description} />} /><Bar dataKey="value" name="R²" fill={modelMeta.lstm.color} radius={[5, 5, 0, 0]} barSize={54} label={{ position: 'top', fill: '#4e5d72', fontSize: 10, formatter: (value: number) => value.toFixed(4) }}><Cell fill="#8B5CF6" /><Cell fill="#b9a3f8" /></Bar>
        </BarChart></ResponsiveContainer></div>
      </Card>
      <Card title="Generalization gap" note="Evidence describes the observed gap; cause remains undetermined.">
        <div className="callout-number">{(validation.r2 - test.r2).toFixed(4)} <span style={{ font: '500 11px var(--app-font-mono)', color: '#77869a' }}>R² difference</span></div>
        <p className="small-muted" style={{ marginTop: 10 }}>The LSTM performs substantially better on the validation set than on the held-out test set. This suggests that its generalization should be investigated further; the current experiment does not establish the cause.</p>
        <div className="note-box" style={{ marginTop: 12 }}>The model comparison is also subject to the limitation that tree models and LSTM may use slightly different temporal covariate information.</div>
      </Card>
    </div>
    <div className="section-title">Training process · verified facts</div>
    <div className="two-col">
      <Card title="Epoch and early-stopping summary" note="No epoch-level loss values were provided, so no loss curve is displayed.">
        <div className="metric-strip">
          <MiniStat label="Completed epochs" value={String(lstmTraining.completedEpochs)} foot="Of maximum 50 epochs" />
          <MiniStat label="Best weights restored" value={`Epoch ${lstmTraining.bestWeightsEpoch}`} foot="Best validation weights" />
          <MiniStat label="Early stopping" value={`Patience ${lstmTraining.earlyStoppingPatience}`} foot="Enabled" />
          <MiniStat label="Training time" value={`${lstmTraining.trainingTimeSeconds.toFixed(2)} s`} foot="CPU" />
        </div>
        <div className="section-title" style={{ marginTop: 17 }}>Training controls</div>
        <div className="definition-list">
          <div className="definition"><code>LR reduction</code><span>Factor {lstmTraining.lrReductionFactor} · patience {lstmTraining.lrReductionPatience}</span></div>
          <div className="definition"><code>Minimum LR</code><span>{lstmTraining.minimumLearningRate.toFixed(5)}</span></div>
          <div className="definition"><code>Optimizer</code><span>{modelConfigurations.lstm.optimizer}</span></div>
          <div className="definition"><code>Loss</code><span>{modelConfigurations.lstm.loss}</span></div>
        </div>
      </Card>
      <Card title="Training process, conceptually" note="Sequence shows the verified training procedure, not unprovided epoch outcomes.">
        <div className="step-list">{[
          ['Fit sequence model', 'Train with Adam and mean squared error on CPU.'],
          ['Monitor validation', `Early stopping patience ${lstmTraining.earlyStoppingPatience}; learning-rate reduction patience ${lstmTraining.lrReductionPatience}.`],
          ['Restore best weights', `Best validation weights restored at epoch ${lstmTraining.bestWeightsEpoch}.`],
          ['Record result', `${lstmTraining.completedEpochs} epochs completed; ${lstmTraining.trainingTimeSeconds.toFixed(2)} seconds reported.`],
        ].map((item, index) => <div className="step" key={item[0]}><div className="step-num">{String(index + 1).padStart(2, '0')}</div><div><h3>{item[0]}</h3><p>{item[1]}</p></div></div>)}</div>
      </Card>
    </div>
  </>;
}

function Anomalies() {
  const [screeningStep, setScreeningStep] = useState(0);
  return <>
    <PageIntro eyebrow="Exploratory / residuals" title="Residual analysis, not detection" text="A transparent summary of available LSTM residual statistics and the research needed before anomaly claims could be made." extra={<span className="tag orange" data-testid="status-anomaly-not-validated"><AlertTriangle size={12} />Exploratory Analysis — Not Validated</span>} />
    <div className="status-banner"><AlertTriangle size={17} /><div><strong>No completed, validated anomaly detector is available in these results.</strong><p>This page communicates current research status and proposed next steps only. No detections, labeled fault events, or detection-performance metrics are reported.</p></div></div>
    <div className="section-title">Verified LSTM residual statistics</div>
    <div className="two-col">
      <Card title="Residual summary" note={`Definition: ${lstmResiduals.definition}. Units are kilowatts (kW), as recorded in the residual summary.`}>
        <div className="metric-strip"><MiniStat label="Mean residual" value={`+${lstmResiduals.meanKw.toFixed(2)} kW`} foot="Slight average underprediction" /><MiniStat label="Residual std. dev." value={`${lstmResiduals.standardDeviationKw.toFixed(2)} kW`} foot="Substantial residual variability" /></div>
        <div className="info-box" style={{ marginTop: 13 }}>{lstmResiduals.interpretation}</div>
      </Card>
      <Card title="What this summary does not contain" note="The fixed project information contains aggregate statistics only.">
        <ul className="list-bullet"><li>No individual timestamp-level residual records.</li><li>No residual distribution samples or histogram data.</li><li>No selected screening threshold or validated classification rule.</li><li>No confirmed anomaly counts, events, or detection scores.</li></ul>
      </Card>
    </div>
    <div className="section-title">How a future residual screen could be evaluated</div>
    <Card title="Exploratory workflow" note="Interactive explainer: advance through the conceptual steps. This does not run a detector or classify any observations." right={<button className="text-button" data-testid="button-next-screening-step" onClick={() => setScreeningStep((screeningStep + 1) % 4)}>Next step <ArrowRight size={13} /></button>}>
      <div className="step-list">{[
        ['Define residual basis', 'Compare actual and predicted power using the stated residual convention: Actual − Predicted.'],
        ['Set a screening rule', 'Choose and justify a candidate threshold using a defined method; no threshold is established in these results.'],
        ['Review candidate intervals', 'A high residual would be a candidate for review—not automatically a confirmed anomaly.'],
        ['Evaluate with labels', 'Use labeled evaluation data and report precision, recall, and F1 before making detector claims.'],
      ].map((item, index) => <div className="step" key={item[0]} style={{ opacity: screeningStep === index ? 1 : 0.7 }}><div className="step-num" style={screeningStep === index ? { background: '#fff2dc', color: '#a9670e' } : undefined}>{String(index + 1).padStart(2, '0')}</div><div><h3>{item[0]} {screeningStep === index && <span className="tag orange" style={{ marginLeft: 6 }}>Focus</span>}</h3><p>{item[1]}</p></div></div>)}</div>
    </Card>
    <div className="section-title">Research next steps</div>
    <div className="three-col">
      <Finding icon={<ScanSearch size={15} />} title="Specify a method" text="Select and document a defined anomaly-detection or residual-screening method." />
      <Finding icon={<Gauge size={15} />} title="Select a threshold" text="Establish a defensible threshold-selection process before inspecting outcomes." />
      <Finding icon={<Table2 size={15} />} title="Evaluate with labels" text="Acquire labeled evaluation data and report precision, recall, and F1." />
    </div>
    <div className="note-box" style={{ marginTop: 15 }}>This research has not verified anomaly labels, electricity-theft detections, fault events, anomaly timestamps, or precision/recall/F1/ROC-AUC/PR-AUC values.</div>
  </>;
}

function Methodology() {
  const splitSections = [
    { label: 'Training', detail: `Through ${split.training.end}`, count: split.training.evaluated, total: split.training.rows, missing: split.training.missing, color: '#3B82F6' },
    { label: 'Validation', detail: `${split.validation.start} – ${split.validation.end}`, count: split.validation.evaluated, total: split.validation.rows, missing: split.validation.missing, color: '#14B8A6' },
    { label: 'Test', detail: `${split.test.start} – ${split.test.end}`, count: split.test.evaluated, total: split.test.rows, missing: split.test.missing, color: '#8B5CF6' },
  ];
  return <>
    <PageIntro eyebrow="Study design / reproducibility" title="Methodology & study boundaries" text="The actual experimental workflow, feature groups, chronology, and limits of the available evidence." />
    <div className="two-col">
      <Card title="Experimental workflow" note="Sequence of the completed project">
        <div className="step-list">{pipeline.map((step, index) => <div className="step" key={step}><div className="step-num">{String(index + 1).padStart(2, '0')}</div><div><h3>{step}</h3><p>{index === 0 ? `${dataset.rawRecords.toLocaleString('en-US')} minute-level records, ${dataset.rawRange}.` : index === 2 ? `${dataset.hourlyRows.toLocaleString('en-US')} hourly rows; target is hourly mean active power in W.` : index === 4 ? 'Chronological boundaries are displayed below in Asia/Kolkata time.' : index === 6 ? 'MAE, RMSE, R², and MAPE on validation and test sets.' : 'Completed project stage.'}</p></div></div>)}</div>
      </Card>
      <Card title="Dataset profile" note={dataset.description}>
        <div className="metric-strip">
          <MiniStat label="Raw dataset" value={dataset.rawRecords.toLocaleString('en-US')} foot="Minute-level rows" />
          <MiniStat label="Modeling dataset" value={dataset.hourlyRows.toLocaleString('en-US')} foot="Hourly rows" />
          <MiniStat label="Engineered data" value={`${dataset.engineeredColumns} cols`} foot={`${dataset.engineeredRows.toLocaleString('en-US')} rows`} />
          <MiniStat label="Target variable" value="Power · W" foot="Hourly mean active power" />
        </div>
        <div className="section-title" style={{ marginTop: 17 }}>Coverage</div>
        <div className="timeline-line"><i className="timeline-marker" style={{ left: '0%' }} /><i className="timeline-marker" style={{ left: '100%', background: '#14b8a6' }} /></div>
        <div className="timeline-labels"><div className="timeline-label"><b>START</b>{dataset.rawStart}</div><div className="timeline-label" style={{ textAlign: 'right' }}><b>END</b>{dataset.rawEnd}</div></div>
        <p className="small-muted">Timezone: {dataset.timezone}. The timeline represents the recorded dataset coverage—not a plotted history of hourly power.</p>
      </Card>
    </div>
    <div className="section-title">Chronological evaluation split</div>
    <Card title="Temporal split and evaluated samples" note={`Timezone: ${split.timezone}. The model results use a single chronological split.`}>
      <div className="split-track" aria-label="Chronological split: training, validation, test"><div /><div /><div /></div>
      <div className="split-legend"><span className="legend-item"><i className="legend-dot" style={{ background: '#3B82F6' }} />Training</span><span className="legend-item"><i className="legend-dot" style={{ background: '#14B8A6' }} />Validation</span><span className="legend-item"><i className="legend-dot" style={{ background: '#8B5CF6' }} />Test</span></div>
      <div className="table-wrap" style={{ marginTop: 14 }}><table aria-label="Chronological split details"><thead><tr><th>Split</th><th>Time boundaries</th><th>Rows before target filtering</th><th>Missing targets</th><th>Evaluated samples</th></tr></thead><tbody>{splitSections.map((section, index) => <tr key={section.label}><td><span className="model-name"><i className="model-chip" style={{ background: section.color }} />{section.label}</span></td><td>{index === 0 ? `Through ${split.training.end}` : `${index === 1 ? split.validation.start : split.test.start} – ${section.detail.split(' – ')[1]}`}</td><td>{section.total.toLocaleString('en-US')}</td><td>{section.missing.toLocaleString('en-US')}</td><td className="best-cell">{section.count.toLocaleString('en-US')}</td></tr>)}</tbody></table></div>
    </Card>
    <div className="section-title">Feature-engineering design</div>
    <div className="two-col">
      <Card title="Reported predictor groups" note={`${dataset.engineeredColumns} engineered columns; reported model predictor set uses 39 features.`}>
        <div className="definition-list">
          <div className="definition"><code>Power lags</code><span>{featureGroups.powerLags.join(', ')} hours</span></div>
          <div className="definition"><code>Energy lags</code><span>{featureGroups.energyLags.join(', ')} hours</span></div>
          <div className="definition"><code>Rolling means</code><span>{featureGroups.rollingWindows.join(', ')} hour windows</span></div>
          <div className="definition"><code>Rolling standard deviations</code><span>Same windows: {featureGroups.rollingWindows.join(', ')} hours</span></div>
          <div className="definition"><code>Cyclical time</code><span>{featureGroups.cyclical.join(', ')} encodings</span></div>
          <div className="definition"><code>Other descriptors</code><span>Calendar descriptors and lagged power-range features</span></div>
        </div>
        <div className="info-box" style={{ marginTop: 13 }}>Lagged rolling features use historical observations and exclude the current target.</div>
      </Card>
      <Card title="Target and units" note="Power is not energy">
        <div className="callout-number">W <span style={{ font: '500 11px var(--app-font-mono)', color: '#77869a' }}>watts · power</span></div>
        <p className="small-muted">The target variable is hourly mean active power. Do not interpret power in W as energy in kWh. The source readings also include current, voltage, frequency, and power factor.</p>
        <div className="section-title" style={{ marginTop: 17 }}>Data quality counts</div>
        <ul className="list-bullet"><li>{dataset.missingTargets.toLocaleString('en-US')} missing hourly power targets.</li><li>{dataset.fullyObserved.toLocaleString('en-US')} fully observed hourly targets and {dataset.partiallyObserved.toLocaleString('en-US')} partially observed hours.</li><li>{dataset.zeroPowerReadings.toLocaleString('en-US')} minute-level zero-power readings.</li></ul>
      </Card>
    </div>
    <div className="section-title">Limitations to keep in view</div>
    <Card title="Interpretation boundaries" note="These constraints apply to claims made from the current study.">
      <div className="three-col">{limitations.map((item, index) => <div className="definition" key={item}><code>LIMITATION {String(index + 1).padStart(2, '0')}</code><span>{item}</span></div>)}</div>
    </Card>
    <div className="note-box" style={{ marginTop: 15 }}>Training times are reported observations on different hardware, not a fair standalone speed benchmark. Timestamp-level predictions, prediction intervals, and uncertainty estimates are not available in the fixed project data.</div>
  </>;
}

function NotFoundPage() {
  return <div className="card"><h1 className="h1">Page not found</h1><p className="lede">This route is not part of the WattWise research dashboard.</p><Link href="/" className="tag blue" data-testid="link-back-overview">Return to overview <ArrowRight size={12} /></Link></div>;
}

function DashboardRouter() {
  return <Shell><Switch>
    <Route path="/" component={Overview} />
    <Route path="/comparison" component={Comparison} />
    <Route path="/forecast" component={Forecast} />
    <Route path="/features" component={Features} />
    <Route path="/lstm" component={Lstm} />
    <Route path="/anomalies" component={Anomalies} />
    <Route path="/methodology" component={Methodology} />
    <Route component={NotFoundPage} />
  </Switch></Shell>;
}

function App() {
  return <DashboardRouter />;
}

export default App;
