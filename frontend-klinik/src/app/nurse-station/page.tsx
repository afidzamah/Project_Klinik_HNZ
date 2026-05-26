'use client';
import { API_URL } from '@/lib/api';

import MasterLayout from '@/components/MasterLayout';
import { useState, useEffect } from 'react';

const formatLocalDate = (dateInput?: string | Date) => {
  const d = dateInput ? new Date(dateInput) : new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Fungsi pembantu untuk menghitung umur pasien
const hitungUmur = (tglLahir: string) => {
  if (!tglLahir) return '-';
  const today = new Date();
  const birthDate = new Date(tglLahir);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return `${age} Tahun`;
};

export default function NurseStationDashboard() {
  const [antreanPoliList, setAntreanPoliList] = useState<any[]>([]);
  const [activeAntrean, setActiveAntrean] = useState<any>(null);
  
  const [selectedDate, setSelectedDate] = useState(formatLocalDate());
  const [statusFilter, setStatusFilter] = useState<'belum' | 'all' | 'sudah'>('belum');
  const [demographicsExpanded, setDemographicsExpanded] = useState(false);

  const [formTriage, setFormTriage] = useState({
    keluhan_utama: '',
    sistole: '',
    diastole: '',
    suhu_tubuh: '',
    berat_badan: '',
    alergi_makanan: '',
    alergi_obat: '',
  });

  const [historyKunjungan, setHistoryKunjungan] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [loading, setLoading] = useState(false);

  // Data master untuk lookup nama poliklinik dan dokter tujuan
  const [masterPoliklinik, setMasterPoliklinik] = useState<any[]>([]);
  const [masterDokter, setMasterDokter] = useState<any[]>([]);

  // State untuk berpindah sub-formulir / halaman form
  const [activeFormTab, setActiveFormTab] = useState<'ttv' | 'risiko_jatuh' | 'nyeri' | 'riwayat'>('ttv');

  const fetchMasterData = async () => {
    try {
      const resPoli = await fetch(`${API_URL}/master-poliklinik`);
      const dataPoli = await resPoli.json();
      setMasterPoliklinik(Array.isArray(dataPoli) ? dataPoli : []);

      const resDokter = await fetch(`${API_URL}/master-dokter`);
      const dataDokter = await resDokter.json();
      setMasterDokter(Array.isArray(dataDokter) ? dataDokter : []);
    } catch (error) {
      console.error('Gagal mengambil data master:', error);
    }
  };

  const fetchAntreanPoli = async () => {
    try {
      const response = await fetch(`${API_URL}/antrean`);
      const data = await response.json();
      
      const poliQueue = data.filter((item: any) => {
        const isNurse = item.tipe_antrean === 'Nurse';
        
        let isMatchDate = false;
        if (item.kunjungan && item.kunjungan.tgl_kunjungan) {
          const antreanDate = formatLocalDate(item.kunjungan.tgl_kunjungan);
          isMatchDate = antreanDate === selectedDate;
        }
        
        return isNurse && isMatchDate;
      });
      
      setAntreanPoliList(poliQueue);
    } catch (error) {
      console.error('Gagal mengambil data antrean nurse:', error);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  useEffect(() => {
    fetchAntreanPoli();
    const interval = setInterval(fetchAntreanPoli, 5000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  const isBatal = (item: any) => {
    return item?.status_panggil === 'Batal' || item?.kunjungan?.status_kunjungan === 'Batal';
  };

  const isSelesai = (item: any) => {
    return item?.status_panggil === 'Selesai';
  };

  // FUNGSI 1: Memilih Pasien (Hanya melihat data, tidak memanggil)
  const fetchPatientHistory = async (nik: string) => {
    if (!nik) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`${API_URL}/pasien/nik/${nik}`);
      if (res.ok) {
        const data = await res.json();
        setHistoryKunjungan(Array.isArray(data.kunjungan) ? data.kunjungan : []);
      }
    } catch (err) {
      console.error('Gagal mengambil riwayat kunjungan:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handlePilihPasien = (antrean: any) => {
    setActiveAntrean(antrean);
    setActiveFormTab('ttv'); // Reset tab formulir ke TTV setiap kali pasien baru dipilih
    
    if (antrean?.kunjungan?.pasien?.nik) {
      fetchPatientHistory(antrean.kunjungan.pasien.nik);
    } else {
      setHistoryKunjungan([]);
    }

    // Load saved triage data if it exists
    const savedTriage = antrean.kunjungan?.asesmen_keperawatan?.[0];
    if (savedTriage) {
      setFormTriage({
        keluhan_utama: savedTriage.keluhan_utama || '',
        sistole: savedTriage.sistole?.toString() || '',
        diastole: savedTriage.diastole?.toString() || '',
        suhu_tubuh: savedTriage.suhu_tubuh?.toString() || '',
        berat_badan: savedTriage.berat_badan?.toString() || '',
        alergi_makanan: savedTriage.alergi_makanan || '',
        alergi_obat: savedTriage.alergi_obat || '',
      });
    } else {
      setFormTriage({
        keluhan_utama: '',
        sistole: '',
        diastole: '',
        suhu_tubuh: '',
        berat_badan: '',
        alergi_makanan: '',
        alergi_obat: '',
      });
    }
  };

  // FUNGSI 2: Memanggil Suara (Robot TTS)
  const handlePanggilSuara = (e: React.MouseEvent, antrean: any) => {
    e.stopPropagation(); // Mencegah klik menyebar ke fungsi Pilih Pasien jika tidak diinginkan
    
    if (isBatal(antrean)) {
      alert('⚠️ Pasien ini telah dibatalkan pemeriksaannya dan tidak dapat dipanggil lagi!');
      return;
    }

    if (isSelesai(antrean)) {
      alert('⚠️ Pasien ini telah selesai pemeriksaan triage awal!');
      return;
    }

    setActiveAntrean(antrean); // Otomatis aktifkan pasien ini di layar
    setActiveFormTab('ttv'); // Reset ke TTV
    
    if (antrean?.kunjungan?.pasien?.nik) {
      fetchPatientHistory(antrean.kunjungan.pasien.nik);
    } else {
      setHistoryKunjungan([]);
    }

    // Load saved triage data if it exists
    const savedTriage = antrean.kunjungan?.asesmen_keperawatan?.[0];
    if (savedTriage) {
      setFormTriage({
        keluhan_utama: savedTriage.keluhan_utama || '',
        sistole: savedTriage.sistole?.toString() || '',
        diastole: savedTriage.diastole?.toString() || '',
        suhu_tubuh: savedTriage.suhu_tubuh?.toString() || '',
        berat_badan: savedTriage.berat_badan?.toString() || '',
        alergi_makanan: savedTriage.alergi_makanan || '',
        alergi_obat: savedTriage.alergi_obat || '',
      });
    } else {
      setFormTriage({
        keluhan_utama: '',
        sistole: '',
        diastole: '',
        suhu_tubuh: '',
        berat_badan: '',
        alergi_makanan: '',
        alergi_obat: '',
      });
    }

    const nomorEja = antrean.no_antrean.split('').join(' ');
    const namaPasien = antrean.kunjungan?.pasien?.nama_lengkap || '';
    const teksPanggilan = `Nomor antrean, ${nomorEja}, atas nama pasien ${namaPasien}, silakan menuju ruang pemeriksaan awal perawat.`;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(teksPanggilan);
      utterance.lang = 'id-ID';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleTandaiSelesaiPelayanan = async (antrean: any) => {
    if (!antrean || !antrean.id_kunjungan) {
      alert('Silakan pilih antrean yang valid!');
      return;
    }

    if (isBatal(antrean)) {
      alert('⚠️ Tidak dapat menyelesaikan pelayanan untuk pasien yang telah dibatalkan!');
      return;
    }

    if (isSelesai(antrean)) {
      alert('⚠️ Pelayanan untuk pasien ini sudah diselesaikan sebelumnya!');
      return;
    }

    const konfirmasi = confirm(`Apakah Anda yakin ingin menandai pelayanan perawat SELESAI untuk pasien ${antrean.kunjungan?.pasien?.nama_lengkap}?`);
    if (!konfirmasi) return;

    setLoading(true);
    try {
      // 1. Update status antrean menjadi 'Selesai' di database
      const resAntrean = await fetch(`${API_URL}/antrean/${antrean.id_antrean}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_panggil: 'Selesai' }),
      });

      if (!resAntrean.ok) throw new Error('Gagal memperbarui status antrean.');

      // 2. Update status kunjungan menjadi 'Selesai Perawat' di database
      const resKunjungan = await fetch(`${API_URL}/kunjungan/${antrean.id_kunjungan}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_kunjungan: 'Selesai Perawat' }),
      });

      if (!resKunjungan.ok) throw new Error('Gagal memperbarui status kunjungan.');

      // 3. Alirkan/antrekan pasien ke Pemeriksaan Dokter (Tipe Poli)
      const resPoliAntrean = await fetch(`${API_URL}/antrean`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_kunjungan: antrean.id_kunjungan,
          tipe_antrean: 'Poli',
        }),
      });

      if (!resPoliAntrean.ok) throw new Error('Gagal mengalirkan pasien ke antrean dokter.');

      alert(`✅ Pelayanan Sukses!\nStatus pelayanan pasien ${antrean.kunjungan?.pasien?.nama_lengkap} berhasil diselesaikan dan diteruskan ke antrean dokter.`);
      
      setFormTriage({ keluhan_utama: '', sistole: '', diastole: '', suhu_tubuh: '', berat_badan: '', alergi_makanan: '', alergi_obat: '' });
      setHistoryKunjungan([]);
      setActiveAntrean(null);
      setActiveFormTab('ttv');
      fetchAntreanPoli();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSimpanTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAntrean || !activeAntrean.id_kunjungan) {
      alert('Silakan pilih antrean yang valid!');
      return;
    }

    if (isBatal(activeAntrean)) {
      alert('⚠️ Tidak dapat menyimpan data triage untuk pasien yang telah dibatalkan!');
      return;
    }

    if (isSelesai(activeAntrean)) {
      alert('⚠️ Pemeriksaan triage untuk pasien ini sudah diselesaikan sebelumnya!');
      return;
    }
    
    setLoading(true);
    try {
      const resTriage = await fetch(`${API_URL}/asesmen-keperawatan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_kunjungan: activeAntrean.id_kunjungan,
          id_perawat: 'PRW-HNZ-001',
          keluhan_utama: formTriage.keluhan_utama,
          sistole: parseInt(formTriage.sistole),
          diastole: parseInt(formTriage.diastole),
          suhu_tubuh: parseFloat(formTriage.suhu_tubuh),
          berat_badan: parseFloat(formTriage.berat_badan),
          alergi_makanan: formTriage.alergi_makanan,
          alergi_obat: formTriage.alergi_obat,
        }),
      });

      if (!resTriage.ok) throw new Error('Gagal menyimpan data asesmen keperawatan.');

      // Update status antrean menjadi 'Selesai' di database
      await fetch(`${API_URL}/antrean/${activeAntrean.id_antrean}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_panggil: 'Selesai' }),
      });

      // Update status kunjungan menjadi 'Selesai Perawat' di database
      await fetch(`${API_URL}/kunjungan/${activeAntrean.id_kunjungan}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_kunjungan: 'Selesai Perawat' }),
      });

      // Alirkan/antrekan pasien ke Pemeriksaan Dokter (Tipe Poli)
      const resPoliAntrean = await fetch(`${API_URL}/antrean`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_kunjungan: activeAntrean.id_kunjungan,
          tipe_antrean: 'Poli',
        }),
      });

      if (!resPoliAntrean.ok) throw new Error('Gagal mengalirkan pasien ke antrean dokter.');

      alert(`✅ Triage & Pelayanan Sukses!\nData rekam medis awal pasien ${activeAntrean.kunjungan?.pasien?.nama_lengkap} berhasil disimpan dan diteruskan ke antrean dokter.`);
      
      setFormTriage({ keluhan_utama: '', sistole: '', diastole: '', suhu_tubuh: '', berat_badan: '', alergi_makanan: '', alergi_obat: '' });
      setActiveAntrean(null);
      setActiveFormTab('ttv');
      fetchAntreanPoli(); 
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const pasienAktif = activeAntrean?.kunjungan?.pasien;
  const isActiveBatal = activeAntrean ? isBatal(activeAntrean) : false;
  const isActiveSelesai = activeAntrean ? isSelesai(activeAntrean) : false;

  const filteredAntreanList = antreanPoliList.filter((item) => {
    if (statusFilter === 'belum') {
      return !isSelesai(item) && !isBatal(item);
    }
    if (statusFilter === 'sudah') {
      return isSelesai(item);
    }
    return true; // 'all'
  });

  return (
    <MasterLayout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* PANEL KIRI: DAFTAR ANTREAN TRIAGE (PISAH KLIK & PANGGIL - LEBAR 3 KOLOM) */}
        <aside className="lg:col-span-3 bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col h-full min-h-[75vh]">
          
          <div className="flex flex-col mb-4 pb-4 border-b border-slate-100 gap-3">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-black text-slate-800 tracking-wide flex items-center gap-2">
                <span className="text-red-600 text-lg">🩺</span> Antrean Triage
              </h2>
              <span className="bg-red-50 text-red-600 text-xs font-black px-3 py-1 rounded-full">{filteredAntreanList.length} Pasien</span>
            </div>
            
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/60">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 whitespace-nowrap">Filter Tgl:</label>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-white"
              />
            </div>

            {/* Status Filter Segmented Control - Icon-only */}
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setStatusFilter('belum')}
                className={`flex-1 flex justify-center items-center py-2 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'belum'
                    ? 'bg-white text-red-650 shadow-sm border border-slate-200/50 scale-105'
                    : 'text-slate-400 hover:text-red-500 hover:bg-white/50'
                }`}
                title="Belum Diperiksa (Antrean Aktif)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`flex-1 flex justify-center items-center py-2 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50 scale-105'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-white/50'
                }`}
                title="Semua Pasien"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('sudah')}
                className={`flex-1 flex justify-center items-center py-2 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'sudah'
                    ? 'bg-white text-emerald-650 shadow-sm border border-slate-200/50 scale-105'
                    : 'text-slate-400 hover:text-emerald-500 hover:bg-white/50'
                }`}
                title="Sudah Diperiksa (Selesai Triage)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="space-y-3 overflow-y-auto pr-1 pb-2 max-h-[60vh] scrollbar-thin">
            {filteredAntreanList.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/50">
                <span className="text-4xl block mb-3 opacity-50">📅</span>
                <p className="text-xs font-bold text-slate-400">Tidak ada antrean pasien <br/>dengan status ini.</p>
              </div>
            ) : (
              filteredAntreanList.map((item) => {
                const itemBatal = isBatal(item);
                const itemSelesai = isSelesai(item);
                const namaPoli = masterPoliklinik.find((p) => p.id_poli === item.kunjungan?.id_poli)?.nama_poli || 'Poliklinik';
                const namaDokter = masterDokter.find((d) => d.id_dokter === item.kunjungan?.id_dokter)?.nama_dokter || 'Dokter Tujuan';
                
                return (
                  <div 
                    key={item.id_antrean} 
                    onClick={() => handlePilihPasien(item)} // KLIK KARTU = HANYA LIHAT DATA
                    className={`p-3.5 rounded-2xl border-2 flex flex-col gap-3 transition-all cursor-pointer ${
                      activeAntrean?.id_antrean === item.id_antrean 
                        ? itemBatal
                          ? 'border-rose-400 bg-rose-50/40 shadow-md'
                          : itemSelesai
                            ? 'border-emerald-400 bg-emerald-50/40 shadow-md shadow-emerald-100'
                            : 'border-red-500 bg-red-50 shadow-md shadow-red-100' 
                        : itemBatal
                          ? 'border-rose-100 bg-rose-50/20 opacity-75 hover:opacity-100 hover:border-rose-200'
                          : itemSelesai
                            ? 'border-emerald-100 bg-emerald-50/10 opacity-80 hover:opacity-100 hover:border-emerald-200'
                            : 'border-slate-100 bg-white hover:border-red-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xl font-mono font-black text-slate-900 tracking-tighter leading-none">{item.no_antrean}</span>
                          {itemBatal && (
                            <span className="bg-rose-100 text-rose-700 text-[9px] font-black px-2 py-0.5 rounded-md flex items-center gap-0.5 shrink-0">
                              ❌ Batal
                            </span>
                          )}
                          {itemSelesai && (
                            <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-md flex items-center gap-0.5 shrink-0">
                              ✓ Selesai
                            </span>
                          )}
                        </div>
                        <span className={`text-xs font-black block truncate ${
                          itemBatal 
                            ? 'line-through text-slate-400' 
                            : itemSelesai 
                              ? 'text-emerald-800' 
                              : 'text-slate-800'
                        }`}>
                          {item.kunjungan?.pasien?.nama_lengkap || 'Pasien Tidak Diketahui'}
                        </span>
                      </div>
                      
                      {/* TOMBOL PANGGIL TERPISAH (HANYA MEMAINKAN SUARA) */}
                      <button 
                        onClick={(e) => handlePanggilSuara(e, item)}
                        disabled={itemBatal || itemSelesai}
                        className={`p-2.5 rounded-xl shadow-sm transition-all shrink-0 ${
                          itemBatal || itemSelesai
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                            : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-red-500/20 active:scale-95'
                        }`}
                        title={itemBatal ? 'Pemeriksaan Dibatalkan' : itemSelesai ? 'Pelayanan Selesai' : 'Panggil Pasien'}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                      </button>
                    </div>

                    {/* Informasi Ruangan & Dokter yang diperjelas */}
                    <div className="border-t border-slate-100 pt-2 flex flex-col gap-1 text-[10px] font-bold text-slate-500">
                      {statusFilter !== 'belum' && statusFilter !== 'sudah' && (
                        <span className="flex items-center gap-1.5 truncate">
                          <span className="opacity-70 text-xs">🏥</span> Poli: <span className={itemBatal ? 'text-slate-400' : 'text-slate-700 font-extrabold'}>{namaPoli}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 truncate">
                        <span className="opacity-70 text-xs">👨‍⚕️</span> Dr: <span className={itemBatal ? 'text-slate-400' : 'text-slate-700 font-extrabold'}>{namaDokter}</span>
                      </span>
                      {statusFilter === 'sudah' && item.kunjungan?.asesmen_keperawatan?.[0] && (
                        <div className="mt-1.5 p-1.5 rounded-lg bg-emerald-50/50 text-[9px] text-emerald-800 border border-emerald-100 flex flex-col gap-0.5 font-medium leading-relaxed">
                          <span className="font-bold flex items-center gap-1">📋 TTV: <span className="font-mono text-emerald-950 font-extrabold">{item.kunjungan.asesmen_keperawatan[0].sistole}/{item.kunjungan.asesmen_keperawatan[0].diastole} mmHg | {item.kunjungan.asesmen_keperawatan[0].suhu_tubuh}°C | {item.kunjungan.asesmen_keperawatan[0].berat_badan}kg</span></span>
                          <span className="truncate italic">💬 {item.kunjungan.asesmen_keperawatan[0].keluhan_utama}</span>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* PANEL TENGAH: KARTU IDENTITAS & CONTAINER FORM BERJENJANG (5 KOLOM) */}
        <main className="lg:col-span-5 flex flex-col gap-6">
          {/* SECTION A: KARTU IDENTITAS PASIEN (MUNCUL JIKA PASIEN DIPILIH) */}
          {activeAntrean ? (
            <div className={`bg-white rounded-2xl p-3 px-4 shadow-sm border flex flex-col relative overflow-hidden transition-all ${
              isActiveBatal 
                ? 'border-rose-200 bg-rose-50/5' 
                : isActiveSelesai
                  ? 'border-emerald-200 bg-emerald-50/5'
                  : 'border-red-100'
            }`}>
              {/* Ornamen Pita di Kiri */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                isActiveBatal 
                  ? 'bg-rose-400' 
                  : isActiveSelesai
                    ? 'bg-emerald-500'
                    : 'bg-red-500'
              }`}></div>
              
              {/* Collapsed/Header Row */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Left Side: Queue No & Patient Basic Info */}
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`px-2.5 py-1 rounded-xl font-mono text-sm font-black border flex items-center gap-1 shrink-0 ${
                    isActiveBatal 
                      ? 'bg-rose-50 border-rose-200 text-rose-800' 
                      : isActiveSelesai
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-red-50 border-red-200 text-red-700'
                  }`}>
                    <span className="text-[9px] font-black uppercase text-slate-400 font-sans tracking-wide">NO:</span>
                    {activeAntrean.no_antrean}
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <h2 className={`text-sm font-black tracking-tight truncate ${
                        isActiveBatal ? 'text-slate-400 line-through' : 'text-slate-800'
                      }`}>
                        {pasienAktif?.nama_lengkap || '-'}
                      </h2>
                      {isActiveBatal && (
                        <span className="bg-rose-100 text-rose-700 text-[8px] font-black px-1.5 py-0.5 rounded shrink-0">❌ BATAL</span>
                      )}
                      {isActiveSelesai && (
                        <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black px-1.5 py-0.5 rounded shrink-0">✓ SELESAI</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-700">RM: {pasienAktif?.no_rm || '-'}</span>
                      <span>•</span>
                      <span>{hitungUmur(pasienAktif?.tgl_lahir)}</span>
                      <span>•</span>
                      <span>{pasienAktif?.jenis_kelamin === 'L' ? 'Laki-Laki' : pasienAktif?.jenis_kelamin === 'P' ? 'Perempuan' : '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Doctor Badge & Actions */}
                <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
                  <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100 text-[10px] font-bold">
                    <span className="text-red-755 font-extrabold text-red-700">
                      🏥 {masterPoliklinik.find((p) => p.id_poli === activeAntrean.kunjungan?.id_poli)?.nama_poli || 'Poli'}
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-700 font-extrabold">
                      👨‍⚕️ {masterDokter.find((d) => d.id_dokter === activeAntrean.kunjungan?.id_dokter)?.nama_dokter || 'Dokter'}
                    </span>
                  </div>

                  {!isActiveSelesai && !isActiveBatal && (
                    <button
                      onClick={() => handleTandaiSelesaiPelayanan(activeAntrean)}
                      disabled={loading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] uppercase tracking-widest px-3 py-2 rounded-xl shadow-md shadow-emerald-500/10 active:scale-95 transition-all flex items-center gap-1 border border-emerald-750 disabled:bg-slate-300 disabled:border-slate-300 disabled:shadow-none cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Selesai</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setDemographicsExpanded(!demographicsExpanded)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all cursor-pointer border border-slate-200/50 flex items-center justify-center shrink-0"
                    title={demographicsExpanded ? "Sembunyikan Detail" : "Tampilkan Detail Demografi"}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transform transition-transform ${demographicsExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Expanded details section */}
              {demographicsExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-3 transition-all animate-fade-in">
                  
                  {isActiveBatal && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-900 p-3 rounded-xl flex items-start gap-2.5 shadow-sm">
                      <span className="text-lg">⚠️</span>
                      <div className="flex-1">
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-rose-800">Layanan Triage Terkunci</h4>
                        <p className="text-[11px] font-bold text-rose-600 mt-0.5 leading-normal">
                          Pemeriksaan untuk pasien ini telah dibatalkan. Seluruh aksi pemanggilan suara dan penyimpanan rekam medis awal (triage) telah dikunci demi integritas data medis.
                        </p>
                      </div>
                    </div>
                  )}

                  {isActiveSelesai && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 p-3 rounded-xl flex items-start gap-2.5 shadow-sm">
                      <span className="text-lg">✓</span>
                      <div className="flex-1">
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Layanan Triage Selesai</h4>
                        <p className="text-[11px] font-bold text-emerald-600 mt-0.5 leading-normal">
                          Pemeriksaan awal perawat untuk pasien ini telah diselesaikan. Seluruh isian data rekam medis awal telah disimpan dengan aman dan diteruskan secara real-time ke ruang periksa Dokter Spesialis.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px]">
                    <div>
                      <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest">NIK KTP</span>
                      <span className="font-bold text-slate-850 text-slate-800 font-mono">{pasienAktif?.nik || '-'}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest">Umur / Tgl Lahir</span>
                      <span className="font-bold text-slate-800">{hitungUmur(pasienAktif?.tgl_lahir)} ({pasienAktif?.tgl_lahir ? formatLocalDate(pasienAktif.tgl_lahir) : '-'})</span>
                    </div>
                    <div>
                      <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest">Jenis Kelamin</span>
                      <span className="font-bold text-slate-800">{pasienAktif?.jenis_kelamin === 'L' ? 'Laki-Laki' : pasienAktif?.jenis_kelamin === 'P' ? 'Perempuan' : '-'}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest">Kontak / WA</span>
                      <span className="font-bold text-slate-800">{pasienAktif?.no_kontak || '-'}</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest">Pekerjaan</span>
                      <span className="font-bold text-slate-800">{pasienAktif?.pekerjaan || '-'}</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest">Agama</span>
                      <span className="font-bold text-slate-800">{pasienAktif?.agama || '-'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center h-[200px]">
              <span className="text-4xl mb-3">👆</span>
              <h3 className="text-sm font-black text-slate-700">Silakan Pilih Pasien</h3>
              <p className="text-xs font-medium text-slate-400 mt-1">Klik salah satu kartu antrean di sebelah kiri untuk melihat data demografi pasien.</p>
            </div>
          )}

          {/* MULTI-FORM TABS SELECTOR (HANYA DITAMPILKAN JIKA ADA PASIEN YANG DIPILIH) */}
          {activeAntrean && (
            <div className="flex gap-2 border-b border-slate-200 pb-1 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveFormTab('ttv')}
                className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer ${
                  activeFormTab === 'ttv'
                    ? isActiveBatal
                      ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-sm'
                      : isActiveSelesai
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm'
                        : 'bg-red-50 text-red-600 border border-red-200 shadow-sm shadow-red-100'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                🩺 Pemeriksaan TTV
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('risiko_jatuh')}
                className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer ${
                  activeFormTab === 'risiko_jatuh'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                ⚠️ Risiko Jatuh
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('nyeri')}
                className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer ${
                  activeFormTab === 'nyeri'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                💥 Asesmen Nyeri
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('riwayat')}
                className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer ${
                  activeFormTab === 'riwayat'
                    ? 'bg-teal-50 text-teal-700 border border-teal-200 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                📋 Riwayat & Alergi
              </button>
            </div>
          )}

          {/* SECTION B: FORMULIR TRIAGE & TTV (MUNCUL TERUS TAPI DISABLED JIKA TIDAK ADA PASIEN ATAU PASIEN BATAL / SELESAI) */}
          <div className={`bg-white rounded-2xl p-6 shadow-sm border transition-all ${
            activeAntrean 
              ? isActiveBatal 
                ? 'border-rose-200 bg-rose-50/10 opacity-75' 
                : isActiveSelesai
                  ? 'border-emerald-200 bg-emerald-50/5 opacity-90'
                  : 'border-slate-200' 
              : 'border-slate-200 opacity-60 pointer-events-none'
          }`}>
            
            {/* 1. HALAMAN FORM 1: PEMERIKSAAN TTV */}
            {activeFormTab === 'ttv' && (
              <form onSubmit={handleSimpanTriage} className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <span className="text-red-600">📝</span> Input Asesmen Keperawatan (TTV)
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* KELUHAN UTAMA */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Keluhan Utama</label>
                    <textarea 
                      required 
                      disabled={!activeAntrean || isActiveBatal || isActiveSelesai}
                      rows={6}
                      placeholder={
                        isActiveBatal 
                          ? 'Layanan dikunci karena pasien telah dibatalkan.' 
                          : isActiveSelesai 
                            ? 'Pemeriksaan triage telah diselesaikan (Mode Read-Only).' 
                            : 'Catat keluhan subjektif pasien di sini...'
                      }
                      value={formTriage.keluhan_utama} 
                      onChange={(e) => setFormTriage({...formTriage, keluhan_utama: e.target.value})}
                      className="w-full rounded-2xl border-2 border-slate-200 p-4 bg-slate-50 text-sm font-medium text-slate-800 focus:bg-white focus:ring-4 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all resize-none disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed"
                    ></textarea>
                  </div>

                  {/* TANDA-TANDA VITAL (TTV) CARD */}
                  <div className={`p-5 rounded-2xl border space-y-5 transition-all ${
                    isActiveBatal 
                      ? 'bg-rose-50/20 border-rose-100' 
                      : isActiveSelesai
                        ? 'bg-emerald-50/20 border-emerald-100'
                        : 'bg-red-50/50 border-red-100'
                  }`}>
                    <h3 className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${
                      isActiveBatal 
                        ? 'text-rose-600' 
                        : isActiveSelesai
                          ? 'text-emerald-600'
                          : 'text-red-600'
                    }`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Pemeriksaan Tanda Vital
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* Tensi */}
                      <div className="col-span-2 flex gap-3 items-end">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sistole</label>
                          <div className="relative">
                            <input type="number" required disabled={!activeAntrean || isActiveBatal || isActiveSelesai} placeholder="120" value={formTriage.sistole} onChange={(e) => setFormTriage({...formTriage, sistole: e.target.value})} className="w-full rounded-xl border-2 border-slate-200 p-3 pl-4 pr-10 text-lg font-black text-slate-800 focus:border-red-500 outline-none transition-all bg-white disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed" />
                            <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">mmHg</span>
                          </div>
                        </div>
                        <span className="text-2xl font-light text-slate-300 pb-2">/</span>
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Diastole</label>
                          <div className="relative">
                            <input type="number" required disabled={!activeAntrean || isActiveBatal || isActiveSelesai} placeholder="80" value={formTriage.diastole} onChange={(e) => setFormTriage({...formTriage, diastole: e.target.value})} className="w-full rounded-xl border-2 border-slate-200 p-3 pl-4 pr-10 text-lg font-black text-slate-800 focus:border-red-500 outline-none transition-all bg-white disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed" />
                            <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">mmHg</span>
                          </div>
                        </div>
                      </div>

                      {/* Suhu & BB */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Suhu Tubuh</label>
                        <div className="relative">
                          <input type="number" step="0.1" required disabled={!activeAntrean || isActiveBatal || isActiveSelesai} placeholder="36.5" value={formTriage.suhu_tubuh} onChange={(e) => setFormTriage({...formTriage, suhu_tubuh: e.target.value})} className="w-full rounded-xl border-2 border-slate-200 p-3 pl-4 pr-8 text-lg font-black text-slate-800 focus:border-red-500 outline-none transition-all bg-white disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed" />
                          <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">°C</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Berat Badan</label>
                        <div className="relative">
                          <input type="number" step="0.1" required disabled={!activeAntrean || isActiveBatal || isActiveSelesai} placeholder="65" value={formTriage.berat_badan} onChange={(e) => setFormTriage({...formTriage, berat_badan: e.target.value})} className="w-full rounded-xl border-2 border-slate-200 p-3 pl-4 pr-8 text-lg font-black text-slate-800 focus:border-red-500 outline-none transition-all bg-white disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed" />
                          <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">kg</span>
                        </div>
                      </div>

                      {/* Alergi Makanan & Obat */}
                      <div className="col-span-2 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 mt-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Alergi Makanan</label>
                          <input
                            type="text"
                            disabled={!activeAntrean || isActiveBatal || isActiveSelesai}
                            placeholder="Contoh: Seafood, Kacang (kosongkan jika tdk ada)"
                            value={formTriage.alergi_makanan}
                            onChange={(e) => setFormTriage({...formTriage, alergi_makanan: e.target.value})}
                            className="w-full rounded-xl border-2 border-slate-200 p-3.5 pl-4 text-sm font-semibold text-slate-800 focus:border-red-500 outline-none transition-all bg-white disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Alergi Obat</label>
                          <input
                            type="text"
                            disabled={!activeAntrean || isActiveBatal || isActiveSelesai}
                            placeholder="Contoh: Penicillin, Sulfa (kosongkan jika tdk ada)"
                            value={formTriage.alergi_obat}
                            onChange={(e) => setFormTriage({...formTriage, alergi_obat: e.target.value})}
                            className="w-full rounded-xl border-2 border-slate-200 p-3.5 pl-4 text-sm font-semibold text-slate-800 focus:border-red-500 outline-none transition-all bg-white disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTON */}
                <div className="pt-4 border-t border-slate-100">
                  <button 
                    type="submit" 
                    disabled={loading || !activeAntrean || isActiveBatal} 
                    className={`w-full font-black py-4 rounded-2xl shadow-lg border text-sm flex justify-center items-center gap-2 tracking-widest uppercase transition-all active:scale-[0.99] ${
                      isActiveBatal
                        ? 'bg-rose-100 text-rose-500 border-rose-200 cursor-not-allowed shadow-none'
                        : 'bg-red-600 text-white border-red-700 shadow-red-500/30 hover:bg-red-700 disabled:bg-slate-300 disabled:border-slate-300 disabled:shadow-none disabled:text-slate-500'
                    }`}
                  >
                    {loading 
                      ? '⏳ MENYIMPAN DATA TRIAGE...' 
                      : isActiveBatal 
                        ? '❌ LAYANAN TERKUNCI (PASIEN BATAL)' 
                        : '💾 SIMPAN & TERUSKAN KE DOKTER SPESIALIS'}
                  </button>
                </div>
              </form>
            )}

            {/* 2. HALAMAN FORM 2: RISIKO JATUH */}
            {activeFormTab === 'risiko_jatuh' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <span className="text-amber-500">⚠️</span> Asesmen Risiko Jatuh (Skala Morse)
                  </h2>
                  <span className="bg-amber-50 text-amber-600 text-xs font-black px-3 py-1 rounded-full">Fase Pengembangan</span>
                </div>

                <div className="bg-amber-50/40 p-5 rounded-2xl border border-amber-100 space-y-4">
                  <p className="text-xs font-bold text-amber-700 leading-relaxed">
                    ℹ️ Modul Asesmen Risiko Jatuh akan mengukur probabilitas pasien jatuh berdasarkan riwayat medis, diagnosis sekunder, bantuan ambulasi, terapi intravena, gaya berjalan, dan status mental.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: 'Riwayat Jatuh (3 bulan terakhir)', pts: 25 },
                      { label: 'Diagnosis Sekunder (>= 2 penyakit)', pts: 15 },
                      { label: 'Menggunakan Alat Bantu Jalan (kruk/tongkat)', pts: 15 },
                      { label: 'Terpasang Infus / Terapi Intravena', pts: 20 },
                      { label: 'Gaya Berjalan Lemah / Terganggu', pts: 10 },
                      { label: 'Status Mental (Sadar akan keterbatasan)', pts: 0 }
                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-slate-200/60 opacity-60">
                        <span className="text-xs font-bold text-slate-700">{item.label}</span>
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded-md">+{item.pts} Pts</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 flex items-center justify-center text-center">
                  <div>
                    <span className="text-3xl block mb-2">🚀</span>
                    <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Fitur Segera Hadir</h3>
                    <p className="text-[11px] font-medium text-slate-400 mt-1 max-w-sm leading-relaxed">
                      Modul evaluasi risiko jatuh otomatis akan diintegrasikan dengan gelang penanda risiko pasien pada fase pengembangan berikutnya.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. HALAMAN FORM 3: ASESMEN NYERI */}
            {activeFormTab === 'nyeri' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <span className="text-indigo-600">💥</span> Asesmen Skala Nyeri (Wong-Baker)
                  </h2>
                  <span className="bg-indigo-50 text-indigo-600 text-xs font-black px-3 py-1 rounded-full">Fase Pengembangan</span>
                </div>

                <div className="bg-indigo-50/40 p-5 rounded-2xl border border-indigo-100 space-y-5">
                  <p className="text-xs font-bold text-indigo-700 leading-relaxed">
                    ℹ️ Modul Asesmen Nyeri Wong-Baker membantu mendeteksi tingkat keparahan nyeri subjektif pasien melalui skala ekspresi wajah numerik (0-10).
                  </p>

                  <div className="grid grid-cols-6 gap-2 text-center">
                    {[
                      { emoji: '😊', desc: 'Tidak Nyeri', num: 0, color: 'bg-emerald-50 text-emerald-600' },
                      { emoji: '🙂', desc: 'Sedikit Nyeri', num: 2, color: 'bg-green-50 text-green-600' },
                      { emoji: '😐', desc: 'Nyeri Sedang', num: 4, color: 'bg-yellow-50 text-yellow-600' },
                      { emoji: '🙁', desc: 'Lebih Nyeri', num: 6, color: 'bg-orange-50 text-orange-600' },
                      { emoji: '😢', desc: 'Sangat Nyeri', num: 8, color: 'bg-red-50 text-red-600' },
                      { emoji: '😭', desc: 'Nyeri Hebat', num: 10, color: 'bg-rose-50 text-rose-600' }
                    ].map((face, idx) => (
                      <div key={idx} className="p-3 rounded-xl border border-slate-100 bg-white opacity-60 flex flex-col items-center gap-1">
                        <span className="text-2xl">{face.emoji}</span>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${face.color}`}>{face.num}</span>
                        <span className="text-[9px] font-bold text-slate-500 whitespace-nowrap">{face.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 flex items-center justify-center text-center">
                  <div>
                    <span className="text-3xl block mb-2">🎯</span>
                    <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Peta Distribusi Nyeri</h3>
                    <p className="text-[11px] font-medium text-slate-400 mt-1 max-w-sm leading-relaxed">
                      Dukungan pemilihan diagram titik anatomi tubuh (Body Pain Mapping Tool) sedang disempurnakan untuk integrasi data rekam medis dokter spesialis.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 4. HALAMAN FORM 4: RIWAYAT & ALERGI */}
            {activeFormTab === 'riwayat' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <span className="text-teal-600">📋</span> Riwayat Kesehatan & Alergi
                  </h2>
                  <span className="bg-teal-50 text-teal-600 text-xs font-black px-3 py-1 rounded-full">Fase Pengembangan</span>
                </div>

                <div className="bg-teal-50/40 p-5 rounded-2xl border border-teal-100 space-y-4">
                  <p className="text-xs font-bold text-teal-700 leading-relaxed">
                    ℹ️ Modul Riwayat & Alergi mencatat alergi obat spesifik, riwayat operasi, riwayat penyakit keluarga, serta gaya hidup pasien untuk pengaman peresepan obat di masa mendatang.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200/60 opacity-60 space-y-2">
                      <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Daftar Kontraindikasi Alergi</span>
                      <div className="flex flex-wrap gap-1.5">
                        {['Golongan Penicillin', 'Aspirin', 'Udang & Seafood', 'Kacang-kacangan'].map((alg, idx) => (
                          <span key={idx} className="bg-rose-50 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-100">🚫 {alg}</span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200/60 opacity-60 space-y-2">
                      <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Penyakit Bawaan / Kronis</span>
                      <div className="flex flex-wrap gap-1.5">
                        {['Diabetes Melitus Tipe 2', 'Hipertensi Primer', 'Asma Bronkial'].map((his, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200/60">🩺 {his}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 flex items-center justify-center text-center">
                  <div>
                    <span className="text-3xl block mb-2">⚡</span>
                    <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">E-Prescription Safeguard</h3>
                    <p className="text-[11px] font-medium text-slate-400 mt-1 max-w-sm leading-relaxed">
                      Sistem peringatan otomatis obat kontraindikasi akan langsung menyala pada stasiun kerja apoteker/dokter jika obat yang diresepkan memicu alergi pasien.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>

        </main>

        {/* PANEL KANAN: RIWAYAT KLINIS & ALERGI PASIEN (4 KOLOM) */}
        <aside className="lg:col-span-4 bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col h-full min-h-[75vh]">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100">
            <h2 className="text-sm font-black text-slate-800 tracking-wide flex items-center gap-2">
              <span className="text-red-600 text-lg">📋</span> Riwayat & Alergi
            </h2>
          </div>

          {!activeAntrean ? (
            <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/50 flex-1 flex flex-col justify-center items-center">
              <span className="text-4xl block mb-3 opacity-50">📂</span>
              <p className="text-xs font-bold text-slate-400">Pilih pasien untuk melihat<br/>riwayat kunjungan & alergi.</p>
            </div>
          ) : (
            <div className="space-y-5 flex-1 flex flex-col overflow-hidden">
              
              {/* STATUS ALERGI PASIEN */}
              <div className="space-y-2">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Status Alergi Aktif</span>
                
                {(() => {
                  const alergiMakanan = formTriage.alergi_makanan || historyKunjungan.find(k => k.asesmen_keperawatan?.[0]?.alergi_makanan)?.asesmen_keperawatan?.[0]?.alergi_makanan;
                  const alergiObat = formTriage.alergi_obat || historyKunjungan.find(k => k.asesmen_keperawatan?.[0]?.alergi_obat)?.asesmen_keperawatan?.[0]?.alergi_obat;

                  if (!alergiMakanan && !alergiObat) {
                    return (
                      <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3 flex items-center gap-2.5">
                        <span className="text-emerald-600 text-lg">🛡️</span>
                        <div>
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Aman / Bebas Alergi</h4>
                          <p className="text-[10px] font-bold text-emerald-600 mt-0.5">Tidak ada riwayat alergi obat & makanan yang tercatat.</p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2">
                      {alergiMakanan && (
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5 shadow-sm">
                          <span className="text-rose-600 text-lg">🚫</span>
                          <div className="flex-1">
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Alergi Makanan</h4>
                            <p className="text-xs font-black text-rose-700 mt-0.5">{alergiMakanan}</p>
                          </div>
                        </div>
                      )}
                      {alergiObat && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5 shadow-sm">
                          <span className="text-red-600 text-lg">💊</span>
                          <div className="flex-1">
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-red-800">Alergi Obat</h4>
                            <p className="text-xs font-black text-red-700 mt-0.5">{alergiObat}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* TIMELINE RIWAYAT KUNJUNGAN */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-3">5 Kunjungan Terakhir</span>
                
                {loadingHistory ? (
                  <div className="text-center py-12 flex-1 flex flex-col justify-center items-center">
                    <span className="animate-spin text-2xl block mb-2">⏳</span>
                    <span className="text-xs font-bold text-slate-400">Memuat riwayat klinis...</span>
                  </div>
                ) : historyKunjungan.length === 0 ? (
                  <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/50 flex-1 flex flex-col justify-center items-center">
                    <span className="text-3xl block mb-2">📅</span>
                    <span className="text-xs font-bold text-slate-400">Belum ada riwayat kunjungan terdahulu.</span>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-2 scrollbar-thin scrollbar-thumb-slate-200">
                    {historyKunjungan.map((visit) => {
                      const assessment = visit.asesmen_keperawatan?.[0];
                      const dateStr = formatLocalDate(visit.tgl_kunjungan);
                      
                      return (
                        <div key={visit.id_kunjungan} className="relative pl-6 pb-2 border-l border-slate-200 last:border-0 last:pb-0">
                          {/* Dot Connector */}
                          <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-red-500 bg-white"></div>
                          
                          <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2 hover:border-slate-300 hover:bg-white hover:shadow-sm transition-all duration-200">
                            {/* Visit Info Header */}
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <span className="text-[10px] font-black text-slate-700 block leading-tight">{visit.nama_poli}</span>
                                <span className="text-[9px] font-bold text-slate-400 block mt-0.5">Dr. {visit.nama_dokter}</span>
                              </div>
                              <span className="text-[9px] font-black text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-md font-mono shrink-0">
                                {dateStr}
                              </span>
                            </div>

                            {/* Vital Signs (TTV) */}
                            {assessment ? (
                              <div className="space-y-1.5 border-t border-slate-100 pt-2">
                                <div className="grid grid-cols-2 gap-2 text-[10px] font-medium text-slate-600">
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs">🩺</span>
                                    <span>Tensi: <strong className="font-mono text-slate-900">{assessment.sistole}/{assessment.diastole}</strong> <span className="text-[8px] text-slate-400">mmHg</span></span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs">🌡️</span>
                                    <span>Suhu: <strong className="font-mono text-slate-900">{assessment.suhu_tubuh}</strong> <span className="text-[8px] text-slate-400">°C</span></span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs">⚖️</span>
                                    <span>Berat: <strong className="font-mono text-slate-900">{assessment.berat_badan}</strong> <span className="text-[8px] text-slate-400">kg</span></span>
                                  </div>
                                </div>

                                {/* Complaints (Keluhan) */}
                                {assessment.keluhan_utama && (
                                  <div className="bg-white p-2 rounded-lg border border-slate-200/50 text-[10px] leading-relaxed text-slate-700">
                                    <span className="font-black block text-[8px] text-slate-400 uppercase tracking-widest mb-0.5">Keluhan Utama</span>
                                    <p className="italic">💬 {assessment.keluhan_utama}</p>
                                  </div>
                                )}

                                {/* Allergy Records in this visit */}
                                {(assessment.alergi_makanan || assessment.alergi_obat) && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {assessment.alergi_makanan && (
                                      <span className="bg-rose-50 text-rose-600 text-[8px] font-bold px-1.5 py-0.5 rounded border border-rose-100/50 shrink-0">
                                        🚫 Alergi Mkn: {assessment.alergi_makanan}
                                      </span>
                                    )}
                                    {assessment.alergi_obat && (
                                      <span className="bg-red-50 text-red-600 text-[8px] font-bold px-1.5 py-0.5 rounded border border-red-100/50 shrink-0">
                                        💊 Alergi Obat: {assessment.alergi_obat}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-[9px] italic text-slate-400 border-t border-slate-100 pt-2">
                                Tidak ada catatan asesmen keperawatan (TTV) untuk kunjungan ini.
                              </div>
                            )}

                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}
        </aside>
      </div>
    </MasterLayout>
  );
}