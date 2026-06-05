'use client';

import React from 'react';

interface TtvFormProps {
  formTriage: any;
  setFormTriage: React.Dispatch<React.SetStateAction<any>>;
  activeAntrean: any;
  isActiveBatal: boolean;
  isActiveSelesai: boolean;
  prevTriage: any;
}

// Fungsi pembantu untuk menghitung IMT (BMI) secara otomatis
const hitungImt = (bb: string, tb: string) => {
  const weight = parseFloat(bb);
  const height = parseFloat(tb) / 100; // cm to meters
  if (!weight || !height) return '-';
  const imt = weight / (height * height);
  const roundedImt = imt.toFixed(1);
  let category = 'Normal';
  if (imt < 18.5) category = 'Kurus';
  else if (imt >= 18.5 && imt <= 22.9) category = 'Normal';
  else if (imt >= 23 && imt <= 24.9) category = 'Kelebihan BB';
  else if (imt >= 25 && imt <= 29.9) category = 'Gemuk';
  else category = 'Obesitas';
  return `${roundedImt} — ${category}`;
};

const getBpGrade = (sistole: number, diastole: number) => {
  if (sistole >= 160 || diastole >= 100) return 'Hipertensi Grade 2';
  if (sistole >= 140 || diastole >= 90) return 'Hipertensi Grade 1';
  if ((sistole >= 120 && sistole <= 139) || (diastole >= 80 && diastole <= 89)) return 'Prehipertensi';
  return 'Normal';
};

const getBpComparisonText = (curSistole: number, curDiastole: number, prevSistole: number | null, prevDiastole: number | null) => {
  if (prevSistole === null || prevDiastole === null) return '';
  if (curSistole > prevSistole || curDiastole > prevDiastole) {
    return `Lebih tinggi dari kunjungan terakhir (${prevSistole}/${prevDiastole}).`;
  }
  if (curSistole < prevSistole && curDiastole < prevDiastole) {
    return `Lebih rendah dari kunjungan terakhir (${prevSistole}/${prevDiastole}).`;
  }
  return `Stabil dibandingkan kunjungan terakhir (${prevSistole}/${prevDiastole}).`;
};

const getGdsComparisonText = (curGds: number, prevGds: number | null) => {
  if (prevGds === null) return '';
  if (curGds > prevGds) {
    return `Naik dari kunjungan terakhir (${prevGds}).`;
  }
  if (curGds < prevGds) {
    return `Turun dari kunjungan terakhir (${prevGds}).`;
  }
  return `Sama dengan kunjungan terakhir (${prevGds}).`;
};

