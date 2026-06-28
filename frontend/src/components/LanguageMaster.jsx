import { useState } from 'react';

function LanguageMaster({ languages, onAddLanguage }) {
  const [languageForm, setLanguageForm] = useState({ name: '', code: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!languageForm.name.trim() || !languageForm.code.trim()) return;
    onAddLanguage({ ...languageForm });
    setLanguageForm({ name: '', code: '' });
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
            <label className="field-label">Language Code</label>
            <input
              placeholder="Enter language code"
              value={languageForm.code}
              onChange={(e) => setLanguageForm({ ...languageForm, code: e.target.value })}
            />
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
              </li>
            ))}
          </ul>
        </div>
      </section>
    </section>
  );
}

export default LanguageMaster;
