'use client';

import React, { useState, useEffect } from 'react';

interface KeluhanAsesmenFormProps {
  formTriage: any;
  setFormTriage: React.Dispatch<React.SetStateAction<any>>;
  activeAntrean: any;
  isActiveBatal: boolean;
  isActiveSelesai: boolean;
  
  // Keluhan & Anamnesis states
  tipeKunjungan: string;
  setTipeKunjungan: (val: string) => void;
  onsetKeluhan: string;
  setOnsetKeluhan: (val: string) => void;
  gejalaTambahan: string[];
  setGejalaTambahan: React.Dispatch<React.SetStateAction<string[]>>;

  // Collapsible states
  nyeriCollapsed: boolean;
  setNyeriCollapsed: (val: boolean) => void;
  risikoJatuhCollapsed: boolean;
  setRisikoJatuhCollapsed: (val: boolean) => void;
  metodeNyeri: 'wong-baker' | 'nrs' | 'vas' | 'flacc' | 'painad';
  setMetodeNyeri: (val: 'wong-baker' | 'nrs' | 'vas' | 'flacc' | 'painad') => void;

  // Morse states
  morse1: number;
  setMorse1: (val: number) => void;
  morse2: number;
  setMorse2: (val: number) => void;
  morse3: number;
  setMorse3: (val: number) => void;
  morse4: number;
  setMorse4: (val: number) => void;
  morse5: number;
  setMorse5: (val: number) => void;
  morse6: number;
  setMorse6: (val: number) => void;
}

