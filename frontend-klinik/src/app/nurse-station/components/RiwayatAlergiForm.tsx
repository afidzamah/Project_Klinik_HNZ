'use client';

import React from 'react';

interface RiwayatAlergiFormProps {
  formTriage: any;
  setFormTriage: React.Dispatch<React.SetStateAction<any>>;
  activeAntrean: any;
  isActiveBatal: boolean;
  isActiveSelesai: boolean;
}

export default function RiwayatAlergiForm({
  formTriage,
  setFormTriage,
  activeAntrean,
  isActiveBatal,
  isActiveSelesai,
}: RiwayatAlergiFormProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <span className="text-teal-600">📋</span> Riwayat Kesehatan & Alergi
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-5 rounded-2xl border border-slate-200/60">
        {/* Alergi Makanan */}
        <div className="space-y-2">
          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Alergi Makanan</label>
          <input
            type="text"
            disabled={!activeAntrean || isActiveBatal || isActiveSelesai}
            placeholder="Contoh: Seafood, Kacang, Telur (Kosongkan jika tdk ada)"
            value={formTriage.alergi_makanan}
            onChange={(e) => setFormTriage({...formTriage, alergi_makanan: e.target.value})}
            className="w-full rounded-xl border-2 border-slate-200 p-3.5 text-xs font-semibold text-slate-800 focus:border-red-500 outline-none transition-all bg-white disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200"
          />
        </div>

        {/* Alergi Obat */}
        <div className="space-y-2">
          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Alergi Obat</label>
          <input
            type="text"
            disabled={!activeAntrean || isActiveBatal || isActiveSelesai}
            placeholder="Contoh: Penicillin, Aspirin, Sulfa (Kosongkan jika tdk ada)"
            value={formTriage.alergi_obat}
            onChange={(e) => setFormTriage({...formTriage, alergi_obat: e.target.value})}
            className="w-full rounded-xl border-2 border-slate-200 p-3.5 text-xs font-semibold text-slate-800 focus:border-red-500 outline-none transition-all bg-white disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200"
          />
        </div>

        {/* Obat yang Dikonsumsi */}
        <div className="col-span-1 md:col-span-2 space-y-2">
          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Obat yang Sedang Dikonsumsi</label>
          <textarea
            disabled={!activeAntrean || isActiveBatal || isActiveSelesai}
            rows={3}
            placeholder="Contoh: Amlodipine 5mg 1x1, Metformin 500mg 2x1 (Kosongkan jika tdk ada)"
            value={formTriage.obat_dikonsumsi}
            onChange={(e) => setFormTriage({...formTriage, obat_dikonsumsi: e.target.value})}
            className="w-full rounded-xl border-2 border-slate-200 p-3.5 text-xs font-semibold text-slate-800 focus:border-red-500 outline-none transition-all bg-white disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 resize-none"
          ></textarea>
        </div>

        {/* Riwayat Penyakit Sebelumnya */}
        <div className="col-span-1 md:col-span-2 space-y-2">
          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Riwayat Penyakit Sebelumnya</label>
          <textarea
            disabled={!activeAntrean || isActiveBatal || isActiveSelesai}
            rows={3}
            placeholder="Contoh: Hipertensi, Diabetes Melitus, Asma (Kosongkan jika tdk ada)"
            value={formTriage.riwayat_penyakit}
            onChange={(e) => setFormTriage({...formTriage, riwayat_penyakit: e.target.value})}
            className="w-full rounded-xl border-2 border-slate-200 p-3.5 text-xs font-semibold text-slate-800 focus:border-red-500 outline-none transition-all bg-white disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 resize-none"
          ></textarea>
        </div>
      </div>
    </div>
  );
}
