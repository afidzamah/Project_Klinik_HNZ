'use client';
import { API_URL } from '@/lib/api';

import MasterLayout from '@/components/MasterLayout';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const TtvForm = dynamic(() => import('./components/TtvForm'), { ssr: false });
const KeluhanAsesmenForm = dynamic(() => import('./components/KeluhanAsesmenForm'), { ssr: false });
const RiwayatAlergiForm = dynamic(() => import('./components/RiwayatAlergiForm'), { ssr: false });
const HasilLabAiForm = dynamic(() => import('./components/HasilLabAiForm'), { ssr: false });

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
    tinggi_badan: '',
    nadi: '',
    spo2: '',
    gds: '',
    alergi_makanan: '',
    alergi_obat: '',
    skala_nyeri: 0,
    skala_risiko_jatuh: 0,
    tingkat_risiko_jatuh: 'Risiko Rendah',
    obat_dikonsumsi: '',
    riwayat_penyakit: '',
  });

  const [morse1, setMorse1] = useState(0); // Riwayat jatuh
  const [morse2, setMorse2] = useState(0); // Diagnosis sekunder
  const [morse3, setMorse3] = useState(0); // Alat bantu
  const [morse4, setMorse4] = useState(0); // Terapi IV
  const [morse5, setMorse5] = useState(0); // Gaya berjalan
  const [morse6, setMorse6] = useState(0); // Status mental

  useEffect(() => {
    const score = morse1 + morse2 + morse3 + morse4 + morse5 + morse6;
    let tingkat = 'Risiko Rendah';
    if (score >= 25 && score <= 50) tingkat = 'Risiko Sedang';
    if (score > 50) tingkat = 'Risiko Tinggi';
    
    setFormTriage(prev => ({
      ...prev,
      skala_risiko_jatuh: score,
      tingkat_risiko_jatuh: tingkat
    }));
  }, [morse1, morse2, morse3, morse4, morse5, morse6]);

  const parseKeluhan = (text: string) => {
    if (!text) return { keluhan: '', tipe: 'Kontrol rutin', onset: '3 hari', gejala: [] as string[], metode: 'wong-baker' as 'wong-baker' | 'nrs' | 'vas' | 'flacc' | 'painad' };
    const parts = text.split('\n\n[Tipe Kunjungan:');
    const keluhan = parts[0]?.trim() || '';
    let tipe = 'Kontrol rutin';
    let onset = '3 hari';
    let gejala: string[] = [];
    let metode: 'wong-baker' | 'nrs' | 'vas' | 'flacc' | 'painad' = 'wong-baker';
    
    if (parts[1]) {
      const tipePart = parts[1].split(']')[0]?.trim();
      if (tipePart) tipe = tipePart;
      
      const onsetPart = text.match(/\[Onset Keluhan:\s*([^\]]+)\]/);
      if (onsetPart && onsetPart[1]) onset = onsetPart[1].trim();
      
      const gejalaPart = text.match(/\[Gejala Tambahan:\s*([^\]]+)\]/);
      if (gejalaPart && gejalaPart[1]) {
        gejala = gejalaPart[1].split(',').map(s => s.trim());
      }

      const metodePart = text.match(/\[Metode Nyeri:\s*([^\]]+)\]/);
      if (metodePart && metodePart[1]) {
        const m = metodePart[1].trim().toLowerCase();
        if (m === 'nrs' || m === 'vas' || m === 'wong-baker' || m === 'flacc' || m === 'painad') {
          metode = m as 'wong-baker' | 'nrs' | 'vas' | 'flacc' | 'painad';
        }
      }
    }
    return { keluhan, tipe, onset, gejala, metode };
  };

  const populateFormTriage = (savedTriage: any) => {
    if (savedTriage) {
      const parsed = parseKeluhan(savedTriage.keluhan_utama || '');
      setFormTriage({
        keluhan_utama: parsed.keluhan,
        sistole: savedTriage.sistole?.toString() || '',
        diastole: savedTriage.diastole?.toString() || '',
        suhu_tubuh: savedTriage.suhu_tubuh?.toString() || '',
        berat_badan: savedTriage.berat_badan?.toString() || '',
        tinggi_badan: savedTriage.tinggi_badan?.toString() || '',
        nadi: savedTriage.detak_jantung?.toString() || '',
        spo2: savedTriage.spo2?.toString() || '',
        gds: savedTriage.gds?.toString() || '',
        alergi_makanan: savedTriage.alergi_makanan || '',
        alergi_obat: savedTriage.alergi_obat || '',
        skala_nyeri: savedTriage.skala_nyeri || 0,
        skala_risiko_jatuh: savedTriage.skala_risiko_jatuh || 0,
        tingkat_risiko_jatuh: savedTriage.tingkat_risiko_jatuh || 'Risiko Rendah',
        obat_dikonsumsi: savedTriage.obat_dikonsumsi || '',
        riwayat_penyakit: savedTriage.riwayat_penyakit || '',
      });
      setTipeKunjungan(parsed.tipe);
      setOnsetKeluhan(parsed.onset);
      setGejalaTambahan(parsed.gejala);
      setMetodeNyeri(parsed.metode);

      setNyeriCollapsed(savedTriage.skala_nyeri === 0 || !savedTriage.skala_nyeri);
      setRisikoJatuhCollapsed(savedTriage.skala_risiko_jatuh === 0 || !savedTriage.skala_risiko_jatuh);

      // Set Morse state scores from saved database total for visual display
      setMorse1(0);
      setMorse2(0);
      setMorse3(0);
      setMorse4(0);
      setMorse5(0);
      setMorse6(0);
    } else {
      setFormTriage({
        keluhan_utama: '',
        sistole: '',
        diastole: '',
        suhu_tubuh: '',
        berat_badan: '',
        tinggi_badan: '',
        nadi: '',
        spo2: '',
        gds: '',
        alergi_makanan: '',
        alergi_obat: '',
        skala_nyeri: 0,
        skala_risiko_jatuh: 0,
        tingkat_risiko_jatuh: 'Risiko Rendah',
        obat_dikonsumsi: '',
        riwayat_penyakit: '',
      });
      setTipeKunjungan('Kontrol rutin');
      setOnsetKeluhan('3 hari');
      setGejalaTambahan([]);
      setMetodeNyeri('wong-baker');
      
      setNyeriCollapsed(true);
      setRisikoJatuhCollapsed(true);

      // Reset Morse choices
      setMorse1(0);
      setMorse2(0);
      setMorse3(0);
      setMorse4(0);
      setMorse5(0);
      setMorse6(0);
    }
  };

  const resetFormTriage = () => {
    setFormTriage({
      keluhan_utama: '',
      sistole: '',
      diastole: '',
      suhu_tubuh: '',
      berat_badan: '',
      tinggi_badan: '',
      nadi: '',
      spo2: '',
      gds: '',
      alergi_makanan: '',
      alergi_obat: '',
      skala_nyeri: 0,
      skala_risiko_jatuh: 0,
      tingkat_risiko_jatuh: 'Risiko Rendah',
      obat_dikonsumsi: '',
      riwayat_penyakit: '',
    });
    setTipeKunjungan('Kontrol rutin');
    setOnsetKeluhan('3 hari');
    setGejalaTambahan([]);
    setMetodeNyeri('wong-baker');
    
    setNyeriCollapsed(true);
    setRisikoJatuhCollapsed(true);

    setMorse1(0);
    setMorse2(0);
    setMorse3(0);
    setMorse4(0);
    setMorse5(0);
    setMorse6(0);
  };

  const [historyKunjungan, setHistoryKunjungan] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Mencari riwayat TTV kunjungan terakhir yang memiliki data asesmen keperawatan dan berbeda dari kunjungan aktif
  const prevTriage = (() => {
    if (!historyKunjungan || historyKunjungan.length === 0) return null;
    
    // Sort visits by tgl_kunjungan descending
    const sortedVisits = [...historyKunjungan].sort((a, b) => {
      return new Date(b.tgl_kunjungan).getTime() - new Date(a.tgl_kunjungan).getTime();
    });

    const activeKunjunganId = activeAntrean?.kunjungan?.id_kunjungan || activeAntrean?.id_kunjungan || activeAntrean?.kunjungan?.id;
    const prevVisit = sortedVisits.find(v => {
      const isDifferent = activeKunjunganId ? v.id_kunjungan !== activeKunjunganId && v.id !== activeKunjunganId : true;
      return isDifferent && v.asesmen_keperawatan && v.asesmen_keperawatan.length > 0;
    });

    return prevVisit ? prevVisit.asesmen_keperawatan[0] : null;
  })();

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

  const [loading, setLoading] = useState(false);

  // Data master untuk lookup nama poliklinik dan dokter tujuan
  const [masterPoliklinik, setMasterPoliklinik] = useState<any[]>([]);
  const [masterDokter, setMasterDokter] = useState<any[]>([]);

  // State untuk berpindah sub-formulir / halaman form
  const [activeFormTab, setActiveFormTab] = useState<'ttv' | 'keluhan_asesmen' | 'riwayat' | 'hasil_lab'>('ttv');

  // State baru untuk Keluhan & Anamnesis Awal
  const [tipeKunjungan, setTipeKunjungan] = useState('Kontrol rutin');
  const [onsetKeluhan, setOnsetKeluhan] = useState('3 hari');
  const [gejalaTambahan, setGejalaTambahan] = useState<string[]>([]);
  
  // State baru untuk Collapsible Accordion Asesmen
  const [nyeriCollapsed, setNyeriCollapsed] = useState(true);
  const [risikoJatuhCollapsed, setRisikoJatuhCollapsed] = useState(true);
  const [metodeNyeri, setMetodeNyeri] = useState<'wong-baker' | 'nrs' | 'vas' | 'flacc' | 'painad'>('wong-baker');

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
    populateFormTriage(antrean.kunjungan?.asesmen_keperawatan?.[0]);
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
    populateFormTriage(antrean.kunjungan?.asesmen_keperawatan?.[0]);

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
      
      resetFormTriage();
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
    
    const fullKeluhanUtama = `${formTriage.keluhan_utama || ''} \n\n[Tipe Kunjungan: ${tipeKunjungan}] \n[Onset Keluhan: ${onsetKeluhan}]` + (gejalaTambahan.length > 0 ? ` \n[Gejala Tambahan: ${gejalaTambahan.join(', ')}]` : '') + ` \n[Metode Nyeri: ${metodeNyeri}]`;

    setLoading(true);
    try {
      const resTriage = await fetch(`${API_URL}/asesmen-keperawatan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_kunjungan: activeAntrean.id_kunjungan,
          id_perawat: 'PRW-HNZ-001',
          keluhan_utama: fullKeluhanUtama,
          sistole: parseInt(formTriage.sistole) || null,
          diastole: parseInt(formTriage.diastole) || null,
          suhu_tubuh: parseFloat(formTriage.suhu_tubuh) || null,
          berat_badan: parseFloat(formTriage.berat_badan) || null,
          tinggi_badan: parseFloat(formTriage.tinggi_badan) || null,
          detak_jantung: parseInt(formTriage.nadi) || null,
          spo2: parseInt(formTriage.spo2) || null,
          gds: parseInt(formTriage.gds) || null,
          alergi_makanan: formTriage.alergi_makanan,
          alergi_obat: formTriage.alergi_obat,
          skala_nyeri: formTriage.skala_nyeri,
          skala_risiko_jatuh: formTriage.skala_risiko_jatuh,
          tingkat_risiko_jatuh: formTriage.tingkat_risiko_jatuh,
          obat_dikonsumsi: formTriage.obat_dikonsumsi,
          riwayat_penyakit: formTriage.riwayat_penyakit,
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
      
      resetFormTriage();
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
        
        {/* PANEL KIRI: DAFTAR ANTREAN TRIAGE (PISAH KLIK & PANGGIL - LEBAR 2 KOLOM) */}
        <aside className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col h-full min-h-[75vh]">
          
          <div className="flex flex-col mb-4 pb-4 border-b border-slate-100 gap-3">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-black text-slate-800 tracking-wide flex items-center gap-2">
                <span className="text-red-600 text-lg">🩺</span> Antrean Triage
              </h2>
              <span className="bg-red-50 text-red-600 text-xs font-black px-3 py-1 rounded-full">{filteredAntreanList.length} Pasien</span>
            </div>
            
            <div className="flex flex-col gap-1 text-left bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 select-none">
                📅 Filter Tanggal Antrean
              </label>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-white cursor-pointer"
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

        {/* PANEL TENGAH: KARTU IDENTITAS & CONTAINER FORM BERJENJANG (7 KOLOM) */}
        <main className="lg:col-span-7 flex flex-col gap-6">
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
                onClick={() => setActiveFormTab('keluhan_asesmen')}
                className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer ${
                  activeFormTab === 'keluhan_asesmen'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                💬 Keluhan & Asesmen
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
              <button
                type="button"
                onClick={() => setActiveFormTab('hasil_lab')}
                className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer ${
                  activeFormTab === 'hasil_lab'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm shadow-indigo-100'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                🧪 Hasil Lab & AI
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
            
            {activeFormTab !== 'hasil_lab' ? (
              <form onSubmit={handleSimpanTriage} className="space-y-6">
                
                {/* 1. HALAMAN FORM 1: PEMERIKSAAN TTV */}
                {activeFormTab === 'ttv' && (
                  <TtvForm
                    formTriage={formTriage}
                    setFormTriage={setFormTriage}
                    activeAntrean={activeAntrean}
                    isActiveBatal={isActiveBatal}
                    isActiveSelesai={isActiveSelesai}
                    prevTriage={prevTriage}
                  />
                )}

                {/* 2. HALAMAN FORM 2: KELUHAN & ASESMEN */}
                {activeFormTab === 'keluhan_asesmen' && (
                  <KeluhanAsesmenForm
                    formTriage={formTriage}
                    setFormTriage={setFormTriage}
                    activeAntrean={activeAntrean}
                    isActiveBatal={isActiveBatal}
                    isActiveSelesai={isActiveSelesai}
                    
                    tipeKunjungan={tipeKunjungan}
                    setTipeKunjungan={setTipeKunjungan}
                    onsetKeluhan={onsetKeluhan}
                    setOnsetKeluhan={setOnsetKeluhan}
                    gejalaTambahan={gejalaTambahan}
                    setGejalaTambahan={setGejalaTambahan}

                    nyeriCollapsed={nyeriCollapsed}
                    setNyeriCollapsed={setNyeriCollapsed}
                    risikoJatuhCollapsed={risikoJatuhCollapsed}
                    setRisikoJatuhCollapsed={setRisikoJatuhCollapsed}
                    metodeNyeri={metodeNyeri}
                    setMetodeNyeri={setMetodeNyeri}

                    morse1={morse1}
                    setMorse1={setMorse1}
                    morse2={morse2}
                    setMorse2={setMorse2}
                    morse3={morse3}
                    setMorse3={setMorse3}
                    morse4={morse4}
                    setMorse4={setMorse4}
                    morse5={morse5}
                    setMorse5={setMorse5}
                    morse6={morse6}
                    setMorse6={setMorse6}
                  />
                )}

                {/* 3. HALAMAN FORM 3: RIWAYAT & ALERGI */}
                {activeFormTab === 'riwayat' && (
                  <RiwayatAlergiForm
                    formTriage={formTriage}
                    setFormTriage={setFormTriage}
                    activeAntrean={activeAntrean}
                    isActiveBatal={isActiveBatal}
                    isActiveSelesai={isActiveSelesai}
                  />
                )}

                {/* ACTION BUTTON AT THE BOTTOM OF THE CARD */}
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
            ) : (
              <HasilLabAiForm
                activeAntrean={activeAntrean}
                isActiveBatal={isActiveBatal}
                isActiveSelesai={isActiveSelesai}
              />
            )}
          </div>

        </main>

        {/* PANEL KANAN: RIWAYAT KLINIS & ALERGI PASIEN (3 KOLOM) */}
        <aside className="lg:col-span-3 bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col h-full min-h-[75vh]">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100">
            <h2 className="text-sm font-black text-slate-800 tracking-wide flex items-center gap-2">
              <span className="text-red-650 text-red-600 text-lg">📋</span> Riwayat & Alergi
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
              <div className="space-y-2 overflow-y-auto max-h-[30vh] pr-1 pb-1 scrollbar-thin scrollbar-thumb-slate-200 flex flex-col gap-2 shrink-0">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Status Klinis Aktif</span>
                
                {(() => {
                  const alergiMakanan = formTriage.alergi_makanan || historyKunjungan.find(k => k.asesmen_keperawatan?.[0]?.alergi_makanan)?.asesmen_keperawatan?.[0]?.alergi_makanan;
                  const alergiObat = formTriage.alergi_obat || historyKunjungan.find(k => k.asesmen_keperawatan?.[0]?.alergi_obat)?.asesmen_keperawatan?.[0]?.alergi_obat;
                  const obatDikonsumsi = formTriage.obat_dikonsumsi || historyKunjungan.find(k => k.asesmen_keperawatan?.[0]?.obat_dikonsumsi)?.asesmen_keperawatan?.[0]?.obat_dikonsumsi;
                  const riwayatPenyakit = formTriage.riwayat_penyakit || historyKunjungan.find(k => k.asesmen_keperawatan?.[0]?.riwayat_penyakit)?.asesmen_keperawatan?.[0]?.riwayat_penyakit;

                  if (!alergiMakanan && !alergiObat && !obatDikonsumsi && !riwayatPenyakit) {
                    return (
                      <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3 flex items-center gap-2.5">
                        <span className="text-emerald-600 text-lg">🛡️</span>
                        <div>
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Aman / Bebas Alergi</h4>
                          <p className="text-[10px] font-bold text-emerald-650 mt-0.5">Tidak ada kontraindikasi klinis yang terdeteksi.</p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2 flex flex-col">
                      {alergiMakanan && (
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 flex items-start gap-2 shadow-sm">
                          <span className="text-rose-600 text-base">🚫</span>
                          <div className="flex-1">
                            <h4 className="text-[9px] font-bold uppercase tracking-wider text-rose-800">Alergi Makanan</h4>
                            <p className="text-[10px] font-black text-rose-700 mt-0.5 leading-tight">{alergiMakanan}</p>
                          </div>
                        </div>
                      )}
                      {alergiObat && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 flex items-start gap-2 shadow-sm">
                          <span className="text-red-600 text-base">💊</span>
                          <div className="flex-1">
                            <h4 className="text-[9px] font-bold uppercase tracking-wider text-red-800">Alergi Obat</h4>
                            <p className="text-[10px] font-black text-red-700 mt-0.5 leading-tight">{alergiObat}</p>
                          </div>
                        </div>
                      )}
                      {obatDikonsumsi && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-start gap-2 shadow-sm">
                          <span className="text-amber-600 text-base">💊</span>
                          <div className="flex-1">
                            <h4 className="text-[9px] font-bold uppercase tracking-wider text-amber-800">Obat Sedang Dikonsumsi</h4>
                            <p className="text-[10px] font-black text-amber-700 mt-0.5 leading-tight">{obatDikonsumsi}</p>
                          </div>
                        </div>
                      )}
                      {riwayatPenyakit && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 flex items-start gap-2 shadow-sm">
                          <span className="text-blue-600 text-base">🩺</span>
                          <div className="flex-1">
                            <h4 className="text-[9px] font-bold uppercase tracking-wider text-blue-800">Riwayat Penyakit</h4>
                            <p className="text-[10px] font-black text-blue-700 mt-0.5 leading-tight">{riwayatPenyakit}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* TIMELINE RIWAYAT KUNJUNGAN */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-3 shrink-0">5 Kunjungan Terakhir</span>
                
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
                                <div className="grid grid-cols-2 gap-2 text-[10px] font-medium text-slate-650">
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px]">🩺</span>
                                    <span className="truncate">Tensi: <strong className="font-mono text-slate-900">{assessment.sistole}/{assessment.diastole}</strong></span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px]">🌡️</span>
                                    <span>Suhu: <strong className="font-mono text-slate-900">{assessment.suhu_tubuh}</strong>°C</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px]">⚖️</span>
                                    <span>Berat: <strong className="font-mono text-slate-900">{assessment.berat_badan}</strong>kg</span>
                                  </div>
                                  {assessment.skala_nyeri !== null && assessment.skala_nyeri !== undefined && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px]">💥</span>
                                      <span>Nyeri: <strong className="font-mono text-slate-900">{assessment.skala_nyeri}</strong>/10</span>
                                    </div>
                                  )}
                                  {assessment.skala_risiko_jatuh !== null && assessment.skala_risiko_jatuh !== undefined && (
                                    <div className="col-span-2 flex items-center gap-1">
                                      <span className="text-[10px]">⚠️</span>
                                      <span className="truncate">Jatuh: <strong className="font-mono text-slate-900">{assessment.skala_risiko_jatuh}</strong> <span className="text-[9px] font-semibold text-slate-500">({assessment.tingkat_risiko_jatuh})</span></span>
                                    </div>
                                  )}
                                </div>

                                {/* Complaints (Keluhan) */}
                                {assessment.keluhan_utama && (
                                  <div className="bg-white p-2 rounded-lg border border-slate-200/50 text-[10px] leading-relaxed text-slate-700">
                                    <span className="font-black block text-[8px] text-slate-400 uppercase tracking-widest mb-0.5">Keluhan Utama</span>
                                    <p className="italic">💬 {assessment.keluhan_utama}</p>
                                  </div>
                                )}

                                {/* Medications consumed */}
                                {assessment.obat_dikonsumsi && (
                                  <div className="bg-white p-2 rounded-lg border border-slate-200/50 text-[10px] leading-relaxed text-slate-700">
                                    <span className="font-black block text-[8px] text-amber-500 uppercase tracking-widest mb-0.5">Obat Dikonsumsi</span>
                                    <p>💊 {assessment.obat_dikonsumsi}</p>
                                  </div>
                                )}

                                {/* Previous disease history */}
                                {assessment.riwayat_penyakit && (
                                  <div className="bg-white p-2 rounded-lg border border-slate-200/50 text-[10px] leading-relaxed text-slate-700">
                                    <span className="font-black block text-[8px] text-blue-500 uppercase tracking-widest mb-0.5">Riwayat Penyakit</span>
                                    <p>🩺 {assessment.riwayat_penyakit}</p>
                                  </div>
                                )}

                                {/* Allergy Records in this visit */}
                                {(assessment.alergi_makanan || assessment.alergi_obat) && (
                                  <div className="flex flex-wrap gap-1 mt-1 pt-1 border-t border-slate-100/50">
                                    {assessment.alergi_makanan && (
                                      <span className="bg-rose-50 text-rose-600 text-[8px] font-bold px-1.5 py-0.5 rounded border border-rose-100/50 shrink-0">
                                        🚫 Mkn: {assessment.alergi_makanan}
                                      </span>
                                    )}
                                    {assessment.alergi_obat && (
                                      <span className="bg-red-50 text-red-600 text-[8px] font-bold px-1.5 py-0.5 rounded border border-red-100/50 shrink-0">
                                        💊 Obat: {assessment.alergi_obat}
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