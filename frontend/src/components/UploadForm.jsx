import { useState } from 'react';
import { useDropzone } from 'react-dropzone';

export default function UploadForm({ onSubmit, submitting }) {
  const [file, setFile] = useState(null);
  const [jdText, setJdText] = useState('');
  const [error, setError] = useState('');

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    onDrop(acceptedFiles) {
      if (acceptedFiles[0]) {
        setFile(acceptedFiles[0]);
        setError('');
      }
    },
  });

  async function handleSubmit(event) {
    event.preventDefault();

    if (!file) {
      setError('Upload a PDF resume first.');
      return;
    }

    if (!jdText.trim()) {
      setError('Paste the target job description to continue.');
      return;
    }

    setError('');
    await onSubmit({ file, jdText: jdText.trim() });
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="section-label">New run</p>
          <h3>Upload the resume and job description</h3>
        </div>
        <span className="muted">PDF only, max 5 MB</span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form className="upload-form" onSubmit={handleSubmit}>
        <div
          {...getRootProps()}
          className={`dropzone${isDragActive ? ' dropzone-active' : ''}`}
        >
          <input {...getInputProps()} />
          {file ? (
            <>
              <p className="section-label">Resume ready</p>
              <strong>{file.name}</strong>
              <p className="muted">{(file.size / 1024).toFixed(1)} KB</p>
            </>
          ) : (
            <>
              <p className="section-label">Drag and drop</p>
              <strong>{isDragActive ? 'Release to upload the PDF' : 'Drop your resume here'}</strong>
              <p className="muted">or click to browse from your computer</p>
            </>
          )}
        </div>

        <label className="field">
          <span className="section-label">Target job description</span>
          <textarea
            rows="12"
            value={jdText}
            onChange={(event) => setJdText(event.target.value)}
            placeholder="Paste the complete job description here so HireForge can score the match accurately."
          />
        </label>

        <button type="submit" className="primary-button" disabled={submitting}>
          {submitting ? 'Submitting analysis...' : 'Analyze and optimize'}
        </button>
      </form>
    </section>
  );
}
