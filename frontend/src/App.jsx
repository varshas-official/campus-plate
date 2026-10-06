import { useCallback, useEffect, useState } from 'react'
import { Activity, ArrowDownRight, ArrowUpRight, Check, ChevronDown, CircleHelp, Clock3, CookingPot, Leaf, LoaderCircle, Menu, Plus, RefreshCw, Sparkles, Utensils, X } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart } from 'recharts'
import { createPrediction, getDashboard, getHistory, getModel, getPredictions } from './api'

const today = new Date().toISOString().slice(0, 10)
const todayLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date()).toUpperCase()
const number = (value) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(value || 0))
const shortDate = (value) => new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

function StatCard({ label, value, suffix, icon: Icon, tone, note, trend }) {
  return <article className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={18} strokeWidth={1.8} /></div><div className="stat-label">{label}</div><div className="stat-value">{value}<span>{suffix}</span></div><div className="stat-note">{trend && <span className="trend"><ArrowDownRight size={14} />{trend}</span>}{note}</div></article>
}

function App() {
  const [stats, setStats] = useState(null)
  const [predictions, setPredictions] = useState([])
  const [history, setHistory] = useState([])
  const [model, setModel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [result, setResult] = useState(null)
  const [form, setForm] = useState({ date: today, meal_type: 'Lunch', expected_students: '420', previous_avg_consumption: '390', previous_food_waste: '28' })

  const refresh = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [nextStats, nextPredictions, nextHistory, nextModel] = await Promise.all([getDashboard(), getPredictions(), getHistory(), getModel()])
      setStats(nextStats); setPredictions(nextPredictions); setHistory(nextHistory); setModel(nextModel)
    } catch (err) { setError(`${err.message}. Check that the backend is running on port 8000.`) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  async function submit(event) {
    event.preventDefault(); setSubmitting(true); setError(''); setNotice('')
    try {
      const created = await createPrediction({ ...form, expected_students: Number(form.expected_students), previous_avg_consumption: Number(form.previous_avg_consumption), previous_food_waste: Number(form.previous_food_waste) })
      setResult(created); setNotice('Your meal plan is ready.'); await refresh()
    } catch (err) { setError(err.message) }
    finally { setSubmitting(false) }
  }

  const chartData = history.slice(-12).map(row => ({ ...row, label: shortDate(row.date), demand: Math.round(row.predicted_demand), actual: row.actual_consumption == null ? null : Math.round(row.actual_consumption) }))

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#top"><span className="brand-mark"><Leaf size={20} fill="currentColor" /></span><span>campus<span className="brand-light">plate</span><small>FOOD INTELLIGENCE</small></span></a>
      <div className="nav-caption">WORKSPACE</div>
      <a className="nav-item active" href="#overview"><Activity size={17} />Overview</a>
      <a className="nav-item" href="#plan"><Sparkles size={17} />Meal planner</a>
      <a className="nav-item" href="#history"><Clock3 size={17} />Prediction history</a>
      <div className="sidebar-bottom"><div className="sidebar-tip"><div className="tip-icon"><Leaf size={16} /></div><strong>Every plate counts.</strong><p>Smarter planning means less food left behind.</p><div className="tip-progress"><span style={{ width: `${Math.min(100, (stats?.estimated_waste_reduction || 0) * 2)}%` }} /></div><small>{number(stats?.estimated_waste_reduction)} portions saved so far</small></div><div className="profile"><div className="avatar">CF</div><div><strong>Campus Food Team</strong><small>Operations</small></div><ChevronDown size={15} /></div></div>
    </aside>
    <main className="main" id="top">
      <header className="topbar"><div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>Overview</strong></div><div className="top-actions"><span className="live-indicator"><i />Live workspace</span><button className="icon-button" aria-label="Refresh dashboard" onClick={refresh}><RefreshCw size={16} /></button><div className="avatar small-avatar">CF</div></div></header>
      <div className="content" id="overview">
        <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-line" />{todayLabel}</div><h1>Good afternoon, team <span>☀️</span></h1><p className="subtitle">A little foresight goes a long way. Here's your kitchen at a glance.</p></div><button className="primary-button" onClick={() => document.getElementById('plan').scrollIntoView({ behavior: 'smooth' })}><Plus size={17} />New prediction</button></section>
        {error && <div className="alert error-alert"><CircleHelp size={17} /><span>{error}</span><button aria-label="Dismiss" onClick={() => setError('')}><X size={15} /></button></div>}
        {notice && <div className="alert success-alert"><Check size={17} /><span>{notice}</span><button aria-label="Dismiss" onClick={() => setNotice('')}><X size={15} /></button></div>}
        <section className="stats-grid">
          <StatCard label="Meals predicted" value={loading ? '—' : number(stats?.total_meals_predicted)} icon={Utensils} tone="mint" note="Across all meal services" />
          <StatCard label="Average demand" value={loading ? '—' : number(stats?.average_predicted_demand)} suffix=" portions" icon={Activity} tone="blue" note="Per meal service" />
          <StatCard label="Est. food waste" value={loading ? '—' : number(stats?.estimated_food_waste)} suffix=" portions" icon={CookingPot} tone="amber" note="From planned servings" />
          <StatCard label="Waste avoided" value={loading ? '—' : number(stats?.estimated_waste_reduction)} suffix=" portions" icon={Leaf} tone="green" note="Vs. previous waste levels" />
        </section>
        <div className="dashboard-grid">
          <section className="panel trend-panel"><div className="panel-heading"><div><div className="section-kicker">DEMAND OVER TIME</div><h2>Meals served & predicted</h2></div><div className="legend"><span><i className="legend-dot predicted" />Predicted</span><span><i className="legend-dot actual" />Actual</span></div></div><div className="chart-wrap">{loading ? <div className="chart-loading"><LoaderCircle className="spin" /> Loading trend…</div> : <ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}><defs><linearGradient id="demandFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#58a882" stopOpacity={0.2} /><stop offset="95%" stopColor="#58a882" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#edf0ec" strokeDasharray="3 4" /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#909a91', fontSize: 11 }} dy={9} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#909a91', fontSize: 11 }} /><Tooltip contentStyle={{ border: '1px solid #e8ece8', borderRadius: 12, fontSize: 12, boxShadow: '0 8px 22px #1a33220d' }} /><Area type="monotone" dataKey="demand" name="Predicted" stroke="#4d9c78" strokeWidth={2.5} fill="url(#demandFill)" activeDot={{ r: 4 }} /><Area type="monotone" dataKey="actual" name="Actual" stroke="#91a8c1" strokeWidth={2} strokeDasharray="5 5" fill="none" activeDot={{ r: 4 }} /></AreaChart></ResponsiveContainer>}</div><div className="chart-footnote"><span>Based on meal service records</span><span className="period-chip">Last 12 services</span></div></section>
          <section className="panel waste-panel"><div className="panel-heading"><div><div className="section-kicker">A SMALLER FOOTPRINT</div><h2>Waste snapshot</h2></div><span className="leaf-badge"><Leaf size={15} /></span></div><div className="waste-summary"><div><strong>{number(stats?.estimated_food_waste)}</strong><span>planned surplus portions</span></div><div className="waste-change"><ArrowDownRight size={15} />{number(stats?.estimated_waste_reduction)}<small>saved</small></div></div><div className="waste-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData.slice(-7)} barSize={17} margin={{ top: 5, right: 0, left: -28, bottom: -3 }}><CartesianGrid vertical={false} stroke="#edf0ec" strokeDasharray="3 4" /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#909a91', fontSize: 10 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#909a91', fontSize: 10 }} /><Tooltip contentStyle={{ border: '1px solid #e8ece8', borderRadius: 10, fontSize: 11 }} /><Bar dataKey="estimated_waste" name="Estimated waste" fill="#e7b765" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div><div className="waste-callout"><span className="callout-icon"><Sparkles size={14} /></span><span>Small adjustments add up to a lighter footprint.</span></div></section>
        </div>
        <div className="lower-grid">
          <section className="panel form-panel" id="plan"><div className="panel-heading"><div><div className="section-kicker">PLAN YOUR NEXT SERVICE</div><h2>Get a demand forecast</h2></div><span className="ai-pill"><Sparkles size={13} />AI powered</span></div><p className="panel-description">Share a few details and we'll estimate what your kitchen needs.</p><form onSubmit={submit} className="prediction-form"><div className="form-grid"><label className="field"><span>Meal date</span><input required type="date" min={today} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></label><label className="field"><span>Meal service</span><select value={form.meal_type} onChange={e => setForm({ ...form, meal_type: e.target.value })}><option>Breakfast</option><option>Lunch</option><option>Dinner</option></select></label><label className="field"><span>Expected students</span><input required type="number" min="1" max="5000" value={form.expected_students} onChange={e => setForm({ ...form, expected_students: e.target.value })} /></label><label className="field"><span>Avg. past consumption</span><div className="input-suffix"><input required type="number" min="0" max="5000" value={form.previous_avg_consumption} onChange={e => setForm({ ...form, previous_avg_consumption: e.target.value })} /><span>portions</span></div></label><label className="field full-field"><span>Food waste from a similar meal</span><div className="input-suffix"><input required type="number" min="0" max="5000" value={form.previous_food_waste} onChange={e => setForm({ ...form, previous_food_waste: e.target.value })} /><span>portions</span></div></label></div><button className="primary-button submit-button" type="submit" disabled={submitting}>{submitting ? <><LoaderCircle className="spin" size={16} />Calculating forecast…</> : <><Sparkles size={16} />Generate forecast</>}</button></form></section>
          <section className={`panel result-panel ${result ? 'has-result' : ''}`}><div className="panel-heading"><div><div className="section-kicker">YOUR RECOMMENDATION</div><h2>{result ? 'Forecast is ready' : 'Next meal, planned better'}</h2></div><div className="result-orbit"><Leaf size={20} /></div></div>{result ? <div className="result-content"><div className="result-date">{shortDate(result.date)} · {result.meal_type}</div><div className="result-main"><strong>{number(result.predicted_requirement)}</strong><span>portions to prepare</span></div><div className="result-metrics"><div><span>Expected demand</span><strong>{number(result.predicted_demand)}</strong></div><div><span>Est. surplus</span><strong>{number(result.estimated_waste)} portions</strong></div><div><span>Waste reduction</span><strong className="reduction">{number(result.estimated_waste_reduction)} portions</strong></div></div><div className="success-note"><Check size={15} /> Saved to prediction history</div></div> : <div className="empty-result"><div className="plate-art"><div><Utensils size={25} /></div><span className="plate-leaf"><Leaf size={14} /></span></div><p>Run a forecast to see the right amount to prepare, plus the surplus you can avoid.</p><div className="empty-result-foot"><span><Check size={13} />Tailored to your campus</span><span><Check size={13} />Ready in seconds</span></div></div>}</section>
        </div>
        <section className="panel history-panel" id="history"><div className="panel-heading history-heading"><div><div className="section-kicker">YOUR RECENT ACTIVITY</div><h2>Prediction history</h2></div><button className="text-button" onClick={() => document.getElementById('history-table').scrollIntoView({ behavior: 'smooth' })}>View all <ArrowUpRight size={14} /></button></div><div className="table-scroll" id="history-table"><table><thead><tr><th>MEAL SERVICE</th><th>DATE</th><th>STUDENTS</th><th>DEMAND</th><th>TO PREPARE</th><th>EST. WASTE</th><th>STATUS</th></tr></thead><tbody>{loading ? <tr><td colSpan="7" className="table-empty"><LoaderCircle className="spin" size={17} /> Loading predictions…</td></tr> : predictions.slice(0, 8).map(item => <tr key={item.id}><td><span className={`meal-icon ${item.meal_type.toLowerCase()}`}>{item.meal_type === 'Breakfast' ? '☀' : item.meal_type === 'Lunch' ? '◒' : '☾'}</span><strong>{item.meal_type}</strong></td><td>{shortDate(item.date)}</td><td>{number(item.expected_students)}</td><td>{number(item.predicted_demand)}</td><td className="prepare-cell">{number(item.predicted_requirement)}</td><td>{number(item.estimated_waste)} portions</td><td><span className={`status ${item.actual_consumption != null ? 'completed' : 'upcoming'}`}><i />{item.actual_consumption != null ? 'Completed' : 'Upcoming'}</span></td></tr>)}{!loading && predictions.length === 0 && <tr><td colSpan="7" className="table-empty">No meal predictions yet. Create your first forecast above.</td></tr>}</tbody></table></div><div className="table-footer"><span>Showing {Math.min(predictions.length, 8)} of {predictions.length} meal predictions</span><span className="online-dot" />All data up to date</div></section>
        <section className="how-section"><div className="how-icon"><Sparkles size={17} /></div><div className="how-copy"><div className="section-kicker">TRANSPARENT BY DESIGN</div><h2>How the forecast works</h2><p>We train a Ridge regression model on {model?.training_rows || 30} sample meal records. It learns how student turnout, recent consumption, food waste, meal type, and the day of week relate to portions actually consumed. Then it estimates demand for your upcoming service. We add a small 5% serving buffer to help the kitchen avoid running short.</p></div><div className="model-card"><span>MODEL FIT ON SAMPLE DATA</span><strong>{model ? `${Math.round(model.training_r2 * 100)}%` : '—'}</strong><small>training R² score</small><div className="model-note">Ridge regression · {model?.training_rows || '—'} records</div></div></section>
        <footer className="footer"><span>Campus Plate <span>·</span> Better meals, less waste.</span><span>Built for a more sustainable campus <Leaf size={13} /></span></footer>
      </div>
    </main>
  </div>
}

export default App
