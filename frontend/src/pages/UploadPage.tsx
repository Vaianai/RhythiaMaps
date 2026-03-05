import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUploadCloud, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import apiClient from '../services/apiClient';
import { useAuthStore } from '../context/authStore';

const emitUploadStatus = (status: 'pending' | 'success' | 'error', message: string) => {
  window.dispatchEvent(
    new CustomEvent('rhythia-upload-status', {
      detail: { status, message, timestamp: Date.now() },
    })
  );
};

export const UploadPage: React.FC = () => {
  const [selectedSourceType, setSelectedSourceType] = useState<'rhythia' | 'soundspace'>('rhythia');
  const [soundSpaceInputMode, setSoundSpaceInputMode] = useState<'file' | 'paste'>('file');
  const [soundSpaceText, setSoundSpaceText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [selectedAdditionalTags, setSelectedAdditionalTags] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [dragCoverActive, setDragCoverActive] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Difficulty tags with styles
  const difficultyTags = [
    { name: 'Easy', bg: 'bg-green-500', hover: 'hover:bg-green-400', gradient: 'from-green-500 to-emerald-400', border: 'border-green-500/20' },
    { name: 'Medium', bg: 'bg-yellow-500', hover: 'hover:bg-yellow-400', gradient: 'from-yellow-500 to-amber-400', border: 'border-yellow-500/20' },
    { name: 'Hard', bg: 'bg-red-500', hover: 'hover:bg-red-400', gradient: 'from-red-500 to-orange-400', border: 'border-red-500/20' },
    { name: 'Logic', bg: 'bg-purple-600', hover: 'hover:bg-purple-500', gradient: 'from-purple-600 to-violet-500', border: 'border-purple-500/20' },
    { name: 'Brrr', bg: 'bg-gray-100', hover: 'hover:bg-white', gradient: 'from-gray-100 to-white', border: 'border-white/30' },
  ];

  // Additional tags with emojis
  const additionalTags = [
    { label: 'Visual', emoji: '👁️' },
    { label: 'Tech', emoji: '⚙️' },
    { label: 'Jumps', emoji: '⬆️' },
    { label: 'Streams', emoji: '〰️' },
  ];

  const difficultyToValue: Record<string, number> = {
    Easy: 1,
    Medium: 2,
    Hard: 3,
    Logic: 4,
    Brrr: 5,
  };

  // Get difficulty config by name
  const getDifficultyConfig = (name: string) => {
    return difficultyTags.find(d => d.name === name);
  };

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles?.[0]) {
      handleFileSelect(droppedFiles[0]);
    }
  };

  const handleCoverDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragCoverActive(true);
    } else if (e.type === 'dragleave') {
      setDragCoverActive(false);
    }
  };

  const handleCoverDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCoverActive(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles?.[0]) {
      handleCoverImageSelect(droppedFiles[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    const validExtension = selectedSourceType === 'rhythia' ? '.sspm' : '.txt';
    if (selectedFile.name.toLowerCase().endsWith(validExtension)) {
      setFile(selectedFile);
      setError('');
    } else {
      setError(`❌ Please select a ${validExtension} file`);
    }
  };

  const validateSoundSpaceText = (raw: string): { noteCount: number; duration: number } => {
    const text = raw.trim();
    if (!text) {
      throw new Error('Text map is empty');
    }

    const chunks = text.split(',').map((part) => part.trim()).filter(Boolean);
    if (chunks.length < 2) {
      throw new Error('Invalid format: expected header and notes');
    }

    if (!/^\d+$/.test(chunks[0])) {
      throw new Error('Invalid header: first value must be numeric id');
    }

    let minTime = Number.POSITIVE_INFINITY;
    let maxTime = Number.NEGATIVE_INFINITY;
    let noteCount = 0;

    for (let index = 1; index < chunks.length; index += 1) {
      const [xRaw, yRaw, timeRaw] = chunks[index].split('|');
      if (xRaw === undefined || yRaw === undefined || timeRaw === undefined) {
        throw new Error(`Invalid note format at entry ${index}`);
      }

      const x = Number(xRaw);
      const y = Number(yRaw);
      const time = Number(timeRaw);
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(time)) {
        throw new Error(`Invalid numbers at entry ${index}`);
      }

      minTime = Math.min(minTime, time);
      maxTime = Math.max(maxTime, time);
      noteCount += 1;
    }

    return {
      noteCount,
      duration: Math.max(1, Math.round(maxTime - minTime)),
    };
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleCoverImageSelect = (selectedFile: File) => {
    if (selectedFile.type.startsWith('image/')) {
      setCoverImage(selectedFile);
      setCoverPreview(URL.createObjectURL(selectedFile));
      setError('');
    } else {
      setError('❌ Please select a valid image file');
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleCoverImageSelect(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    let finalFile = file;
    let computedDuration = 1;
    let computedNoteCount = 0;

    if (selectedSourceType === 'rhythia') {
      if (!file) {
        setError('❌ Please select a .sspm file');
        return;
      }
    } else {
      if (soundSpaceInputMode === 'paste') {
        try {
          const stats = validateSoundSpaceText(soundSpaceText);
          computedDuration = stats.duration;
          computedNoteCount = stats.noteCount;
          const generatedName = (title.trim() || 'soundspace-map').replace(/\s+/g, '_');
          finalFile = new File([soundSpaceText], `${generatedName}.txt`, { type: 'text/plain' });
        } catch (parseError: any) {
          setError(`❌ ${parseError.message}`);
          return;
        }
      } else {
        if (!file) {
          setError('❌ Please select a .txt file');
          return;
        }
        try {
          const stats = validateSoundSpaceText(await file.text());
          computedDuration = stats.duration;
          computedNoteCount = stats.noteCount;
        } catch (parseError: any) {
          setError(`❌ ${parseError.message}`);
          return;
        }
      }
    }

    if (!title.trim()) {
      setError('❌ Title is required');
      return;
    }

    if (!artist.trim()) {
      setError('❌ Artist is required');
      return;
    }

    if (!selectedDifficulty) {
      setError('❌ Please select a difficulty');
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    if (!finalFile) {
      setError('❌ Please select a map file');
      return;
    }

    formData.append('file', finalFile);
    if (coverImage) {
      formData.append('coverImage', coverImage);
    }
    formData.append('title', title.trim());
    formData.append('artist', artist.trim());
    formData.append('mapper', user?.username?.trim() || artist.trim());
    formData.append('sourceType', selectedSourceType);
    formData.append('difficulty', String(difficultyToValue[selectedDifficulty] ?? 1));
    formData.append('bpm', '120');
    formData.append('duration', String(computedDuration));
    formData.append('noteCount', String(computedNoteCount));

    const allTags = [selectedDifficulty, ...selectedAdditionalTags];
    formData.append('tags', JSON.stringify(allTags));

    const mapTitle = title.trim();
    console.log('📤 Uploading - File:', finalFile.name, 'Title:', mapTitle, 'Artist:', artist, 'Type:', selectedSourceType);

    emitUploadStatus('pending', `Upload in corso: ${mapTitle}`);

    apiClient
      .uploadMap(formData)
      .then(() => {
        emitUploadStatus('success', `Upload completato: ${mapTitle}`);
      })
      .catch((err: any) => {
        console.error('Upload error:', err);
        emitUploadStatus('error', `Upload fallito: ${mapTitle} — ${err.response?.data?.error || 'errore generico'}`);
      });

    setSuccess('⏳ Upload avviato in background. Ti avvisiamo noi quando finisce.');
    setFile(null);
    setSelectedSourceType('rhythia');
    setSoundSpaceInputMode('file');
    setSoundSpaceText('');
    setTitle('');
    setArtist('');
    setCoverImage(null);
    setCoverPreview('');
    setSelectedDifficulty('');
    setSelectedAdditionalTags([]);
    setIsLoading(false);

    setTimeout(() => navigate('/'), 600);
  };

  if (!user) return null;

  return (
    <div className="min-h-[calc(100vh-64px)] relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-20">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-950 to-violet-950/20" />
        <motion.div
          className="absolute top-0 left-0 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl"
          animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
        />
      </div>

      <div className="relative min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="inline-block mb-4"
            >
              <span className="text-5xl">🎵</span>
            </motion.div>
            <h1 className="text-6xl font-black bg-gradient-to-r from-violet-300 via-purple-300 to-pink-300 bg-clip-text text-transparent mb-4 drop-shadow-lg">
              Upload Your Map
            </h1>
            <p className="text-gray-400 text-lg font-medium">
              Share your rhythm creation with the community
            </p>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15 }}
              className="mb-8 rounded-xl bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/50 p-5 flex items-start gap-4 backdrop-blur-sm shadow-lg shadow-red-500/10"
            >
              <FiAlertCircle className="text-2xl text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-100 font-semibold text-lg">{error}</p>
            </motion.div>
          )}

          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15 }}
              className="mb-8 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 p-5 flex items-start gap-4 backdrop-blur-sm shadow-lg shadow-green-500/10"
            >
              <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 0.8 }}>
                <FiCheckCircle className="text-2xl text-green-400 flex-shrink-0" />
              </motion.div>
              <p className="text-green-100 font-semibold text-lg">{success}</p>
            </motion.div>
          )}

          {/* Form Container */}
          <form onSubmit={handleSubmit}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative rounded-3xl overflow-hidden"
            >
              {/* Glassmorphism border effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-500/20 via-purple-500/10 to-pink-500/20 opacity-50 blur-xl" />
              <div className="absolute inset-0 rounded-3xl border-2 border-white/10 backdrop-blur-md" />
              
              {/* Main card content */}
              <div className="relative bg-gradient-to-br from-gray-950/80 to-gray-900/80 rounded-3xl p-12 border border-white/5 shadow-2xl shadow-purple-500/10">
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-10"
                >
              {/* Source Type */}
              <motion.div variants={itemVariants}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🎮</span>
                  <label className="block text-sm font-bold text-gray-200 uppercase tracking-wider">
                    Map Type <span className="text-red-400 text-lg">*</span>
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSourceType('rhythia');
                      setFile(null);
                      setSoundSpaceText('');
                    }}
                    className={`px-4 py-3 rounded-xl border-2 text-left transition-all ${
                      selectedSourceType === 'rhythia'
                        ? 'border-violet-400 bg-violet-500/20 text-white shadow-lg shadow-violet-500/20'
                        : 'border-gray-700/50 bg-gray-800/40 text-gray-300 hover:border-violet-500/50'
                    }`}
                  >
                    <p className="font-semibold">SSPM (Rhythia)</p>
                    <p className="text-xs text-gray-400 mt-1">Upload `.sspm` file</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSourceType('soundspace');
                      setFile(null);
                    }}
                    className={`px-4 py-3 rounded-xl border-2 text-left transition-all ${
                      selectedSourceType === 'soundspace'
                        ? 'border-cyan-400 bg-cyan-500/20 text-white shadow-lg shadow-cyan-500/20'
                        : 'border-gray-700/50 bg-gray-800/40 text-gray-300 hover:border-cyan-500/50'
                    }`}
                  >
                    <p className="font-semibold">TEXT (Sound Space)</p>
                    <p className="text-xs text-gray-400 mt-1">Upload `.txt` or paste map text</p>
                  </button>
                </div>
              </motion.div>

              {/* Map File Upload */}
              <motion.div variants={itemVariants}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">📁</span>
                  <label className="block text-sm font-bold text-gray-200 uppercase tracking-wider">
                    {selectedSourceType === 'rhythia' ? 'Map File (.sspm)' : 'Map File (.txt)'} <span className="text-red-400 text-lg">*</span>
                  </label>
                </div>

                {selectedSourceType === 'soundspace' && (
                  <div className="mb-4 inline-flex rounded-xl border border-gray-700/60 bg-gray-900/60 p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSoundSpaceInputMode('file');
                        setError('');
                      }}
                      className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                        soundSpaceInputMode === 'file'
                          ? 'bg-cyan-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800'
                      }`}
                    >
                      TXT file
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSoundSpaceInputMode('paste');
                        setFile(null);
                        setError('');
                      }}
                      className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                        soundSpaceInputMode === 'paste'
                          ? 'bg-cyan-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800'
                      }`}
                    >
                      Paste text
                    </button>
                  </div>
                )}

                {selectedSourceType === 'soundspace' && soundSpaceInputMode === 'paste' ? (
                  <div className="space-y-3">
                    <textarea
                      value={soundSpaceText}
                      onChange={(e) => {
                        setSoundSpaceText(e.target.value);
                        setError('');
                      }}
                      placeholder="Paste Sound Space map text here (id,x|y|time,...)"
                      rows={8}
                      className="w-full px-4 py-3 rounded-xl bg-gray-900/80 border-2 border-cyan-500/30 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                    />
                    <p className="text-xs text-gray-400">
                      Example: `1328723,1|1|0,1|0|157, ...`
                    </p>
                  </div>
                ) : (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`relative rounded-2xl border-3 border-dashed transition-all duration-300 p-12 text-center cursor-pointer overflow-hidden group ${
                    dragActive
                      ? 'border-violet-400 bg-violet-500/20 scale-105'
                      : 'border-violet-500/40 bg-violet-500/5 hover:border-violet-500/60 hover:bg-violet-500/10'
                  }`}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity" />
                  <input
                    type="file"
                    accept={selectedSourceType === 'rhythia' ? '.sspm' : '.txt'}
                    onChange={handleFileInputChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <motion.div
                    animate={{ y: dragActive ? -5 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div
                      animate={{ rotate: [0, -5, 5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center"
                    >
                      <FiUploadCloud className="text-4xl text-white" />
                    </motion.div>
                  </motion.div>
                  <p className="text-gray-100 font-bold text-lg mb-2">
                    {file ? file.name : 'Drag and drop or click to select'}
                  </p>
                  <p className="text-sm text-gray-400 font-medium">
                    {selectedSourceType === 'rhythia'
                      ? 'Only .sspm files allowed • Max 100MB'
                      : 'Only .txt files allowed • Max 100MB'}
                  </p>
                </div>
                )}
              </motion.div>

              {/* Metadata Section */}
              <motion.div
                variants={itemVariants}
                className="grid grid-cols-1 sm:grid-cols-2 gap-6"
              >
                {/* Title */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-20 blur transition duration-500" />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">✨</span>
                      <label className="block text-sm font-bold text-gray-200 uppercase tracking-wider">
                        Title <span className="text-red-400 text-lg">*</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Your map title"
                      className="w-full px-5 py-3 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-2 border-violet-500/20 text-white placeholder-gray-500/70 font-medium backdrop-blur-sm transition-all focus:outline-none focus:border-violet-500/80 focus:bg-violet-500/5 focus:shadow-lg focus:shadow-violet-500/20"
                    />
                  </div>
                </div>

                {/* Artist */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl opacity-0 group-hover:opacity-20 blur transition duration-500" />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">🎤</span>
                      <label className="block text-sm font-bold text-gray-200 uppercase tracking-wider">
                        Artist <span className="text-red-400 text-lg">*</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      value={artist}
                      onChange={(e) => setArtist(e.target.value)}
                      placeholder="Artist name"
                      className="w-full px-5 py-3 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-2 border-purple-500/20 text-white placeholder-gray-500/70 font-medium backdrop-blur-sm transition-all focus:outline-none focus:border-purple-500/80 focus:bg-purple-500/5 focus:shadow-lg focus:shadow-purple-500/20"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Cover Image */}
              <motion.div variants={itemVariants}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Upload Area */}
                  <div className="lg:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">🖼️</span>
                      <label className="block text-sm font-bold text-gray-200 uppercase tracking-wider">
                        Cover Image <span className="text-red-400 text-lg">*</span>
                      </label>
                    </div>
                    <div
                      onDragEnter={handleCoverDrag}
                      onDragLeave={handleCoverDrag}
                      onDragOver={handleCoverDrag}
                      onDrop={handleCoverDrop}
                      className={`relative rounded-2xl border-3 border-dashed transition-all duration-300 p-8 text-center cursor-pointer group overflow-hidden ${
                        dragCoverActive
                          ? 'border-pink-400 bg-pink-500/20 scale-105'
                          : 'border-pink-500/40 bg-pink-500/5 hover:border-pink-500/60 hover:bg-pink-500/10'
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleCoverImageChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <motion.div
                        animate={{ scale: dragCoverActive ? 1.1 : 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="mx-auto mb-3 w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center">
                          <span className="text-2xl">📸</span>
                        </div>
                      </motion.div>
                      <p className="text-gray-100 font-semibold mb-1">Click or drag image here</p>
                      <p className="text-xs text-gray-400 font-medium">PNG, JPG, or WebP • Max 10MB</p>
                    </div>
                  </div>

                  {/* Preview */}
                  <div>
                    <label className="block text-sm font-bold text-gray-200 uppercase tracking-wider mb-4">
                      Preview
                    </label>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="w-full aspect-square rounded-2xl overflow-hidden border-3 border-pink-500/30 shadow-xl shadow-pink-500/20 bg-gray-900"
                    >
                      {coverPreview ? (
                        <img
                          src={coverPreview}
                          alt="Cover preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="relative w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center overflow-hidden">
                          {/* Checkered pattern background */}
                          <div className="absolute inset-0" style={{
                            opacity: 0.14,
                            backgroundImage: 'linear-gradient(45deg, #262626 25%, transparent 25%, transparent 75%, #262626 75%, #262626), linear-gradient(45deg, #262626 25%, transparent 25%, transparent 75%, #262626 75%, #262626)',
                            backgroundSize: '36px 36px',
                            backgroundPosition: '0 0, 18px 18px',
                          }} />
                          <div className="relative text-center z-10">
                            <div className="text-4xl mb-2">
                              <svg
                                className="w-12 h-12 mx-auto opacity-30"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M0 4a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H2a2 2 0 01-2-2V4zm2 1a1 1 0 000 2h12a1 1 0 100-2H2z" />
                              </svg>
                            </div>
                            <p className="text-xs text-gray-500 font-medium mt-2">No image</p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* Difficulty Section */}
              <motion.div variants={itemVariants}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">⚡</span>
                  <label className="block text-sm font-bold text-gray-200 uppercase tracking-wider">
                    Difficulty <span className="text-red-400 text-lg">*</span>
                  </label>
                </div>
                <div className="grid grid-cols-5 gap-2 sm:gap-3">
                  {difficultyTags.map((diff) => (
                    <motion.button
                      key={diff.name}
                      type="button"
                      onClick={() => setSelectedDifficulty(diff.name)}
                      variants={itemVariants}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`relative px-4 py-3 rounded-xl font-bold transition-all duration-300 overflow-hidden group border-2 ${
                        selectedDifficulty === diff.name
                          ? `bg-gradient-to-r ${diff.gradient} text-white shadow-lg border-white/50`
                          : `bg-gradient-to-br from-gray-800/50 to-gray-900/50 ${diff.border} text-gray-300 border-gray-600/50 hover:scale-105`
                      }`}
                    >
                      <div className="relative z-10">{diff.name}</div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Additional Tags */}
              <motion.div variants={itemVariants}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🏷️</span>
                  <label className="block text-sm font-bold text-gray-200 uppercase tracking-wider">
                    Additional Tags (Optional)
                  </label>
                </div>
                <div className="flex flex-wrap gap-3">
                  {additionalTags.map((tag) => (
                    <motion.button
                      key={tag.label}
                      type="button"
                      onClick={() => {
                        setSelectedAdditionalTags((prev) =>
                          prev.includes(tag.label)
                            ? prev.filter((t) => t !== tag.label)
                            : [...prev, tag.label]
                        );
                      }}
                      variants={itemVariants}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-5 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 backdrop-blur-sm border-2 ${
                        selectedAdditionalTags.includes(tag.label)
                          ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white border-violet-400 shadow-lg shadow-violet-500/30'
                          : 'bg-gray-800/30 border-gray-600/50 text-gray-300 hover:border-violet-500/50 hover:bg-violet-500/10'
                      }`}
                    >
                      <span className="text-lg">{tag.emoji}</span>
                      <span>{tag.label}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Submit Button */}
              <motion.div
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.button
                  disabled={isLoading}
                  type="submit"
                  className="relative w-full py-4 rounded-2xl font-bold text-lg text-white bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 hover:from-violet-500 hover:via-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-purple-500/40 transition-all duration-300 overflow-hidden group uppercase tracking-wider"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <motion.div
                    animate={{ x: isLoading ? [0, 10, 0] : 0 }}
                    transition={{ duration: 1, repeat: isLoading ? Infinity : 0 }}
                    className="relative z-10 flex items-center justify-center gap-2"
                  >
                    <span>{isLoading ? '⏳' : '🚀'}</span>
                    {isLoading ? 'Uploading...' : 'Upload Map'}
                  </motion.div>
                </motion.button>
              </motion.div>
            </motion.div>
              </div>
            </motion.div>
          </form>
        </div>
      </div>
    </div>
  );
};
