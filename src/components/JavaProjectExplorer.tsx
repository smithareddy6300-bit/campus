import React, { useState } from 'react';
import JSZip from 'jszip';
import { JAVA_PROJECT_FILES } from '../data/javaProjectFiles';
import { JavaSourceFile } from '../types';
import {
  FolderCode,
  FileCode2,
  Download,
  Copy,
  Check,
  Code2,
  Terminal,
  Database,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const JavaProjectExplorer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<JavaSourceFile>(JAVA_PROJECT_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();

      JAVA_PROJECT_FILES.forEach((f) => {
        zip.file(f.path, f.content);
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'campussound-springboot-java-project.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to create ZIP:', err);
      alert('Error creating project ZIP.');
    } finally {
      setIsZipping(false);
    }
  };

  const categories = [
    { id: 'all', label: 'All Files' },
    { id: 'docker', label: 'Docker & Compose' },
    { id: 'database', label: 'Database Folder (/database)' },
    { id: 'config', label: 'Maven & Config' },
    { id: 'model', label: 'JPA Entities' },
    { id: 'service', label: 'Services' },
    { id: 'controller', label: 'REST Controllers' },
    { id: 'ai', label: 'LangChain4j AI' },
    { id: 'security', label: 'Security & JWT' },
    { id: 'doc', label: 'README' },
  ];

  const filteredFiles = JAVA_PROJECT_FILES.filter(
    (f) => selectedCategory === 'all' || f.category === selectedCategory
  );

  return (
    <div className="space-y-6">
      {/* Top Banner with Download ZIP button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
            Java 17/21 • Spring Boot 3.3 • LangChain4j 0.35 • MySQL
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FolderCode className="w-5 h-5 text-indigo-400" />
            Complete Java & Spring Boot Codebase Studio
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Full technical training & college project solution matching the PDF design: Controller → Service → Repository pattern with MySQL persistence, Spring Security, and LangChain4j.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-950 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isZipping ? 'Packaging ZIP...' : 'Download Project (.ZIP)'}
          </button>
        </div>
      </div>

      {/* Code Browser Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px]">
        {/* Left: File Explorer Tree */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <FileCode2 className="w-4 h-4 text-indigo-400" /> Source Tree
            </span>
            <span className="text-[11px] font-mono text-slate-400">{filteredFiles.length} files</span>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap gap-1 pb-2 border-b border-slate-800">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* File list */}
          <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
            {filteredFiles.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-mono transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/40 shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <FileCode2
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      isSelected ? 'text-indigo-400' : 'text-slate-500'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{file.path.split('/').pop()}</div>
                    <div className="text-[10px] text-slate-500 truncate">{file.path}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Code Viewer & Description */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          {/* File metadata bar */}
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-mono text-xs font-bold text-white truncate flex items-center gap-2">
                <span>{selectedFile.path}</span>
                <span className="text-[10px] font-sans font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 uppercase">
                  {selectedFile.category}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">{selectedFile.description}</p>
            </div>

            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors shrink-0 border border-slate-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>

          {/* Code content */}
          <div className="flex-1 overflow-auto p-4 bg-slate-950 font-mono text-xs leading-relaxed text-slate-200">
            <pre className="whitespace-pre">
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
