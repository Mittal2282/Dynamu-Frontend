import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from '../../api/adminAxios';

const STEPS = ['Restaurant Details', 'Import Menu', 'Done'];

const CSV_SAMPLE = `Category,Item Name,Price,Is Veg,Spice Level,Description
Starters,Paneer Tikka,299,true,2,Marinated cottage cheese grilled in tandoor
Starters,Chicken Wings,349,false,3,Crispy fried wings with hot sauce
Main Course,Dal Makhani,249,true,1,Slow-cooked black lentils in butter
Main Course,Chicken Biryani,399,false,2,Aromatic basmati rice with spiced chicken`;

function Step1({ form, onChange, onNext, loading, error }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white">Restaurant Details</h2>
        <p className="text-slate-400 text-sm mt-0.5">Basic information about the restaurant and its owner.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Restaurant Name *" value={form.name} name="name" onChange={onChange} placeholder="Spice Garden" />
        <Field label="Slug *" value={form.slug} name="slug" onChange={onChange} placeholder="spice-garden" hint="URL-friendly, lowercase, no spaces" />
        <Field label="Description" value={form.description} name="description" onChange={onChange} placeholder="A lovely family restaurant…" />
        <Field label="Phone" value={form.phone} name="phone" onChange={onChange} placeholder="+91 98765 43210" />
        <Field label="Email" value={form.email} name="email" onChange={onChange} type="email" placeholder="info@spicegarden.com" />
        <Field label="Opening Hours" value={form.opening_hours} name="opening_hours" onChange={onChange} placeholder="11:00 AM – 11:00 PM" />
        <Field label="City" value={form.city} name="city" onChange={onChange} placeholder="Mumbai" />
        <Field label="State" value={form.state} name="state" onChange={onChange} placeholder="Maharashtra" />
      </div>

      <div className="border-t border-white/10 pt-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Owner Account</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Owner Name *" value={form.owner_name} name="owner_name" onChange={onChange} placeholder="Rahul Sharma" />
          <Field label="Owner Email *" value={form.owner_email} name="owner_email" onChange={onChange} type="email" placeholder="rahul@spicegarden.com" />
          <Field label="Password *" value={form.owner_password} name="owner_password" onChange={onChange} type="password" placeholder="Min. 8 characters" />
        </div>
      </div>

      <div className="border-t border-white/10 pt-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Tables</h3>
        <div className="grid grid-cols-2 gap-4 max-w-xs">
          <Field label="Number of Tables *" value={form.table_count} name="table_count" onChange={onChange} type="number" placeholder="10" />
          <Field label="Starting Table #" value={form.start_number} name="start_number" onChange={onChange} type="number" placeholder="1" />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-60"
        >
          {loading ? 'Creating…' : 'Next: Import Menu →'}
        </button>
      </div>
    </div>
  );
}