export default function TtvForm({
  formTriage,
  setFormTriage,
  activeAntrean,
  isActiveBatal,
  isActiveSelesai,
  prevTriage,
}: TtvFormProps) {

  const getSistoleBorderClass = () => {
    const val = parseInt(formTriage.sistole);
    if (!val) return 'border-slate-200 focus:border-red-500 focus:ring-red-500/20 bg-white';
    if (val < 90 || val >= 140) return 'border-rose-400 focus:border-rose-600 focus:ring-rose-500/20 bg-rose-50/5 text-rose-800';
    if (val >= 120 && val < 140) return 'border-amber-400 focus:border-amber-600 focus:ring-amber-500/20 bg-amber-50/5 text-amber-800';
    return 'border-emerald-400 focus:border-emerald-600 focus:ring-emerald-500/20 bg-emerald-50/5 text-emerald-800';
  };

  const getDiastoleBorderClass = () => {
    const val = parseInt(formTriage.diastole);
    if (!val) return 'border-slate-200 focus:border-red-500 focus:ring-red-500/20 bg-white';
    if (val < 60 || val >= 90) return 'border-rose-400 focus:border-rose-600 focus:ring-rose-500/20 bg-rose-50/5 text-rose-800';
    if (val >= 80 && val < 90) return 'border-amber-400 focus:border-amber-600 focus:ring-amber-500/20 bg-amber-50/5 text-amber-800';
    return 'border-emerald-400 focus:border-emerald-600 focus:ring-emerald-500/20 bg-emerald-50/5 text-emerald-800';
  };

  const getNadiBorderClass = () => {
    const val = parseInt(formTriage.nadi);
    if (!val) return 'border-slate-200 focus:border-red-500 focus:ring-red-500/20 bg-white';
    if (val < 50 || val > 120) return 'border-rose-400 focus:border-rose-600 focus:ring-rose-500/20 bg-rose-50/5 text-rose-800';
    if ((val >= 50 && val < 60) || (val > 100 && val <= 120)) return 'border-amber-400 focus:border-amber-600 focus:ring-amber-500/20 bg-amber-50/5 text-amber-800';
    return 'border-emerald-400 focus:border-emerald-600 focus:ring-emerald-500/20 bg-emerald-50/5 text-emerald-800';
  };

  const getSuhuBorderClass = () => {
    const val = parseFloat(formTriage.suhu_tubuh);
    if (!val) return 'border-slate-200 focus:border-red-500 focus:ring-red-500/20 bg-white';
    if (val < 35.0 || val > 38.0) return 'border-rose-400 focus:border-rose-600 focus:ring-rose-500/20 bg-rose-50/5 text-rose-800';
    if ((val >= 35.0 && val < 36.5) || (val > 37.5 && val <= 38.0)) return 'border-amber-400 focus:border-amber-600 focus:ring-amber-500/20 bg-amber-50/5 text-amber-800';
    return 'border-emerald-400 focus:border-emerald-600 focus:ring-emerald-500/20 bg-emerald-50/5 text-emerald-800';
  };

  const getSpo2BorderClass = () => {
    const val = parseInt(formTriage.spo2);
    if (!val) return 'border-slate-200 focus:border-red-500 focus:ring-red-500/20 bg-white';
    if (val < 90) return 'border-rose-400 focus:border-rose-600 focus:ring-rose-500/20 bg-rose-50/5 text-rose-800';
    if (val >= 90 && val < 95) return 'border-amber-400 focus:border-amber-600 focus:ring-amber-500/20 bg-amber-50/5 text-rose-800';
    return 'border-emerald-400 focus:border-emerald-600 focus:ring-emerald-500/20 bg-emerald-50/5 text-emerald-800';
  };

  const getGdsBorderClass = () => {
    const val = parseInt(formTriage.gds);
    if (!val) return 'border-slate-200 focus:border-red-500 focus:ring-red-500/20 bg-white';
    if (val >= 200) return 'border-rose-400 focus:border-rose-600 focus:ring-rose-500/20 bg-rose-50/5 text-rose-800';
    if (val >= 140 && val < 200) return 'border-amber-400 focus:border-amber-600 focus:ring-amber-500/20 bg-amber-50/5 text-amber-800';
    return 'border-emerald-400 focus:border-emerald-600 focus:ring-emerald-500/20 bg-emerald-50/5 text-emerald-800';
  };

  const curSistole = parseInt(formTriage.sistole);
  const curDiastole = parseInt(formTriage.diastole);
  const prevSistole = prevTriage ? parseInt(prevTriage.sistole) : null;
  const prevDiastole = prevTriage ? parseInt(prevTriage.diastole) : null;

  const curGds = parseInt(formTriage.gds);
  const prevGds = prevTriage ? parseInt(prevTriage.gds) : null;

  const showTdAlert = !!(curSistole && curDiastole && prevSistole && prevDiastole && (curSistole >= 120 || curDiastole >= 80));
  const showGdsAlert = !!(curGds && prevGds && curGds >= 140);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <span className="text-red-600">📝</span> Input Asesmen Keperawatan (TTV)
        </h2>
      </div>

      {/* TANDA-TANDA VITAL (TTV) CARD */}
      <div className={`p-6 rounded-2xl border space-y-6 transition-all ${
        isActiveBatal 
          ? 'bg-rose-50/20 border-rose-100' 
          : isActiveSelesai
            ? 'bg-emerald-50/20 border-emerald-100'
            : 'bg-slate-50/40 border-slate-200/80'
      }`}>
        <h3 className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${
          isActiveBatal 
            ? 'text-rose-600' 
            : isActiveSelesai
              ? 'text-emerald-600'
              : 'text-slate-700'
        }`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Pemeriksaan Tanda Vital & Antropometri
        </h3>
        
        <div className="space-y-6">
          {/* FIRST ROW: 5 Columns */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* TD Sistolik */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5 flex justify-between">
                <span>TD SISTOLIK <span className="text-red-500 font-extrabold">*</span></span>
                <span className="text-slate-400 font-normal lowercase tracking-normal font-sans">(norm: 90-120)</span>
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  required 
                  disabled={!activeAntrean || isActiveBatal || isActiveSelesai} 
                  placeholder="120" 
                  value={formTriage.sistole} 
                  onChange={(e) => setFormTriage({...formTriage, sistole: e.target.value})} 
                  className={`w-full rounded-xl border-2 p-3 pl-4 pr-12 text-base font-black outline-none transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed ${getSistoleBorderClass()}`} 
                />
                <span className="absolute right-3.5 top-3.5 text-xs font-bold text-slate-400 select-none pointer-events-none">mmHg</span>
              </div>
            </div>

            {/* TD Diastolik */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5 flex justify-between">
                <span>TD DIASTOLIK <span className="text-red-500 font-extrabold">*</span></span>
                <span className="text-slate-400 font-normal lowercase tracking-normal font-sans">(norm: 60-80)</span>
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  required 
                  disabled={!activeAntrean || isActiveBatal || isActiveSelesai} 
                  placeholder="80" 
                  value={formTriage.diastole} 
                  onChange={(e) => setFormTriage({...formTriage, diastole: e.target.value})} 
                  className={`w-full rounded-xl border-2 p-3 pl-4 pr-12 text-base font-black outline-none transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed ${getDiastoleBorderClass()}`} 
                />
                <span className="absolute right-3.5 top-3.5 text-xs font-bold text-slate-400 select-none pointer-events-none">mmHg</span>
              </div>
            </div>

            {/* Nadi */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5 flex justify-between">
                <span>NADI (/MNT) <span className="text-red-500 font-extrabold">*</span></span>
                <span className="text-slate-400 font-normal lowercase tracking-normal font-sans">(norm: 60-100)</span>
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  required 
                  disabled={!activeAntrean || isActiveBatal || isActiveSelesai} 
                  placeholder="80" 
                  value={formTriage.nadi} 
                  onChange={(e) => setFormTriage({...formTriage, nadi: e.target.value})} 
                  className={`w-full rounded-xl border-2 p-3 pl-4 pr-12 text-base font-black outline-none transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed ${getNadiBorderClass()}`} 
                />
                <span className="absolute right-3.5 top-3.5 text-xs font-bold text-slate-400 select-none pointer-events-none">/mnt</span>
              </div>
            </div>

            {/* Suhu */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5 flex justify-between">
                <span>SUHU (°C)</span>
                <span className="text-slate-400 font-normal lowercase tracking-normal font-sans">(norm: 36.5-37.5)</span>
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.1" 
                  required 
                  disabled={!activeAntrean || isActiveBatal || isActiveSelesai} 
                  placeholder="36.5" 
                  value={formTriage.suhu_tubuh} 
                  onChange={(e) => setFormTriage({...formTriage, suhu_tubuh: e.target.value})} 
                  className={`w-full rounded-xl border-2 p-3 pl-4 pr-8 text-base font-black outline-none transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed ${getSuhuBorderClass()}`} 
                />
                <span className="absolute right-3.5 top-3.5 text-xs font-bold text-slate-400 select-none pointer-events-none">°C</span>
              </div>
            </div>

            {/* SpO2 */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5 flex justify-between">
                <span>SPO2 (%)</span>
                <span className="text-slate-400 font-normal lowercase tracking-normal font-sans">(norm: 95-100)</span>
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  disabled={!activeAntrean || isActiveBatal || isActiveSelesai} 
                  placeholder="98" 
                  value={formTriage.spo2} 
                  onChange={(e) => setFormTriage({...formTriage, spo2: e.target.value})} 
                  className={`w-full rounded-xl border-2 p-3 pl-4 pr-8 text-base font-black outline-none transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed ${getSpo2BorderClass()}`} 
                />
                <span className="absolute right-3.5 top-3.5 text-xs font-bold text-slate-400 select-none pointer-events-none">%</span>
              </div>
            </div>
          </div>

          {/* SECOND ROW: 4 Columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* BB */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                BB (KG) <span className="text-red-500 font-extrabold">*</span>
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.1" 
                  required 
                  disabled={!activeAntrean || isActiveBatal || isActiveSelesai} 
                  placeholder="65" 
                  value={formTriage.berat_badan} 
                  onChange={(e) => setFormTriage({...formTriage, berat_badan: e.target.value})} 
                  className="w-full rounded-xl border-2 border-slate-200 p-3 pl-4 pr-8 text-base font-black text-slate-800 focus:border-red-500 outline-none transition-all bg-white disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed" 
                />
                <span className="absolute right-3.5 top-3.5 text-xs font-bold text-slate-400 select-none pointer-events-none">kg</span>
              </div>
            </div>

            {/* TB */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                TB (CM) <span className="text-red-500 font-extrabold">*</span>
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.1" 
                  required 
                  disabled={!activeAntrean || isActiveBatal || isActiveSelesai} 
                  placeholder="160" 
                  value={formTriage.tinggi_badan} 
                  onChange={(e) => setFormTriage({...formTriage, tinggi_badan: e.target.value})} 
                  className="w-full rounded-xl border-2 border-slate-200 p-3 pl-4 pr-8 text-base font-black text-slate-800 focus:border-red-500 outline-none transition-all bg-white disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed" 
                />
                <span className="absolute right-3.5 top-3.5 text-xs font-bold text-slate-400 select-none pointer-events-none">cm</span>
              </div>
            </div>

            {/* IMT — Otomatis */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                IMT — OTOMATIS
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  disabled 
                  value={hitungImt(formTriage.berat_badan, formTriage.tinggi_badan)} 
                  className="w-full rounded-xl border-2 border-slate-200 p-3 pl-4 text-base font-black text-amber-800 bg-amber-50/10 cursor-not-allowed outline-none select-none" 
                />
              </div>
            </div>

            {/* GDS */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5 flex justify-between">
                <span>GDS (MG/DL)</span>
                <span className="text-slate-400 font-normal lowercase tracking-normal font-sans">(norm: &lt;140)</span>
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  disabled={!activeAntrean || isActiveBatal || isActiveSelesai} 
                  placeholder="120" 
                  value={formTriage.gds} 
                  onChange={(e) => setFormTriage({...formTriage, gds: e.target.value})} 
                  className={`w-full rounded-xl border-2 p-3 pl-4 pr-16 text-base font-black outline-none transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed ${getGdsBorderClass()}`} 
                />
                <span className="absolute right-3.5 top-3.5 text-xs font-bold text-slate-400 select-none pointer-events-none">mg/dL</span>
              </div>
            </div>
          </div>
        </div>

        {/* Warning Comparison Alerts */}
        {(showTdAlert || showGdsAlert) && (
          <div className="space-y-3 pt-4 border-t border-slate-100 mt-4 transition-all duration-300">
            {showTdAlert && (
              <div className="flex items-start gap-3 p-4 rounded-xl border border-rose-200 bg-rose-50/70 text-rose-800 transition-all shadow-sm">
                <span className="text-lg leading-none mt-0.5 select-none">⚠️</span>
                <div className="text-xs font-semibold leading-relaxed">
                  <span className="font-extrabold text-rose-950">TD {formTriage.sistole}/{formTriage.diastole} mmHg — {getBpGrade(curSistole, curDiastole)}.</span>{' '}
                  {getBpComparisonText(curSistole, curDiastole, prevSistole, prevDiastole)}
                  <span className="font-bold text-rose-900"> Akan diflag ke dokter secara otomatis.</span>
                </div>
              </div>
            )}

            {showGdsAlert && (
              <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-800 transition-all shadow-sm">
                <span className="text-lg leading-none mt-0.5 select-none">⚡</span>
                <div className="text-xs font-semibold leading-relaxed">
                  <span className="font-extrabold text-amber-950">GDS {formTriage.gds} mg/dL — Di atas target.</span>{' '}
                  {getGdsComparisonText(curGds, prevGds)}
                  <span className="font-bold text-amber-900"> Dokter perlu evaluasi kepatuhan obat.</span>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
