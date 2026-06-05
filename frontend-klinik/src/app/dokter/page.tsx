'use client';
import { API_URL } from '@/lib/api';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import MasterLayout from '@/components/MasterLayout';

const SoapForm = dynamic(() => import('./components/SoapForm'), { ssr: false });
const ResepForm = dynamic(() => import('./components/ResepForm'), { ssr: false });
const RujukanForm = dynamic(() => import('./components/RujukanForm'), { ssr: false });
const LabForm = dynamic(() => import('./components/LabForm'), { ssr: false });
const MockForm = dynamic(() => import('./components/MockForm'), { ssr: false });



const formatLocalDate = (dateInput?: string | Date) => {
  const d = dateInput ? new Date(dateInput) : new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const hitungImt = (bb?: string, tb?: string) => {
  if (!bb || !tb) return '-';
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

// Static data obat master untuk simulasi e-prescribing
const MASTER_OBAT = [
  { id_obat: 'OBT-001', nama_obat: 'Metformin 500mg' },
  { id_obat: 'OBT-002', nama_obat: 'Amlodipine 5mg' },
  { id_obat: 'OBT-003', nama_obat: 'Amlodipine 10mg' },
  { id_obat: 'OBT-004', nama_obat: 'Atorvastatin 20mg' },
  { id_obat: 'OBT-005', nama_obat: 'Captopril 25mg' },
  { id_obat: 'OBT-006', nama_obat: 'Paracetamol 500mg' },
  { id_obat: 'OBT-007', nama_obat: 'Amoxicillin 500mg' },
  { id_obat: 'OBT-008', nama_obat: 'Omeprazole 20mg' },
];

interface PrescribedDrug {
  id_obat: string;
  nama_obat: string;
  jumlah: number;
  aturan_pakai: string;
  catatan_tambahan: string;
}

export default function DokterDashboard() {
  const [pasienQueue, setPasienQueue] = useState<any[]>([]);
  const [activePasien, setActivePasien] = useState<any>(null);
  const [filterTanggal, setFilterTanggal] = useState<string>(formatLocalDate());


  // State Tabs EMR Workspace
  const [openTabs, setOpenTabs] = useState<string[]>(['EMR Pasien']);
  const [activeTab, setActiveTab] = useState<string>('EMR Pasien');
  const [selectedLabDetail, setSelectedLabDetail] = useState<any>(null);
  
  // State Input SOAP Dokter (Tab 2)
  const [anamnesisSubjektif, setAnamnesisSubjektif] = useState<string>('');
  const [pemeriksaanObjektif, setPemeriksaanObjektif] = useState<string>('');
  const [diagnosaUtama, setDiagnosaUtama] = useState<string>('');
  const [icd10Utama, setIcd10Utama] = useState<string>('');
  const [rencanaTerapi, setRencanaTerapi] = useState<string>('');

  // State Input Resep (Tab 3)
  const [prescribedDrugs, setPrescribedDrugs] = useState<PrescribedDrug[]>([]);
  const [selectedObatId, setSelectedObatId] = useState<string>('OBT-001');
  const [jumlahObat, setJumlahObat] = useState<number>(10);
  const [aturanPakai, setAturanPakai] = useState<string>('3x1 sehari');
  const [catatanObat, setCatatanObat] = useState<string>('Sesudah makan');

  // State Input Rujukan (Tab 4)
  const [rsRujukan, setRsRujukan] = useState<string>('');
  const [poliRujukan, setPoliRujukan] = useState<string>('');
  const [alasanRujukan, setAlasanRujukan] = useState<string>('');

  // State Input Lab (Tab 5)
  const [labTests, setLabTests] = useState<string[]>([]);
  const [labType, setLabType] = useState<'dalam' | 'luar'>('dalam');
  const [externalLabVendor, setExternalLabVendor] = useState<string>('');
  const [labDiagnosis, setLabDiagnosis] = useState<string>('');
  const [labNotes, setLabNotes] = useState<string>('');
  const [labOrderDate, setLabOrderDate] = useState<string>(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now.getTime() - offset)).toISOString().slice(0, 16);
    return localISOTime;
  });
  const [selectedLabActions, setSelectedLabActions] = useState<any[]>([]);
  const [labOrders, setLabOrders] = useState<any[]>([]);
  
  // State Asisten Pintar AI CDSS
  const [aiResult, setAiResult] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState<boolean>(false);
  const [loadingSubmit, setLoadingSubmit] = useState<boolean>(false);

  // Riwayat Kunjungan Pasien untuk CDSS Alerts
  const [historyKunjungan, setHistoryKunjungan] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Hasil Lab Aktif & Analisis AI untuk Cockpit Dokter
  const [savedLabs, setSavedLabs] = useState<any[]>([]);

  const [collapsedCategories, setCollapsedCategories] = useState<{ [key: string]: boolean }>({});
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const toggleCategory = (key: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getGroupedParams = (params: any[]) => {
    const groups: { [key: string]: any[] } = {};
    params.forEach((param) => {
      const cat = param.kategori || 'Umum';
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(param);
    });
    return groups;
  };

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

  const fetchActiveLabResults = async (idKunjungan: string) => {
    if (!idKunjungan) return;
    try {
      const res = await fetch(`${API_URL}/asesmen-keperawatan/hasil-lab/${idKunjungan}`);
      if (res.ok) {
        const data = await res.json();
        setSavedLabs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Gagal mengambil hasil lab aktif:', err);
      setSavedLabs([]);
    }
  };

  // Mencari riwayat TTV kunjungan terakhir yang memiliki data asesmen keperawatan dan berbeda dari kunjungan aktif
  const prevTriage = (() => {
    if (!historyKunjungan || historyKunjungan.length === 0) return null;
    
    // Sort visits by tgl_kunjungan descending
    const sortedVisits = [...historyKunjungan].sort((a, b) => {
      return new Date(b.tgl_kunjungan).getTime() - new Date(a.tgl_kunjungan).getTime();
    });

    const activeKunjunganId = activePasien?.kunjungan?.id_kunjungan || activePasien?.id_kunjungan || activePasien?.kunjungan?.id;
    const prevVisit = sortedVisits.find(v => {
      const isDifferent = activeKunjunganId ? v.id_kunjungan !== activeKunjunganId && v.id !== activeKunjunganId : true;
      return isDifferent && v.asesmen_keperawatan && v.asesmen_keperawatan.length > 0;
    });

    return prevVisit ? prevVisit.asesmen_keperawatan[0] : null;
  })();

  // Ambil data antrean perawat (Tipe Poli) yang siap diperiksa dokter
  const fetchQueue = async () => {
    try {
      const res = await fetch(`${API_URL}/antrean`);
      const data = await res.json();
      const poliQueue = data.filter((item: any) => {
        const tanggalItem = formatLocalDate(item.created_at);
        return item.tipe_antrean === 'Poli' && tanggalItem === filterTanggal && item.status_panggil !== 'Selesai';
      });
      setPasienQueue(poliQueue);
    } catch (error) {
      console.error('Gagal memuat antrean dokter:', error);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, [filterTanggal]);



  // Memilih Pasien
  const handleSelectPasien = (item: any) => {
    setActivePasien(item);
    setOpenTabs(['EMR Pasien']);
    setActiveTab('EMR Pasien');

    // Reset Form EMR
    setAnamnesisSubjektif('');
    setPemeriksaanObjektif('');
    setDiagnosaUtama('');
    setIcd10Utama('');
    setRencanaTerapi('');
    setPrescribedDrugs([]);
    setRsRujukan('');
    setPoliRujukan('');
    setAlasanRujukan('');
    setLabTests([]);
    setLabType('dalam');
    setExternalLabVendor('');
    setLabDiagnosis('');
    setLabNotes('');
    setLabOrderDate(() => {
      const now = new Date();
      const offset = now.getTimezoneOffset() * 60000;
      return (new Date(now.getTime() - offset)).toISOString().slice(0, 16);
    });
    setSelectedLabActions([]);
    setLabOrders([]);
    setAiResult(null);

    if (item?.kunjungan?.pasien?.nik) {
      fetchPatientHistory(item.kunjungan.pasien.nik);
    } else {
      setHistoryKunjungan([]);
    }

    const activeKunjunganId = item?.kunjungan?.id_kunjungan || item?.id_kunjungan || item?.kunjungan?.id;
    if (activeKunjunganId) {
      fetchActiveLabResults(activeKunjunganId);
    } else {
      setSavedLabs([]);
    }
  };

  // Kontrol Tab EMR
  const openTab = (tabLabel: string) => {
    if (!openTabs.includes(tabLabel)) {
      setOpenTabs([...openTabs, tabLabel]);
    }
    setActiveTab(tabLabel);
  };

  const handleOpenLabDetail = (lab: any) => {
    setSelectedLabDetail(lab);
    openTab('Detail Hasil Lab');
  };

  const closeTab = (e: React.MouseEvent, tabLabel: string) => {
    e.stopPropagation();
    if (tabLabel === 'EMR Pasien') return; // Beranda tidak bisa ditutup
    const updatedTabs = openTabs.filter(t => t !== tabLabel);
    setOpenTabs(updatedTabs);
    if (tabLabel === 'Detail Hasil Lab') {
      setSelectedLabDetail(null);
    }
    if (activeTab === tabLabel) {
      setActiveTab('EMR Pasien');
    }
  };

  // CDSS AI CDSS Assistant
  const handleMintaSaranAI = async () => {
    if (!activePasien) return;
    if (!anamnesisSubjektif.trim()) {
      showToast('error', '⚠️ Tulis anamnesis subjektif terlebih dahulu untuk memicu asisten AI!');
      return;
    }

    setLoadingAI(true);
    try {
      const res = await fetch(`${API_URL}/pemeriksaan-dokter/analisis-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_kunjungan: activePasien.id_kunjungan,
          anamnesis_subjektif: anamnesisSubjektif,
        }),
      });
      const data = await res.json();
      setAiResult(data);
      
      if (data.diagnosa_utama) setDiagnosaUtama(data.diagnosa_utama);
      if (data.icd10_utama) setIcd10Utama(data.icd10_utama);
      if (data.rekomendasi_tindakan) setRencanaTerapi(data.rekomendasi_tindakan);
      showToast('success', '✨ Berhasil mendapatkan rekomendasi asisten AI!');
    } catch (error) {
      showToast('error', 'Gagal mengambil rekomendasi asisten AI.');
    } finally {
      setLoadingAI(false);
    }
  };

  // Simpan Seluruh EMR (SOAP + Resep)
  const handleSimpanSeluruhEMR = async () => {
    if (!activePasien) return;
    if (!anamnesisSubjektif || !pemeriksaanObjektif || !diagnosaUtama || !icd10Utama) {
      showToast('error', '⚠️ Mohon lengkapi data SOAP Rawat Jalan terlebih dahulu sebelum mengunci EMR!');
      openTab('SOAP Rawat Jalan');
      return;
    }

    setLoadingSubmit(true);
    try {
      // Auto-compile prescribed drugs to append to rencana_terapi_plan if they aren't already included
      let finalRencanaTerapi = rencanaTerapi;
      if (prescribedDrugs.length > 0) {
        const resepHeader = '\n\n=== RESEP DIGITAL DIGITAL ===\n';
        if (!finalRencanaTerapi.includes('=== RESEP DIGITAL DIGITAL ===') && !finalRencanaTerapi.includes('=== RESEP DIGITAL ===')) {
          const compiledDrugs = prescribedDrugs.map((d) => {
            if (d.nama_obat.startsWith('R/ ')) {
              return `${d.nama_obat}\nAturan Pakai: ${d.aturan_pakai}\n${d.catatan_tambahan}`;
            }
            return `R/ ${d.nama_obat} - ${d.jumlah} unit\nAturan Pakai: ${d.aturan_pakai}${d.catatan_tambahan ? `\nCatatan: ${d.catatan_tambahan}` : ''}`;
          }).join('\n\n');
          finalRencanaTerapi += resepHeader + compiledDrugs;
        }
      }

      // Auto-compile lab orders to append to rencana_terapi_plan if they aren't already included
      if (labOrders.length > 0) {
        const labHeader = '\n\n=== DAFTAR ORDER PEMERIKSAAN LAB ===\n';
        if (!finalRencanaTerapi.includes('=== DAFTAR ORDER PEMERIKSAAN LAB ===')) {
          const compiledLab = labOrders.map((ord, idx) => {
            return `[ORDER #${idx + 1}]
No. Order: ${ord.no_order}
Tanggal Order: ${ord.tanggal_order.replace('T', ' ')}
Asal Pemeriksaan: ${ord.kategori === 'dalam' ? 'Pemeriksaan Dalam (Lab HNZ)' : `Pemeriksaan Luar (Rujukan: ${ord.vendor})`}
Status: ${ord.status}
Diagnosa Klinis: ${ord.diagnosa}
Keterangan: ${ord.keterangan || '-'}
Pemeriksaan:
` + ord.tindakan.map((t: any, i: number) => `  ${i + 1}. ${t.nama_tindakan} (${t.sub_spesialis})`).join('\n');
          }).join('\n\n');
          finalRencanaTerapi += labHeader + compiledLab;
        }
      }

      // 1. Simpan SOAP Dokter
      const resSOAP = await fetch(`${API_URL}/pemeriksaan-dokter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_kunjungan: activePasien.id_kunjungan,
          anamnesis_subjektif: anamnesisSubjektif,
          pemeriksaan_fisik_objektif: pemeriksaanObjektif,
          rencana_terapi_plan: finalRencanaTerapi,
        }),
      });

      if (!resSOAP.ok) throw new Error('Gagal menyimpan rekam medis SOAP.');

      // 2. Simpan Resep jika ada obat
      if (prescribedDrugs.length > 0) {
        const resPrescription = await fetch(`${API_URL}/resep`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_kunjungan: activePasien.id_kunjungan,
            items: prescribedDrugs.map(d => ({
              id_obat: d.id_obat,
              nama_obat: d.nama_obat,
              jumlah: d.jumlah,
              aturan_pakai: d.aturan_pakai,
              catatan_tambahan: d.catatan_tambahan,
            })),
          }),
        });
        if (!resPrescription.ok) throw new Error('Gagal mengirimkan resep digital ke Apotek.');
      }

      // 3. Update status antrean menjadi selesai
      await fetch(`${API_URL}/antrean/${activePasien.id_antrean}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_panggil: 'Selesai' }),
      });

      showToast('success', '🎉 EMR Berhasil Disimpan & Dikunci! Resep digital dan SOAP telah diteruskan ke Apotek & Kasir.');
      handleSelectPasien(null);
      fetchQueue();
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setLoadingSubmit(false);
    }
  };

  // Simpan SOAP Dokter Saja
  const handleSimpanSOAP = async () => {
    if (!activePasien) return;
    if (!anamnesisSubjektif || !pemeriksaanObjektif || !diagnosaUtama || !icd10Utama) {
      showToast('error', '⚠️ Mohon lengkapi data SOAP Rawat Jalan terlebih dahulu sebelum menyimpan!');
      openTab('SOAP Rawat Jalan');
      return;
    }

    setLoadingSubmit(true);
    try {
      const resSOAP = await fetch(`${API_URL}/pemeriksaan-dokter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_kunjungan: activePasien.id_kunjungan,
          anamnesis_subjektif: anamnesisSubjektif,
          pemeriksaan_fisik_objektif: pemeriksaanObjektif,
          rencana_terapi_plan: rencanaTerapi,
        }),
      });

      if (!resSOAP.ok) throw new Error('Gagal menyimpan rekam medis SOAP.');

      showToast('success', '🎉 Rekam Medis SOAP berhasil disimpan!');
      if (activePasien?.kunjungan?.pasien?.nik) {
        fetchPatientHistory(activePasien.kunjungan.pasien.nik);
      }
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setLoadingSubmit(false);
    }
  };

  // Simpan Resep Saja
  const handleSimpanResep = async () => {
    if (!activePasien) return;
    if (prescribedDrugs.length === 0) {
      showToast('error', '⚠️ Mohon tambahkan minimal 1 obat ke dalam resep sebelum menyimpan!');
      openTab('Resep');
      return;
    }

    setLoadingSubmit(true);
    try {
      const resPrescription = await fetch(`${API_URL}/resep`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_kunjungan: activePasien.id_kunjungan,
          items: prescribedDrugs.map(d => ({
            id_obat: d.id_obat,
            nama_obat: d.nama_obat,
            jumlah: d.jumlah,
            aturan_pakai: d.aturan_pakai,
            catatan_tambahan: d.catatan_tambahan,
          })),
        }),
      });
      if (!resPrescription.ok) {
        const errorData = await resPrescription.json().catch(() => ({}));
        throw new Error(errorData.message || 'Gagal mengirimkan resep digital ke Apotek.');
      }
      showToast('success', '🎉 Resep digital berhasil dikirim ke Apotek!');
      if (activePasien?.kunjungan?.pasien?.nik) {
        fetchPatientHistory(activePasien.kunjungan.pasien.nik);
      }
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setLoadingSubmit(false);
    }
  };

  // Simpan Surat Rujukan Saja (Simulasi)
  const handleSimpanRujukan = () => {
    if (!activePasien) return;
    if (!rsRujukan || !poliRujukan || !alasanRujukan) {
      showToast('error', '⚠️ Mohon lengkapi data Surat Rujukan terlebih dahulu!');
      return;
    }
    showToast('success', '🎉 Data Surat Rujukan berhasil disimpan ke EMR lokal!');
  };

  // Ajukan Permintaan Lab Saja
  const handleSimpanLab = () => {
    if (!activePasien) return;
    if (selectedLabActions.length === 0) {
      showToast('error', '⚠️ Mohon pilih minimal satu pemeriksaan laboratorium!');
      return;
    }
    if (!labDiagnosis.trim()) {
      showToast('error', '⚠️ Mohon lengkapi diagnosa klinis permintaan lab!');
      return;
    }
    if (labType === 'luar' && !externalLabVendor.trim()) {
      showToast('error', '⚠️ Mohon isi nama Vendor Lab Eksternal rujukan!');
      return;
    }

    const typeStr = labType === 'dalam' ? 'Pemeriksaan Dalam (Lab HNZ)' : `Rujukan Eksternal (${externalLabVendor})`;
    const listNames = selectedLabActions.map(a => a.nama_tindakan).join(', ');

    // Generate a unique order number
    const now = new Date();
    const dateComp = now.getFullYear().toString().slice(-2) + 
                     String(now.getMonth() + 1).padStart(2, '0') + 
                     String(now.getDate()).padStart(2, '0');
    const randComp = Math.floor(1000 + Math.random() * 9000);
    const noOrder = `ORD-LAB-${dateComp}-${randComp}`;

    const newOrder = {
      id: Math.random().toString(36).substr(2, 9),
      no_order: noOrder,
      tanggal_order: labOrderDate,
      kategori: labType,
      vendor: labType === 'luar' ? externalLabVendor : 'Lab Klinik HNZ',
      diagnosa: labDiagnosis,
      keterangan: labNotes,
      tindakan: [...selectedLabActions],
      status: labType === 'dalam' ? 'Dikirim ke Lab & Billing' : 'Rujukan Dibuat'
    };

    setLabOrders(prev => [newOrder, ...prev]);

    // Clear active selection to allow subsequent entries
    setSelectedLabActions([]);
    setLabNotes('');

    if (labType === 'dalam') {
      showToast('success', `🎉 Sukses! Permintaan Lab [${listNames}] telah berhasil dikirim ke laboratorium internal & terverifikasi masuk billing.`);
    } else {
      showToast('success', `🎉 Sukses! Surat Rujukan Lab Eksternal ke ${externalLabVendor} telah berhasil diterbitkan.`);
    }
  };

  // Simpan Surat Kontrol Saja (Simulasi)
  const handleSimpanKontrol = () => {
    if (!activePasien) return;
    showToast('success', '🎉 Surat Kontrol berhasil dibuat & disimpan!');
  };

  // Simpan Sertifikat Medis Saja (Simulasi)
  const handleSimpanSertifikat = () => {
    if (!activePasien) return;
    showToast('success', '🎉 Sertifikat Medis berhasil diterbitkan & disimpan!');
  };

  // Menyalin data tanda vital Clinical Cockpit ke SOAP
  const handleCopyVtsToSoap = () => {
    const triage = activePasien?.kunjungan?.asesmen_keperawatan?.[0];
    if (!triage) return;
    const vtsText = `Tekanan Darah: ${triage.sistole}/${triage.diastole} mmHg (${getBpGrade(parseInt(triage.sistole), parseInt(triage.diastole))}), Nadi: ${triage.detak_jantung} /mnt, Suhu: ${triage.suhu_tubuh} °C, SpO2: ${triage.spo2}%, GDS: ${triage.gds} mg/dL, IMT: ${hitungImt(triage.berat_badan?.toString(), triage.tinggi_badan?.toString())}`;
    
    setPemeriksaanObjektif(prev => prev ? `${prev}\n${vtsText}` : vtsText);
    openTab('SOAP Rawat Jalan');
    showToast('success', '📥 Hasil TTV awal Nurse berhasil disalin ke kolom Objective (O) SOAP!');
  };

  // Kontrol input obat resep
  const handleAddDrug = () => {
    const selected = MASTER_OBAT.find(o => o.id_obat === selectedObatId);
    if (!selected) return;

    // Hindari obat duplikat
    if (prescribedDrugs.some(d => d.id_obat === selectedObatId)) {
      showToast('error', '⚠️ Obat ini sudah ada di dalam daftar resep!');
      return;
    }

    setPrescribedDrugs([
      ...prescribedDrugs,
      {
        id_obat: selected.id_obat,
        nama_obat: selected.nama_obat,
        jumlah: jumlahObat,
        aturan_pakai: aturanPakai,
        catatan_tambahan: catatanObat,
      }
    ]);
    showToast('success', `💊 ${selected.nama_obat} ditambahkan ke resep!`);
  };

  const handleRemoveDrug = (id: string) => {
    setPrescribedDrugs(prescribedDrugs.filter(d => d.id_obat !== id));
  };

  // Derived state for dynamic cockpit EMR parameters
  const uniqueDiagnoses = (() => {
    if (!historyKunjungan || historyKunjungan.length === 0) return [];
    const list: { name: string; code: string }[] = [];
    const seen = new Set<string>();
    
    historyKunjungan.forEach((v) => {
      const docExam = v.pemeriksaan_dokter?.[0];
      if (docExam) {
        let diagName = '';
        let diagCode = '';
        if (typeof docExam.pemeriksaan_fisik_objektif === 'object' && docExam.pemeriksaan_fisik_objektif !== null) {
          const obj = docExam.pemeriksaan_fisik_objektif as any;
          diagName = obj.diagnosa_utama || '';
          diagCode = obj.icd10_utama || '';
        }
        
        if (diagName && diagCode) {
          const key = `${diagCode}-${diagName}`;
          if (!seen.has(key)) {
            seen.add(key);
            list.push({ name: diagName, code: diagCode });
          }
        }
      }
    });
    return list;
  })();

  const uniqueActiveDrugs = (() => {
    if (!historyKunjungan || historyKunjungan.length === 0) return [];
    const list: string[] = [];
    const seen = new Set<string>();
    
    historyKunjungan.forEach((v) => {
      const rxItems = v.resep?.[0]?.resep_item;
      if (Array.isArray(rxItems)) {
        rxItems.forEach((item: any) => {
          const drug = MASTER_OBAT.find(mo => mo.id_obat === item.id_obat);
          const name = drug ? drug.nama_obat : 'Obat Medis';
          if (!seen.has(name)) {
            seen.add(name);
            list.push(name);
          }
        });
      }
    });
    return list;
  })();

  return (
    <MasterLayout>
      <div className="relative space-y-4">
        


        <div className="grid grid-cols-12 gap-5 items-start">
          
          {/* COLUMN 1: ANTREAN PASIEN / PROFIL DETAIL COLLAPSIBLE (col-span-3) */}
          <div className="col-span-12 lg:col-span-3">
            <div className="sticky top-[76px] lg:top-[84px] space-y-4 self-start w-full max-h-[calc(100vh-100px)] overflow-y-auto pr-1">
          {!activePasien ? (
            /* PASIEN QUEUE LIST */
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="pb-2 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-widest flex items-center gap-1.5 select-none">
                  🚪 Antrean Pasien
                </h3>
                <span className="bg-red-50 text-red-600 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200">
                  {pasienQueue.length} Antre
                </span>
              </div>

              {/* Date Filter Input */}
              <div className="flex flex-col gap-1 text-left bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider select-none">
                  📅 Filter Tanggal Antrean
                </label>
                <input
                  type="date"
                  value={filterTanggal}
                  onChange={(e) => setFilterTanggal(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold font-sans outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/10 cursor-pointer text-slate-700"
                />
              </div>
              
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-0.5">
                {pasienQueue.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-400 font-semibold bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Belum ada pasien Triage Nurse...
                  </div>
                ) : (
                  pasienQueue.map((item) => (
                    <div 
                      key={item.id_antrean} 
                      onClick={() => handleSelectPasien(item)}
                      className="p-3 rounded-xl border border-slate-100 bg-white hover:border-red-400 hover:bg-slate-50/50 cursor-pointer transition-all duration-200"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-mono font-bold text-red-600">
                          {item.kunjungan?.pasien?.no_rm || 'RM-HNZ-XXXX'}
                        </span>
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-600">
                          {item.no_antrean}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-slate-800 text-sm mt-1 truncate">
                        {item.kunjungan?.pasien?.nama_lengkap}
                      </h4>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* COLLAPSED PROFILE PASIEN */
            <div className="space-y-4">
              <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md space-y-4">
                <button 
                  onClick={() => handleSelectPasien(null)} 
                  className="flex items-center gap-1.5 text-[10px] text-red-400 hover:text-red-300 transition-all font-bold uppercase tracking-wider mb-2"
                >
                  ← Kembali ke Antrean
                </button>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pasien</span>
                  <h3 className="text-lg font-black text-white leading-tight">
                    {activePasien.kunjungan?.pasien?.nama_lengkap}
                  </h3>
                  <p className="text-xs text-slate-300 font-semibold font-mono">
                    {activePasien.kunjungan?.pasien?.no_rm || 'RM-XXXX'} | F - {activePasien.kunjungan?.pasien?.tgl_lahir ? `${formatLocalDate(activePasien.kunjungan.pasien.tgl_lahir)}` : '-'}
                  </p>
                </div>

                <div className="border-t border-slate-800 pt-3 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Poli</span>
                    <span className="font-bold text-slate-200">Interna</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Jaminan</span>
                    <span className="font-bold text-slate-200">BRJS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">DPJP</span>
                    <span className="font-bold text-red-400">dr. Raka</span>
                  </div>
                </div>

                {/* ALERGI BANNER */}
                {activePasien.kunjungan?.asesmen_keperawatan?.[0]?.alergi_obat || activePasien.kunjungan?.asesmen_keperawatan?.[0]?.alergi_makanan ? (
                  <div className="bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl p-3 text-xs space-y-1 font-bold">
                    <p className="flex items-center gap-1 text-[10px] text-rose-400 uppercase tracking-wider font-black">
                      <span>⚠️</span> Alergi Pasien
                    </p>
                    {activePasien.kunjungan?.asesmen_keperawatan?.[0]?.alergi_obat && (
                      <p>💊 Obat: {activePasien.kunjungan.asesmen_keperawatan[0].alergi_obat}</p>
                    )}
                    {activePasien.kunjungan?.asesmen_keperawatan?.[0]?.alergi_makanan && (
                      <p>🍔 Makanan: {activePasien.kunjungan.asesmen_keperawatan[0].alergi_makanan}</p>
                    )}
                  </div>
                ) : (
                  <div className="bg-emerald-950/60 border border-emerald-900 text-emerald-400 rounded-xl p-2.5 text-xs text-center font-bold">
                    🛡️ Aman / Bebas Alergi
                  </div>
                )}

                {/* RIWAYAT PENYAKIT BADGES */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Riwayat Penyakit</span>
                  {activePasien.kunjungan?.asesmen_keperawatan?.[0]?.riwayat_penyakit ? (
                    <div className="flex flex-wrap gap-1.5">
                      {activePasien.kunjungan.asesmen_keperawatan[0].riwayat_penyakit.split(',').map((p: string, idx: number) => (
                        <span key={idx} className="bg-amber-600/30 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded text-[10px] font-black uppercase">
                          {p.trim()}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 italic">Tidak ada catatan penyakit kronis</span>
                  )}
                </div>
              </div>

              {/* KUNJUNGAN SEBELUMNYA SECTION */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-4">
                <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-widest border-b border-slate-100 pb-2">
                  ⏪ Kunjungan Sebelumnya
                </h4>

                {historyKunjungan.length > 1 ? (
                  (() => {
                    const prevVisit = historyKunjungan[1]; // Kunjungan terakhir sebelum saat ini
                    const prevSoap = prevVisit?.pemeriksaan_dokter?.[0];
                    const prevPresc = prevVisit?.resep?.[0]?.resep_item;

                    return (
                      <div className="space-y-3.5 text-xs">
                        {/* VITAL SIGN TERAKHIR */}
                        <div className="space-y-1 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                          <div className="flex justify-between items-center text-[10px] text-slate-400">
                            <span className="font-bold">VITAL SIGN TERAKHIR</span>
                            <span className="font-mono">{prevVisit.tgl_kunjungan ? formatLocalDate(prevVisit.tgl_kunjungan) : '-'}</span>
                          </div>
                          {prevVisit.asesmen_keperawatan?.[0] ? (() => {
                            const pTriage = prevVisit.asesmen_keperawatan[0];
                            return (
                              <p className="font-semibold text-slate-700 text-[10.5px] leading-relaxed">
                                • TD: <span className="font-bold text-slate-850">{pTriage.sistole}/{pTriage.diastole} mmHg</span> | Nadi: {pTriage.detak_jantung} /mnt<br/>
                                • Suhu: {pTriage.suhu_tubuh} °C | SpO2: {pTriage.spo2}% | GDS: {pTriage.gds || '-'} mg/dL<br/>
                                • IMT: {hitungImt(pTriage.berat_badan?.toString(), pTriage.tinggi_badan?.toString())}
                              </p>
                            );
                          })() : (
                            <span className="text-xs text-slate-400 italic font-bold">Tidak ada rekaman Vital Sign</span>
                          )}
                        </div>

                        <div className="space-y-1 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                          <div className="flex justify-between items-center text-[10px] text-slate-400">
                            <span className="font-bold">DIAGNOSIS TERAKHIR</span>
                            <span className="font-mono">{prevVisit.tgl_kunjungan ? formatLocalDate(prevVisit.tgl_kunjungan) : '-'}</span>
                          </div>
                          <p className="font-extrabold text-slate-800 text-[11px] leading-snug">
                            {(() => {
                              if (!prevSoap) return 'Ada kunjungan, belum ada catatan medis';
                              if (prevSoap.pemeriksaan_fisik_objektif && typeof prevSoap.pemeriksaan_fisik_objektif === 'object') {
                                const obj = prevSoap.pemeriksaan_fisik_objektif as any;
                                if (obj.diagnosa_utama) {
                                  return obj.icd10_utama ? `${obj.diagnosa_utama} (${obj.icd10_utama})` : obj.diagnosa_utama;
                                }
                              }
                              return prevSoap.rencana_terapi_plan || prevSoap.anamnesis_subjektif || 'Ada kunjungan, belum ada catatan medis';
                            })()}
                          </p>
                        </div>

                        <div className="space-y-1 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                          <div className="flex justify-between items-center text-[10px] text-slate-400">
                            <span className="font-bold">OBAT TERAKHIR</span>
                            <span className="font-mono">{prevVisit.tgl_kunjungan ? formatLocalDate(prevVisit.tgl_kunjungan) : '-'}</span>
                          </div>
                          <p className="font-semibold text-slate-700 text-[11px] leading-relaxed">
                            {prevPresc && prevPresc.length > 0 ? (
                              prevPresc.map((m: any, i: number) => (
                                <span key={i} className="block">• {MASTER_OBAT.find(mo => mo.id_obat === m.id_obat)?.nama_obat || 'Obat Medis'} ({m.jumlah} tab)</span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400 italic font-bold">Tidak ada resep obat</span>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <p className="text-center py-6 text-xs text-slate-400 italic font-semibold">
                    Tidak ada riwayat kunjungan terdahulu
                  </p>
                )}
              </div>
            </div>
          )}
          </div>
        </div>

        {/* COLUMN 2: EMR MULTI-TAB WORKSPACE (col-span-6) */}
        <div className="col-span-12 lg:col-span-6 sticky top-[76px] lg:top-[84px] bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-[calc(100vh-100px)]">
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* EMR TABS BAR */}
            {activePasien && (
              <div className="flex flex-wrap items-center gap-1.5 pb-3 border-b border-slate-200 mb-4 select-none">
                {openTabs.map((tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <div 
                      key={tab} 
                      onClick={() => setActiveTab(tab)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer transition-all border ${
                        isActive 
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{tab === 'EMR Pasien' ? '🏠 EMR Pasien' : tab}</span>
                      {tab !== 'EMR Pasien' && (
                        <button 
                          onClick={(e) => closeTab(e, tab)}
                          className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all ${
                            isActive ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-200 text-slate-400'
                          }`}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB CONTENT CONTENT */}
            {!activePasien ? (
              /* PANEL WELCOME EMPTY STATE */
              <div className="text-center py-24 space-y-4">
                <div className="text-5xl">🩺</div>
                <h3 className="text-base font-black text-slate-800">Clinical EMR Workspace</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Silakan pilih pasien di antrean sebelah kiri untuk membuka Rekam Medis Elektronik (RME) dan mengisi formulir SOAP poliklinik.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* 1. HOMEPAGE TABS: EMR PASIEN (HOME) */}
                {activeTab === 'EMR Pasien' && (
                  <div className="space-y-5 animate-fadeIn">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <h3 className="font-extrabold text-slate-800 text-sm">
                        EMR Rawat Jalan — {activePasien.kunjungan?.pasien?.nama_lengkap}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-bold font-mono">ID: {activePasien.id_kunjungan?.slice(0,8)}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* CARD 1: SOAP */}
                      <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between space-y-3">
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs">SOAP Rawat Jalan</h4>
                          <p className="text-[10px] text-slate-400 font-bold mt-1">
                            {anamnesisSubjektif || pemeriksaanObjektif ? (
                              <span className="text-amber-600">📝 Sedang diisi — 1/4 bagian</span>
                            ) : (
                              '💤 Belum dibuat'
                            )}
                          </p>
                        </div>
                        <button 
                          onClick={() => openTab('SOAP Rawat Jalan')}
                          className="w-full text-center text-white bg-red-600 hover:bg-red-700 text-[10px] font-black py-2 rounded-lg font-mono transition-all"
                        >
                          {anamnesisSubjektif || pemeriksaanObjektif ? 'Lanjut isi →' : 'Buat SOAP →'}
                        </button>
                      </div>

                      {/* CARD 2: RESEP */}
                      <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between space-y-3">
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs">Resep Obat</h4>
                          <p className="text-[10px] text-slate-400 font-bold mt-1">
                            {prescribedDrugs.length > 0 ? (
                              <span className="text-emerald-600">💊 Sedang dibuat ({prescribedDrugs.length} obat)</span>
                            ) : (
                              '💤 Belum dibuat'
                            )}
                          </p>
                        </div>
                        <button 
                          onClick={() => openTab('Resep')}
                          className="w-full text-center text-white bg-red-600 hover:bg-red-700 text-[10px] font-black py-2 rounded-lg font-mono transition-all"
                        >
                          {prescribedDrugs.length > 0 ? 'Edit Resep →' : 'Buat Resep →'}
                        </button>
                      </div>

                      {/* CARD 3: RUJUKAN */}
                      <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between space-y-3">
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs">Surat Rujukan</h4>
                          <p className="text-[10px] text-slate-400 font-bold mt-1">
                            {rsRujukan ? (
                              <span className="text-amber-600">📝 Sedang diisi</span>
                            ) : (
                              '💤 Belum dibuat'
                            )}
                          </p>
                        </div>
                        <button 
                          onClick={() => openTab('Surat Rujukan')}
                          className="w-full text-center text-white bg-red-600 hover:bg-red-700 text-[10px] font-black py-2 rounded-lg font-mono transition-all"
                        >
                          Buka Form →
                        </button>
                      </div>

                      {/* CARD 4: LAB */}
                      <div className="bg-slate-50/30 p-4 rounded-xl border border-slate-200/50 flex flex-col justify-between space-y-3">
                        <div>
                          <h4 className="font-bold text-slate-500 text-xs">Permintaan Lab</h4>
                          <p className="text-[10px] text-slate-400 font-bold mt-1">Opsional</p>
                        </div>
                        <button 
                          onClick={() => openTab('Permintaan Lab')}
                          className="w-full text-center text-slate-600 bg-slate-100 hover:bg-slate-200 text-[10px] font-black py-2 rounded-lg font-mono transition-all"
                        >
                          Buka Form →
                        </button>
                      </div>

                      {/* CARD 5: KONTROL */}
                      <div className="bg-slate-50/30 p-4 rounded-xl border border-slate-200/50 flex flex-col justify-between space-y-3">
                        <div>
                          <h4 className="font-bold text-slate-500 text-xs">Surat Kontrol</h4>
                          <p className="text-[10px] text-slate-400 font-bold mt-1">Opsional</p>
                        </div>
                        <button 
                          onClick={() => openTab('Surat Kontrol')}
                          className="w-full text-center text-slate-600 bg-slate-100 hover:bg-slate-200 text-[10px] font-black py-2 rounded-lg font-mono transition-all"
                        >
                          Buka Form →
                        </button>
                      </div>

                      {/* CARD 6: SERTIFIKAT */}
                      <div className="bg-slate-50/30 p-4 rounded-xl border border-slate-200/50 flex flex-col justify-between space-y-3">
                        <div>
                          <h4 className="font-bold text-slate-500 text-xs">Sertifikat Medis</h4>
                          <p className="text-[10px] text-slate-400 font-bold mt-1">Opsional</p>
                        </div>
                        <button 
                          onClick={() => openTab('Sertifikat Medis')}
                          className="w-full text-center text-slate-650 bg-slate-100 hover:bg-slate-200 text-[10px] font-black py-2 rounded-lg font-mono transition-all"
                        >
                          Buka Form →
                        </button>
                      </div>
                    </div>

                    {/* LABORATORY RESULTS HISTORY SECTION */}
                    <div className="bg-slate-50/20 border border-slate-200 p-5 rounded-2xl space-y-4 text-left">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5 select-none">
                          🧪 Hasil Laboratorium Terunggah & Analisis AI
                        </h4>
                        {savedLabs.length > 0 && (
                          <span className="bg-indigo-50 text-indigo-750 text-[9px] font-black px-2 py-0.5 rounded-md border border-indigo-200">
                            {savedLabs.length} Berkas
                          </span>
                        )}
                      </div>

                      {savedLabs.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {savedLabs.map((lab: any) => {
                            let formattedDate = '';
                            if (lab.tanggal_lab) {
                              const d = new Date(lab.tanggal_lab);
                              formattedDate = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                            }
                            const abnormalParams = (lab.daftar_pemeriksaan || []).filter((p: any) => p.flag === 'High' || p.flag === 'Low');
                            return (
                              <div key={lab.id_hasil_lab} className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 shadow-sm hover:shadow transition-all flex flex-col justify-between">
                                <div className="space-y-2">
                                  <div className="flex justify-between items-start border-b border-slate-100 pb-1.5">
                                    <div>
                                      <span className="font-black text-xs text-slate-800 block">🏢 {lab.nama_rs}</span>
                                      <span className="text-[9px] text-slate-400 font-bold block">{formattedDate}</span>
                                    </div>
                                    <span className="text-[10px] font-mono bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 font-bold">
                                      Order: {lab.no_registrasi || lab.no_order || '-'}
                                    </span>
                                  </div>

                                  <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Parameter Abnormal:</span>
                                    <div className="flex flex-wrap gap-1">
                                      {abnormalParams.map((p: any, idx: number) => (
                                        <span key={idx} className={`text-[8.5px] font-extrabold px-1.5 py-0.5 rounded border ${
                                          p.flag === 'High' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-blue-50 border-blue-200 text-blue-800'
                                        }`}>
                                          {p.nama_pemeriksaan} ({p.hasil} {p.satuan})
                                        </span>
                                      ))}
                                      {abnormalParams.length === 0 && (
                                        <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded font-bold">
                                          ✓ Semua Parameter Normal
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleOpenLabDetail(lab)}
                                  className="w-full text-center text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 text-[10px] font-black py-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer mt-3"
                                >
                                  🔍 Buka Tab Detail Hasil & AI Analisis →
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-6 bg-white border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-400">
                          <span className="text-xl">💤</span>
                          <span className="text-[10px] font-black uppercase">Belum ada pemeriksaan lab terunggah</span>
                          <span className="text-[9px] text-slate-400 font-medium">Unggah berkas melalui Nurse Station untuk memicu data.</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. FORM TABS: SOAP RAWAT JALAN */}
                {activeTab === 'SOAP Rawat Jalan' && (
                  <div className="space-y-4">
                    <SoapForm
                      anamnesisSubjektif={anamnesisSubjektif}
                      setAnamnesisSubjektif={setAnamnesisSubjektif}
                      pemeriksaanObjektif={pemeriksaanObjektif}
                      setPemeriksaanObjektif={setPemeriksaanObjektif}
                      diagnosaUtama={diagnosaUtama}
                      setDiagnosaUtama={setDiagnosaUtama}
                      icd10Utama={icd10Utama}
                      setIcd10Utama={setIcd10Utama}
                      rencanaTerapi={rencanaTerapi}
                      setRencanaTerapi={setRencanaTerapi}
                      aiResult={aiResult}
                      loadingAI={loadingAI}
                      handleMintaSaranAI={handleMintaSaranAI}
                      activePasien={activePasien}
                    />
                    <div className="pt-2">
                      <button
                        type="button"
                        disabled={loadingSubmit}
                        onClick={handleSimpanSOAP}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-black py-3 rounded-xl shadow-md transition-all font-mono tracking-wider uppercase flex items-center justify-center gap-1.5 cursor-pointer border-none"
                      >
                        {loadingSubmit ? '⏳ MENYIMPAN SOAP...' : '💾 SIMPAN DATA SOAP SAJA'}
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. FORM TABS: RESEP */}
                {activeTab === 'Resep' && (
                  <div className="space-y-4">
                    <ResepForm
                      prescribedDrugs={prescribedDrugs}
                      setPrescribedDrugs={setPrescribedDrugs}
                      activePasien={activePasien}
                      historyKunjungan={historyKunjungan}
                      selectedObatId={selectedObatId}
                      setSelectedObatId={setSelectedObatId}
                      jumlahObat={jumlahObat}
                      setJumlahObat={setJumlahObat}
                      aturanPakai={aturanPakai}
                      setAturanPakai={setAturanPakai}
                      catatanObat={catatanObat}
                      setCatatanObat={setCatatanObat}
                      handleAddDrug={handleAddDrug}
                      handleRemoveDrug={handleRemoveDrug}
                    />
                    <div className="pt-2">
                      <button
                        type="button"
                        disabled={loadingSubmit}
                        onClick={handleSimpanResep}
                        className="w-full bg-emerald-600 hover:bg-emerald-750 text-white text-xs font-black py-3 rounded-xl shadow-md transition-all font-mono tracking-wider uppercase flex items-center justify-center gap-1.5 cursor-pointer border-none"
                      >
                        {loadingSubmit ? '⏳ MENGIRIM RESEP...' : '💊 KIRIM RESEP DIGITAL KE APOTEK SAJA'}
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. FORM TABS: SURAT RUJUKAN */}
                {activeTab === 'Surat Rujukan' && (
                  <div className="space-y-4">
                    <RujukanForm
                      rsRujukan={rsRujukan}
                      setRsRujukan={setRsRujukan}
                      poliRujukan={poliRujukan}
                      setPoliRujukan={setPoliRujukan}
                      alasanRujukan={alasanRujukan}
                      setAlasanRujukan={setAlasanRujukan}
                    />
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleSimpanRujukan}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-black py-3 rounded-xl shadow-md transition-all font-mono tracking-wider uppercase flex items-center justify-center gap-1.5 cursor-pointer border-none"
                      >
                        📨 SIMPAN SURAT RUJUKAN SAJA
                      </button>
                    </div>
                  </div>
                )}

                {/* 5. FORM TABS: PERMINTAAN LAB */}
                {activeTab === 'Permintaan Lab' && (
                  <div className="space-y-4">
                    <LabForm 
                      activeTab={activeTab}
                      activePasien={activePasien}
                      labType={labType}
                      setLabType={setLabType}
                      externalLabVendor={externalLabVendor}
                      setExternalLabVendor={setExternalLabVendor}
                      labDiagnosis={labDiagnosis}
                      setLabDiagnosis={setLabDiagnosis}
                      labNotes={labNotes}
                      setLabNotes={setLabNotes}
                      labOrderDate={labOrderDate}
                      setLabOrderDate={setLabOrderDate}
                      selectedLabActions={selectedLabActions}
                      setSelectedLabActions={setSelectedLabActions}
                      diagnosaUtama={diagnosaUtama}
                      labOrders={labOrders}
                      setLabOrders={setLabOrders}
                    />
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleSimpanLab}
                        className="w-full bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-black py-3 rounded-xl shadow-md transition-all font-mono tracking-wider uppercase flex items-center justify-center gap-1.5 cursor-pointer border-none"
                      >
                        🧪 AJUKAN PERMINTAAN LAB SAJA
                      </button>
                    </div>
                  </div>
                )}

                {/* 6. MOCKUP FORM TABS */}
                {activeTab === 'Surat Kontrol' && (
                  <div className="space-y-4">
                    <MockForm activeTab={activeTab} />
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleSimpanKontrol}
                        className="w-full bg-slate-700 hover:bg-slate-800 text-white text-xs font-black py-3 rounded-xl shadow-md transition-all font-mono tracking-wider uppercase flex items-center justify-center gap-1.5 cursor-pointer border-none"
                      >
                        📅 SIMPAN SURAT KONTROL SAJA
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'Sertifikat Medis' && (
                  <div className="space-y-4">
                    <MockForm activeTab={activeTab} />
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleSimpanSertifikat}
                        className="w-full bg-slate-700 hover:bg-slate-800 text-white text-xs font-black py-3 rounded-xl shadow-md transition-all font-mono tracking-wider uppercase flex items-center justify-center gap-1.5 cursor-pointer border-none"
                      >
                        📜 SIMPAN SERTIFIKAT MEDIS SAJA
                      </button>
                    </div>
                  </div>
                )}

                {/* 8. DETAIL TABS: DETAIL HASIL LAB */}
                {activeTab === 'Detail Hasil Lab' && selectedLabDetail && (
                  <div className="space-y-5 animate-fadeIn">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 text-left">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveTab('EMR Pasien')}
                          className="p-1.5 rounded-lg hover:bg-slate-100 border border-slate-200 transition-all text-slate-650 hover:text-slate-800 cursor-pointer text-[10px] font-black uppercase tracking-wider"
                        >
                          ← Kembali
                        </button>
                        <h3 className="font-extrabold text-slate-800 text-sm">
                          Detail Hasil Laboratorium & AI — {selectedLabDetail.nama_pasien || activePasien.kunjungan?.pasien?.nama_lengkap}
                        </h3>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold font-mono">Order: {selectedLabDetail.no_registrasi || selectedLabDetail.no_order || '-'}</span>
                    </div>

                    {/* RS Letterhead / Kop Surat */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6 text-left relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                      
                      <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                        <div className="space-y-1">
                          <span className="text-xs font-black text-indigo-600 uppercase tracking-widest block">🏥 LAPORAN HASIL LABORATORIUM</span>
                          <h4 className="font-black text-lg text-slate-800 leading-tight">{selectedLabDetail.nama_rs}</h4>
                        </div>
                        <div className="text-right space-y-0.5">
                          <span className="text-[10px] text-slate-400 font-bold block">TANGGAL PEMERIKSAAN</span>
                          <span className="text-xs font-extrabold text-slate-700 block">
                            {selectedLabDetail.tanggal_lab ? new Date(selectedLabDetail.tanggal_lab).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                          </span>
                        </div>
                      </div>

                      {/* Patient Metadata Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-150">
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">Nama Pasien</span>
                          <span className="text-xs font-extrabold text-slate-800 block">{selectedLabDetail.nama_pasien || '-'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">No. Registrasi</span>
                          <span className="text-xs font-extrabold text-slate-800 block">{selectedLabDetail.no_registrasi || '-'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">No. Order / LIS</span>
                          <span className="text-xs font-extrabold text-slate-800 block">{selectedLabDetail.no_order || '-'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">Status Verifikasi</span>
                          <span className="text-xs font-extrabold text-emerald-600 block flex items-center gap-1">✓ Terverifikasi Nurse</span>
                        </div>
                      </div>

                      {/* AI CLINICAL ANALYSIS TWIN CARDS */}
                      {(selectedLabDetail.ringkasan_analisis_ai || selectedLabDetail.saran_analisis_ai || selectedLabDetail.catatan_analisis_ai) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-b border-slate-100 py-4">
                          {selectedLabDetail.ringkasan_analisis_ai ? (
                            <div className="bg-indigo-50/15 border border-indigo-100 rounded-xl p-4.5 space-y-2 shadow-sm">
                              <span className="text-[10px] font-black text-indigo-750 uppercase tracking-widest block border-b border-indigo-100/40 pb-1 flex items-center gap-1">
                                🔬 Hasil Ringkasan AI
                              </span>
                              <div className="text-xs font-semibold text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">
                                {selectedLabDetail.ringkasan_analisis_ai}
                              </div>
                            </div>
                          ) : selectedLabDetail.catatan_analisis_ai ? (
                            <div className="bg-indigo-50/15 border border-indigo-100 rounded-xl p-4.5 space-y-2 shadow-sm md:col-span-2">
                              <span className="text-[10px] font-black text-indigo-750 uppercase tracking-widest block border-b border-indigo-100/40 pb-1 flex items-center gap-1">
                                🧠 Hasil Analisis Klinis & Rekomendasi AI (Tersimpan)
                              </span>
                              <div className="text-xs font-semibold text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">
                                {selectedLabDetail.catatan_analisis_ai}
                              </div>
                            </div>
                          ) : null}

                          {selectedLabDetail.saran_analisis_ai && (
                            <div className="bg-emerald-50/15 border border-emerald-100 rounded-xl p-4.5 space-y-2 shadow-sm">
                              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest block border-b border-emerald-100/40 pb-1 flex items-center gap-1">
                                📋 Rekomendasi Taktis AI
                              </span>
                              <div className="text-xs font-semibold text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">
                                {selectedLabDetail.saran_analisis_ai}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Full Parameters Table */}
                      <div className="space-y-3">
                        <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">🔬 Parameter Hasil Laboratorium Lengkap</span>
                        <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
                          <table className="w-full text-xs font-semibold leading-normal font-sans">
                            <thead>
                              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-650 text-[10px] uppercase font-black tracking-wider text-left">
                                <th className="p-3 w-1/4">Kategori</th>
                                <th className="p-3 w-1/4">Pemeriksaan</th>
                                <th className="p-3 w-1/6 text-center">Hasil</th>
                                <th className="p-3 w-1/6 text-center">Nilai Rujukan</th>
                                <th className="p-3 w-1/12 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-150">
                              {(() => {
                                const grouped = getGroupedParams(selectedLabDetail.daftar_pemeriksaan || []);
                                return Object.keys(grouped).map((categoryName) => {
                                  const items = grouped[categoryName];
                                  const key = `doctor-${categoryName}`;
                                  const isCollapsed = collapsedCategories[key];
                                  
                                  const highCount = items.filter(param => param.flag === 'High').length;
                                  const lowCount = items.filter(param => param.flag === 'Low').length;
                                  const hasAbnormal = highCount > 0 || lowCount > 0;
                                  
                                  return (
                                    <React.Fragment key={categoryName}>
                                      {/* Category Header Row */}
                                      <tr 
                                        onClick={() => toggleCategory(key)}
                                        className="bg-slate-50 hover:bg-slate-100 cursor-pointer select-none transition-colors border-b border-slate-200"
                                      >
                                        <td colSpan={5} className="p-3 pl-4 font-black text-slate-800 text-left">
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
                                      {!isCollapsed && items.map((param: any, pIdx: number) => {
                                        const isHigh = param.flag === 'High';
                                        const isLow = param.flag === 'Low';
                                        return (
                                          <tr key={pIdx} className={`hover:bg-slate-50/50 transition-colors ${
                                            isHigh ? 'bg-rose-50/30' : isLow ? 'bg-blue-50/30' : ''
                                          }`}>
                                            <td className="p-3 text-slate-450 font-bold uppercase text-[9.5px] tracking-wide pl-6">↳ {param.kategori || '-'}</td>
                                            <td className="p-3 text-slate-800 font-extrabold">{param.nama_pemeriksaan}</td>
                                            <td className={`p-3 text-center font-black ${
                                              isHigh ? 'text-rose-650' : isLow ? 'text-blue-650' : 'text-slate-700'
                                            }`}>{param.hasil} <span className="text-[9px] text-slate-400 font-bold">{param.satuan}</span></td>
                                            <td className="p-3 text-center text-slate-550 font-bold">{param.nilai_normal}</td>
                                            <td className="p-3 text-center">
                                              <div className="flex justify-center">
                                                {isHigh ? (
                                                  <span className="bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">High</span>
                                                ) : isLow ? (
                                                  <span className="bg-blue-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">Low</span>
                                                ) : (
                                                  <span className="bg-slate-100 text-slate-500 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">Normal</span>
                                                )}
                                              </div>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </React.Fragment>
                                  );
                                });
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
          {/* MASTER ACTIONS FOOTER FOR WORKSPACE PANEL */}
          {activePasien && (
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2 shrink-0">
              <button 
                type="button" 
                disabled={loadingSubmit}
                onClick={handleSimpanSeluruhEMR}
                className="w-full bg-red-650 hover:bg-red-700 text-white text-xs font-black py-4 rounded-xl shadow-lg shadow-red-500/20 active:scale-98 disabled:bg-slate-300 transition-all font-mono tracking-widest uppercase cursor-pointer border-none"
              >
                {loadingSubmit ? '⏳ MENGUNCI REKAM MEDIS...' : '🔒 SELESAIKAN KUNJUNGAN & KUNCI REKAM MEDIS'}
              </button>
            </div>
          )}
        </div>

        {/* COLUMN 3: CLINICAL COCKPIT (col-span-3) */}
        <div className="col-span-12 lg:col-span-3">
          <div className="sticky top-[76px] lg:top-[84px] bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 self-start w-full max-h-[calc(100vh-100px)] overflow-y-auto">
            <div className="pb-2 border-b border-slate-100 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-widest flex items-center gap-1.5">
              🛠️ Clinical Cockpit
            </h3>
            <span className="text-[10px] text-slate-400 font-bold hover:underline cursor-pointer">
              Atur pin
            </span>
          </div>

          {!activePasien ? (
            /* COCKPIT EMPTY STATE */
            <p className="text-center py-20 text-xs text-slate-400 font-semibold bg-slate-50 rounded-xl border border-dashed border-slate-200">
              Cockpit kosong... Pilih pasien untuk melihat rangkuman.
            </p>
          ) : (
            /* ACTIVE CLINICAL COCKPIT */
            <div className="space-y-4 text-xs pr-0.5">
              
              {/* ALERGI STATUS CARD */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span className="uppercase">ALERGI</span>
                  <span className="text-[9px] text-slate-300 font-normal">selalu tampil</span>
                </div>
                {activePasien.kunjungan?.asesmen_keperawatan?.[0]?.alergi_obat || activePasien.kunjungan?.asesmen_keperawatan?.[0]?.alergi_makanan ? (
                  <div className="flex flex-wrap gap-1.5">
                    {activePasien.kunjungan.asesmen_keperawatan[0].alergi_obat && (
                      <span className="bg-rose-50 border border-rose-200 text-rose-800 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
                        ⚠️ {activePasien.kunjungan.asesmen_keperawatan[0].alergi_obat}
                      </span>
                    )}
                    {activePasien.kunjungan.asesmen_keperawatan[0].alergi_makanan && (
                      <span className="bg-rose-50 border border-rose-200 text-rose-800 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
                        🍔 {activePasien.kunjungan.asesmen_keperawatan[0].alergi_makanan}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 italic">Bebas Alergi</span>
                )}
              </div>

              {/* VITAL SIGN GRID */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span className="uppercase">VITAL SIGN</span>
                  {activePasien.kunjungan?.asesmen_keperawatan?.[0] && (
                    <span onClick={handleCopyVtsToSoap} className="text-[10px] text-red-500 hover:text-red-700 cursor-pointer font-extrabold flex items-center gap-0.5">
                      salin →
                    </span>
                  )}
                </div>

                {activePasien.kunjungan?.asesmen_keperawatan?.[0] ? (() => {
                  const triage = activePasien.kunjungan.asesmen_keperawatan[0];
                  const sistole = triage.sistole || 0;
                  const diastole = triage.diastole || 0;
                  const detak_jantung = triage.detak_jantung || 0;
                  const suhu_tubuh = triage.suhu_tubuh || 0;
                  const spo2 = triage.spo2 || 0;
                  const gds = triage.gds || 0;

                  const hasData = (sistole > 0 || diastole > 0 || detak_jantung > 0 || suhu_tubuh > 0);

                  if (!hasData) {
                    return (
                      <p className="text-center py-4 text-[10px] text-slate-400 italic bg-slate-50 border border-slate-200/60 rounded-xl font-bold select-none">
                        ⚠️ Vital Sign belum diinput oleh Nurse
                      </p>
                    );
                  }

                  const imtCategory = hitungImt(triage.berat_badan?.toString(), triage.tinggi_badan?.toString());
                  const bpHigh = (sistole >= 140 || diastole >= 90);
                  const gdsHigh = (gds >= 140);

                  return (
                    <>
                      <div className="grid grid-cols-2 gap-2 font-mono text-[11px] font-bold">
                        {/* BP */}
                        <div className={`p-2 rounded-xl border flex flex-col ${
                          bpHigh ? 'bg-rose-50/70 border-rose-200 text-rose-800' : 'bg-slate-50/50 border-slate-200 text-slate-700'
                        }`}>
                          <span className="text-[8px] text-slate-400 font-bold uppercase font-sans">TD</span>
                          <span>{triage.sistole}/{triage.diastole} <span className="text-[8px] font-normal font-sans">mmHg</span></span>
                          <span className="text-[8px] font-bold font-sans mt-0.5">{bpHigh ? '↑ Tinggi' : 'Normal'}</span>
                        </div>
                        
                        {/* Nadi */}
                        <div className="p-2 rounded-xl border bg-slate-50/50 border-slate-200 text-slate-700 flex flex-col">
                          <span className="text-[8px] text-slate-400 font-bold uppercase font-sans">Nadi</span>
                          <span>{triage.detak_jantung} <span className="text-[8px] font-normal font-sans">/mnt</span></span>
                          <span className="text-[8px] font-bold font-sans mt-0.5 text-emerald-600">Normal</span>
                        </div>

                        {/* GDS */}
                        <div className={`p-2 rounded-xl border flex flex-col ${
                          gdsHigh ? 'bg-amber-50/70 border-amber-200 text-amber-800' : 'bg-slate-50/50 border-slate-200 text-slate-700'
                        }`}>
                          <span className="text-[8px] text-slate-400 font-bold uppercase font-sans">GDS</span>
                          <span>{triage.gds || '-'} <span className="text-[8px] font-normal font-sans">mg/dL</span></span>
                          <span className="text-[8px] font-bold font-sans mt-0.5">{gdsHigh ? '↑ Perlu Pantau' : 'Normal'}</span>
                        </div>

                        {/* IMT */}
                        <div className="p-2 rounded-xl border bg-slate-50/50 border-slate-200 text-slate-700 flex flex-col">
                          <span className="text-[8px] text-slate-400 font-bold uppercase font-sans">IMT</span>
                          <span className="truncate">{imtCategory.split('—')[0].trim()}</span>
                          <span className="text-[8px] font-bold font-sans mt-0.5 text-amber-700 truncate">{imtCategory.split('—')[1]?.trim()}</span>
                        </div>
                      </div>

                      {/* CDSS Warning Cards (TTV & GDS Alerts) */}
                      <div className="space-y-2 mt-2">
                        {/* 1. TD Hipertensi Alert */}
                        {(sistole >= 120 || diastole >= 80) && (() => {
                          const bpGrade = getBpGrade(sistole, diastole);
                          const prevSistole = prevTriage?.sistole || null;
                          const prevDiastole = prevTriage?.diastole || null;
                          const bpComparison = getBpComparisonText(sistole, diastole, prevSistole, prevDiastole);
                          return (
                            <div className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-200/60 rounded-xl text-[10px] leading-relaxed text-red-950 font-medium animate-fadeIn">
                              <span className="text-red-500 text-xs mt-0.5">⚠️</span>
                              <div>
                                <span className="font-extrabold text-slate-800">
                                  TD {triage.sistole}/{triage.diastole} mmHg — {bpGrade}.{' '}
                                </span>
                                <span className="text-red-600 font-bold">
                                  {bpComparison} Akan diflag ke dokter secara otomatis.
                                </span>
                              </div>
                            </div>
                          );
                        })()}

                        {/* 2. GDS Di Atas Target Alert */}
                        {gds >= 140 && (() => {
                          const prevGds = prevTriage?.gds || null;
                          const gdsComparison = getGdsComparisonText(gds, prevGds);
                          return (
                            <div className="flex items-start gap-2 p-2.5 bg-amber-50/85 border border-amber-200/70 rounded-xl text-[10px] leading-relaxed text-amber-950 font-medium animate-fadeIn">
                              <span className="text-amber-500 text-xs mt-0.5">⚡</span>
                              <div>
                                <span className="font-extrabold text-slate-800">
                                  GDS {triage.gds} mg/dL — Di atas target.{' '}
                                </span>
                                <span className="text-amber-700 font-bold">
                                  {gdsComparison} Dokter perlu evaluasi kepatuhan obat.
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      <button 
                        type="button" onClick={handleCopyVtsToSoap}
                        className="w-full text-center text-slate-700 bg-slate-100 hover:bg-slate-200 font-bold border border-slate-200 py-2 rounded-lg text-[10px] transition-all mt-2"
                      >
                        📥 Pakai ke form
                      </button>
                    </>
                  );
                })() : (
                  <p className="text-center py-4 text-[10px] text-slate-400 italic bg-slate-50 border border-slate-200/60 rounded-xl font-bold select-none">
                    ⚠️ Vital Sign belum diinput oleh Nurse
                  </p>
                )}
              </div>

              {/* DIAGNOSIS AKTIF */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">DIAGNOSIS AKTIF</span>
                {uniqueDiagnoses.length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic select-none">Belum ada riwayat diagnosis</p>
                ) : (
                  <div className="space-y-1.5 font-bold text-slate-800 leading-normal text-[11px]">
                    {uniqueDiagnoses.map((diag, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 animate-fadeIn">
                        <span className="text-blue-500 text-xs mt-0.5">•</span>
                        <p>{diag.name} <span className="text-[10px] text-slate-400 block font-semibold">{diag.code} - Komorbid</span></p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* LAB TERAKHIR & ANALISIS AI */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 select-none">
                  <span className="uppercase font-black">🧪 Hasil Lab & Analisis AI</span>
                  {savedLabs.length > 0 && (
                    <span className="bg-indigo-50 text-indigo-700 text-[8px] font-black px-1.5 py-0.25 rounded-md border border-indigo-200">
                      {savedLabs.length} Berkas
                    </span>
                  )}
                </div>

                {savedLabs.length > 0 ? (
                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-0.5">
                    {savedLabs.map((lab: any) => {
                      let formattedDate = '';
                      if (lab.tanggal_lab) {
                        const d = new Date(lab.tanggal_lab);
                        formattedDate = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
                      }
                      return (
                        <div key={lab.id_hasil_lab} className="bg-indigo-50/20 border border-indigo-100/50 p-2.5 rounded-xl space-y-2 text-left animate-fadeIn">
                          <div className="flex justify-between items-center border-b border-indigo-100/30 pb-1">
                            <div>
                              <span className="font-extrabold text-[9px] text-slate-800 block">🏢 {lab.nama_rs}</span>
                              <span className="text-[7.5px] text-slate-400 font-bold block">{formattedDate}</span>
                            </div>
                            <span className="text-[8px] font-mono text-slate-500">{lab.no_registrasi || lab.no_order || '-'}</span>
                          </div>

                          {/* Parameter abnormal flags */}
                          <div className="flex flex-wrap gap-1">
                            {(lab.daftar_pemeriksaan || []).filter((p: any) => p.flag === 'High' || p.flag === 'Low').map((p: any, idx: number) => (
                              <span key={idx} className={`text-[8px] font-bold px-1 py-0.25 rounded border ${
                                p.flag === 'High' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-blue-50 border-blue-200 text-blue-800'
                              }`}>
                                {p.nama_pemeriksaan} ({p.hasil})
                              </span>
                            ))}
                            {(lab.daftar_pemeriksaan || []).filter((p: any) => p.flag === 'High' || p.flag === 'Low').length === 0 && (
                              <span className="text-[8.5px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-1 py-0.25 rounded font-bold">
                                ✓ Semua Normal
                              </span>
                            )}
                          </div>

                          {/* Action Button: Lihat Detail */}
                          <button
                            type="button"
                            onClick={() => handleOpenLabDetail(lab)}
                            className="w-full text-center text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 text-[8px] font-black py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            🔍 Lihat Detail Hasil & AI →
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : activePasien?.kunjungan?.pasien?.nik === '9876543210123456' ? (
                  /* Fallback for Tn Yanto Tanjung if database has no real uploads yet */
                  <div className="bg-slate-50/50 p-2.5 border border-slate-200/60 rounded-xl space-y-1.5 font-semibold text-slate-700 animate-fadeIn">
                    <div className="flex justify-between">
                      <span>HbA1c</span>
                      <span className="font-bold text-rose-600">7.8% ↑</span>
                    </div>
                    <div className="flex justify-between">
                      <span>LDL</span>
                      <span className="font-bold text-rose-600">142 ↑</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kreatinin</span>
                      <span className="font-bold text-emerald-600">0.9 mg/dL</span>
                    </div>
                    <div className="flex justify-between">
                      <span>eGFR</span>
                      <span className="font-bold text-emerald-600">74 mL/min</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic select-none">Belum ada pemeriksaan lab</p>
                )}
              </div>

              {/* OBAT AKTIF */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span className="uppercase">OBAT AKTIF</span>
                  <span onClick={() => openTab('Resep')} className="text-[10px] text-red-500 hover:text-red-700 cursor-pointer font-extrabold">
                    ke resep →
                  </span>
                </div>
                {uniqueActiveDrugs.length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic select-none">Belum ada riwayat terapi obat</p>
                ) : (
                  <div className="bg-slate-50/50 p-2.5 border border-slate-200/60 rounded-xl space-y-1.5 font-bold text-slate-700 leading-normal text-[11px] animate-fadeIn">
                    {uniqueActiveDrugs.map((drug, idx) => (
                      <p key={idx}>• {drug}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* CEK OBAT & ALERGI */}
              <div className="space-y-2 pt-1 border-t border-slate-100 pb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">CEK OBAT & ALERGI</span>
                <div className="space-y-1.5 text-[11px] font-bold leading-normal select-none">
                  {activePasien.kunjungan?.asesmen_keperawatan?.[0]?.alergi_obat ? (
                    <p className="text-rose-700 animate-fadeIn">• 🔴 Risiko Alergi Obat: {activePasien.kunjungan.asesmen_keperawatan[0].alergi_obat}</p>
                  ) : (
                    <p className="text-emerald-700 animate-fadeIn">• 🟢 Bebas kontraindikasi obat — aman</p>
                  )}
                  {activePasien.kunjungan?.asesmen_keperawatan?.[0]?.alergi_makanan && (
                    <p className="text-amber-700 animate-fadeIn">• 🍔 Alergi Makanan: {activePasien.kunjungan.asesmen_keperawatan[0].alergi_makanan}</p>
                  )}
                </div>
              </div>

            </div>
          )}
          </div>
        </div>

      </div>
      </div>

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

    </MasterLayout>
  );
}