function Step2({ restaurantId, onNext, onSkip }) {
  const [csvText, setCsvText] = useState('');
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSample, setShowSample] = useState(false);

  const parsePreview = (text) => {
    const lines = text.trim().split('\n').slice(1).filter(l => l.trim());
    return lines.slice(0, 5).map(line => {
      const parts = line.split(',');
      return { category: parts[0], name: parts[1], price: parts[2] };
    });
  };

  const handleImport = async () => {
    if (!csvText.trim()) { setError('Paste your CSV data first.'); return; }
    setError('');
    setLoading(true);
    try {
      await adminApi.post(`/api/superadmin/restaurants/${restaurantId}/menu`, { csvText });
      onNext();
    } catch (err) {
      setError(err.response?.data?.message || 'Import failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white">Import Menu</h2>
        <p className="text-slate-400 text-sm mt-0.5">Paste the restaurant's menu CSV or upload a file.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">{error}</div>
      )}

      <div>
        <button
          onClick={() => setShowSample(s => !s)}
          className="text-xs text-orange-400 hover:text-orange-300 mb-2 transition-colors"
        >
          {showSample ? '▲ Hide' : '▼ Show'} CSV Format Example
        </button>
        {showSample && (
          <pre className="bg-slate-800 rounded-lg p-4 text-xs text-slate-300 overflow-x-auto border border-white/10 mb-3">
            {CSV_SAMPLE}
          </pre>
        )}
      </div>

      <div>
        <label className="text-sm text-slate-400 block mb-1">Paste CSV Data</label>
        <textarea
          value={csvText}
          onChange={e => { setCsvText(e.target.value); setPreview(parsePreview(e.target.value)); }}
          rows={10}
          className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-orange-500 resize-y"
          placeholder={CSV_SAMPLE}
        />
      </div>

      {preview.length > 0 && (
        <div>
          <p className="text-xs text-slate-400 mb-2">Preview (first 5 items):</p>
          <div className="bg-slate-800 rounded-lg overflow-hidden border border-white/10">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-white/10">
                <th className="text-left px-3 py-2 text-slate-400">Category</th>
                <th className="text-left px-3 py-2 text-slate-400">Name</th>
                <th className="text-left px-3 py-2 text-slate-400">Price</th>
              </tr></thead>
              <tbody>{preview.map((r, i) => (
                <tr key={i} className="border-b border-white/5 last:border-0">
                  <td className="px-3 py-2 text-slate-300">{r.category}</td>
                  <td className="px-3 py-2 text-white font-medium">{r.name}</td>
                  <td className="px-3 py-2 text-orange-400">₹{r.price}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={onSkip}
          className="text-sm text-slate-400 hover:text-white transition-colors"
        >
          Skip for now →
        </button>
        <button
          onClick={handleImport}
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-60"
        >
          {loading ? 'Importing…' : 'Import Menu →'}
        </button>
      </div>
    </div>
  );
}

function Step3({ restaurantId }) {
  const navigate = useNavigate();
  const downloadWithAuth = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/superadmin/restaurants/${restaurantId}/qr-pdf`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('admin_access_token')}` } }
      );
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'qr-codes.pdf'; a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download PDF. Please try again.');
    }
  };

  return (
    <div className="text-center space-y-6 py-8">
      <div className="text-6xl">🎉</div>
      <div>
        <h2 className="text-2xl font-bold text-white">Restaurant Onboarded!</h2>
        <p className="text-slate-400 mt-2">The restaurant, owner account, tables, and menu have been set up.</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={downloadWithAuth}
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          📄 Download QR Codes PDF
        </button>
        <button
          onClick={() => navigate('/superadmin')}
          className="text-slate-300 hover:text-white font-medium px-6 py-3 rounded-lg border border-white/10 hover:border-white/30 transition-colors"
        >
          Back to Restaurants
        </button>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, type = 'text', placeholder, hint }) {
  return (
    <div>
      <label className="text-sm text-slate-400 block mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={e => onChange(name, e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500"
      />
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

export default function OnboardPage() {
  const [step, setStep] = useState(0);
  const [restaurantId, setRestaurantId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', slug: '', description: '', phone: '', email: '',
    opening_hours: '', city: '', state: '',
    owner_name: '', owner_email: '', owner_password: '',
    table_count: '10', start_number: '1',
  });

  const handleChange = (name, value) => {
    setForm(p => ({ ...p, [name]: value }));
    // Auto-slug from name
    if (name === 'name' && !form.slug) {
      setForm(p => ({ ...p, [name]: value, slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }));
    }
  };

  const handleStep1 = async () => {
    const required = ['name', 'slug', 'owner_name', 'owner_email', 'owner_password'];
    for (const f of required) {
      if (!form[f]) { setError(`${f.replace(/_/g, ' ')} is required`); return; }
    }
    setError('');
    setLoading(true);
    try {
      const res = await adminApi.post('/api/superadmin/restaurants', {
        name: form.name,
        slug: form.slug,
        description: form.description,
        contact: { phone: form.phone, email: form.email },
        address: { city: form.city, state: form.state },
        owner_name: form.owner_name,
        owner_email: form.owner_email,
        owner_password: form.owner_password,
      });
      const rid = res.data.data.restaurant._id;
      setRestaurantId(rid);

      // Create tables if count > 0
      const count = parseInt(form.table_count);
      if (count > 0) {
        await adminApi.post(`/api/superadmin/restaurants/${rid}/tables`, {
          count,
          start_number: parseInt(form.start_number) || 1,
        });
      }
      setStep(1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create restaurant.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <button onClick={() => window.history.back()} className="hover:text-white transition-colors">Restaurants</button>
        <span>/</span>
        <span className="text-white">Onboard New Restaurant</span>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`flex items-center gap-2 text-sm font-medium transition-colors
              ${i === step ? 'text-orange-400' : i < step ? 'text-green-400' : 'text-slate-500'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                ${i === step ? 'bg-orange-500 text-white' : i < step ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className="hidden sm:block">{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-8 sm:w-16 h-0.5 mx-2 ${i < step ? 'bg-green-500' : 'bg-slate-700'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-white/10">
        {step === 0 && (
          <Step1 form={form} onChange={handleChange} onNext={handleStep1} loading={loading} error={error} />
        )}
        {step === 1 && (
          <Step2 restaurantId={restaurantId} onNext={() => setStep(2)} onSkip={() => setStep(2)} />
        )}
        {step === 2 && (
          <Step3 restaurantId={restaurantId} />
        )}
      </div>
    </div>
  );
}
