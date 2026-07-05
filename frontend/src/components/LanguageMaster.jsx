import { useState } from 'react';

function LanguageMaster({ languages, onAddLanguage, onUpdateLanguage, onDeleteLanguage }) {
  const [languageForm, setLanguageForm] = useState({ name: '', code: '', isActive: true });
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!languageForm.name || !languageForm.name.trim()) nextErrors.name = 'Name is required';
    if (!languageForm.code || !languageForm.code.trim()) nextErrors.code = 'Code is required';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    if (editingId) {
      onUpdateLanguage(editingId, { ...languageForm });
      setEditingId(null);
    } else {
      onAddLanguage({ ...languageForm });
    }
    setLanguageForm({ name: '', code: '', isActive: true });
  };

  return (
    <section className="page-card">
      <div className="page-header">
        <div>
          <h2>Language Master</h2>
          <span className="page-badge">language_master</span>
        </div>
        <p>Maintain language information and quick access from this page.</p>
      </div>

      <section className="content-grid">
        <div className="card">
          <h3>Add Language</h3>
          <form onSubmit={handleSubmit}>
            <label className="field-label">Language Name</label>
            <input
              placeholder="Enter language name"
              value={languageForm.name}
              onChange={(e) => setLanguageForm({ ...languageForm, name: e.target.value })}
            />
            {errors.name && <div className="field-error" style={{ color: '#c00', marginTop: 6 }}>{errors.name}</div>}
            <label className="field-label">Language Code</label>
            <input
              placeholder="Enter language code"
              value={languageForm.code}
              onChange={(e) => setLanguageForm({ ...languageForm, code: e.target.value })}
            />
            {errors.code && <div className="field-error" style={{ color: '#c00', marginTop: 6 }}>{errors.code}</div>}

            <label className="field-label">Is Active</label>
            <select
              value={languageForm.isActive ? 'true' : 'false'}
              onChange={(e) => setLanguageForm({ ...languageForm, isActive: e.target.value === 'true' })}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>

            <button type="submit">Save Language</button>
          </form>
        </div>

        <div className="card">
          <h3>Available Languages</h3>
          <ul className="list">
            {languages.map((language) => (
              <li key={language.id}>
                <strong>{language.name}</strong>
                <span>({language.code})</span>
                <span className={language.isActive ? 'status-pill active' : 'status-pill'} style={{ marginLeft: 8 }}>
                  {language.isActive ? 'Active' : 'Inactive'}
                </span>
                <div style={{ marginTop: 8 }}>
                  <button onClick={() => {
                    setEditingId(language.id);
                    setLanguageForm({ name: language.name, code: language.code, isActive: !!language.isActive });
                  }}>Edit</button>
                  <button onClick={() => onDeleteLanguage(language.id)} style={{ marginLeft: 8 }}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </section>
  );
}

export default LanguageMaster;
