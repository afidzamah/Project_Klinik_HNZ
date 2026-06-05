import React, { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';

// Fallback comprehensive list of lab examinations seeded in DB
const FALLBACK_LAB_ACTIONS = [
  // 1. Laboratorium Klinik (Patologi Klinik)
  { nama_tindakan: 'Pemeriksaan Darah Lengkap', kategori_tindakan: 'Laboratorium', sub_spesialis: 'Laboratorium Klinik', sub_kategori: 'Hematologi', basePrice: 80000 },
  { nama_tindakan: 'Pemeriksaan Urine Lengkap', kategori_tindakan: 'Laboratorium', sub_spesialis: 'Laboratorium Klinik', sub_kategori: 'Urinalisis', basePrice: 55000 },
  { nama_tindakan: 'Pemeriksaan Glukosa Darah Puasa', kategori_tindakan: 'Laboratorium', sub_spesialis: 'Laboratorium Klinik', sub_kategori: 'Biokimia Darah', basePrice: 30000 },
  { nama_tindakan: 'Pemeriksaan Glukosa Darah 2 Jam PP', kategori_tindakan: 'Laboratorium', sub_spesialis: 'Laboratorium Klinik', sub_kategori: 'Biokimia Darah', basePrice: 30000 },
  { nama_tindakan: 'Pemeriksaan HbA1c', kategori_tindakan: 'Laboratorium', sub_spesialis: 'Laboratorium Klinik', sub_kategori: 'Biokimia Darah', basePrice: 180000 },
  { nama_tindakan: 'Pemeriksaan Kolesterol Total', kategori_tindakan: 'Laboratorium', sub_spesialis: 'Laboratorium Klinik', sub_kategori: 'Lipid', basePrice: 45000 },
  { nama_tindakan: 'Pemeriksaan HDL Kolesterol', kategori_tindakan: 'Laboratorium', sub_spesialis: 'Laboratorium Klinik', sub_kategori: 'Lipid', basePrice: 55000 },
  { nama_tindakan: 'Pemeriksaan LDL Kolesterol', kategori_tindakan: 'Laboratorium', sub_spesialis: 'Laboratorium Klinik', sub_kategori: 'Lipid', basePrice: 75000 },
  { nama_tindakan: 'Pemeriksaan Trigliserida', kategori_tindakan: 'Laboratorium', sub_spesialis: 'Laboratorium Klinik', sub_kategori: 'Lipid', basePrice: 50000 },
  { nama_tindakan: 'Pemeriksaan SGOT (AST)', kategori_tindakan: 'Laboratorium', sub_spesialis: 'Laboratorium Klinik', sub_kategori: 'Fungsi Hati', basePrice: 40000 },
  { nama_tindakan: 'Pemeriksaan SGPT (ALT)', kategori_tindakan: 'Laboratorium', sub_spesialis: 'Laboratorium Klinik', sub_kategori: 'Fungsi Hati', basePrice: 40000 },
  { nama_tindakan: 'Pemeriksaan Ureum Darah', kategori_tindakan: 'Laboratorium', sub_spesialis: 'Laboratorium Klinik', sub_kategori: 'Fungsi Ginjal', basePrice: 45000 },
  { nama_tindakan: 'Pemeriksaan Kreatinin Darah', kategori_tindakan: 'Laboratorium', sub_spesialis: 'Laboratorium Klinik', sub_kategori: 'Fungsi Ginjal', basePrice: 45000 },
  { nama_tindakan: 'Pemeriksaan Asam Urat Darah', kategori_tindakan: 'Laboratorium', sub_spesialis: 'Laboratorium Klinik', sub_kategori: 'Biokimia Darah', basePrice: 40000 },

  // 2. Patologi Anatomi
  { nama_tindakan: 'Histopatologi Biopsi Kecil', kategori_tindakan: 'Laboratorium', sub_spesialis: 'Patologi Anatomi', sub_kategori: 'Histopatologi', basePrice: 350000 },
  { nama_tindakan: 'Histopatologi Biopsi Sedang', kategori_tindakan: 'Laboratorium', sub_spesialis: 'Patologi Anatomi', sub_kategori: 'Histopatologi', basePrice: 550000 },
  { nama_tindakan: 'Histopatologi Biopsi Besar', kategori_tindakan: 'Laboratorium', sub_spesialis: 'Patologi Anatomi', sub_kategori: 'Histopatologi', basePrice: 850000 },
  { nama_tindakan: 'Sitologi Cairan Tubuh (Pleura/Asites)', kategori_tindakan: 'Laboratorium', sub_spesialis: 'Patologi Anatomi', sub_kategori: 'Sitologi', basePrice: 250000 },
  { nama_tindakan: 'Fine Needle Aspiration Biopsy (FNAB)', kategori_tindakan: 'Laboratorium', sub_spesialis: 'Patologi Anatomi', sub_kategori: 'Sitologi', basePrice: 450000 },
  { nama_tindakan: 'Cervical Pap Smear', kategori_tindakan: 'Laboratorium', sub_spesialis: 'Patologi Anatomi', sub_kategori: 'Sitologi', basePrice: 150000 },

  // 3. Mikrobiologi
  { nama_tindakan: 'Pemeriksaan Pewarnaan Gram', kategori_tindakan: 'Laboratorium', sub_spesialis: 'Mikrobiologi', sub_kategori: 'Pewarnaan', basePrice: 65000 },
  { nama_tindakan: 'Pemeriksaan Pewarnaan BTA', kategori_tindakan: 'Laboratorium', sub_spesialis: 'Mikrobiologi', sub_kategori: 'Pewarnaan', basePrice: 90000 },
  { nama_tindakan: 'Kultur & Sensitivitas Bakteri Aerob', kategori_tindakan: 'Laboratorium', sub_spesialis: 'Mikrobiologi', sub_kategori: 'Kultur', basePrice: 350000 },
  { nama_tindakan: 'Pemeriksaan Jamur (KOH)', kategori_tindakan: 'Laboratorium', sub_spesialis: 'Mikrobiologi', sub_kategori: 'Pewarnaan', basePrice: 60000 }
];

// Payment multiplier constants for UI price calculations
const BAYAR_MULTIPLIERS: { [key: string]: number } = {
  'Umum Pribadi': 1.0,
  'Asuransi': 1.3,
  'Perusahaan': 1.2,
  'BPJS': 0.85
};

const QUICK_VENDORS = ['Prodia', 'Pramita Lab', 'Kimia Farma Lab', 'Cito Lab'];

interface LabFormProps {
  activeTab: string;
  activePasien: any;
  labType: 'dalam' | 'luar';
  setLabType: (val: 'dalam' | 'luar') => void;
  externalLabVendor: string;
  setExternalLabVendor: (val: string) => void;
  labDiagnosis: string;
  setLabDiagnosis: (val: string) => void;
  labNotes: string;
  setLabNotes: (val: string) => void;
  labOrderDate: string;
  setLabOrderDate: (val: string) => void;
  selectedLabActions: any[];
  setSelectedLabActions: React.Dispatch<React.SetStateAction<any[]>>;
  diagnosaUtama?: string;
  labOrders: any[];
  setLabOrders: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function LabForm({
  activeTab,
  activePasien,
  labType,
  setLabType,
  externalLabVendor,
  setExternalLabVendor,
  labDiagnosis,
  setLabDiagnosis,
  labNotes,
  setLabNotes,
  labOrderDate,
  setLabOrderDate,
  selectedLabActions,
  setSelectedLabActions,
  diagnosaUtama,
  labOrders,
  setLabOrders,
}: LabFormProps) {
  const [dbTindakans, setDbTindakans] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubSpesialis, setActiveSubSpesialis] = useState<'All' | 'Laboratorium Klinik' | 'Patologi Anatomi' | 'Mikrobiologi'>('All');
  const [loading, setLoading] = useState(false);
  
  // Tab within the lab order form: 'order' (buat order) vs 'history' (riwayat order)
  const [formSubTab, setFormSubTab] = useState<'order' | 'history'>('order');
  
  // State for the order that is currently being printed/previewed
  const [printOrder, setPrintOrder] = useState<any | null>(null);

  // Fetch tindakan from backend and filter by category 'Laboratorium'
  useEffect(() => {
    async function loadTindakans() {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/master-tindakan`);
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        
        // Filter actions with 'Laboratorium' category or match names from our list
        const filtered = data.filter((t: any) => 
          t.kategori_tindakan?.toLowerCase().includes('lab') || 
          FALLBACK_LAB_ACTIONS.some(fa => fa.nama_tindakan.toLowerCase() === t.nama_tindakan.toLowerCase())
        );

        // Map sub-specialty metadata from our seeded list for grouping
        const mapped = filtered.map((t: any) => {
          const matchingFallback = FALLBACK_LAB_ACTIONS.find(
            fa => fa.nama_tindakan.toLowerCase() === t.nama_tindakan.toLowerCase()
          );
          return {
            ...t,
            sub_spesialis: matchingFallback?.sub_spesialis || 'Laboratorium Klinik',
            sub_kategori: matchingFallback?.sub_kategori || 'Hematologi',
            basePrice: matchingFallback?.basePrice || 75000
          };
        });

        if (mapped.length > 0) {
          setDbTindakans(mapped);
        } else {
          setDbTindakans(FALLBACK_LAB_ACTIONS);
        }
      } catch (err) {
        console.warn('API error fetching master tindakan, falling back to local master list:', err);
        setDbTindakans(FALLBACK_LAB_ACTIONS);
      } finally {
        setLoading(false);
      }
    }

    loadTindakans();
  }, []);

  // Autofill diagnosis if SOAP diagnosis exists and state is empty
  useEffect(() => {
    if (diagnosaUtama && !labDiagnosis) {
      setLabDiagnosis(diagnosaUtama);
    }
  }, [diagnosaUtama, labDiagnosis, setLabDiagnosis]);

  const caraBayar = activePasien?.kunjungan?.cara_bayar?.nama_cara_bayar || 'Umum Pribadi';
  const payMultiplier = BAYAR_MULTIPLIERS[caraBayar] || 1.0;

  // Calculate dynamic tariff based on cara bayar multiplier
  const calculateTariff = (basePrice: number) => {
    const raw = basePrice * 1.0 * payMultiplier; // Outpatient is Rawat Jalan (x1.0)
    return Math.round(raw / 100) * 100;
  };

  const handleToggleAction = (action: any) => {
    const isSelected = selectedLabActions.some(a => a.nama_tindakan === action.nama_tindakan);
    if (isSelected) {
      setSelectedLabActions(selectedLabActions.filter(a => a.nama_tindakan !== action.nama_tindakan));
    } else {
      setSelectedLabActions([...selectedLabActions, action]);
    }
  };

  const filteredActions = dbTindakans.filter(act => {
    const matchesSearch = act.nama_tindakan.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          act.sub_kategori.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubSpesialis = activeSubSpesialis === 'All' || act.sub_spesialis === activeSubSpesialis;
    return matchesSearch && matchesSubSpesialis;
  });

  const grandTotal = selectedLabActions.reduce((sum, act) => sum + calculateTariff(act.basePrice), 0);

  const handleTriggerPrint = (order: any) => {
    setPrintOrder(order);
  };

  const executePrint = () => {
    window.print();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).replace('pukul', '');
  };

  return (
    <div className="space-y-4 text-left animate-fadeIn">
      {/* DOUBLE-STATE SUB-TAB SELECTOR */}
      <div className="flex border-b border-slate-200 gap-1.5 pb-0.5">
        <button
          type="button"
          onClick={() => setFormSubTab('order')}
          className={`px-4 py-2 text-xs font-black border-b-2 transition-all cursor-pointer ${
            formSubTab === 'order'
              ? 'border-indigo-600 text-indigo-750'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          🧪 Order Permintaan Baru
        </button>
        <button
          type="button"
          onClick={() => setFormSubTab('history')}
          className={`px-4 py-2 text-xs font-black border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            formSubTab === 'history'
              ? 'border-indigo-600 text-indigo-750'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          📜 Riwayat & Cetak Rujukan
          {labOrders.length > 0 && (
            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0">
              {labOrders.length}
            </span>
          )}
        </button>
      </div>

      {formSubTab === 'order' ? (
        <div className="space-y-4 animate-fadeIn">
          {/* HEADER SECTION */}
          <div className="flex justify-between items-center pb-2.5 border-b border-slate-150">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 uppercase tracking-wide">
                🧪 Buat Permintaan Pemeriksaan
              </h3>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase">
                Pasien: <span className="text-slate-650">{activePasien?.kunjungan?.pasien?.nama_lengkap}</span> | Cara Bayar: <span className="text-indigo-600">{caraBayar}</span>
              </p>
            </div>
            <span className="text-[9px] font-mono bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-indigo-750 font-black">
              ORDER
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* LEFT COLUMN: ORDER PARAMETERS (col-span-7) */}
            <div className="md:col-span-7 space-y-4">
              
              {/* SWITCH BUTTON FOR INTERNAL / EXTERNAL EXAMINATION */}
              <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-150 space-y-2.5">
                <label className="text-[10px] text-slate-400 font-black uppercase block tracking-wider">
                  Tempat Pemeriksaan & Alur Logistik
                </label>
                <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setLabType('dalam')}
                    className={`py-2 text-center text-xs font-black rounded-lg transition-all cursor-pointer ${
                      labType === 'dalam'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-200/50'
                    }`}
                  >
                    🏥 Pemeriksaan Dalam (Lab HNZ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLabType('luar')}
                    className={`py-2 text-center text-xs font-black rounded-lg transition-all cursor-pointer ${
                      labType === 'luar'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-200/50'
                    }`}
                  >
                    🏢 Pemeriksaan Luar (Rujukan)
                  </button>
                </div>

                <p className="text-[9.5px] text-slate-400 font-bold leading-normal pt-0.5">
                  {labType === 'dalam' 
                    ? '✓ Permintaan terkirim ke LIS Lab Klinik, terverifikasi langsung masuk ke Billing Pasien.' 
                    : '✓ Tidak terkirim ke Lab lokal & Billing. Dokter menerbitkan Surat Rujukan Resmi untuk dicetak.'}
                </p>

                {/* EXTERNAL LAB VENDOR FIELD (SHOW ANIMATED IF 'LUAR') */}
                {labType === 'luar' && (
                  <div className="pt-2.5 space-y-2 animate-fadeIn">
                    <label className="text-[9.5px] text-slate-500 font-bold uppercase block">
                      Vendor Laboratorium Rujukan Eksternal
                    </label>
                    <input
                      type="text"
                      placeholder="Masukkan nama laboratorium rujukan (contoh: Prodia)"
                      value={externalLabVendor}
                      onChange={(e) => setExternalLabVendor(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    
                    {/* QUICK VENDOR CHIPS */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {QUICK_VENDORS.map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setExternalLabVendor(v)}
                          className={`text-[8.5px] font-extrabold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                            externalLabVendor === v
                              ? 'bg-indigo-500 text-white border-indigo-600'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* DATE AND DIAGNOSIS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* TANGGAL ORDER */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-black uppercase block tracking-wider">
                    Tanggal & Waktu Order
                  </label>
                  <input
                    type="datetime-local"
                    value={labOrderDate}
                    onChange={(e) => setLabOrderDate(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* DIAGNOSA */}
                <div className="space-y-1 relative">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-slate-400 font-black uppercase block tracking-wider">
                      Diagnosa Klinis
                    </label>
                    {diagnosaUtama && labDiagnosis !== diagnosaUtama && (
                      <button
                        type="button"
                        onClick={() => setLabDiagnosis(diagnosaUtama)}
                        className="text-[8.5px] font-extrabold text-indigo-650 hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        📥 Salin SOAP
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Tuliskan diagnosa atau gejala klinis"
                    value={labDiagnosis}
                    onChange={(e) => setLabDiagnosis(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* KETERANGAN KLINIS */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-black uppercase block tracking-wider">
                  Keterangan / Informasi Klinis
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Pasien diwajibkan puasa 10 jam. Periksa toleransi glukosa."
                  value={labNotes}
                  onChange={(e) => setLabNotes(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                />
              </div>

              {/* SEARCHABLE TINDAKAN MASTER SELECTION */}
              <div className="space-y-3 pt-1">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <label className="text-[10px] text-slate-400 font-black uppercase block tracking-wider">
                    Pilih Parameter Pemeriksaan Lab
                  </label>
                  <input
                    type="text"
                    placeholder="🔍 Cari pemeriksaan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-[11px] rounded-lg border border-slate-200 px-2 py-1 outline-none font-semibold text-slate-750 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 max-w-[220px]"
                  />
                </div>

                {/* FILTER CATEGORY PILLS */}
                <div className="flex flex-wrap gap-1">
                  {(['All', 'Laboratorium Klinik', 'Patologi Anatomi', 'Mikrobiologi'] as const).map((spec) => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => setActiveSubSpesialis(spec)}
                      className={`text-[9px] font-black px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        activeSubSpesialis === spec
                          ? 'bg-indigo-600 text-white border-indigo-750 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-150 hover:bg-slate-100'
                      }`}
                    >
                      {spec === 'All' ? '🌐 Semua' : spec}
                    </button>
                  ))}
                </div>

                {/* LIVE EXAMINATION CHECKBOX LIST */}
                <div className="bg-slate-50/20 rounded-2xl border border-slate-200 p-3 max-h-[220px] overflow-y-auto space-y-2">
                  {loading ? (
                    <div className="text-center py-8 text-xs text-slate-400 font-black">
                      ⏳ Memuat Master Tindakan Lab...
                    </div>
                  ) : filteredActions.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {filteredActions.map((act) => {
                        const isSelected = selectedLabActions.some(a => a.nama_tindakan === act.nama_tindakan);
                        const calcPrice = calculateTariff(act.basePrice);
                        return (
                          <div
                            key={act.nama_tindakan}
                            onClick={() => handleToggleAction(act)}
                            className={`flex justify-between items-center p-2 rounded-xl border text-[11px] font-bold cursor-pointer select-none transition-all ${
                              isSelected
                                ? 'bg-indigo-50/70 border-indigo-300 text-indigo-800 shadow-sm'
                                : 'bg-white border-slate-150 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate pr-1">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="w-3.5 h-3.5 rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 cursor-pointer pointer-events-none"
                              />
                              <div className="truncate">
                                <span className="block truncate leading-snug">{act.nama_tindakan}</span>
                                <span className="text-[8px] text-slate-400 font-bold block leading-none">{act.sub_kategori}</span>
                              </div>
                            </div>
                            <span className="text-[9.5px] font-extrabold text-slate-500 font-mono shrink-0">
                              Rp{calcPrice.toLocaleString('id-ID')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-xs text-slate-400 italic font-semibold">
                      💤 Tidak ditemukan hasil pencarian lab
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: ORDER SUMMARY CART (col-span-5) */}
            <div className="md:col-span-5 space-y-3.5">
              <div className="bg-slate-50/40 border border-slate-200 rounded-2xl p-4.5 space-y-4 flex flex-col h-full justify-between">
                <div className="space-y-3">
                  <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">
                    🛒 Ringkasan Order Pemeriksaan ({selectedLabActions.length} item)
                  </span>

                  {/* CART ITEMS CONTAINER */}
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-0.5">
                    {selectedLabActions.length > 0 ? (
                      selectedLabActions.map((act, index) => {
                        const price = calculateTariff(act.basePrice);
                        return (
                          <div key={index} className="bg-white border border-slate-150 p-2.5 rounded-xl flex justify-between items-center shadow-xs">
                            <div className="space-y-0.5 truncate pr-1 text-xs">
                              <span className="font-extrabold text-slate-800 block truncate leading-snug">{act.nama_tindakan}</span>
                              <span className="text-[8px] bg-slate-50 border border-slate-200 text-slate-450 px-1.5 py-0.5 rounded font-black uppercase inline-block">
                                {act.sub_spesialis}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] font-black text-slate-700 font-mono">
                                Rp{price.toLocaleString('id-ID')}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleAction(act);
                                }}
                                className="text-slate-400 hover:text-rose-500 font-black cursor-pointer text-sm p-0.5 rounded hover:bg-slate-50"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-1.5">
                        <span className="text-2xl">🧺</span>
                        <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-350">Keranjang Order Kosong</span>
                        <span className="text-[8.5px] text-slate-400 max-w-[150px] leading-relaxed">Pilih tindakan di sebelah kiri untuk menambah pesanan.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* PRICING DETAILS SECTION */}
                <div className="border-t border-slate-200/80 pt-3.5 mt-auto space-y-2.5">
                  <div className="space-y-1.5 text-[10.5px] font-semibold text-slate-500">
                    <div className="flex justify-between">
                      <span>Cara Bayar Penjamin</span>
                      <span className="font-extrabold text-slate-700">{caraBayar}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Multiplier Asuransi/BPJS</span>
                      <span className="font-extrabold text-slate-700">{payMultiplier.toFixed(2)}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tipe Pemeriksaan</span>
                      <span className="font-extrabold text-slate-700 capitalize">{labType === 'dalam' ? 'Internal (Lab HNZ)' : `Rujukan (${externalLabVendor || '-'})`}</span>
                    </div>
                  </div>

                  {/* GRAND TOTAL */}
                  <div className="border-t border-dashed border-slate-200 pt-3 flex justify-between items-baseline">
                    <span className="text-xs font-black text-slate-800">ESTIMASI TARIF</span>
                    <span className="text-base font-black text-indigo-750 font-mono">
                      Rp{grandTotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* HISTORY TAB VIEW: MONITOR AND PRINT REFERRALS */
        <div className="space-y-4 animate-fadeIn text-left">
          <div className="flex justify-between items-center pb-2.5 border-b border-slate-150">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 uppercase tracking-wide">
                📜 Riwayat Order & Rujukan Lab
              </h3>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase">
                Memantau status pengiriman logistik & mencetak dokumen rujukan pasien
              </p>
            </div>
            <span className="text-[9px] font-mono bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-indigo-750 font-black">
              RIWAYAT
            </span>
          </div>

          {labOrders.length > 0 ? (
            <div className="space-y-3">
              {labOrders.map((ord) => {
                const total = ord.tindakan.reduce((sum: number, a: any) => sum + calculateTariff(a.basePrice), 0);
                const isLuar = ord.kategori === 'luar';
                return (
                  <div 
                    key={ord.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-l-4 border-l-indigo-500"
                  >
                    <div className="space-y-2 flex-1 text-xs">
                      {/* Sub-Header metadata */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-black text-[11px] text-slate-800 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                          {ord.no_order}
                        </span>
                        <span className="text-slate-400 font-semibold font-mono text-[10px]">
                          {formatDate(ord.tanggal_order)}
                        </span>
                        
                        {/* Status Badge */}
                        <span className={`text-[8.5px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                          isLuar 
                            ? 'bg-blue-50 border-blue-200 text-blue-800' 
                            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        }`}>
                          {ord.status}
                        </span>
                      </div>

                      {/* Diagnostic parameters info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 pt-1 font-semibold text-slate-600">
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold block uppercase leading-none">Diagnosa Klinis:</span>
                          <span className="text-slate-800 font-extrabold text-[11px] block mt-0.5">{ord.diagnosa}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold block uppercase leading-none">Asal Pemeriksaan:</span>
                          <span className="text-slate-800 font-extrabold text-[11px] block mt-0.5 capitalize">
                            {isLuar ? `🏢 Rujukan: ${ord.vendor}` : '🏥 Internal (Lab HNZ)'}
                          </span>
                        </div>
                      </div>

                      {/* Tindakan listed */}
                      <div className="pt-1.5">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider mb-1">Pemeriksaan Yang Diorder:</span>
                        <div className="flex flex-wrap gap-1">
                          {ord.tindakan.map((t: any, idx: number) => (
                            <span key={idx} className="bg-slate-50 border border-slate-200 text-slate-650 text-[9.5px] font-bold px-2 py-0.5 rounded">
                              ✓ {t.nama_tindakan}
                            </span>
                          ))}
                        </div>
                      </div>

                      {ord.keterangan && (
                        <p className="text-[10px] text-slate-500 italic bg-slate-50/50 p-2 rounded-lg border border-slate-150">
                          <strong>Catatan Klinis:</strong> {ord.keterangan}
                        </p>
                      )}
                    </div>

                    {/* ACTIONS COLUMN IN HISTORY CARD */}
                    <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto text-right">
                      <span className="text-base font-black text-indigo-750 font-mono block">
                        Rp{total.toLocaleString('id-ID')}
                      </span>
                      
                      {isLuar ? (
                        <button
                          type="button"
                          onClick={() => handleTriggerPrint(ord)}
                          className="px-3.5 py-2 text-[10.5px] font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none"
                        >
                          🖨️ Cetak Surat Rujukan
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleTriggerPrint(ord)}
                          className="px-3.5 py-2 text-[10.5px] font-black text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          🖨️ Cetak Form Permintaan
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-20 bg-white border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400">
              <span className="text-3xl">📜</span>
              <span className="text-xs font-black uppercase tracking-wider text-slate-350">Belum ada riwayat order</span>
              <span className="text-[10px] text-slate-400 max-w-xs leading-relaxed text-center">Silakan buat permintaan pemeriksaan laboratorium baru pada tab sebelah kiri terlebih dahulu.</span>
            </div>
          )}
        </div>
      )}

      {/* PRINT-READY MODAL PREVIEW OVERLAY */}
      {printOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-250 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
              <span className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                🖨️ Pratinjau Dokumen Cetak ({printOrder.kategori === 'luar' ? 'Rujukan Lab' : 'Permintaan Lab'})
              </span>
              <button
                type="button"
                onClick={() => setPrintOrder(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer p-1 rounded-full hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            {/* PRINT MATERIAL CANVAS (PRINT TARGET AREA) */}
            <div className="flex-1 overflow-y-auto p-8 text-left bg-white font-sans text-slate-850" id="print-area">
              {/* PRINT STYLE STAMP */}
              <style>{`
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  #print-area, #print-area * {
                    visibility: visible;
                  }
                  #print-area {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    padding: 24px;
                    background: white !important;
                    color: black !important;
                  }
                  .no-print {
                    display: none !important;
                  }
                }
              `}</style>

              <div className="space-y-6 max-w-2xl mx-auto border border-slate-250/50 p-6 rounded-2xl print:border-none print:p-0">
                {/* 1. KOP SURAT (Letterhead) */}
                <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-indigo-650 tracking-widest block uppercase">KLINIK RAWAT JALAN & DIAGNOSTIK</span>
                    <h2 className="font-black text-xl text-slate-900 leading-tight">KLINIK PRATAMA HNZ</h2>
                    <p className="text-[9.5px] text-slate-500 font-semibold leading-normal">
                      Jl. Terusan Raya No. 45, Kebayoran Baru, Jakarta Selatan<br/>
                      Telp: (021) 8594-8294 | Email: info@klinikhnz.com | Website: www.klinikhnz.com
                    </p>
                  </div>
                  <div className="text-right border-l pl-4 border-slate-250">
                    <span className="text-[9.5px] font-bold text-slate-400 uppercase block tracking-wider">NOMOR ORDER</span>
                    <span className="font-mono font-black text-xs text-slate-800">{printOrder.no_order}</span>
                  </div>
                </div>

                {/* 2. DOKUMEN TITLE */}
                <div className="text-center py-2 space-y-1">
                  <h3 className="font-black text-sm uppercase tracking-widest text-slate-900 border-b border-dashed border-slate-300 pb-1 inline-block">
                    {printOrder.kategori === 'luar' 
                      ? 'SURAT RUJUKAN PEMERIKSAAN LABORATORIUM EKSTERNAL' 
                      : 'FORMULIR PERMINTAAN PEMERIKSAAN LABORATORIUM INTERNAL'}
                  </h3>
                  <p className="text-[9.5px] text-slate-400 font-bold font-mono">Tanggal Order: {formatDate(printOrder.tanggal_order)}</p>
                </div>

                {/* 3. PATIENT DATA */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-[10.5px]">
                  <div className="space-y-2">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase leading-none">Nama Lengkap Pasien</span>
                      <span className="font-extrabold text-slate-800 text-[11px] block mt-0.5">{activePasien?.kunjungan?.pasien?.nama_lengkap}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase leading-none">No. Rekam Medis (RM)</span>
                      <span className="font-extrabold text-slate-800 font-mono mt-0.5 block">{activePasien?.kunjungan?.pasien?.no_rm || '-'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold block uppercase leading-none">Jenis Kelamin</span>
                        <span className="font-extrabold text-slate-800 mt-0.5 block">
                          {activePasien?.kunjungan?.pasien?.jenis_kelamin === 'L' ? 'Laki-laki' : activePasien?.kunjungan?.pasien?.jenis_kelamin === 'P' ? 'Perempuan' : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold block uppercase leading-none">Cara Bayar</span>
                        <span className="font-extrabold text-slate-800 mt-0.5 block">{caraBayar}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase leading-none">Tujuan Rujukan Lab</span>
                      <span className="font-extrabold text-indigo-700 text-[11.5px] mt-0.5 block">{printOrder.vendor}</span>
                    </div>
                  </div>
                </div>

                {/* 4. DIAGNOSTIC DATA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10.5px] border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider mb-0.5">Diagnosa Klinis / Indikasi</span>
                    <p className="font-extrabold text-slate-800 leading-relaxed">{printOrder.diagnosa}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider mb-0.5">Keterangan Tambahan / Catatan Medis</span>
                    <p className="font-semibold text-slate-700 leading-relaxed">{printOrder.keterangan || '-'}</p>
                  </div>
                </div>

                {/* 5. LAB ACTIONS TABLE */}
                <div className="space-y-2">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Daftar Pemeriksaan Laboratorium Yang Diminta</span>
                  <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-xs font-semibold leading-normal font-sans">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-300 text-slate-700 text-[9.5px] uppercase font-black tracking-wider text-left">
                          <th className="p-2.5 pl-4 w-1/12 text-center">No</th>
                          <th className="p-2.5 w-7/12">Nama Pemeriksaan</th>
                          <th className="p-2.5 w-4/12 text-right pr-4">Estimasi Tarif ({caraBayar})</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {printOrder.tindakan.map((t: any, idx: number) => {
                          const price = calculateTariff(t.basePrice);
                          return (
                            <tr key={idx} className="hover:bg-slate-50/30">
                              <td className="p-2.5 text-center text-slate-450 font-bold">{idx + 1}</td>
                              <td className="p-2.5">
                                <span className="font-extrabold text-slate-800 block">{t.nama_tindakan}</span>
                                <span className="text-[8px] text-slate-400 font-bold block">{t.sub_spesialis} ({t.sub_kategori})</span>
                              </td>
                              <td className="p-2.5 text-right pr-4 font-mono font-black text-slate-800">
                                {caraBayar === 'BPJS' ? (
                                  <span className="text-emerald-650 text-[9.5px]">Ditanggung BPJS</span>
                                ) : (
                                  `Rp${price.toLocaleString('id-ID')}`
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {/* Summary Total Row */}
                        <tr className="bg-slate-50/50 font-black border-t-2 border-slate-300 text-slate-900">
                          <td colSpan={2} className="p-3 pl-4 text-left uppercase text-[9.5px] tracking-wider">TOTAL ESTIMASI TARIF</td>
                          <td className="p-3 text-right pr-4 font-mono text-[13px] text-indigo-750">
                            {caraBayar === 'BPJS' ? (
                              <span className="text-emerald-700 text-[10px]">Rp 0 (Full Covered)</span>
                            ) : (
                              `Rp${printOrder.tindakan.reduce((sum: number, t: any) => sum + calculateTariff(t.basePrice), 0).toLocaleString('id-ID')}`
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 6. LEGAL SIGNATURE FOOTER */}
                <div className="grid grid-cols-2 pt-8 text-[11px] leading-relaxed">
                  <div>
                    {printOrder.kategori === 'luar' && (
                      <div className="border border-indigo-200/50 bg-indigo-50/10 p-2.5 rounded-xl max-w-[200px] text-[8.5px] leading-normal text-indigo-850 font-medium">
                        * Mohon tunjukkan formulir rujukan ini pada petugas administrasi vendor laboratorium yang dituju untuk diverifikasi.
                      </div>
                    )}
                  </div>
                  <div className="text-center space-y-12 max-w-[220px] ml-auto">
                    <div>
                      <span className="block font-semibold">Jakarta, {new Date(printOrder.tanggal_order).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                      <span className="block font-extrabold text-slate-800">Dokter Pemeriksa Klinik,</span>
                    </div>
                    
                    <div className="relative inline-block">
                      {/* Signature stamp representation */}
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-28 h-12 border-2 border-dashed border-indigo-500/30 rounded flex items-center justify-center text-[7.5px] font-black uppercase text-indigo-500/50 select-none pointer-events-none transform rotate-3">
                        ✓ VERIFIED E-SIGN
                      </div>
                      <span className="font-extrabold text-slate-900 text-xs border-b border-slate-900 block pb-0.5">
                        Dr. Hendra HNZ, Sp.PK
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold block leading-none">SIP. 084.284.294.1</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-2.5 shrink-0 no-print">
              <button
                type="button"
                onClick={() => setPrintOrder(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-black text-slate-700 bg-white hover:bg-slate-50 transition-all cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={executePrint}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-black text-white shadow transition-all flex items-center gap-1.5 cursor-pointer border-none"
              >
                🖨️ Cetak / Simpan PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