export default function KeluhanAsesmenForm({
  formTriage,
  setFormTriage,
  activeAntrean,
  isActiveBatal,
  isActiveSelesai,
  
  tipeKunjungan,
  setTipeKunjungan,
  onsetKeluhan,
  setOnsetKeluhan,
  gejalaTambahan,
  setGejalaTambahan,

  nyeriCollapsed,
  setNyeriCollapsed,
  risikoJatuhCollapsed,
  setRisikoJatuhCollapsed,
  metodeNyeri,
  setMetodeNyeri,

  morse1,
  setMorse1,
  morse2,
  setMorse2,
  morse3,
  setMorse3,
  morse4,
  setMorse4,
  morse5,
  setMorse5,
  morse6,
  setMorse6,
}: KeluhanAsesmenFormProps) {

  const [vasMm, setVasMm] = useState(formTriage.skala_nyeri * 10);

  useEffect(() => {
    setVasMm(formTriage.skala_nyeri * 10);
  }, [formTriage.skala_nyeri]);

  // Local states for FLACC
  const [flaccFace, setFlaccFace] = useState(0);
  const [flaccLegs, setFlaccLegs] = useState(0);
  const [flaccActivity, setFlaccActivity] = useState(0);
  const [flaccCry, setFlaccCry] = useState(0);
  const [flaccConsolability, setFlaccConsolability] = useState(0);

  // Local states for PAINAD
  const [painadBreathing, setPainadBreathing] = useState(0);
  const [painadVocalization, setPainadVocalization] = useState(0);
  const [painadFacial, setPainadFacial] = useState(0);
  const [painadBody, setPainadBody] = useState(0);
  const [painadConsolability, setPainadConsolability] = useState(0);

  const handleFlaccChange = (category: string, value: number) => {
    let fFace = flaccFace;
    let fLegs = flaccLegs;
    let fAct = flaccActivity;
    let fCry = flaccCry;
    let fCons = flaccConsolability;

    if (category === 'face') { setFlaccFace(value); fFace = value; }
    if (category === 'legs') { setFlaccLegs(value); fLegs = value; }
    if (category === 'activity') { setFlaccActivity(value); fAct = value; }
    if (category === 'cry') { setFlaccCry(value); fCry = value; }
    if (category === 'consolability') { setFlaccConsolability(value); fCons = value; }

    const newScore = fFace + fLegs + fAct + fCry + fCons;
    setFormTriage((prev: any) => ({ ...prev, skala_nyeri: newScore }));
  };

  const handlePainadChange = (category: string, value: number) => {
    let pBreath = painadBreathing;
    let pVocal = painadVocalization;
    let pFace = painadFacial;
    let pBody = painadBody;
    let pCons = painadConsolability;

    if (category === 'breathing') { setPainadBreathing(value); pBreath = value; }
    if (category === 'vocalization') { setPainadVocalization(value); pVocal = value; }
    if (category === 'facial') { setPainadFacial(value); pFace = value; }
    if (category === 'body') { setPainadBody(value); pBody = value; }
    if (category === 'consolability') { setPainadConsolability(value); pCons = value; }

    const newScore = pBreath + pVocal + pFace + pBody + pCons;
    setFormTriage((prev: any) => ({ ...prev, skala_nyeri: newScore }));
  };

  const toggleGejala = (gejala: string) => {
    if (isActiveBatal || isActiveSelesai || !activeAntrean) return;
    if (gejalaTambahan.includes(gejala)) {
      setGejalaTambahan(gejalaTambahan.filter(g => g !== gejala));
    } else {
      setGejalaTambahan([...gejalaTambahan, gejala]);
    }
  };

  const getTipeKunjunganClass = (tipe: string) => {
    const isSelected = tipeKunjungan === tipe;
    if (isSelected) return 'bg-emerald-600 border-emerald-700 text-white font-extrabold scale-105';
    return 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-800';
  };

  const getOnsetKeluhanClass = (onset: string) => {
    const isSelected = onsetKeluhan === onset;
    if (isSelected) return 'bg-emerald-600 border-emerald-700 text-white font-extrabold scale-105';
    return 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-800';
  };

  const getGejalaClass = (gejala: string, type: 'kardio' | 'metabolik') => {
    const isSelected = gejalaTambahan.includes(gejala);
    if (isSelected) {
      if (type === 'kardio') return 'bg-rose-50 border-rose-400 text-rose-800 font-extrabold ring-1 ring-rose-400';
      return 'bg-amber-50 border-amber-400 text-amber-800 font-extrabold ring-1 ring-amber-400';
    }
    return 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-800';
  };

  return (
    <div className="space-y-6">
      
      {/* 1. KELUHAN & ANAMNESIS AWAL */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-6 shadow-sm/5 bg-slate-50/20">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span className="text-emerald-600">💬</span> Keluhan & Anamnesis Awal
          </h3>
          <p className="text-[10px] text-slate-400 font-bold mt-0.5">Kumpulkan informasi klinis awal — akan langsung tampil di cockpit dokter</p>
        </div>

        {/* 1.1 Keluhan Utama */}
        <div className="space-y-4 p-4 rounded-xl border border-slate-200 bg-white">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-black text-slate-700 flex items-center gap-1.5">
              <span className="bg-emerald-100 text-emerald-700 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold">1</span>
              Keluhan Utama
            </h4>
            <span className="bg-amber-50 text-amber-600 text-[10px] font-black px-2 py-0.5 rounded-md border border-amber-250 border-amber-200">Wajib</span>
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest pl-0.5">KELUHAN HARI INI *</label>
            <textarea 
              required 
              disabled={!activeAntrean || isActiveBatal || isActiveSelesai}
              rows={3}
              placeholder={
                isActiveBatal 
                  ? 'Layanan dikunci karena pasien telah dibatalkan.' 
                  : isActiveSelesai 
                    ? 'Pemeriksaan triage telah diselesaikan (Mode Read-Only).' 
                    : 'Pasien datang untuk kontrol rutin. Mengeluh kepala agak pusing sejak 3 hari lalu...'
              }
              value={formTriage.keluhan_utama} 
              onChange={(e) => setFormTriage({...formTriage, keluhan_utama: e.target.value})}
              className="w-full rounded-xl border-2 border-slate-200 p-3.5 bg-slate-50 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all resize-none disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Tipe Kunjungan */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipe Kunjungan</label>
              <div className="flex flex-wrap gap-2">
                {['Kontrol rutin', 'Keluhan baru', 'Tindak lanjut'].map((tipe) => (
                  <button
                    key={tipe}
                    type="button"
                    disabled={!activeAntrean || isActiveBatal || isActiveSelesai}
                    onClick={() => setTipeKunjungan(tipe)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${getTipeKunjunganClass(tipe)}`}
                  >
                    {tipe}
                  </button>
                ))}
              </div>
            </div>

            {/* Onset Keluhan */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Onset Keluhan</label>
              <div className="flex flex-wrap gap-2">
                {['3 hari', '1 minggu', 'Kronik'].map((onset) => (
                  <button
                    key={onset}
                    type="button"
                    disabled={!activeAntrean || isActiveBatal || isActiveSelesai}
                    onClick={() => setOnsetKeluhan(onset)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${getOnsetKeluhanClass(onset)}`}
                  >
                    {onset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 1.2 Screening Gejala Tambahan */}
        <div className="space-y-4 p-4 rounded-xl border border-slate-200 bg-white">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-black text-slate-700 flex items-center gap-1.5">
              <span className="bg-emerald-100 text-emerald-700 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold">2</span>
              Screening Gejala Tambahan
            </h4>
            <span className="bg-amber-50 text-amber-600 text-[10px] font-black px-2 py-0.5 rounded-md border border-amber-200">Wajib</span>
          </div>
          <p className="text-[10px] text-slate-400 font-bold leading-normal">Tanyakan satu per satu — centang yang ada</p>

          <div className="space-y-4 pt-2">
            {/* Kardiovaskular */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-rose-500 uppercase tracking-wider">Kardiovaskular</label>
              <div className="flex flex-wrap gap-2">
                {['Nyeri dada', 'Sesak napas', 'Berdebar', 'Pusing / sakit kepala', 'Edema kaki'].map((gjl) => (
                  <button
                    key={gjl}
                    type="button"
                    disabled={!activeAntrean || isActiveBatal || isActiveSelesai}
                    onClick={() => toggleGejala(gjl)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${getGejalaClass(gjl, 'kardio')}`}
                  >
                    {gjl}
                  </button>
                ))}
              </div>
            </div>

            {/* Metabolik */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-amber-650 text-amber-500 uppercase tracking-wider">Metabolik (DM)</label>
              <div className="flex flex-wrap gap-2">
                {['Poliuri / polidipsi', 'Kesemutan', 'Luka sulit sembuh', 'Penglihatan kabur', 'Hipoglikemia'].map((gjl) => (
                  <button
                    key={gjl}
                    type="button"
                    disabled={!activeAntrean || isActiveBatal || isActiveSelesai}
                    onClick={() => toggleGejala(gjl)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${getGejalaClass(gjl, 'metabolik')}`}
                  >
                    {gjl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200/80 text-blue-900 rounded-xl p-3.5 flex items-start gap-2.5 mt-4 select-none">
            <span className="text-base leading-none mt-0.5">ℹ️</span>
            <p className="text-[10px] font-semibold leading-relaxed text-blue-800">
              Gejala kardiovaskular (<span className="text-rose-600 font-extrabold">merah</span>) = prioritas tinggi, dokter diberitahu segera. Gejala metabolik (<span className="text-amber-600 font-extrabold">kuning</span>) = dicatat untuk evaluasi DM.
            </p>
          </div>
        </div>

      </div>

      {/* 2. COLLAPSIBLE ACCORDION: ASESMEN NYERI (WONG-BAKER, NRS, VAS) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setNyeriCollapsed(!nyeriCollapsed)}
          className="w-full flex items-center justify-between p-4 px-5 bg-indigo-50/30 hover:bg-indigo-50/50 transition-all font-black text-xs uppercase tracking-widest text-indigo-900 border-b border-slate-100 cursor-pointer"
        >
          <span className="flex items-center gap-2 text-slate-800">
            <span>💥</span> Asesmen Nyeri <span className="text-[9px] font-black text-indigo-650 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full lowercase">opsional</span>
          </span>
          <div className="flex items-center gap-2">
            <span className="bg-white px-2 py-0.5 rounded border border-indigo-200 font-mono text-[10px] text-indigo-700">Skor: {formTriage.skala_nyeri}/10</span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4.5 w-4.5 text-slate-500 transform transition-transform ${!nyeriCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {!nyeriCollapsed && (
          <div className="p-5 space-y-5 animate-fade-in">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 bg-slate-100 p-1.5 rounded-xl gap-1.5 border border-slate-200/60 shadow-sm/5">
              {[
                { label: '🔢 NRS (Numeric)', value: 'nrs' },
                { label: '📏 VAS (Analogue)', value: 'vas' },
                { label: '😊 Wong-Baker', value: 'wong-baker' },
                { label: '👶 FLACC (Pediatrik)', value: 'flacc' },
                { label: '👵 PAINAD (Lansia)', value: 'painad' }
              ].map((opt, idx) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMetodeNyeri(opt.value as any)}
                  className={`text-center py-2.5 rounded-lg text-[10px] sm:text-xs font-black transition-all cursor-pointer ${
                    idx === 4 ? 'col-span-2 sm:col-span-1' : ''
                  } ${
                    metodeNyeri === opt.value
                      ? 'bg-indigo-600 text-white shadow-md border border-indigo-750'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* METHOD 1: NRS */}
            {metodeNyeri === 'nrs' && (
              <div className="space-y-4 animate-fade-in">
                {/* Info Card */}
                <div className="bg-slate-50 border border-slate-200 p-4.5 rounded-xl space-y-3">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <h4 className="text-xs font-black text-slate-850">NRS — Numeric Rating Scale</h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">Pasien menyebutkan angka 0 sampai 10</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[8px] font-black px-2.5 py-0.5 rounded">Paling umum digunakan</span>
                      {['Dewasa', 'Rawat jalan', 'Rawat inap', 'IGD'].map(b => (
                        <span key={b} className="bg-slate-200/60 text-slate-650 text-[8px] font-black px-1.5 py-0.5 rounded">{b}</span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-slate-200/60 pt-3 text-[10px] text-slate-600 leading-relaxed">
                    <div>
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Cara Penggunaan</span>
                      Tanyakan: "Dari 0 sampai 10, seberapa nyeri?" — 0 tidak nyeri, 10 nyeri terberat yang bisa dibayangkan.
                    </div>
                    <div>
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 text-emerald-650">Kelebihan</span>
                      <ul className="list-disc list-inside font-medium text-slate-500 space-y-0.5">
                        <li>Cepat, 5-10 detik</li>
                        <li>Sensitif terhadap perubahan kecil</li>
                        <li>Mudah didokumentasikan</li>
                        <li>Bisa verbal tanpa alat</li>
                      </ul>
                    </div>
                    <div>
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 text-slate-500">Keterbatasan</span>
                      <ul className="list-disc list-inside font-medium text-slate-500 space-y-0.5">
                        <li>Tidak cocok anak di bawah 7 tahun</li>
                        <li>Butuh abstraksi angka</li>
                        <li>Bukan untuk gangguan kognitif berat</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Interactive NRS selector */}
                <div className="bg-indigo-50/40 p-5 rounded-2xl border border-indigo-100 flex flex-col items-center gap-4.5">
                  <span className="text-[10px] font-black text-indigo-750 uppercase tracking-widest">Pilih Skor Nyeri Pasien</span>
                  <div className="flex flex-wrap justify-center gap-2">
                    {Array.from({ length: 11 }, (_, i) => {
                      const isActive = formTriage.skala_nyeri === i;
                      let colorClass = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50';
                      if (isActive) {
                        if (i === 0) colorClass = 'bg-emerald-600 text-white border-emerald-700 scale-110 shadow-md ring-4 ring-emerald-100';
                        else if (i >= 1 && i <= 3) colorClass = 'bg-green-600 text-white border-green-700 scale-110 shadow-md ring-4 ring-green-100';
                        else if (i >= 4 && i <= 6) colorClass = 'bg-yellow-600 text-white border-yellow-700 scale-110 shadow-md ring-4 ring-yellow-100';
                        else if (i >= 7 && i <= 9) colorClass = 'bg-orange-600 text-white border-orange-700 scale-110 shadow-md ring-4 ring-orange-100';
                        else colorClass = 'bg-rose-600 text-white border-rose-700 scale-110 shadow-md ring-4 ring-rose-100';
                      }
                      return (
                        <button
                          key={i}
                          type="button"
                          disabled={!activeAntrean || isActiveBatal || isActiveSelesai}
                          onClick={() => setFormTriage({ ...formTriage, skala_nyeri: i })}
                          className={`w-11 h-11 rounded-xl border text-sm font-black flex items-center justify-center transition-all cursor-pointer ${colorClass}`}
                        >
                          {i}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Descriptions under scale */}
                  <div className="flex justify-between w-full max-w-lg text-[9px] font-black uppercase tracking-wider text-slate-450 border-t border-slate-200/50 pt-3">
                    <span className="text-emerald-650">0 (Tidak Nyeri)</span>
                    <span className="text-green-650">1-3 (Nyeri Ringan)</span>
                    <span className="text-yellow-650">4-6 (Nyeri Sedang)</span>
                    <span className="text-rose-650">7-10 (Nyeri Berat)</span>
                  </div>
                </div>
              </div>
            )}

            {/* METHOD 2: VAS */}
            {metodeNyeri === 'vas' && (
              <div className="space-y-4 animate-fade-in">
                {/* Info Card */}
                <div className="bg-slate-50 border border-slate-200 p-4.5 rounded-xl space-y-3">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <h4 className="text-xs font-black text-slate-850">VAS — Visual Analogue Scale</h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">Pasien menandai titik di garis 10 cm antara "tidak nyeri" dan "nyeri terberat"</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {['Dewasa', 'Rawat jalan', 'Penelitian klinis'].map(b => (
                        <span key={b} className="bg-slate-200/60 text-slate-650 text-[8px] font-black px-1.5 py-0.5 rounded">{b}</span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-slate-200/60 pt-3 text-[10px] text-slate-600 leading-relaxed">
                    <div>
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Cara Penggunaan</span>
                      Pasien menunjuk atau menandai titik pada garis horizontal. Diukur dalam mm dari ujung kiri (0-100mm).
                    </div>
                    <div>
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 text-emerald-650">Kelebihan</span>
                      <ul className="list-disc list-inside font-medium text-slate-500 space-y-0.5">
                        <li>Akurat untuk penelitian & uji klinis</li>
                        <li>Mendeteksi perubahan sangat kecil</li>
                        <li>Tidak terpengaruh bias angka bulat</li>
                      </ul>
                    </div>
                    <div>
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 text-slate-500">Keterbatasan</span>
                      <ul className="list-disc list-inside font-medium text-slate-500 space-y-0.5">
                        <li>Butuh kertas/layar sentuh — tidak bisa verbal</li>
                        <li>Lebih lambat dari NRS</li>
                        <li>Kurang praktis di klinik sibuk</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Interactive VAS slider */}
                <div className="bg-indigo-50/40 p-5 rounded-2xl border border-indigo-100 flex flex-col items-center gap-5 w-full">
                  <div className="flex justify-between items-center w-full max-w-xl">
                    <span className="text-[10px] font-black text-indigo-750 uppercase tracking-widest">Geser Slider Sesuai Nyeri Pasien</span>
                    <span className="bg-indigo-600 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-md border border-indigo-700 font-mono">
                      {vasMm} mm (Skor: {formTriage.skala_nyeri}/10)
                    </span>
                  </div>
                  
                  <div className="w-full max-w-xl space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      disabled={!activeAntrean || isActiveBatal || isActiveSelesai}
                      value={vasMm}
                      onChange={(e) => {
                        const mm = parseInt(e.target.value);
                        setVasMm(mm);
                        const scale = Math.round(mm / 10);
                        setFormTriage((prev: any) => ({ ...prev, skala_nyeri: scale }));
                      }}
                      className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                    />
                    
                    {/* Visual analogue scale line indicator */}
                    <div className="flex justify-between text-[9px] font-black uppercase text-slate-450 pt-1 font-mono tracking-tight select-none border-t border-slate-200/20 mt-1">
                      <div className="flex flex-col items-start">
                        <span>|</span>
                        <span className="text-emerald-600 mt-1">0 mm (Tidak Nyeri)</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span>|</span>
                        <span className="text-yellow-600 mt-1">50 mm (Sedang)</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span>|</span>
                        <span className="text-rose-600 mt-1">100 mm (Nyeri Terberat)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* METHOD 3: WONG-BAKER FACES */}
            {metodeNyeri === 'wong-baker' && (
              <div className="space-y-4 animate-fade-in">
                {/* Info Card */}
                <div className="bg-slate-50 border border-slate-200 p-4.5 rounded-xl space-y-3">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <h4 className="text-xs font-black text-slate-850">Wong-Baker FACES</h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">Pasien memilih wajah yang paling menggambarkan nyerinya dari 6 ekspresi wajah</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[8px] font-black px-2.5 py-0.5 rounded">Anak usia 3-7 tahun</span>
                      {['Anak', 'Lansia', 'Hambatan bahasa'].map(b => (
                        <span key={b} className="bg-slate-200/60 text-slate-650 text-[8px] font-black px-1.5 py-0.5 rounded">{b}</span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-slate-200/60 pt-3 text-[10px] text-slate-600 leading-relaxed">
                    <div>
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Cara Penggunaan</span>
                      Tunjukkan gambar 6 wajah dari tersenyum (0) hingga menangis (10). Minta pasien tunjuk yang paling sesuai.
                    </div>
                    <div>
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 text-emerald-650">Kelebihan</span>
                      <ul className="list-disc list-inside font-medium text-slate-500 space-y-0.5">
                        <li>Tidak butuh kemampuan bahasa/angka</li>
                        <li>Intuitif untuk anak-anak</li>
                        <li>Bisa untuk pasien hambatan komunikasi</li>
                      </ul>
                    </div>
                    <div>
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 text-slate-500">Keterbatasan</span>
                      <ul className="list-disc list-inside font-medium text-slate-500 space-y-0.5">
                        <li>Pasien mungkin menilai emosi bukan nyeri</li>
                        <li>Butuh gambar / kartu fisik atau layar</li>
                        <li>Kurang sensitif untuk perubahan kecil</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Wong-baker FACES visual selector */}
                <div className="bg-indigo-50/40 p-4.5 rounded-2xl border border-indigo-100 space-y-3.5">
                  <p className="text-[10px] font-bold text-indigo-750 leading-relaxed text-center uppercase tracking-widest">
                    Pilih Salah Satu Ekspresi Wajah Pasien
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center">
                    {[
                      { emoji: '😊', desc: 'Tidak Nyeri', num: 0, color: 'bg-emerald-50 text-emerald-600 border-emerald-100', activeColor: 'bg-emerald-600 text-white border-emerald-700 scale-105 ring-4 ring-emerald-100' },
                      { emoji: '🙂', desc: 'Sedikit Nyeri', num: 2, color: 'bg-green-50 text-green-600 border-green-100', activeColor: 'bg-green-600 text-white border-green-700 scale-105 ring-4 ring-green-100' },
                      { emoji: '😐', desc: 'Nyeri Sedang', num: 4, color: 'bg-yellow-50 text-yellow-600 border-yellow-100', activeColor: 'bg-yellow-600 text-white border-yellow-700 scale-105 ring-4 ring-yellow-100' },
                      { emoji: '🙁', desc: 'Lebih Nyeri', num: 6, color: 'bg-orange-50 text-orange-600 border-orange-100', activeColor: 'bg-orange-600 text-white border-orange-700 scale-105 ring-4 ring-orange-100' },
                      { emoji: '😢', desc: 'Sangat Nyeri', num: 8, color: 'bg-red-50 text-red-600 border-red-100', activeColor: 'bg-red-600 text-white border-red-700 scale-105 ring-4 ring-red-100' },
                      { emoji: '😭', desc: 'Nyeri Hebat', num: 10, color: 'bg-rose-50 text-rose-600 border-rose-100', activeColor: 'bg-rose-600 text-white border-rose-700 scale-105 ring-4 ring-rose-100' }
                    ].map((face) => {
                      const isActive = formTriage.skala_nyeri === face.num;
                      return (
                        <button
                          key={face.num}
                          type="button"
                          disabled={!activeAntrean || isActiveBatal || isActiveSelesai}
                          onClick={() => setFormTriage({ ...formTriage, skala_nyeri: face.num })}
                          className={`p-3.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                            isActive ? face.activeColor : 'bg-white hover:bg-slate-50 border-slate-200 hover:scale-[1.02]'
                          }`}
                        >
                          <span className="text-3xl select-none">{face.emoji}</span>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            isActive ? 'bg-white/20 text-white' : face.color
                          }`}>{face.num}</span>
                          <span className={`text-[9px] font-bold ${
                            isActive ? 'text-white' : 'text-slate-500'
                          }`}>{face.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* METHOD 4: FLACC BEHAVIORAL SCALE */}
            {metodeNyeri === 'flacc' && (
              <div className="space-y-4 animate-fade-in">
                {/* Info Card */}
                <div className="bg-slate-50 border border-slate-200 p-4.5 rounded-xl space-y-3">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <h4 className="text-xs font-black text-slate-850">FLACC Behavioral Scale</h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">Face, Legs, Activity, Cry, Consolability</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[8px] font-black px-2.5 py-0.5 rounded">Pediatrik & Non-verbal</span>
                      {['Anak < 3 tahun', 'Non-verbal', 'Pasca Operasi', 'ICU'].map(b => (
                        <span key={b} className="bg-slate-200/60 text-slate-650 text-[8px] font-black px-1.5 py-0.5 rounded">{b}</span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-slate-200/60 pt-3 text-[10px] text-slate-600 leading-relaxed">
                    <div>
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Cara Penggunaan</span>
                      Amati pasien selama 1-5 menit. Berikan skor 0, 1, atau 2 pada setiap kategori sesuai kondisi pasien, lalu jumlahkan seluruh skor (0-10).
                    </div>
                    <div>
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 text-emerald-650">Kelebihan</span>
                      <ul className="list-disc list-inside font-medium text-slate-500 space-y-0.5">
                        <li>Sangat andal untuk anak pra-verbal/bayi</li>
                        <li>Menilai perilaku secara objektif</li>
                        <li>Cocok saat pasien tidur/istirahat</li>
                      </ul>
                    </div>
                    <div>
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 text-slate-500">Keterbatasan</span>
                      <ul className="list-disc list-inside font-medium text-slate-500 space-y-0.5">
                        <li>Membutuhkan observasi perilaku langsung</li>
                        <li>Dipengaruhi kecemasan/tidak nyaman non-nyeri</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Interactive FLACC Calculator */}
                <div className="bg-indigo-50/40 p-4.5 rounded-2xl border border-indigo-100 space-y-4">
                  <div className="flex justify-between items-center border-b border-indigo-100 pb-2.5">
                    <span className="text-[10px] font-black text-indigo-750 uppercase tracking-widest">Kalkulator Skor FLACC (Pediatrik)</span>
                    <span className="bg-indigo-600 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-md border border-indigo-700 font-mono">
                      Skor Total: {formTriage.skala_nyeri}/10
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* Category 1: Face */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider pl-0.5">1. Ekspresi Wajah (Face)</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {[
                          { val: 0, label: '😊 0 — Rileks / Senang', desc: 'Tidak ada ekspresi khusus, tersenyum' },
                          { val: 1, label: '🙁 1 — Meringis / Murung', desc: 'Sesekali mengernyitkan dahi, murung, tidak tertarik' },
                          { val: 2, label: '😭 2 — Meringis Terus', desc: 'Dahi berkerut, dagu bergetar, rahang terkatup rapat' }
                        ].map((opt) => (
                          <button
                            key={opt.val}
                            type="button"
                            disabled={!activeAntrean || isActiveBatal || isActiveSelesai}
                            onClick={() => handleFlaccChange('face', opt.val)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-full ${
                              flaccFace === opt.val
                                ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm hover:bg-indigo-650'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="text-xs font-extrabold block">{opt.label}</span>
                            <span className={`text-[9px] mt-1 block leading-relaxed ${flaccFace === opt.val ? 'text-indigo-100 font-bold' : 'text-slate-400 font-semibold'}`}>{opt.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Category 2: Legs */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider pl-0.5">2. Gerakan Kaki (Legs)</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {[
                          { val: 0, label: '🦵 0 — Normal / Rileks', desc: 'Posisi normal, kaki santai tidak tegang' },
                          { val: 1, label: '🏃 1 — Gelisah / Tegang', desc: 'Kaki tidak tenang, tidak bisa diam, terasa kaku' },
                          { val: 2, label: '👟 2 — Menendang / Kaku', desc: 'Kaki ditarik ke atas, menendang-nendang terus' }
                        ].map((opt) => (
                          <button
                            key={opt.val}
                            type="button"
                            disabled={!activeAntrean || isActiveBatal || isActiveSelesai}
                            onClick={() => handleFlaccChange('legs', opt.val)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-full ${
                              flaccLegs === opt.val
                                ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm hover:bg-indigo-650'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="text-xs font-extrabold block">{opt.label}</span>
                            <span className={`text-[9px] mt-1 block leading-relaxed ${flaccLegs === opt.val ? 'text-indigo-100 font-bold' : 'text-slate-400 font-semibold'}`}>{opt.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Category 3: Activity */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider pl-0.5">3. Aktivitas (Activity)</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {[
                          { val: 0, label: '🛌 0 — Tenang / Mudah bergerak', desc: 'Berbaring tenang, posisi normal, bergerak mudah' },
                          { val: 1, label: '🔄 1 — Mengeliat / Tegang', desc: 'Gelisah, membolak-balikkan badan, tegang' },
                          { val: 2, label: '⚡ 2 — Melengkung / Kaku', desc: 'Posisi melengkung kaku, menghentak, menolak bergerak' }
                        ].map((opt) => (
                          <button
                            key={opt.val}
                            type="button"
                            disabled={!activeAntrean || isActiveBatal || isActiveSelesai}
                            onClick={() => handleFlaccChange('activity', opt.val)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-full ${
                              flaccActivity === opt.val
                                ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm hover:bg-indigo-650'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="text-xs font-extrabold block">{opt.label}</span>
                            <span className={`text-[9px] mt-1 block leading-relaxed ${flaccActivity === opt.val ? 'text-indigo-100 font-bold' : 'text-slate-400 font-semibold'}`}>{opt.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Category 4: Cry */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider pl-0.5">4. Tangisan (Cry)</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {[
                          { val: 0, label: '🔇 0 — Tidak Menangis', desc: 'Tenang, tidak mengeluarkan tangisan' },
                          { val: 1, label: '😢 1 — Merintih / Sesekali mengeluh', desc: 'Mengerang atau merengek, sesekali mengeluh pelan' },
                          { val: 2, label: '🔊 2 — Menangis Keras / Menjerit', desc: 'Menangis terus-menerus, berteriak, meracau keras' }
                        ].map((opt) => (
                          <button
                            key={opt.val}
                            type="button"
                            disabled={!activeAntrean || isActiveBatal || isActiveSelesai}
                            onClick={() => handleFlaccChange('cry', opt.val)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-full ${
                              flaccCry === opt.val
                                ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm hover:bg-indigo-650'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="text-xs font-extrabold block">{opt.label}</span>
                            <span className={`text-[9px] mt-1 block leading-relaxed ${flaccCry === opt.val ? 'text-indigo-100 font-bold' : 'text-slate-400 font-semibold'}`}>{opt.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Category 5: Consolability */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider pl-0.5">5. Kemampuan Ditenangkan (Consolability)</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {[
                          { val: 0, label: '🤝 0 — Rileks / Tenang', desc: 'Tenang, santai, tidak memerlukan bantuan khusus' },
                          { val: 1, label: '❤️ 1 — Bisa ditenangkan', desc: 'Tenang bila disentuh, dipeluk, diajak bicara, mudah dialihkan' },
                          { val: 2, label: '❌ 2 — Sulit ditenangkan', desc: 'Sangat sulit ditenangkan dengan sentuhan atau pelukan' }
                        ].map((opt) => (
                          <button
                            key={opt.val}
                            type="button"
                            disabled={!activeAntrean || isActiveBatal || isActiveSelesai}
                            onClick={() => handleFlaccChange('consolability', opt.val)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-full ${
                              flaccConsolability === opt.val
                                ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm hover:bg-indigo-650'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="text-xs font-extrabold block">{opt.label}</span>
                            <span className={`text-[9px] mt-1 block leading-relaxed ${flaccConsolability === opt.val ? 'text-indigo-100 font-bold' : 'text-slate-400 font-semibold'}`}>{opt.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* METHOD 5: PAINAD (PAIN ASSESSMENT IN ADVANCED DEMENTIA) */}
            {metodeNyeri === 'painad' && (
              <div className="space-y-4 animate-fade-in">
                {/* Info Card */}
                <div className="bg-slate-50 border border-slate-200 p-4.5 rounded-xl space-y-3">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <h4 className="text-xs font-black text-slate-850">PAINAD Scale</h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">Pain Assessment in Advanced Dementia</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[8px] font-black px-2.5 py-0.5 rounded">Geriatrik & Demensia</span>
                      {['Lansia', 'Demensia Berat', 'Gangguan Kognitif', 'Paliatif'].map(b => (
                        <span key={b} className="bg-slate-200/60 text-slate-650 text-[8px] font-black px-1.5 py-0.5 rounded">{b}</span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-slate-200/60 pt-3 text-[10px] text-slate-600 leading-relaxed">
                    <div>
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Cara Penggunaan</span>
                      Amati pasien selama 5 menit dalam kondisi istirahat dan bergerak. Berikan skor 0, 1, atau 2 pada setiap kategori sesuai kondisi pasien, lalu jumlahkan seluruh skor (0-10).
                    </div>
                    <div>
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 text-emerald-650">Kelebihan</span>
                      <ul className="list-disc list-inside font-medium text-slate-500 space-y-0.5">
                        <li>Sangat sensitif untuk lansia demensia berat</li>
                        <li>Menghindari bias sub-treatment nyeri geriatri</li>
                        <li>Fokus pada tanda fisiologis dan perilaku</li>
                      </ul>
                    </div>
                    <div>
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 text-slate-500">Keterbatasan</span>
                      <ul className="list-disc list-inside font-medium text-slate-500 space-y-0.5">
                        <li>Skor bisa terpengaruh oleh distress psikososial</li>
                        <li>Membutuhkan keahlian observasi berkala</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Interactive PAINAD Calculator */}
                <div className="bg-indigo-50/40 p-4.5 rounded-2xl border border-indigo-100 space-y-4">
                  <div className="flex justify-between items-center border-b border-indigo-100 pb-2.5">
                    <span className="text-[10px] font-black text-indigo-750 uppercase tracking-widest">Kalkulator Skor PAINAD (Geriatrik)</span>
                    <span className="bg-indigo-600 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-md border border-indigo-700 font-mono">
                      Skor Total: {formTriage.skala_nyeri}/10
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* Category 1: Breathing */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider pl-0.5">1. Pernapasan (Breathing)</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {[
                          { val: 0, label: '🫁 0 — Normal', desc: 'Pernapasan rileks, teratur, tidak bersuara' },
                          { val: 1, label: '😮‍💨 1 — Sesekali sesak / berat', desc: 'Napas berat pendek, sesekali sesak napas singkat' },
                          { val: 2, label: '🌪️ 2 — Napas bising / berat', desc: 'Napas berat bising terus-menerus, hiperventilasi lama, pernapasan Cheyne-Stokes' }
                        ].map((opt) => (
                          <button
                            key={opt.val}
                            type="button"
                            disabled={!activeAntrean || isActiveBatal || isActiveSelesai}
                            onClick={() => handlePainadChange('breathing', opt.val)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-full ${
                              painadBreathing === opt.val
                                ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm hover:bg-indigo-650'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="text-xs font-extrabold block">{opt.label}</span>
                            <span className={`text-[9px] mt-1 block leading-relaxed ${painadBreathing === opt.val ? 'text-indigo-100 font-bold' : 'text-slate-400 font-semibold'}`}>{opt.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Category 2: Vocalization */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider pl-0.5">2. Vokalisasi Negatif (Negative Vocalization)</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {[
                          { val: 0, label: '🤫 0 — Tidak ada', desc: 'Tenang, tidak ada rintihan atau ucapan negatif' },
                          { val: 1, label: '💬 1 — Bergumam / Mengeluh', desc: 'Sesekali bergumam, merintih pelan, atau mengeluh suara rendah' },
                          { val: 2, label: '📢 2 — Meracau / Mengerang keras', desc: 'Meracau terus-menerus, berteriak gelisah, menangis terisak' }
                        ].map((opt) => (
                          <button
                            key={opt.val}
                            type="button"
                            disabled={!activeAntrean || isActiveBatal || isActiveSelesai}
                            onClick={() => handlePainadChange('vocalization', opt.val)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-full ${
                              painadVocalization === opt.val
                                ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm hover:bg-indigo-650'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="text-xs font-extrabold block">{opt.label}</span>
                            <span className={`text-[9px] mt-1 block leading-relaxed ${painadVocalization === opt.val ? 'text-indigo-100 font-bold' : 'text-slate-400 font-semibold'}`}>{opt.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Category 3: Facial Expression */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider pl-0.5">3. Ekspresi Wajah (Facial Expression)</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {[
                          { val: 0, label: '🙂 0 — Rileks / Senang', desc: 'Tersenyum, santai, ekspresi netral' },
                          { val: 1, label: '🙁 1 — Sedih / Tegang / Cemas', desc: 'Sedih, tegang, sesekali mengernyitkan dahi' },
                          { val: 2, label: '😭 2 — Meringis Kesakitan', desc: 'Meringis kesakitan, mengetatkan gigi, ekspresi sangat menderita' }
                        ].map((opt) => (
                          <button
                            key={opt.val}
                            type="button"
                            disabled={!activeAntrean || isActiveBatal || isActiveSelesai}
                            onClick={() => handlePainadChange('facial', opt.val)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-full ${
                              painadFacial === opt.val
                                ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm hover:bg-indigo-650'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="text-xs font-extrabold block">{opt.label}</span>
                            <span className={`text-[9px] mt-1 block leading-relaxed ${painadFacial === opt.val ? 'text-indigo-100 font-bold' : 'text-slate-400 font-semibold'}`}>{opt.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Category 4: Body Language */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider pl-0.5">4. Bahasa Tubuh (Body Language)</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {[
                          { val: 0, label: '🧘 0 — Rileks', desc: 'Tubuh santai, bergerak bebas dan normal' },
                          { val: 1, label: '😰 1 — Tegang / Gelisah', desc: 'Tubuh tegang, gelisah, mondar-mandir, tidak bisa diam' },
                          { val: 2, label: '✊ 2 — Kaku / Mengepal', desc: 'Kaku, mengepalkan tangan, menarik kaki, memukul/menolak disentuh' }
                        ].map((opt) => (
                          <button
                            key={opt.val}
                            type="button"
                            disabled={!activeAntrean || isActiveBatal || isActiveSelesai}
                            onClick={() => handlePainadChange('body', opt.val)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-full ${
                              painadBody === opt.val
                                ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm hover:bg-indigo-650'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="text-xs font-extrabold block">{opt.label}</span>
                            <span className={`text-[9px] mt-1 block leading-relaxed ${painadBody === opt.val ? 'text-indigo-100 font-bold' : 'text-slate-400 font-semibold'}`}>{opt.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Category 5: Consolability */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider pl-0.5">5. Kemampuan Ditenangkan (Consolability)</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {[
                          { val: 0, label: '🤗 0 — Tenang', desc: 'Tidak memerlukan upaya khusus untuk menenangkan' },
                          { val: 1, label: '🗣️ 1 — Bisa ditenangkan', desc: 'Dapat ditenangkan dengan suara, sentuhan, atau perhatian singkat' },
                          { val: 2, label: '⛔ 2 — Tidak dapat ditenangkan', desc: 'Sangat sulit atau tidak dapat ditenangkan dengan cara apapun' }
                        ].map((opt) => (
                          <button
                            key={opt.val}
                            type="button"
                            disabled={!activeAntrean || isActiveBatal || isActiveSelesai}
                            onClick={() => handlePainadChange('consolability', opt.val)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-full ${
                              painadConsolability === opt.val
                                ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm hover:bg-indigo-650'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="text-xs font-extrabold block">{opt.label}</span>
                            <span className={`text-[9px] mt-1 block leading-relaxed ${painadConsolability === opt.val ? 'text-indigo-100 font-bold' : 'text-slate-400 font-semibold'}`}>{opt.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* 3. COLLAPSIBLE ACCORDION: ASESMEN RISIKO JATUH (MORSE SCALE) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setRisikoJatuhCollapsed(!risikoJatuhCollapsed)}
          className="w-full flex items-center justify-between p-4 px-5 bg-amber-50/20 hover:bg-amber-50/40 transition-all font-black text-xs uppercase tracking-widest text-amber-900 border-b border-slate-100 cursor-pointer"
        >
          <span className="flex items-center gap-2 text-slate-800">
            <span>⚠️</span> Risiko Jatuh <span className="text-[9px] font-black text-amber-650 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full lowercase">opsional</span>
          </span>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded font-bold border text-[9px] uppercase tracking-wide ${
              formTriage.tingkat_risiko_jatuh === 'Risiko Tinggi' 
                ? 'bg-rose-50 border-rose-200 text-rose-700' 
                : formTriage.tingkat_risiko_jatuh === 'Risiko Sedang'
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              Skor: {formTriage.skala_risiko_jatuh} ({formTriage.tingkat_risiko_jatuh})
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4.5 w-4.5 text-slate-500 transform transition-transform ${!risikoJatuhCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {!risikoJatuhCollapsed && (
          <div className="p-5 space-y-5 animate-fade-in">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3.5">
              {/* Morse Item 1 */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200/50">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">1. Riwayat Jatuh (3 bulan terakhir)</span>
                  <span className="text-[10px] text-slate-400">Apakah pasien memiliki riwayat jatuh dalam 3 bulan terakhir?</span>
                </div>
                <div className="flex gap-2">
                  {[
                    { label: 'Tidak (0)', value: 0 },
                    { label: 'Ya (+25)', value: 25 }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={!activeAntrean || isActiveBatal || isActiveSelesai}
                      onClick={() => setMorse1(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        morse1 === opt.value
                          ? 'bg-amber-600 text-white border-amber-700'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Morse Item 2 */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200/50">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">2. Diagnosis Sekunder</span>
                  <span className="text-[10px] text-slate-400">Apakah pasien memiliki 2 atau lebih diagnosa penyakit aktif?</span>
                </div>
                <div className="flex gap-2">
                  {[
                    { label: 'Tidak (0)', value: 0 },
                    { label: 'Ya (+15)', value: 15 }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={!activeAntrean || isActiveBatal || isActiveSelesai}
                      onClick={() => setMorse2(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        morse2 === opt.value
                          ? 'bg-amber-600 text-white border-amber-700'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Morse Item 3 */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200/50">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">3. Alat Bantu Jalan</span>
                  <span className="text-[10px] text-slate-400">Bagaimana gaya berpindah / berjalan pasien?</span>
                </div>
                <div className="flex gap-2">
                  {[
                    { label: 'Mandiri / Dibantu (0)', value: 0 },
                    { label: 'Kruk / Tongkat / Walker (+15)', value: 15 },
                    { label: 'Cenderung Berpegangan Furnitur (+30)', value: 30 }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={!activeAntrean || isActiveBatal || isActiveSelesai}
                      onClick={() => setMorse3(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        morse3 === opt.value
                          ? 'bg-amber-600 text-white border-amber-700'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Morse Item 4 */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200/50">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">4. Terpasang Infus / Terapi IV</span>
                  <span className="text-[10px] text-slate-400">Apakah pasien terpasang infus / terapi obat IV?</span>
                </div>
                <div className="flex gap-2">
                  {[
                    { label: 'Tidak (0)', value: 0 },
                    { label: 'Ya (+20)', value: 20 }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={!activeAntrean || isActiveBatal || isActiveSelesai}
                      onClick={() => setMorse4(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        morse4 === opt.value
                          ? 'bg-amber-600 text-white border-amber-700'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Morse Item 5 */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200/50">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">5. Gaya Berjalan / Cara Berpindah</span>
                  <span className="text-[10px] text-slate-400">Deskripsi gaya berjalan atau berpindah pasien:</span>
                </div>
                <div className="flex gap-2">
                  {[
                    { label: 'Normal / Bedrest (0)', value: 0 },
                    { label: 'Lemah / Salah tumpuan (+10)', value: 10 },
                    { label: 'Terganggu / Goyah (+20)', value: 20 }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={!activeAntrean || isActiveBatal || isActiveSelesai}
                      onClick={() => setMorse5(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        morse5 === opt.value
                          ? 'bg-amber-600 text-white border-amber-700'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Morse Item 6 */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200/50">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">6. Status Mental</span>
                  <span className="text-[10px] text-slate-400">Deskripsi kesadaran mental pasien terhadap kondisinya:</span>
                </div>
                <div className="flex gap-2">
                  {[
                    { label: 'Sadar Keterbatasan (0)', value: 0 },
                    { label: 'Lupa Keterbatasan / Sering Lupa (+15)', value: 15 }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={!activeAntrean || isActiveBatal || isActiveSelesai}
                      onClick={() => setMorse6(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        morse6 === opt.value
                          ? 'bg-amber-600 text-white border-amber-700'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
