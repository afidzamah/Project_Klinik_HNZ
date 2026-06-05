'use client';

import React, { useState, useEffect, useRef } from 'react';

interface LabParameter {
  kategori: string;
  nama_pemeriksaan: string;
  hasil: string;
  satuan: string;
  nilai_normal: string;
  flag: 'Normal' | 'High' | 'Low';
}

interface LabData {
  nama_rs: string;
  nama_pasien: string;
  tanggal_lab: string;
  no_registrasi: string;
  no_order: string;
  daftar_pemeriksaan: LabParameter[];
}

interface HasilLabAiFormProps {
  activeAntrean: any;
  isActiveBatal: boolean;
  isActiveSelesai: boolean;
}

const API_URL = 'http://localhost:3000';

export default function HasilLabAiForm({
  activeAntrean,
  isActiveBatal,
  isActiveSelesai,
}: HasilLabAiFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [file, setFile] = useState<File | null>(null);
  const [base64File, setBase64File] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const [labData, setLabData] = useState<LabData | null>(null);
  const [originalLabData, setOriginalLabData] = useState<LabData | null>(null);

  const [showNameConfirmModal, setShowNameConfirmModal] = useState<boolean>(false);
  const [mismatchedNames, setMismatchedNames] = useState<{ systemName: string; documentName: string } | null>(null);

  const [catatanAnalisisAi, setCatatanAnalisisAi] = useState<string>('');
  const [ringkasanAnalisisAi, setRingkasanAnalisisAi] = useState<string>('');
  const [saranAnalisisAi, setSaranAnalisisAi] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const idKunjungan = activeAntrean?.id_kunjungan;

  // States for multiple files & history table
  const [savedRecords, setSavedRecords] = useState<any[]>([]);
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  const [collapsedCategories, setCollapsedCategories] = useState<{ [key: string]: boolean }>({});

  const toggleCategory = (key: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getGroupedParams = (params: LabParameter[]) => {
    const groups: { [key: string]: { param: LabParameter; originalIndex: number }[] } = {};
    params.forEach((param, originalIndex) => {
      const cat = param.kategori || 'Umum';
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push({ param, originalIndex });
    });
    return groups;
  };

  // 1. Fetch saved lab results for this patient visit on load
  useEffect(() => {
    if (idKunjungan) {
      fetchSavedLabData();
    } else {
      resetAllStates();
    }
  }, [idKunjungan]);

  const fetchSavedLabData = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      const res = await fetch(`${API_URL}/asesmen-keperawatan/hasil-lab/${idKunjungan}`);
      if (res.ok) {
        const records = await res.json();
        if (Array.isArray(records)) {
          // Format date for each record
          const formattedRecords = records.map((record: any) => {
            let formattedDate = '';
            if (record.tanggal_lab) {
              const d = new Date(record.tanggal_lab);
              formattedDate = d.toISOString().slice(0, 19).replace('T', ' ');
            }
            return {
              ...record,
              formatted_tanggal_lab: formattedDate
            };
          });
          setSavedRecords(formattedRecords);
        } else {
          setSavedRecords([]);
        }
      }
    } catch (err) {
      console.error('Error fetching saved lab results:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLabData = async (idHasilLab: string) => {
    if (!idHasilLab) return;
    const confirmDelete = window.confirm('Apakah Anda yakin ingin menghapus data hasil laboratorium ini secara permanen?');
    if (!confirmDelete) return;

    try {
      setIsLoading(true);
      setErrorMessage('');
      setSaveSuccess(false);

      const res = await fetch(`${API_URL}/asesmen-keperawatan/hasil-lab/${idHasilLab}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Gagal menghapus hasil laboratorium dari database.');
      }

      setSaveSuccess(true);
      showToast('success', 'Data hasil laboratorium berhasil dihapus secara permanen.');
      if (expandedRecordId === idHasilLab) {
        setExpandedRecordId(null);
      }
      // Refresh list
      fetchSavedLabData();
    } catch (err: any) {
      console.error(err);
      const errMsg = err.message || 'Gagal menghapus data.';
      setErrorMessage(errMsg);
      showToast('error', errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const resetAllStates = () => {
    setFile(null);
    setBase64File('');
    setLabData(null);
    setOriginalLabData(null);
    setSaveSuccess(false);
    setErrorMessage('');
    setShowNameConfirmModal(false);
    setMismatchedNames(null);
    setSavedRecords([]);
    setExpandedRecordId(null);
    setCatatanAnalisisAi('');
    setRingkasanAnalisisAi('');
    setSaranAnalisisAi('');
    setIsAnalyzing(false);
  };

  // 2. Handle file selection & convert to Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    processFile(selectedFile);
  };

  const processFile = (selectedFile: File) => {
    setErrorMessage('');
    setSaveSuccess(false);

    // Limit files to PDF or Images
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setErrorMessage('Dokumen harus berupa file PDF atau gambar (PNG/JPEG)!');
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      setBase64File(base64String);
    };
    reader.onerror = () => {
      setErrorMessage('Gagal membaca file.');
    };
    reader.readAsDataURL(selectedFile);
  };

  // 3. Trigger Gemini Multimodal Parser in backend
  const handleAnalyzeFile = async () => {
    if (!base64File) return;

    try {
      setIsLoading(true);
      setErrorMessage('');
      setSaveSuccess(false);

      const res = await fetch(`${API_URL}/asesmen-keperawatan/parse-lab-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64Data: base64File,
          mimeType: file?.type || 'application/pdf',
        }),
      });

      if (!res.ok) {
        throw new Error('Gagal memproses file. Pastikan API key Gemini aktif.');
      }

      const result = await res.json();
      if (result) {
        setLabData(result);
        setOriginalLabData(JSON.parse(JSON.stringify(result)));
        showToast('success', 'Gemini AI berhasil membaca dan mengekstrak berkas laboratorium!');
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err.message || 'Terjadi kesalahan saat memproses dengan Gemini AI.';
      setErrorMessage(errMsg);
      showToast('error', errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Save results to PostgreSQL hasil_laboratorium table
  const handleSaveLabData = async () => {
    if (!labData || !idKunjungan) return;

    const systemName = activeAntrean?.kunjungan?.pasien?.nama_lengkap || '';
    const documentName = labData.nama_pasien || '';

    // Check if names differ case-insensitively (trimmed)
    if (systemName && documentName && systemName.trim().toLowerCase() !== documentName.trim().toLowerCase()) {
      setMismatchedNames({ systemName, documentName });
      setShowNameConfirmModal(true);
      return;
    }

    await executeSave(documentName);
  };

  const executeSave = async (finalPatientName: string) => {
    if (!labData || !idKunjungan) return;

    try {
      setIsLoading(true);
      setErrorMessage('');
      setSaveSuccess(false);
      setShowNameConfirmModal(false);

      const res = await fetch(`${API_URL}/asesmen-keperawatan/hasil-lab`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_kunjungan: idKunjungan,
          ...labData,
          nama_pasien: finalPatientName,
          catatan_analisis_ai: (ringkasanAnalisisAi && saranAnalisisAi) ? `${ringkasanAnalisisAi}\n\n${saranAnalisisAi}` : (catatanAnalisisAi || null),
          ringkasan_analisis_ai: ringkasanAnalisisAi || null,
          saran_analisis_ai: saranAnalisisAi || null,
        }),
      });

      if (!res.ok) {
        throw new Error('Gagal menyimpan hasil laboratorium ke database.');
      }

      setSaveSuccess(true);
      showToast('success', 'Hasil pemeriksaan laboratorium telah terekam secara permanen di database!');
      setFile(null);
      setBase64File('');
      setCatatanAnalisisAi('');
      setRingkasanAnalisisAi('');
      setSaranAnalisisAi('');
      // Refresh local saved data
      fetchSavedLabData();
    } catch (err: any) {
      console.error(err);
      const errMsg = err.message || 'Gagal menyimpan hasil.';
      setErrorMessage(errMsg);
      showToast('error', errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAnalysis = async () => {
    if (!labData || !labData.daftar_pemeriksaan) return;

    try {
      setIsAnalyzing(true);
      setErrorMessage('');
      const res = await fetch(`${API_URL}/asesmen-keperawatan/hasil-lab/analisis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          daftar_pemeriksaan: labData.daftar_pemeriksaan,
        }),
      });

      if (!res.ok) {
        throw new Error('Gagal memproses analisis klinis AI.');
      }

      const result = await res.json();
      if (result) {
        setRingkasanAnalisisAi(result.ringkasan || '');
        setSaranAnalisisAi(result.saran || '');
        setCatatanAnalisisAi((result.ringkasan && result.saran) ? `${result.ringkasan}\n\n${result.saran}` : '');
        showToast('success', 'Analisis klinis AI berhasil disusun!');
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err.message || 'Gagal menghasilkan analisis klinis AI.';
      setErrorMessage(errMsg);
      showToast('error', errMsg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 5. Handle user modifying fields manually in the input table
  const handleFieldChange = (index: number, value: string) => {
    if (!labData) return;
    const updatedExamList = [...labData.daftar_pemeriksaan];
    
    // Convert comma to dot for numerical check if needed
    const normalizedVal = value.replace(',', '.');
    updatedExamList[index].hasil = value;

    // Automatic Flag checking based on Nilai Rujukan if it's a numeric range
    const nilaiNormal = updatedExamList[index].nilai_normal;
    const rangeMatch = nilaiNormal.match(/([0-9.]+)\s*-\s*([0-9.]+)/);
    
    if (rangeMatch && !isNaN(parseFloat(normalizedVal))) {
      const min = parseFloat(rangeMatch[1]);
      const max = parseFloat(rangeMatch[2]);
      const valNum = parseFloat(normalizedVal);

      if (valNum < min) {
        updatedExamList[index].flag = 'Low';
      } else if (valNum > max) {
        updatedExamList[index].flag = 'High';
      } else {
        updatedExamList[index].flag = 'Normal';
      }
    } else if (nilaiNormal.startsWith('<') && !isNaN(parseFloat(normalizedVal))) {
      const limit = parseFloat(nilaiNormal.replace('<', '').trim());
      const valNum = parseFloat(normalizedVal);
      if (valNum >= limit) {
        updatedExamList[index].flag = 'High';
      } else {
        updatedExamList[index].flag = 'Normal';
      }
    } else if (normalizedVal.toLowerCase() === 'negatif') {
      updatedExamList[index].flag = 'Normal';
    } else if (normalizedVal.toLowerCase() === 'positif') {
      updatedExamList[index].flag = 'High';
    }

    setLabData({
      ...labData,
      daftar_pemeriksaan: updatedExamList,
    });
  };

  // Drag and Drop files handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  // Visual helper styles for flag coloring
  const getRowClass = (flag: string) => {
    if (flag === 'High') return 'bg-rose-50/50 hover:bg-rose-50/80 transition-colors duration-150 border-rose-100';
    if (flag === 'Low') return 'bg-blue-50/50 hover:bg-blue-50/80 transition-colors duration-150 border-blue-100';
    return 'bg-white hover:bg-slate-50 border-slate-100';
  };

  const getFlagBadge = (flag: string) => {
    if (flag === 'High') {
      return (
        <span className="bg-rose-500 border border-rose-600 text-white font-extrabold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 select-none animate-pulse w-fit">
          ▲ High
        </span>
      );
    }
    if (flag === 'Low') {
      return (
        <span className="bg-blue-500 border border-blue-600 text-white font-extrabold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 select-none animate-pulse w-fit">
          ▼ Low
        </span>
      );
    }
    return (
      <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 select-none w-fit">
        ✓ Normal
      </span>
    );
  };

  const getInputClass = (flag: string) => {
    const base = "w-full rounded-lg border-2 p-1.5 px-2.5 font-mono text-xs font-bold text-slate-800 transition-all outline-none focus:bg-white text-center ";
    if (flag === 'High') return base + "border-rose-300 bg-rose-50 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 text-rose-700";
    if (flag === 'Low') return base + "border-blue-300 bg-blue-50 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-blue-700";
    return base + "border-slate-200 bg-slate-50 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";
  };

  if (!idKunjungan) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 font-bold text-xs select-none">
        ⚠️ Silakan pilih salah satu pasien di antrean sebelah kiri terlebih dahulu.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER INFO */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4 shadow-sm/5 bg-slate-50/20">
        <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="text-indigo-600">🧪</span> AI Hasil Lab LIS Uploader
            </h3>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">
              Multimodal AI - Upload hasil laboratorium LIS (PDF/Image) pasien untuk ekstraksi data otomatis
            </p>
          </div>
          <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-indigo-200">
            Gemini 2.5 Flash
          </span>
        </div>

        {/* DRAG AND DROP ZONE */}
        {(!labData || file) && (
          <div className="space-y-4 animate-fade-in">
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6.5 text-center cursor-pointer transition-all ${
                file
                  ? 'border-indigo-400 bg-indigo-50/20 scale-[0.99]'
                  : 'border-slate-350 bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-400 hover:scale-[1.01]'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,image/png,image/jpeg,image/jpg"
                className="hidden"
              />
              
              <div className="space-y-2">
                <span className="text-3xl block select-none">📁</span>
                {file ? (
                  <div>
                    <span className="text-xs font-black text-indigo-700 block truncate max-w-md mx-auto">
                      📄 {file.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold block mt-1">
                      {(file.size / 1024).toFixed(1)} KB — Siap untuk dianalisis AI
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-black text-slate-700 block">
                      Tarik & lepas file hasil lab di sini, atau klik untuk memilih file
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold block mt-1">
                      Mendukung file PDF dan Gambar (PNG/JPEG) hasil LIS Brawijaya Hospital
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* BUTTON ANALYZE */}
            {file && (
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={resetAllStates}
                  className="px-4 py-2 rounded-xl text-xs font-black text-slate-650 bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer transition-all"
                >
                  Reset
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleAnalyzeFile}
                  className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 shadow-md border border-indigo-700 hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 duration-150"
                  style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
                >
                  ✨ Jalankan Analisis AI
                </button>
              </div>
            )}
          </div>
        )}

        {/* LOADING STATE */}
        {isLoading && (
          <div className="bg-indigo-50/30 p-8 rounded-2xl border border-indigo-100/50 flex flex-col items-center gap-4 animate-pulse">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-200 animate-ping"></div>
              <span className="text-2xl z-10">🧠</span>
            </div>
            <div className="text-center space-y-1">
              <span className="text-xs font-black text-indigo-900 block">Gemini AI Sedang Membaca Dokumen...</span>
              <span className="text-[10px] text-indigo-600/70 font-bold block">
                Melakukan Optical Character Recognition (OCR) dan klasifikasi parameter hasil lab secara otomatis
              </span>
            </div>
          </div>
        )}

        {/* ERROR MESSAGE */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3.5 flex items-start gap-2.5 select-none animate-fade-in">
            <span className="text-base leading-none">⚠️</span>
            <div className="space-y-0.5">
              <span className="text-xs font-black block">Terjadi Kesalahan</span>
              <span className="text-[10px] font-semibold leading-relaxed text-rose-700 block">{errorMessage}</span>
            </div>
          </div>
        )}

        {/* SAVE SUCCESS MESSAGE */}
        {saveSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3.5 flex items-start gap-2.5 select-none animate-fade-in">
            <span className="text-base leading-none">✅</span>
            <div className="space-y-0.5">
              <span className="text-xs font-black block">Berhasil Disimpan</span>
              <span className="text-[10px] font-semibold leading-relaxed text-emerald-700 block">
                Hasil pemeriksaan laboratorium telah terekam secara permanen di database hasil_laboratorium!
              </span>
            </div>
          </div>
        )}
      </div>

      {/* RENDER PARSED LAB DATA */}
      {labData && !isLoading && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden animate-fade-in space-y-5 p-5">
          
          {/* HOSPITAL LETTERHEAD PREVIEW */}
          <div className="border border-indigo-100 bg-indigo-50/20 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-start border-b border-indigo-100/60 pb-3 flex-wrap gap-4">
              <div className="space-y-1">
                <span className="text-[9px] font-black text-indigo-750 uppercase tracking-widest block">INSTANSI PENGIRIM</span>
                <span className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                  🏢 {labData.nama_rs}
                </span>
              </div>
              <div className="space-y-1 md:text-right">
                <span className="text-[9px] font-black text-indigo-750 uppercase tracking-widest block">TANGGAL PEMERIKSAAN</span>
                <span className="text-xs font-mono font-bold text-slate-700 block">
                  📅 {labData.tanggal_lab}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold text-slate-700">
              <div className="space-y-1">
                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">NAMA PASIEN</span>
                <span className="block text-slate-800 text-xs font-black">{labData.nama_pasien}</span>
              </div>
              <div className="space-y-1">
                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">NO REGISTRASI</span>
                <span className="block text-slate-700 font-mono text-[11px]">{labData.no_registrasi || '-'}</span>
              </div>
              <div className="space-y-1">
                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">NO ORDER / LIS</span>
                <span className="block text-slate-700 font-mono text-[11px]">{labData.no_order || '-'}</span>
              </div>
            </div>
          </div>

          {/* LABORATORY RESULTS TABLE */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <div>
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Daftar Parameter Hasil Laboratorium
                </h4>
                <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                  Double check data di bawah ini. Nilai dalam kolom Hasil dapat diubah secara manual jika ada salah bacaan.
                </p>
              </div>
              <div className="flex gap-2 text-[9px] font-black uppercase">
                <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md">Merah = High</span>
                <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md">Biru = Low</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm/5">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-500 border-b border-slate-250 font-black uppercase tracking-wider text-[9px] text-center">
                      <th className="p-3 text-left w-1/3">Parameter Pemeriksaan</th>
                      <th className="p-3 w-1/6">Kategori</th>
                      <th className="p-3 w-1/6">Hasil</th>
                      <th className="p-3 w-1/12">Satuan</th>
                      <th className="p-3 w-1/6">Nilai Normal</th>
                      <th className="p-3 w-1/6">Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {(() => {
                      const grouped = getGroupedParams(labData.daftar_pemeriksaan);
                      return Object.keys(grouped).map((categoryName) => {
                        const items = grouped[categoryName];
                        const key = `unsaved-${categoryName}`;
                        const isCollapsed = collapsedCategories[key];
                        
                        const highCount = items.filter(item => item.param.flag === 'High').length;
                        const lowCount = items.filter(item => item.param.flag === 'Low').length;
                        const hasAbnormal = highCount > 0 || lowCount > 0;
                        
                        return (
                          <React.Fragment key={categoryName}>
                            {/* Category Header Row */}
                            <tr 
                              onClick={() => toggleCategory(key)}
                              className="bg-slate-50 hover:bg-slate-100 cursor-pointer select-none transition-colors border-b border-slate-200"
                            >
                              <td colSpan={6} className="p-3 pl-4 font-black text-slate-800 text-left">
                                <div className="flex justify-between items-center w-full">
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-450 text-[10px] font-bold font-mono">
                                      {isCollapsed ? '▶' : '▼'}
                                    </span>
                                    <span className="text-xs uppercase tracking-wider text-slate-700 font-extrabold">
                                      📁 {categoryName}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-bold font-sans">
                                      ({items.length} Parameter)
                                    </span>
                                  </div>
                                  
                                  <div className="flex gap-1.5 items-center">
                                    {isCollapsed && hasAbnormal && (
                                      <div className="flex gap-1">
                                        {highCount > 0 && (
                                          <span className="bg-rose-500 border border-rose-600 text-white font-extrabold text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider select-none animate-pulse">
                                            ▲ {highCount} High
                                          </span>
                                        )}
                                        {lowCount > 0 && (
                                          <span className="bg-blue-500 border border-blue-600 text-white font-extrabold text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider select-none animate-pulse">
                                            ▼ {lowCount} Low
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    {isCollapsed && !hasAbnormal && (
                                      <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider select-none">
                                        ✓ Semua Normal
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                            
                            {/* Parameter Rows (if expanded) */}
                            {!isCollapsed && items.map(({ param, originalIndex }) => (
                              <tr key={originalIndex} className={getRowClass(param.flag)}>
                                <td className="p-3 pl-6 font-bold text-slate-800 text-left">
                                  {param.nama_pemeriksaan}
                                </td>
                                <td className="p-3 text-slate-450 font-bold text-[10px] uppercase text-center select-none">
                                  {param.kategori}
                                </td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={param.hasil}
                                    disabled={isActiveBatal || isActiveSelesai}
                                    onChange={(e) => handleFieldChange(originalIndex, e.target.value)}
                                    className={getInputClass(param.flag)}
                                  />
                                </td>
                                <td className="p-3 font-mono font-bold text-center text-slate-550 select-none">
                                  {param.satuan || '-'}
                                </td>
                                <td className="p-3 font-mono font-bold text-center text-slate-500 select-none">
                                  {param.nilai_normal}
                                </td>
                                <td className="p-3 text-center flex justify-center items-center h-full pt-4">
                                  {getFlagBadge(param.flag)}
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* AI CLINICAL NOTES DRAFT SECTION */}
          {(ringkasanAnalisisAi || saranAnalisisAi || isAnalyzing) && (
            <div className="bg-indigo-50/15 border border-indigo-100 rounded-2xl p-5 space-y-4 animate-fade-in text-left">
              <div className="flex justify-between items-center border-b border-indigo-100/60 pb-2">
                <span className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                  🧠 AI Analisis Klinis & Rekomendasi (Draf)
                </span>
                {isAnalyzing && (
                  <span className="text-[10px] text-indigo-600 font-bold animate-pulse flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span> Menganalisis...
                  </span>
                )}
              </div>

              {isAnalyzing ? (
                <div className="py-8 flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-650 animate-spin"></div>
                  <span className="text-[10px] text-indigo-600 font-bold">Menyusun analisis klinis & saran medis komprehensif...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-indigo-950 uppercase tracking-wide flex items-center gap-1">
                      🔬 Hasil Ringkasan AI
                    </label>
                    <textarea
                      value={ringkasanAnalisisAi}
                      onChange={(e) => setRingkasanAnalisisAi(e.target.value)}
                      className="w-full h-44 bg-white border border-slate-200 rounded-xl p-3.5 text-xs font-semibold leading-relaxed focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/10 outline-none resize-none font-sans text-slate-700"
                      placeholder="Draf ringkasan analisis klinis..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-emerald-950 uppercase tracking-wide flex items-center gap-1">
                      📋 Saran & Rekomendasi AI
                    </label>
                    <textarea
                      value={saranAnalisisAi}
                      onChange={(e) => setSaranAnalisisAi(e.target.value)}
                      className="w-full h-44 bg-white border border-slate-200 rounded-xl p-3.5 text-xs font-semibold leading-relaxed focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/10 outline-none resize-none font-sans text-slate-700"
                      placeholder="Draf saran medis tindak lanjut..."
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ACTION SAVE BUTTONS */}
          <div className="flex gap-2 justify-end border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={resetAllStates}
              className="px-4 py-2 rounded-xl text-xs font-black text-slate-650 bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer transition-all"
            >
              Reset / Bersihkan
            </button>
            <button
              type="button"
              disabled={isAnalyzing || isLoading}
              onClick={handleGenerateAnalysis}
              className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 shadow-md border border-indigo-700 hover:shadow-lg cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 duration-150 shadow-indigo-100 hover:shadow-indigo-250/20"
              style={{ backgroundColor: '#4f46e5', color: '#ffffff', borderColor: '#4338ca' }}
            >
              ✨ AI Analisis Klinis
            </button>
            <button
              type="button"
              onClick={handleSaveLabData}
              disabled={isActiveBatal || isActiveSelesai || isAnalyzing}
              className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-md border border-emerald-700 hover:shadow-lg cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 duration-150 shadow-emerald-100 hover:shadow-emerald-250/20"
              style={{ backgroundColor: '#059669', color: '#ffffff', borderColor: '#047857' }}
            >
              💾 Simpan Hasil Lab
            </button>
          </div>

        </div>
      )}

      {/* HISTORY OF UPLOADED LAB RECORDS TABLE */}
      {savedRecords.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4 animate-fade-in">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              📜 Riwayat Pemeriksaan Laboratorium Pasien
            </h3>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">
              Daftar berkas LIS hasil lab yang diunggah dan disimpan untuk kunjungan medis saat ini.
            </p>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-500 border-b border-slate-250 font-black uppercase tracking-wider text-[9px] text-center">
                    <th className="p-3 text-left w-1/4">Tanggal Pemeriksaan</th>
                    <th className="p-3 w-1/4">Instansi/RS Pengirim</th>
                    <th className="p-3 w-1/4">Nama Pasien</th>
                    <th className="p-3 w-1/6">No. Reg / LIS Order</th>
                    <th className="p-3 w-1/4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {savedRecords.map((record) => {
                    const isExpanded = expandedRecordId === record.id_hasil_lab;
                    return (
                      <React.Fragment key={record.id_hasil_lab}>
                        {/* Table Row */}
                        <tr className={`hover:bg-slate-50/50 transition-colors ${isExpanded ? 'bg-indigo-50/10' : ''}`}>
                          <td className="p-3 font-mono font-bold text-left text-slate-700">
                            📅 {record.formatted_tanggal_lab || record.tanggal_lab}
                          </td>
                          <td className="p-3 font-bold text-slate-800 text-center">
                            🏢 {record.nama_rs}
                          </td>
                          <td className="p-3 font-bold text-slate-800 text-center">
                            {record.nama_pasien}
                          </td>
                          <td className="p-3 font-mono text-center text-slate-500">
                            {record.no_registrasi || record.no_order || '-'}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => setExpandedRecordId(isExpanded ? null : record.id_hasil_lab)}
                                className="px-3.5 py-1.5 rounded-lg text-[10px] font-black text-white hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                                style={{ backgroundColor: isExpanded ? '#4f46e5' : '#6366f1', color: '#ffffff' }}
                              >
                                {isExpanded ? '▲ Tutup Detail' : '🔍 Lihat Detail'}
                              </button>
                              <button
                                type="button"
                                disabled={isActiveBatal || isActiveSelesai}
                                onClick={() => handleDeleteLabData(record.id_hasil_lab)}
                                className="px-3 py-1.5 rounded-lg text-[10px] font-black text-rose-650 bg-rose-50 border border-rose-200 hover:bg-rose-100 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                              >
                                🗑️ Hapus
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Collapsible Detail Panel */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={5} className="p-4 bg-slate-50/40 border-t border-b border-indigo-100/30">
                              <div className="space-y-4 animate-scale-up">
                                
                                {/* Kop Surat */}
                                <div className="border border-indigo-100 bg-white rounded-2xl p-5 space-y-4 shadow-sm/5">
                                  <div className="flex justify-between items-start border-b border-indigo-100/60 pb-3 flex-wrap gap-4">
                                    <div className="space-y-1">
                                      <span className="text-[9px] font-black text-indigo-700 uppercase tracking-widest block">INSTANSI PENGIRIM</span>
                                      <span className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                                        🏢 {record.nama_rs}
                                      </span>
                                    </div>
                                    <div className="space-y-1 md:text-right">
                                      <span className="text-[9px] font-black text-indigo-700 uppercase tracking-widest block">TANGGAL PEMERIKSAAN</span>
                                      <span className="text-xs font-mono font-bold text-slate-700 block">
                                        📅 {record.formatted_tanggal_lab || record.tanggal_lab}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold text-slate-700">
                                    <div className="space-y-1">
                                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">NAMA PASIEN</span>
                                      <span className="block text-slate-800 text-xs font-black">{record.nama_pasien}</span>
                                    </div>
                                    <div className="space-y-1">
                                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">NO REGISTRASI</span>
                                      <span className="block text-slate-700 font-mono text-[11px]">{record.no_registrasi || '-'}</span>
                                    </div>
                                    <div className="space-y-1">
                                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">NO ORDER / LIS</span>
                                      <span className="block text-slate-700 font-mono text-[11px]">{record.no_order || '-'}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Results Table */}
                                <div className="border border-slate-200 bg-white rounded-2xl overflow-hidden shadow-sm/5">
                                  <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                      <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-black uppercase tracking-wider text-[9px] text-center">
                                        <th className="p-3 text-left w-1/3">Parameter Pemeriksaan</th>
                                        <th className="p-3 w-1/6">Kategori</th>
                                        <th className="p-3 w-1/6">Hasil</th>
                                        <th className="p-3 w-1/12">Satuan</th>
                                        <th className="p-3 w-1/6">Nilai Normal</th>
                                        <th className="p-3 w-1/6">Flag</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                                      {(() => {
                                        const grouped = getGroupedParams(record.daftar_pemeriksaan || []);
                                        return Object.keys(grouped).map((categoryName) => {
                                          const items = grouped[categoryName];
                                          const key = `${record.id_hasil_lab}-${categoryName}`;
                                          const isCollapsed = collapsedCategories[key];
                                          
                                          const highCount = items.filter(item => item.param.flag === 'High').length;
                                          const lowCount = items.filter(item => item.param.flag === 'Low').length;
                                          const hasAbnormal = highCount > 0 || lowCount > 0;
                                          
                                          return (
                                            <React.Fragment key={categoryName}>
                                              {/* Category Header Row */}
                                              <tr 
                                                onClick={() => toggleCategory(key)}
                                                className="bg-slate-50 hover:bg-slate-100 cursor-pointer select-none transition-colors border-b border-slate-200"
                                              >
                                                <td colSpan={6} className="p-3 pl-4 font-black text-slate-800 text-left">
                                                  <div className="flex justify-between items-center w-full">
                                                    <div className="flex items-center gap-2">
                                                      <span className="text-slate-450 text-[10px] font-bold font-mono">
                                                        {isCollapsed ? '▶' : '▼'}
                                                      </span>
                                                      <span className="text-xs uppercase tracking-wider text-slate-700 font-extrabold">
                                                        📁 {categoryName}
                                                      </span>
                                                      <span className="text-[10px] text-slate-400 font-bold font-sans">
                                                        ({items.length} Parameter)
                                                      </span>
                                                    </div>
                                                    
                                                    <div className="flex gap-1.5 items-center">
                                                      {isCollapsed && hasAbnormal && (
                                                        <div className="flex gap-1">
                                                          {highCount > 0 && (
                                                            <span className="bg-rose-500 border border-rose-600 text-white font-extrabold text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider select-none animate-pulse">
                                                              ▲ {highCount} High
                                                            </span>
                                                          )}
                                                          {lowCount > 0 && (
                                                            <span className="bg-blue-500 border border-blue-600 text-white font-extrabold text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider select-none animate-pulse">
                                                              ▼ {lowCount} Low
                                                            </span>
                                                          )}
                                                        </div>
                                                      )}
                                                      {isCollapsed && !hasAbnormal && (
                                                        <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider select-none">
                                                          ✓ Semua Normal
                                                        </span>
                                                      )}
                                                    </div>
                                                  </div>
                                                </td>
                                              </tr>
                                              
                                              {/* Parameter Rows (if expanded) */}
                                              {!isCollapsed && items.map(({ param, originalIndex }) => (
                                                <tr key={originalIndex} className={getRowClass(param.flag)}>
                                                  <td className="p-3 pl-6 font-bold text-slate-800 text-left">
                                                    {param.nama_pemeriksaan}
                                                  </td>
                                                  <td className="p-3 text-slate-450 font-bold text-[10px] uppercase text-center select-none">
                                                    {param.kategori}
                                                  </td>
                                                  <td className="p-3 font-mono font-black text-center text-slate-800">
                                                    {param.hasil}
                                                  </td>
                                                  <td className="p-3 font-mono font-bold text-center text-slate-550 select-none">
                                                    {param.satuan || '-'}
                                                  </td>
                                                  <td className="p-3 font-mono font-bold text-center text-slate-500 select-none">
                                                    {param.nilai_normal}
                                                  </td>
                                                  <td className="p-3 text-center flex justify-center items-center h-full pt-4">
                                                    {getFlagBadge(param.flag)}
                                                  </td>
                                                </tr>
                                              ))}
                                            </React.Fragment>
                                          );
                                        });
                                      })()}
                                    </tbody>
                                  </table>
                                </div>

                                {/* AI Clinical Notes display */}
                                {(record.ringkasan_analisis_ai || record.saran_analisis_ai || record.catatan_analisis_ai) && (
                                  <div className="bg-indigo-50/15 border border-indigo-100/50 rounded-2xl p-5 text-left mt-2 space-y-4">
                                    <span className="text-[10px] font-black text-indigo-750 uppercase tracking-widest block border-b border-indigo-100/40 pb-1.5 flex items-center gap-1">
                                      🧠 Hasil Analisis Klinis & Rekomendasi AI (Tersimpan)
                                    </span>
                                    {record.ringkasan_analisis_ai || record.saran_analisis_ai ? (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {record.ringkasan_analisis_ai && (
                                          <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider block">🔬 Hasil Ringkasan AI</span>
                                            <div className="text-xs font-semibold text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">
                                              {record.ringkasan_analisis_ai}
                                            </div>
                                          </div>
                                        )}
                                        {record.saran_analisis_ai && (
                                          <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">📋 Rekomendasi Taktis AI</span>
                                            <div className="text-xs font-semibold text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">
                                              {record.saran_analisis_ai}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="text-xs font-semibold text-slate-700 leading-relaxed whitespace-pre-wrap font-sans prose prose-slate max-w-none">
                                        {record.catatan_analisis_ai}
                                      </div>
                                    )}
                                  </div>
                                )}

                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* NAMA PASIEN MISMATCH CONFIRMATION MODAL */}
      {showNameConfirmModal && mismatchedNames && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="bg-amber-50 p-6 border-b border-amber-100 flex items-start gap-4">
              <span className="text-3xl select-none leading-none animate-bounce">⚠️</span>
              <div className="space-y-1 text-left">
                <h3 className="text-sm font-black text-amber-900 uppercase tracking-wider">
                  Verifikasi Kesesuaian Nama Pasien
                </h3>
                <p className="text-[10.5px] text-amber-800/80 font-bold leading-relaxed">
                  Nama pasien terdeteksi berbeda antara dokumen hasil laboratorium yang diunggah dengan data pasien terdaftar di sistem.
                </p>
              </div>
            </div>

            {/* Modal Body / Comparison */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 font-bold text-left leading-relaxed">
                Silakan pilih nama yang benar untuk merekam hasil lab ini ke dalam database rekam medis pasien:
              </p>

              <div className="grid grid-cols-1 gap-3.5">
                
                {/* Option 1: Registered Name */}
                <button
                  type="button"
                  onClick={() => executeSave(mismatchedNames.systemName)}
                  className="w-full text-left p-4.5 rounded-2xl border-2 border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-400 active:scale-[0.99] cursor-pointer transition-all flex flex-col gap-1"
                >
                  <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest block">
                    ✓ Rekomendasi: Gunakan Nama Terdaftar di Sistem
                  </span>
                  <span className="text-sm font-black text-slate-800 block">
                    {mismatchedNames.systemName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                    Gunakan nama resmi pasien yang terdaftar di rekam medis klinik HIS.
                  </span>
                </button>

                {/* Option 2: Scanned Name */}
                <button
                  type="button"
                  onClick={() => executeSave(mismatchedNames.documentName)}
                  className="w-full text-left p-4.5 rounded-2xl border-2 border-indigo-100 bg-indigo-50/20 hover:bg-indigo-50 hover:border-indigo-400 active:scale-[0.99] cursor-pointer transition-all flex flex-col gap-1"
                >
                  <span className="text-[9px] font-black text-indigo-700 uppercase tracking-widest block">
                    📄 Gunakan Nama Tertera di Hasil Lab (PDF)
                  </span>
                  <span className="text-sm font-black text-slate-800 block">
                    {mismatchedNames.documentName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                    Gunakan nama pasien persis seperti yang tercetak di dokumen PDF/Gambar.
                  </span>
                </button>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 px-6 border-t border-slate-100 flex justify-end gap-2.5 animate-fade-in">
              <button
                type="button"
                onClick={() => {
                  setShowNameConfirmModal(false);
                  setMismatchedNames(null);
                }}
                className="px-4.5 py-2 rounded-xl text-xs font-black text-slate-650 hover:bg-slate-100 transition-all cursor-pointer border border-slate-200 bg-white"
              >
                Batal / Batalkan Simpan
              </button>
            </div>

          </div>
        </div>
      )}

      {/* PREMIUM FLOATING TOAST NOTIFICATION */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3.5 px-4.5 py-3.5 rounded-2xl shadow-2xl transition-all duration-300 transform border text-xs font-bold font-sans animate-fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-250 shadow-emerald-500/10'
              : 'bg-rose-50 text-rose-800 border-rose-250 shadow-rose-500/10'
          }`}
          style={{ minWidth: '320px', maxWidth: '420px', zIndex: 9999 }}
        >
          <span className="text-lg leading-none select-none">
            {toast.type === 'success' ? '✅' : '⚠️'}
          </span>
          <div className="flex-1 space-y-0.5 text-left">
            <span className="block font-black text-slate-800">
              {toast.type === 'success' ? 'Berhasil' : 'Peringatan Medis'}
            </span>
            <span className="block text-[10.5px] font-semibold text-slate-650 leading-relaxed">
              {toast.message}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-700 cursor-pointer font-bold text-xs select-none pl-1 transition-colors bg-transparent border-none outline-none"
          >
            ✕
          </button>
        </div>
      )}

    </div>
  );
}
