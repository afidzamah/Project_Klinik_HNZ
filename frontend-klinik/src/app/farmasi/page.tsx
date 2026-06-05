'use client';

import { API_URL } from '@/lib/api';
import { useState, useEffect } from 'react';
import MasterLayout from '@/components/MasterLayout';

interface SubstitutionLog {
  timestamp: string;
  pasien: string;
  resepItem: string;
  dariObat: string;
  keObat: string;
  alasan: string;
  apoteker: string;
}

const customStyles = `
  .verif-farmasi-container {
    --accent: #0F4C35;
    --accent-light: #E8F5EE;
    --accent-border: #A8D5B5;
    --warn: #7C4D00;
    --warn-bg: #FFF8EC;
    --warn-border: #F0C878;
    --danger: #7C1A1A;
    --danger-bg: #FFF0F0;
    --danger-border: #F0A8A8;
    --info: #1A3A6B;
    --info-bg: #EEF3FB;
    --info-border: #A8C0E8;
    --mono: 'IBM Plex Mono', monospace;
  }
  
  /* Layout */
  .verif-farmasi-container .layout { display: flex; gap: 16px; align-items: start; }
  
  /* Sidebar */
  .verif-farmasi-container .sidebar {
    width: 290px; flex-shrink: 0;
    display: flex; flex-direction: column;
    overflow: hidden;
    position: sticky;
    top: -16px;
    height: calc(100vh - 64px - 32px);
  }
  
  .verif-farmasi-container .sf-chip { font-size: 10.5px; padding: 4px 10px; border-radius: 20px; cursor: pointer; font-weight: 600; transition: all .12s; }
  
  .verif-farmasi-container .queue-list { flex: 1; overflow-y: auto; }
  
  .verif-farmasi-container .queue-item {
    padding: 10px 13px;
    cursor: pointer;
    transition: background .12s;
    position: relative;
    border-radius: 8px;
    margin-bottom: 6px;
  }
  .verif-farmasi-container .queue-item.active { border-left: 4px solid var(--accent); }
  
  .verif-farmasi-container .qi-top { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
  .verif-farmasi-container .qi-num { font-family: var(--mono); font-size: 11px; font-weight: bold; }
  .verif-farmasi-container .qi-name { font-size: 12.5px; font-weight: 700; flex: 1; text-align: left; }
  .verif-farmasi-container .qi-time { font-size: 10.5px; }
  .verif-farmasi-container .qi-meta { font-size: 11px; margin-bottom: 4px; text-align: left; }
  .verif-farmasi-container .qi-flags { display: flex; gap: 4px; flex-wrap: wrap; }
  .verif-farmasi-container .qi-flag { font-size: 10px; padding: 2px 7px; border-radius: 4px; font-weight: 600; white-space: nowrap; }
  .verif-farmasi-container .qf-danger { background: var(--danger-bg); color: var(--danger); border: 0.5px solid var(--danger-border); }
  .verif-farmasi-container .qf-warn   { background: var(--warn-bg); color: var(--warn); border: 0.5px solid var(--warn-border); }
  .verif-farmasi-container .qf-ok     { background: var(--accent-light); color: var(--accent); border: 0.5px solid var(--accent-border); }
  .verif-farmasi-container .qf-info   { background: var(--info-bg); color: var(--info); border: 0.5px solid var(--info-border); }
  .verif-farmasi-container .qi-status { position: absolute; right: 10px; top: 14px; width: 8px; height: 8px; border-radius: 50%; }
  .verif-farmasi-container .qs-pending { background: #F59E0B; }
  .verif-farmasi-container .qs-warn    { background: #EF4444; }
  .verif-farmasi-container .qs-done    { background: #22C55E; }
  
  .verif-farmasi-container .main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 14px;
    position: sticky;
    top: -16px;
    height: calc(100vh - 64px - 32px);
    overflow: hidden;
  }
  
  .verif-farmasi-container .rx-header-card {
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
    background: #ffffff;
    flex-shrink: 0;
  }
  :global(.dark) .verif-farmasi-container .rx-header-card {
    background: #1e293b;
    border-color: rgba(255, 255, 255, 0.05);
  }
  @media (min-width: 640px) {
    .verif-farmasi-container .sidebar {
      top: -24px;
      height: calc(100vh - 64px - 48px);
    }
    .verif-farmasi-container .main {
      top: -24px;
      height: calc(100vh - 64px - 48px);
    }
  }
  @media (min-width: 1024px) {
    .verif-farmasi-container .sidebar {
      top: -32px;
      height: calc(100vh - 64px - 64px);
    }
    .verif-farmasi-container .main {
      top: -32px;
      height: calc(100vh - 64px - 64px);
    }
  }
  
  .verif-farmasi-container .rxh-top {
    background: #1E293B;
    padding: 12px 14px;
    display: flex; align-items: center; gap: 12px;
    border-radius: 8px 8px 0 0;
  }
  .verif-farmasi-container .rxh-pt-av { width: 32px; height: 32px; border-radius: 50%; background: #0F172A; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; color: #38BDF8; flex-shrink: 0; }
  .verif-farmasi-container .rxh-pt-name { font-size: 13px; font-weight: 700; color: #F1F5F9; text-align: left; }
  .verif-farmasi-container .rxh-pt-meta { font-size: 10.5px; color: #94A3B8; margin-top: 1px; text-align: left; }
  .verif-farmasi-container .rxh-sp { flex: 1; }
  .verif-farmasi-container .rxh-allergy { display: flex; align-items: center; gap: 5px; background: #451A03; border: 0.5px solid #9A3412; border-radius: 20px; padding: 3px 10px; font-size: 11px; color: #FDBA74; font-weight: bold; }
  .verif-farmasi-container .rxh-meta-row { padding: 10px 14px; border-bottom: 0.5px solid var(--border); display: flex; gap: 24px; overflow-x: auto; }
  .verif-farmasi-container .rxh-meta-item { display: flex; flex-direction: column; gap: 1px; text-align: left; }
  .verif-farmasi-container .rxh-meta-label { font-size: 10px; text-transform: uppercase; letter-spacing: .06em; color: #94A3B8; font-weight: bold; }
  .verif-farmasi-container .rxh-meta-val { font-size: 12px; font-weight: 600; white-space: nowrap; }
  
  .verif-farmasi-container .mc-hdr { padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; border-radius: 8px 8px 0 0; }
  .verif-farmasi-container .mc-title { font-size: 12.5px; font-weight: bold; }
  .verif-farmasi-container .mc-legend { display: flex; gap: 8px; align-items: center; }
  .verif-farmasi-container .mc-leg-item { display: flex; align-items: center; gap: 4px; font-size: 10.5px; color: #94A3B8; }
  .verif-farmasi-container .mc-leg-dot { width: 6px; height: 6px; border-radius: 50%; }
  
  .verif-farmasi-container .map-table { width: 100%; border-collapse: collapse; }
  .verif-farmasi-container .map-table th {
    font-size: 10px; text-transform: uppercase; letter-spacing: .06em;
    color: #94A3B8; font-weight: bold;
    padding: 9px 12px;
    text-align: left; white-space: nowrap;
  }
  .verif-farmasi-container .map-table td { padding: 0; vertical-align: middle; }
  
  .verif-farmasi-container .tc { padding: 10px 12px; }
  .verif-farmasi-container .tc-no { width: 36px; text-align: center; }
  .verif-farmasi-container .row-num { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; margin: 0 auto; }
  .verif-farmasi-container .rn-ok     { background: var(--accent-light); color: var(--accent); }
  .verif-farmasi-container .rn-warn   { background: var(--warn-bg); color: var(--warn); }
  .verif-farmasi-container .rn-danger { background: var(--danger-bg); color: var(--danger); }
  
  .verif-farmasi-container .resep-info { display: flex; flex-direction: column; gap: 2px; text-align: left; }
  .verif-farmasi-container .ri-name { font-size: 12.5px; font-weight: 700; }
  .verif-farmasi-container .ri-detail { font-size: 11px; }
  .verif-farmasi-container .ri-dokter-note { font-size: 11px; color: #0284C7; font-style: italic; margin-top: 2px; }
  
  .verif-farmasi-container .map-result { display: flex; flex-direction: column; gap: 3px; text-align: left; }
  .verif-farmasi-container .mr-main { display: flex; align-items: center; gap: 6px; }
  .verif-farmasi-container .mr-produk { font-size: 12px; font-weight: 700; }
  .verif-farmasi-container .mr-badge { font-size: 10px; padding: 1px 6px; border-radius: 4px; font-weight: 600; }
  .verif-farmasi-container .mrb-generik { background: var(--accent-light); color: var(--accent); border: 0.5px solid var(--accent-border); }
  .verif-farmasi-container .mrb-paten   { background: var(--info-bg); color: var(--info); border: 0.5px solid var(--info-border); }
  .verif-farmasi-container .mrb-bpjs    { background: var(--warn-bg); color: var(--warn); border: 0.5px solid var(--warn-border); }
  .verif-farmasi-container .mrb-nonform { background: var(--danger-bg); color: var(--danger); border: 0.5px solid var(--danger-border); }
  .verif-farmasi-container .mr-stock { font-size: 11px; }
  .verif-farmasi-container .mr-stock.ok { color: #16A34A; font-weight: bold; }
  .verif-farmasi-container .mr-stock.low { color: #D97706; font-weight: bold; }
  
  .verif-farmasi-container .alt-wrap { display: flex; flex-direction: column; gap: 3px; text-align: left; }
  .verif-farmasi-container .alt-item { display: flex; align-items: center; gap: 5px; font-size: 11px; cursor: pointer; padding: 2px 0; }
  .verif-farmasi-container .alt-item:hover .alt-name { text-decoration: underline; color: #0284C7; }
  .verif-farmasi-container .alt-dot { width: 4px; height: 4px; border-radius: 50%; background: #94A3B8; flex-shrink: 0; }
  
  .verif-farmasi-container .flag-wrap { display: flex; flex-direction: column; gap: 3px; text-align: left; }
  .verif-farmasi-container .flag-item { display: flex; align-items: flex-start; gap: 5px; }
  .verif-farmasi-container .flag-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
  .verif-farmasi-container .fd-danger { background: #EF4444; }
  .verif-farmasi-container .fd-warn   { background: #F59E0B; }
  .verif-farmasi-container .fd-ok     { background: #22C55E; }
  .verif-farmasi-container .flag-text { font-size: 11px; line-height: 1.35; }
  
  .verif-farmasi-container .action-btns { display: flex; gap: 4px; align-items: center; }
  .verif-farmasi-container .act-btn { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 5px; cursor: pointer; white-space: nowrap; transition: all .12s; border: none; }
  .verif-farmasi-container .act-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .verif-farmasi-container .ab-ok      { background: var(--accent); color: #fff; }
  .verif-farmasi-container .ab-ok:hover { opacity: .85; }
  .verif-farmasi-container .ab-change  { background: transparent; color: inherit; }
  .verif-farmasi-container .ab-return  { background: var(--danger-bg); color: var(--danger); border: 0.5px solid var(--danger-border); }
  .verif-farmasi-container .ab-return:hover { opacity: .85; }
  
  .verif-farmasi-container .return-panel {
    background: var(--danger-bg);
    border: 0.5px solid var(--danger-border);
    border-radius: 8px;
    padding: 10px 13px;
    margin-top: 6px;
    text-align: left;
  }
  .verif-farmasi-container .rp-title { font-size: 11.5px; font-weight: bold; color: var(--danger); margin-bottom: 6px; }
  .verif-farmasi-container .rp-reasons { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 8px; }
  .verif-farmasi-container .rp-reason { font-size: 11px; padding: 3px 9px; border-radius: 20px; border: 0.5px solid var(--danger-border); background: #fff; color: var(--danger); cursor: pointer; user-select: none; }
  .verif-farmasi-container .rp-reason.sel { background: var(--danger); color: #fff; }
  .verif-farmasi-container .rp-note { width: 100%; font-size: 12px; border: 0.5px solid var(--danger-border); border-radius: 6px; padding: 6px 9px; outline: none; resize: vertical; min-height: 52px; color: #1E293B; }
  .verif-farmasi-container .rp-send { margin-top: 7px; font-size: 12px; font-weight: bold; padding: 5px 14px; border-radius: 6px; background: var(--danger); color: #fff; border: none; cursor: pointer; }
  
  .verif-farmasi-container .summary-bar {
    border-radius: 8px;
    padding: 10px 14px;
    display: flex; align-items: center; gap: 14px;
  }
  .verif-farmasi-container .sb-item { display: flex; flex-direction: column; gap: 1px; text-align: left; }
  .verif-farmasi-container .sb-label { font-size: 10px; text-transform: uppercase; letter-spacing: .06em; color: #94A3B8; font-weight: bold; }
  .verif-farmasi-container .sb-val { font-size: 16px; font-weight: 700; }
  .verif-farmasi-container .sb-val.danger { color: var(--danger); }
  .verif-farmasi-container .sb-val.warn   { color: #D97706; }
  .verif-farmasi-container .sb-val.ok     { color: var(--accent); }
  .verif-farmasi-container .sb-sep { width: 0.5px; height: 32px; background: #E2E8F0; }
  .verif-farmasi-container .sb-sp { flex: 1; }
  .verif-farmasi-container .sb-approve { font-size: 12.5px; font-weight: bold; padding: 8px 20px; border-radius: 7px; background: var(--accent); color: #fff; border: none; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all .1s; }
  .verif-farmasi-container .sb-approve:hover { opacity: .9; }
  .verif-farmasi-container .sb-approve:disabled { opacity: .4; cursor: not-allowed; }
  .verif-farmasi-container .sb-draft { font-size: 12px; font-weight: 600; padding: 8px 14px; border-radius: 7px; background: transparent; border: 0.5px solid #CBD5E1; cursor: pointer; }

  /* Change Modal */
  .verif-farmasi-container .change-modal {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(15, 23, 42, 0.4); z-index: 100;
    display: flex; align-items: center; justify-content: center;
  }
  .verif-farmasi-container .modal-card {
    border-radius: 12px;
    width: 480px;
    overflow: hidden;
    box-shadow: 0 10px 25px rgba(0,0,0,.15);
  }
  .verif-farmasi-container .modal-hdr { padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; }
  .verif-farmasi-container .modal-title { font-size: 13.5px; font-weight: 700; }
  .verif-farmasi-container .modal-close { font-size: 18px; cursor: pointer; }
  .verif-farmasi-container .modal-body { padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; text-align: left; }
  .verif-farmasi-container .modal-label { font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: .05em; color: #94A3B8; margin-bottom: 4px; }
  
  .verif-farmasi-container .alt-option { display: flex; align-items: center; gap: 10px; padding: 9px 11px; border-radius: 8px; cursor: pointer; transition: all .12s; }
  .verif-farmasi-container .ao-radio { width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid #94A3B8; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
  .verif-farmasi-container .alt-option.selected { border-color: var(--accent); background: var(--accent-light); }
  .verif-farmasi-container .alt-option.selected .ao-radio { border-color: var(--accent); background: var(--accent); }
  .verif-farmasi-container .ao-dot { width: 6px; height: 6px; border-radius: 50%; background: #fff; display: none; }
  .verif-farmasi-container .alt-option.selected .ao-dot { display: block; }
  .verif-farmasi-container .ao-info { flex: 1; }
  .verif-farmasi-container .ao-name { font-size: 12.5px; font-weight: 700; }
  .verif-farmasi-container .ao-detail { font-size: 11px; margin-top: 1px; }
  .verif-farmasi-container .ao-badges { display: flex; gap: 4px; margin-top: 3px; }
  
  .verif-farmasi-container .modal-reason { width: 100%; font-size: 12px; border-radius: 6px; padding: 7px 10px; outline: none; resize: none; min-height: 52px; color: #1E293B; }
  .verif-farmasi-container .modal-footer { padding: 10px 16px; display: flex; justify-content: flex-end; gap: 7px; }
  .verif-farmasi-container .mf-cancel { font-size: 12px; padding: 6px 14px; border-radius: 6px; border: 0.5px solid #CBD5E1; background: transparent; cursor: pointer; }
  .verif-farmasi-container .mf-save { font-size: 12px; padding: 6px 14px; border-radius: 6px; background: var(--accent); color: #fff; border: none; cursor: pointer; font-weight: bold; }
`;

const getLocalDateString = (dateObj: Date | string) => {
  if (!dateObj) return '';
  const d = new Date(dateObj);
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

export default function FarmasiDashboard() {
  const [resepList, setResepList] = useState<any[]>([]);
  const [activeResep, setActiveResep] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Date filter state (default to today's local date dynamically)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return getLocalDateString(new Date());
  });
  
  // State filter kategori antrean obat
  const [filterStatus, setFilterStatus] = useState<string>('SEMUA'); // SEMUA, PERLU, PENDING, SELESAI
  const [sudahDiserahkanIds, setSudahDiserahkanIds] = useState<string[]>([]);
  const [deletedResepIds, setDeletedResepIds] = useState<string[]>([]);
  const [masterObat, setMasterObat] = useState<any[]>([]);

  // Substitution Modal & Audit log States
  const [substitutionModalOpen, setSubstitutionModalOpen] = useState<boolean>(false);
  const [subTargetIdx, setSubTargetIdx] = useState<number>(-1);
  const [subReason, setSubReason] = useState<string>('');
  const [selectedAltProduct, setSelectedAltProduct] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<SubstitutionLog[]>([]);

  // Cancel/Delete Order Modal States
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [deleteReason, setDeleteReason] = useState<string>('');

  // Preparation check states for compounded prescriptions
  const [compCheckList, setCompCheckList] = useState<{ [key: string]: boolean }>({});

  // Safety checklist (International Patient Safety Goals)
  const [checkIdentitas, setCheckIdentitas] = useState<boolean>(false);
  const [checkDosis, setCheckDosis] = useState<boolean>(false);
  const [checkAturanPakai, setCheckAturanPakai] = useState<boolean>(false);

  // Doctor Revision State
  const [revisionSent, setRevisionSent] = useState<{ [key: string]: boolean }>({});

  // Active selections map (mapped commercial products selected by the pharmacist)
  const [mappedSelections, setMappedSelections] = useState<{ [key: string]: any }>({});

  // Approved rows set to disable action buttons reactively
  const [approvedRowIdxs, setApprovedRowIdxs] = useState<Set<number>>(new Set());

  // Return panel state
  const [returnPanelOpen, setReturnPanelOpen] = useState<boolean>(false);
  const [selectedReasons, setSelectedReasons] = useState<Set<string>>(new Set());
  const [returnNote, setReturnNote] = useState<string>('');

  const reasonsList = [
    'Stok habis semua varian',
    'Tidak masuk FORNAS BPJS',
    'Perlu konfirmasi interaksi',
    'Dosis di luar lazim',
    'Obat tidak tersedia di RS',
    'Perlu surat khusus BPJS'
  ];

  // Fetch Rekam Medis (including compiled recipes) from backend
  const fetchResep = async () => {
    try {
      const res = await fetch(`${API_URL}/pemeriksaan-dokter`);
      if (res.ok) {
        const data = await res.json();
        setResepList(data);
      }
    } catch (error) {
      console.error('Gagal memuat resep farmasi:', error);
    }
  };

  // Fetch Master Obat DB for candidate mapping
  const fetchMasterObat = async () => {
    try {
      const res = await fetch(`${API_URL}/resep/master-obat`);
      if (res.ok) {
        const data = await res.json();
        setMasterObat(data);
      }
    } catch (err) {
      console.error('Gagal memuat master obat untuk farmasi:', err);
    }
  };

  useEffect(() => {
    fetchResep();
    fetchMasterObat();
    const interval = setInterval(fetchResep, 5000); // Polling every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleSelectResep = (resep: any) => {
    setActiveResep(resep);
    setCompCheckList({});
    setMappedSelections({}); // Reset temporary mappings
    setReturnPanelOpen(false); // Close return panel
    setSelectedReasons(new Set()); // Reset return reasons
    setReturnNote('');

    const items = resep.kunjungan?.resep?.[0]?.resep_item || [];
    const statusResep = resep.kunjungan?.resep?.[0]?.status_resep || 'Terkirim';
    
    if (statusResep === 'Diproses' || statusResep === 'Selesai') {
      const allIdxs = new Set();
      for (let i = 0; i < items.length; i++) {
        allIdxs.add(i);
      }
      setApprovedRowIdxs(allIdxs);
      setCheckIdentitas(true);
      setCheckDosis(true);
      setCheckAturanPakai(true);
      // Auto complete compounding steps
      setCompCheckList({
        step1: true,
        step2: true,
        step3: true,
        step4: true,
        step5: true,
        step6: true
      });
    } else {
      setApprovedRowIdxs(new Set()); // Reset approved rows
      setCheckIdentitas(false);
      setCheckDosis(false);
      setCheckAturanPakai(false);
    }
  };

  // Delete/Cancel active prescription order completely
  const handleDeleteOrder = async () => {
    if (!activeResep) return;
    const resepId = activeResep.kunjungan?.resep?.[0]?.id_resep;
    if (!resepId) {
      const confirmDelete = window.confirm(
        '⚠️ Resep ini tidak memiliki ID valid di database (kemungkinan akibat kegagalan simpan EMR sebelum perbaikan bug).\n\nApakah Anda ingin menyembunyikan order kosong ini dari daftar antrean apotek?'
      );
      if (confirmDelete) {
        setDeletedResepIds([...deletedResepIds, activeResep.id_pemeriksaan]);
        setDeleteModalOpen(false);
        setActiveResep(null);
        alert('Order kosong berhasil disembunyikan dari antrean.');
      }
      return;
    }

    if (!deleteReason.trim()) {
      alert('⚠️ Alasan pembatalan/penghapusan resep wajib diisi.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/resep/${resepId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        // Log cancellation securely in the secure audit log panel
        const cancelLog: SubstitutionLog = {
          timestamp: new Date().toLocaleTimeString('id-ID') + ' WIB',
          pasien: activeResep.kunjungan?.pasien?.nama_lengkap || 'Pasien',
          resepItem: 'Order Resep Lengkap',
          dariObat: activeResep.kunjungan?.resep?.[0]?.no_resep || 'R-HNZ',
          keObat: 'DIBATALKAN / DIHAPUS',
          alasan: deleteReason,
          apoteker: 'Apoteker Utama'
        };
        setAuditLogs([cancelLog, ...auditLogs]);

        alert(`✅ Resep Order #${activeResep.kunjungan?.resep?.[0]?.no_resep || ''} sukses dihapus dari antrean apotek!`);
        setDeleteModalOpen(false);
        setDeleteReason('');
        setActiveResep(null);
        fetchResep(); // Refresh queue
      } else {
        alert('Gagal menghapus resep di server backend.');
      }
    } catch (err) {
      console.error('Error deleting resep order:', err);
      alert('Terjadi kesalahan koneksi server saat menghapus resep.');
    }
  };

  // Filter EMR Recipes based on search, status, and DATE filter
  const resepTerfilter = resepList.filter((item) => {
    if (deletedResepIds.includes(item.id_pemeriksaan)) return false;
    const isSelesai = sudahDiserahkanIds.includes(item.id_pemeriksaan) || item.kunjungan?.resep?.[0]?.status_resep === 'Selesai';
    const isDiproses = item.kunjungan?.resep?.[0]?.status_resep === 'Diproses';
    const hasActivePrescription = item.kunjungan?.resep?.[0]?.resep_item?.length > 0;
    
    // Status filters
    let cocokStatus = true;
    if (filterStatus === 'SELESAI') {
      cocokStatus = isSelesai;
    } else if (filterStatus === 'PENDING') {
      cocokStatus = !isSelesai && isDiproses;
    } else if (filterStatus === 'PERLU') {
      cocokStatus = !isSelesai && !isDiproses && hasActivePrescription;
    } else {
      // SEMUA
      cocokStatus = true;
    }

    // Date Filter matching
    const dateOfItem = item.waktu_periksa || item.kunjungan?.tgl_kunjungan || item.kunjungan?.created_at;
    const dateFormatted = dateOfItem ? getLocalDateString(dateOfItem) : '';
    const cocokDate = !selectedDate || dateFormatted === selectedDate;

    // Search query matching
    const query = searchQuery.toLowerCase();
    const cocokSearch = 
      item.kunjungan?.pasien?.nama_lengkap?.toLowerCase().includes(query) ||
      item.kunjungan?.pasien?.no_rm?.toLowerCase().includes(query);

    return cocokStatus && cocokDate && cocokSearch;
  });

  // Calculate dynamic stats across all dates or selected date (to make numbers fully interactive)
  const getDynamicCounts = () => {
    const listToCount = resepList.filter(item => {
      if (deletedResepIds.includes(item.id_pemeriksaan)) return false;
      const dateOfItem = item.waktu_periksa || item.kunjungan?.tgl_kunjungan || item.kunjungan?.created_at;
      const dateFormatted = dateOfItem ? getLocalDateString(dateOfItem) : '';
      return !selectedDate || dateFormatted === selectedDate;
    });

    const countSemua = listToCount.length;
    const countPerlu = listToCount.filter(item => !sudahDiserahkanIds.includes(item.id_pemeriksaan) && item.kunjungan?.resep?.[0]?.status_resep !== 'Diproses' && item.kunjungan?.resep?.[0]?.status_resep !== 'Selesai' && item.kunjungan?.resep?.[0]?.resep_item?.length > 0).length;
    const countPending = listToCount.filter(item => !sudahDiserahkanIds.includes(item.id_pemeriksaan) && item.kunjungan?.resep?.[0]?.status_resep === 'Diproses').length;
    const countSelesai = listToCount.filter(item => sudahDiserahkanIds.includes(item.id_pemeriksaan) || item.kunjungan?.resep?.[0]?.status_resep === 'Selesai').length;

    return { countSemua, countPerlu, countPending, countSelesai };
  };

  const { countSemua, countPerlu, countPending, countSelesai } = getDynamicCounts();

  // ==================== CANDIDATE MAPPING & SAFETY ENGINE ====================
  const mapPrescriptionItemToProducts = (item: any, isBpjsPatient: boolean) => {
    if (!item) return { selected: null, alternatives: [], allCandidates: [], outOfStock: true };

    // 1. Identify active substance name and dosage strength
    let substance = '';
    let dosage = '';
    let rute = 'oral';

    if (item.master_obat) {
      substance = item.master_obat.zat_aktif?.nama_generik || '';
      dosage = item.master_obat.kekuatan_dosis || '';
      rute = item.master_obat.rute_pemberian || 'oral';
    } else {
      // Fallback parsing from itemNamaObat
      const itemNamaObat = item.nama_obat || (item.catatan_tambahan?.includes('Puyer') || item.aturan_pakai?.includes('bungkus') ? 'R/ Puyer Racikan' : '');
      const rawName = itemNamaObat || '';
      const match = rawName.match(/^([a-zA-Z\s]+)\s*(\d+(?:mg|g|mcg|ml)?)/i);
      if (match) {
        substance = match[1].trim();
        dosage = match[2].trim();
      } else {
        substance = rawName;
      }
    }

    if (!substance) {
      return { selected: null, alternatives: [], allCandidates: [], outOfStock: false };
    }

    const qSub = substance.toLowerCase();
    const qDos = dosage.toLowerCase();

    // 2. Query products in Master Obat with same substance, strength, and route
    const candidates = masterObat.map(o => {
      // Calculate total stock available across all batches
      const totalStock = o.obat_stok?.reduce((acc: number, s: any) => acc + (s.stok_tersedia ?? 0), 0) ?? 0;
      
      // Expiration check: if expiring within 30 days or already expired
      const isExpiredOrSoon = o.obat_stok?.some((s: any) => {
        const exp = new Date(s.expired_date);
        const limit = new Date();
        limit.setDate(limit.getDate() + 30);
        return exp <= limit;
      }) ?? false;

      return {
        ...o,
        totalStock,
        isExpiredOrSoon,
        isValidStock: totalStock >= (item.jumlah || 1) && !isExpiredOrSoon
      };
    }).filter(o => {
      const matchSub = o.zat_aktif?.nama_generik?.toLowerCase().includes(qSub) || o.nama_dagang?.toLowerCase().includes(qSub) || o.nama_produk_lengkap?.toLowerCase().includes(qSub);
      const matchDos = o.kekuatan_dosis?.toLowerCase().includes(qDos) || qDos === '';
      const matchRute = o.rute_pemberian?.toLowerCase() === rute.toLowerCase();
      return matchSub && matchDos && matchRute;
    });

    // 3. Sort candidates based on patient profile (BPJS vs Umum)
    const sorted = [...candidates].sort((a, b) => {
      if (isBpjsPatient) {
        // BPJS Prioritization: BPJS + RS Formulary -> BPJS -> Paten
        const scoreA = (a.is_bpjs ? 2 : 0) + (a.is_formularium_rs ? 1 : 0);
        const scoreB = (b.is_bpjs ? 2 : 0) + (b.is_formularium_rs ? 1 : 0);
        if (scoreB !== scoreA) return scoreB - scoreA;
      } else {
        // Umum Prioritization: Substitution Priority -> RS Formulary
        if (b.prioritas_substitusi !== a.prioritas_substitusi) {
          return a.prioritas_substitusi - b.prioritas_substitusi;
        }
        if (a.is_formularium_rs !== b.is_formularium_rs) {
          return (b.is_formularium_rs ? 1 : 0) - (a.is_formularium_rs ? 1 : 0);
        }
      }
      // Valid stock is ranked higher
      return (b.isValidStock ? 1 : 0) - (a.isValidStock ? 1 : 0);
    });

    // Valid ones (stok sufficient and not expired soon)
    const validCandidates = sorted.filter(c => c.isValidStock);
    
    const selected = validCandidates[0] || null;
    const alternatives = validCandidates.slice(1);
    const outOfStock = validCandidates.length === 0;

    return {
      selected,
      alternatives,
      allCandidates: sorted,
      outOfStock
    };
  };

  const handleSimpanPending = async () => {
    if (!activeResep) return;
    const resepId = activeResep.kunjungan?.resep?.[0]?.id_resep;
    if (!resepId) {
      alert('⚠️ Resep ini tidak memiliki ID valid.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/resep/${resepId}/proses`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        alert(`✅ Resep untuk Pasien ${activeResep.kunjungan?.pasien?.nama_lengkap} berhasil disetujui & dipindahkan ke antrean Pending!`);
        setActiveResep(null);
        fetchResep();
      } else {
        alert('⚠️ Gagal memindahkan resep ke pending.');
      }
    } catch (err) {
      console.error(err);
      alert('⚠️ Terjadi kesalahan koneksi.');
    }
  };

  const handlePanggilPasien = () => {
    if (!activeResep) return;
    const nama = activeResep.kunjungan?.pasien?.nama_lengkap || '';
    const noRm = activeResep.kunjungan?.pasien?.no_rm || '';
    const msg = new SpeechSynthesisUtterance(`Pasien atas nama ${nama}, nomor rekam medis ${noRm.replace(/[^0-9]/g, '')}, silakan menuju ke loket farmasi.`);
    msg.lang = 'id-ID';
    window.speechSynthesis.speak(msg);
    alert(`🔊 Memanggil pasien: ${nama} (${noRm})`);
  };

  const handleSerahkanObat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!activeResep) {
      alert('⚠️ Tidak ada resep aktif yang dipilih.');
      return;
    }

    // CHECK ENFORCE: Pasien UMUM wajib LUNAS di Kasir sebelum serahkan obat
    const isBpjsPatient = activeResep.rencana_terapi_plan?.includes('BPJS') || 
                           activeResep.kunjungan?.pasien?.bpjs_prioritas || 
                           activeResep.kunjungan?.cara_bayar?.nama_cara_bayar?.toLowerCase().includes('bpjs');
    const isUmum = !isBpjsPatient;

    if (isUmum) {
      const tagihanRecord = activeResep.kunjungan?.tagihan?.[0];
      const isLunas = tagihanRecord?.status_bayar === 'LUNAS';

      if (!isLunas) {
        alert('⚠️ Pembayaran Kasir Belum Lunas!\n\nPasien jaminan Umum Pribadi wajib menyelesaikan pelunasan billing resep di Kasir terlebih dahulu sebelum obat dapat diserahkan.');
        return;
      }
    }

    if (!checkIdentitas || !checkDosis || !checkAturanPakai) {
      alert('⚠️ Peringatan Keselamatan: Seluruh item validasi 3S (Salah Pasien, Salah Dosis, Salah Aturan) wajib dicentang demi keselamatan pasien!');
      return;
    }

    // Verify all compounded items have their checklists completed
    if (activeResep.rencana_terapi_plan?.includes('R/ Puyer Racikan')) {
      const allCompStepsChecked = ['step1', 'step2', 'step3', 'step4', 'step5', 'step6'].every(step => compCheckList[step]);
      if (!allCompStepsChecked) {
        alert('⚠️ Peringatan Racikan: Semua tahapan dalam Checklist Proses Racikan wajib dilengkapi sebelum menyelesaikan peracikan sediaan!');
        return;
      }
    }

    if (activeResep) {
      const resepId = activeResep.kunjungan?.resep?.[0]?.id_resep;
      if (!resepId) {
        alert('⚠️ Resep ini tidak memiliki ID valid di database.');
        return;
      }

      try {
        const res = await fetch(`${API_URL}/resep/${resepId}/serahkan`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
        });

        if (res.ok) {
          const resData = await res.json();
          setSudahDiserahkanIds([...sudahDiserahkanIds, activeResep.id_pemeriksaan]);
          alert(`✅ Obat untuk Pasien ${activeResep.kunjungan?.pasien?.nama_lengkap} sukses diserahkan!\nStok berhasil terpotong, label siap cetak, dan obat senilai Rp ${resData.addedTotal.toLocaleString('id-ID')} telah diposting otomatis ke billing kasir.`);
          setActiveResep(null);
          fetchResep(); // Refresh queue
        } else {
          const errorText = await res.text();
          let errorMessage = 'Gagal menyimpan penyerahan obat di server.';
          try {
            const errObj = JSON.parse(errorText);
            errorMessage = errObj.message || errorMessage;
          } catch (e) {}
          alert(`⚠️ Gagal menyerahkan obat: ${errorMessage}`);
        }
      } catch (err) {
        console.error('Error submitting obat handover:', err);
        alert('⚠️ Terjadi kesalahan koneksi saat menyerahkan obat.');
      }
    }
  };

  // Trigger substitute alternative product
  const handleOpenSubstitution = (itemIdx: number) => {
    setSubTargetIdx(itemIdx);
    setSubReason('');
    setSelectedAltProduct(null);
    setSubstitutionModalOpen(true);
  };

  const handleApplySubstitution = () => {
    if (!selectedAltProduct || !subReason.trim()) {
      alert('Mohon pilih produk pengganti dan ketik alasan substitusi secara rinci.');
      return;
    }

    const item = activeResep.kunjungan?.resep?.[0]?.resep_item?.[subTargetIdx];
    const isBpjsPatient = activeResep.rencana_terapi_plan?.includes('BPJS');
    const { selected } = mapPrescriptionItemToProducts(item, isBpjsPatient);
    const prevProduct = mappedSelections[subTargetIdx] || selected;

    const itemNamaObat = item?.nama_obat || (item?.catatan_tambahan?.includes('Puyer') || item?.aturan_pakai?.includes('bungkus') ? 'R/ Puyer Racikan' : 'Obat Medis');

    // Log the audit trial entry
    const newLog: SubstitutionLog = {
      timestamp: new Date().toLocaleTimeString('id-ID') + ' WIB',
      pasien: activeResep.kunjungan?.pasien?.nama_lengkap || 'Pasien',
      resepItem: itemNamaObat,
      dariObat: prevProduct?.nama_produk_lengkap || prevProduct?.nama_dagang || 'Obat Lama',
      keObat: selectedAltProduct.nama_produk_lengkap || selectedAltProduct.nama_dagang,
      alasan: subReason,
      apoteker: 'Apoteker Utama'
    };

    setAuditLogs([newLog, ...auditLogs]);
    setMappedSelections({
      ...mappedSelections,
      [subTargetIdx]: selectedAltProduct
    });

    setSubstitutionModalOpen(false);
    alert(`✅ Substitusi berhasil dilakukan! Alasan pergantian disimpan secara aman di audit logs.`);
  };

  const handleSendDoctorRevision = (itemIdx: number, itemName: string) => {
    setRevisionSent({
      ...revisionSent,
      [itemIdx]: true
    });
    alert(`📬 Notasi revisi resep untuk obat "${itemName}" telah dikirimkan secara langsung ke portal rekam medis dokter!`);
  };

  const toggleReturn = () => {
    setReturnPanelOpen(!returnPanelOpen);
  };

  const toggleReason = (reason: string) => {
    const nextSelected = new Set(selectedReasons);
    if (nextSelected.has(reason)) {
      nextSelected.delete(reason);
    } else {
      nextSelected.add(reason);
    }
    setSelectedReasons(nextSelected);
  };

  const sendReturn = () => {
    if (selectedReasons.size === 0) {
      alert('Mohon pilih minimal satu alasan pengembalian resep.');
      return;
    }
    alert(`Catatan dikirim ke dr. Raka!\n\nDokter akan menerima notifikasi dan bisa merevisi resep dari EMR-nya.\nResep ini dipindahkan ke status "Menunggu revisi dokter".`);
    setReturnPanelOpen(false);
    setSelectedReasons(new Set());
    setReturnNote('');
    setActiveResep(null);
  };

  const approveRow = (idx: number) => {
    const nextApproved = new Set(approvedRowIdxs);
    nextApproved.add(idx);
    setApprovedRowIdxs(nextApproved);
  };

  const approveAll = (totalCount: number) => {
    const nextApproved = new Set<number>();
    for (let i = 0; i < totalCount; i++) {
      nextApproved.add(i);
    }
    setApprovedRowIdxs(nextApproved);
    setTimeout(() => {
      alert(`Resep disetujui!\n\nSemua ${totalCount} obat siap disiapkan.\nNotifikasi dikirim ke:\n• Pasien: nomor antrean pengambilan obat\n• Sistem stok: stok dikurangi otomatis\n• Log audit: tercatat dengan nama apoteker`);
    }, 200);
  };

  // Helper date/time functions
  const hitungUmur = (tglLahir: string) => {
    if (!tglLahir) return '—';
    const birth = new Date(tglLahir);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age}th`;
  };

  const formatWaktu = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const itemsCount = activeResep?.kunjungan?.resep?.[0]?.resep_item?.length || 0;
  const approvedCount = approvedRowIdxs.size;
  const isEverythingApproved = approvedCount >= itemsCount && itemsCount > 0;
  const statusResep = activeResep?.kunjungan?.resep?.[0]?.status_resep || 'Terkirim';

  return (
    <MasterLayout>
      <div className="verif-farmasi-container font-sans text-slate-800 dark:text-slate-100">
        <style dangerouslySetInnerHTML={{ __html: customStyles }} />

        <div className="layout">
          {/* PANEL KIRI: MONITOR ANTRIAN RESEP MASUK */}
          <div className="sidebar bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-3xs space-y-4">
            
            <div className="border-b border-slate-100 dark:border-white/5 pb-2">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                💊 Antrean Resep Digital Masuk
              </h3>
            </div>

            {/* Date and Search Selectors */}
            <div className="space-y-2">
              <input 
                type="text" 
                placeholder="Cari No. RM / Nama..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 font-bold text-xs outline-none focus:bg-white text-slate-800 dark:text-white"
              />
              
              <div className="flex gap-2 items-center">
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="flex-1 p-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 font-bold text-xs outline-none text-slate-850 dark:text-white focus:bg-white cursor-pointer"
                  title="Filter Berdasarkan Tanggal Kunjungan"
                />
                {selectedDate && (
                  <button 
                    onClick={() => setSelectedDate('')}
                    className="p-2 text-xs font-black rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-650 cursor-pointer transition-colors"
                  >
                    Semua
                  </button>
                )}
              </div>
            </div>

            {/* Filter Status Chips (WITH INTERACTIVE COUNTS) */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-50 dark:bg-slate-950 rounded-xl">
              <div 
                className={`sf-chip text-center truncate ${filterStatus === 'SEMUA' ? 'bg-red-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-150 dark:border-white/5'}`} 
                onClick={() => setFilterStatus('SEMUA')}
              >
                Semua ({countSemua})
              </div>
              <div 
                className={`sf-chip text-center truncate ${filterStatus === 'PERLU' ? 'bg-red-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-150 dark:border-white/5'}`} 
                onClick={() => setFilterStatus('PERLU')}
              >
                Perlu Verif ({countPerlu})
              </div>
              <div 
                className={`sf-chip text-center truncate ${filterStatus === 'PENDING' ? 'bg-red-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-150 dark:border-white/5'}`} 
                onClick={() => setFilterStatus('PENDING')}
              >
                Pending ({countPending})
              </div>
              <div 
                className={`sf-chip text-center truncate ${filterStatus === 'SELESAI' ? 'bg-red-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-150 dark:border-white/5'}`} 
                onClick={() => setFilterStatus('SELESAI')}
              >
                Selesai ({countSelesai})
              </div>
            </div>
            
            {/* Active Queue List */}
            <div className="queue-list space-y-1 pr-0.5">
              {resepTerfilter.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400 font-medium">
                  Tidak ada resep masuk...
                </div>
              ) : (
                resepTerfilter.map((item, idx) => {
                  const isSelected = activeResep?.id_pemeriksaan === item.id_pemeriksaan;
                  const isBpjs = item.kunjungan?.pasien?.bpjs_prioritas || item.rencana_terapi_plan?.includes('BPJS');
                  const namaPasien = item.kunjungan?.pasien?.nama_lengkap || 'Pasien HNZ';
                  const noRm = item.kunjungan?.pasien?.no_rm || `RM-${idx + 100}`;
                  const itemsCountLocal = item.kunjungan?.resep?.[0]?.resep_item?.length || 0;
                  const timeOfItem = item.waktu_periksa || item.kunjungan?.tgl_kunjungan || item.kunjungan?.created_at;
                  const timeStr = timeOfItem ? formatWaktu(timeOfItem) : '10:48';
                  
                  let statusDotClass = 'qs-pending';
                  if (sudahDiserahkanIds.includes(item.id_pemeriksaan) || item.kunjungan?.resep?.[0]?.status_resep === 'Selesai') {
                    statusDotClass = 'qs-done';
                  } else if (item.rencana_terapi_plan?.includes('Amlodipine') && item.rencana_terapi_plan?.includes('Captopril')) {
                    statusDotClass = 'qs-warn';
                  }
                  
                  const flags = [];
                  if (item.rencana_terapi_plan?.includes('Amlodipine') && item.rencana_terapi_plan?.includes('Captopril')) {
                    flags.push({ text: 'Interaksi obat', class: 'qf-danger' });
                  }
                  if (isBpjs) {
                    flags.push({ text: 'FORNAS', class: 'qf-ok' });
                  } else {
                    flags.push({ text: 'Umum', class: 'qf-info' });
                  }
                  
                  return (
                    <div 
                      key={item.id_pemeriksaan} 
                      className={`queue-item border transition-all ${
                        isSelected 
                          ? 'border-red-500 bg-red-50/20 dark:bg-slate-800' 
                          : 'border-slate-100 dark:border-white/5 bg-white dark:bg-slate-950/30 hover:bg-slate-50 dark:hover:bg-slate-800/20'
                      } ${isSelected ? 'active' : ''}`}
                      onClick={() => handleSelectResep(item)}
                      style={{ opacity: (sudahDiserahkanIds.includes(item.id_pemeriksaan) || item.kunjungan?.resep?.[0]?.status_resep === 'Selesai') ? 0.6 : 1 }}
                    >
                      <div className={`qi-status ${statusDotClass}`}></div>
                      <div className="qi-top">
                        <span className="qi-num text-red-650 dark:text-red-400">#{noRm.replace('RM-', '')}</span>
                        <span className="qi-name text-slate-800 dark:text-white">{namaPasien}</span>
                        <span className="qi-time text-slate-400 dark:text-slate-500">{timeStr}</span>
                      </div>
                      <div className="qi-meta text-slate-500 dark:text-slate-400 font-medium">
                        dr. Raka &middot; Poli Interna &middot; {isBpjs ? 'BPJS' : 'Umum'} &middot; {itemsCountLocal} obat
                      </div>
                      <div className="qi-flags">
                        {flags.map((fl, fIdx) => (
                          <span key={fIdx} className={`qi-flag ${fl.class}`}>{fl.text}</span>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* PANEL KANAN: DETAIL PERACIKAN & VERIFIKASI OBAT */}
          <div className="main bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-3xs">
            {activeResep ? (
              <>
                {/* ACTIVE PATIENT HEADER */}
                <div className="rx-header-card border border-slate-200 dark:border-white/5">
                  <div className="rxh-top bg-slate-900 dark:bg-slate-950">
                    <div className="rxh-pt-av">
                      {activeResep.kunjungan?.pasien?.nama_lengkap ? activeResep.kunjungan.pasien.nama_lengkap.split(' ').map((n: any) => n[0]).slice(0, 2).join('').toUpperCase() : 'HNZ'}
                    </div>
                    <div>
                      <div className="rxh-pt-name">{activeResep.kunjungan?.pasien?.nama_lengkap}</div>
                      <div className="rxh-pt-meta">
                        {activeResep.kunjungan?.pasien?.jenis_kelamin || 'F'} &middot; {hitungUmur(activeResep.kunjungan?.pasien?.tgl_lahir)} &middot; No. RM {activeResep.kunjungan?.pasien?.no_rm}
                      </div>
                    </div>
                    <div className="rxh-sp"></div>
                    <div className="flex gap-2 items-center">
                      <div className="rxh-allergy">
                        ⚠ Alergi: Penisilin
                      </div>
                      
                      {/* ACTION: DELETE/CANCEL ORDER */}
                      <button
                        type="button"
                        onClick={() => setDeleteModalOpen(true)}
                        className="bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 font-extrabold text-[11px] px-3.5 py-1.5 rounded-full cursor-pointer transition-colors"
                        title="Batalkan / Hapus Order Resep Digital Ini"
                      >
                        🗑️ Batalkan Resep
                      </button>
                    </div>
                  </div>
                  <div className="rxh-meta-row bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-350">
                    <div className="rxh-meta-item">
                      <div className="rxh-meta-label">Dokter</div>
                      <div className="rxh-meta-val text-slate-800 dark:text-white">dr. Raka Pratama</div>
                    </div>
                    <div className="rxh-meta-item">
                      <div className="rxh-meta-label">Poli</div>
                      <div className="rxh-meta-val text-slate-800 dark:text-white">Interna</div>
                    </div>
                    <div className="rxh-meta-item">
                      <div className="rxh-meta-label">Jaminan</div>
                      <div className="rxh-meta-val text-red-650 dark:text-red-400 font-extrabold">
                        {activeResep.rencana_terapi_plan?.includes('BPJS') ? 'BPJS Prioritas' : 'Umum Mandiri'}
                      </div>
                    </div>
                    <div className="rxh-meta-item">
                      <div className="rxh-meta-label">Masuk resep</div>
                      <div className="rxh-meta-val text-slate-800 dark:text-white">
                        {(() => {
                          const timeOfItem = activeResep.waktu_periksa || activeResep.kunjungan?.tgl_kunjungan || activeResep.kunjungan?.created_at;
                          return timeOfItem ? (
                            <>
                              {new Date(timeOfItem).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} &middot; {formatWaktu(timeOfItem)}
                            </>
                          ) : (
                            <>28 Mei 2026 &middot; 10:48</>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="rxh-meta-item">
                      <div className="rxh-meta-label">Status mapping</div>
                      <div className="rxh-meta-val text-amber-650 dark:text-amber-500 font-black">
                        ⚠ Perlu verifikasi
                      </div>
                    </div>
                  </div>
                </div>

                {/* MIDDLE SCROLLABLE CONTENT AREA */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 mt-2">
                  {/* SOAP TRANSCRIBED PRESCRIPTION BLOCK */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-white/5 text-left">
                  <label className="text-[10.5px] text-red-600 dark:text-red-400 font-extrabold uppercase block mb-1.5 tracking-wider">
                    🔮 Transkrip Instruksi Dokter (SOAP Plan Rencana Terapi):
                  </label>
                  <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl p-3.5 font-mono text-xs text-slate-800 dark:text-slate-350 whitespace-pre-wrap leading-relaxed shadow-inner">
                    {activeResep.rencana_terapi_plan}
                  </div>
                </div>

                {/* MAPPING TABLE */}
                <div className="mapping-card border border-slate-200 dark:border-white/10">
                  <div className="mc-hdr bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-white/5">
                    <span className="mc-title text-slate-800 dark:text-white">Hasil auto-mapping — {itemsCount} obat</span>
                    <div className="mc-legend">
                      <div className="mc-leg-item"><div className="mc-leg-dot" style={{ background: '#22C55E' }}></div>OK</div>
                      <div className="mc-leg-item"><div className="mc-leg-dot" style={{ background: '#F59E0B' }}></div>Perlu cek</div>
                      <div className="mc-leg-item"><div className="mc-leg-dot" style={{ background: '#EF4444' }}></div>Perlu tindakan</div>
                    </div>
                  </div>
                  
                  <table className="map-table">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-white/5">
                        <th style={{ width: '36px' }}>#</th>
                        <th style={{ width: '220px' }}>Resep dokter</th>
                        <th style={{ width: '240px' }}>Produk mapped</th>
                        <th style={{ width: '180px' }}>Alternatif tersedia</th>
                        <th style={{ width: '200px' }}>Flag & peringatan</th>
                        <th>Aksi farmasi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeResep.kunjungan?.resep?.[0]?.resep_item?.length > 0 ? (
                        activeResep.kunjungan.resep[0].resep_item.map((item: any, idx: number) => {
                          const itemNamaObat = item.nama_obat || (item.master_obat 
                            ? (item.master_obat.nama_produk_lengkap || item.master_obat.nama_dagang)
                            : (item.catatan_tambahan?.includes('Puyer') || item.aturan_pakai?.includes('bungkus') ? 'R/ Puyer Racikan' : 'R/ Obat Racikan'));
                          
                          const isCompounded = itemNamaObat.startsWith('R/ ');
                          const isApproved = approvedRowIdxs.has(idx);
                          
                          if (isCompounded) {
                            return (
                              <tr key={item.id_resep_item || idx} className="row-warn border-b border-slate-100 dark:border-white/5" style={{ opacity: isApproved ? 0.55 : 1 }}>
                                <td className="tc tc-no">
                                  <div className="row-num rn-warn">{idx + 1}</div>
                                </td>
                                <td className="tc" colSpan={4}>
                                  <div className="resep-info">
                                    <div className="ri-name text-indigo-650 dark:text-indigo-400">🧪 {itemNamaObat.replace('R/ ', '')}</div>
                                    <div className="ri-detail text-slate-500 dark:text-slate-400">{item.aturan_pakai} &middot; {item.jumlah} bungkus</div>
                                    <div className="ri-dokter-note" style={{ whiteSpace: 'pre-wrap', color: 'var(--text2)' }}>
                                      {item.catatan_tambahan}
                                    </div>
                                  </div>
                                </td>
                                <td className="tc">
                                  <div className="action-btns">
                                    <button 
                                      type="button" 
                                      className="act-btn ab-ok bg-red-600 hover:bg-red-700 font-bold px-3 py-1 text-xs text-white rounded cursor-pointer"
                                      disabled={isApproved || statusResep === 'Diproses' || statusResep === 'Selesai'}
                                      onClick={() => approveRow(idx)}
                                      style={isApproved ? { background: '#166534', opacity: 0.7 } : {}}
                                    >
                                      {isApproved ? '✓ Disetujui' : '✓ Setuju'}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          const isBpjsPatient = activeResep.rencana_terapi_plan?.includes('BPJS');
                          const { selected, alternatives, outOfStock } = mapPrescriptionItemToProducts(item, isBpjsPatient);
                          
                          const activeSelection = mappedSelections[idx] || selected;
                          const isRevisionTriggered = revisionSent[idx];
                          
                          let rowClass = 'row-ok';
                          let rnClass = 'rn-ok';
                          if (outOfStock) {
                            rowClass = 'row-danger';
                            rnClass = 'rn-danger';
                          } else if (itemNamaObat.includes('Captopril') || activeSelection?.totalStock < 50) {
                            rowClass = 'row-warn';
                            rnClass = 'rn-warn';
                          }

                          // Flags logic
                          const rowFlags = [];
                          if (itemNamaObat.includes('Captopril')) {
                            rowFlags.push({ dot: 'fd-warn', text: '<strong>Kombinasi antihipertensi</strong> — pantau TD ketat, risiko hipotensi dengan Amlodipine' });
                            rowFlags.push({ dot: 'fd-warn', text: 'Pantau kadar kalium — ACE inhibitor dapat tingkatkan K+' });
                          } else if (activeSelection?.totalStock < 50 && activeSelection?.totalStock > 0) {
                            rowFlags.push({ dot: 'fd-warn', text: '<strong>Stok hampir habis</strong> — sisa terbatas, mepet untuk dipenuhi' });
                          } else if (outOfStock) {
                            rowFlags.push({ dot: 'fd-danger', text: '<strong>STOK HABIS</strong> — produk zat aktif sejenis tidak tersedia di apotek RS' });
                          } else {
                            rowFlags.push({ dot: 'fd-ok', text: 'Aman — tidak ada interaksi klinis bermakna' });
                          }

                          return (
                            <tr key={item.id_resep_item || idx} className={`${rowClass} border-b border-slate-100 dark:border-white/5`} style={{ opacity: isApproved ? 0.55 : 1 }}>
                              <td className="tc tc-no">
                                <div className={`row-num ${rnClass}`}>{idx + 1}</div>
                              </td>
                              <td className="tc">
                                <div className="resep-info">
                                  <div className="ri-name text-slate-800 dark:text-white">{itemNamaObat}</div>
                                  <div className="ri-detail text-slate-500 dark:text-slate-400">oral &middot; {item.aturan_pakai} &middot; 30 hari &middot; {item.jumlah} tablet</div>
                                  {item.catatan_tambahan && (
                                    <div className="ri-dokter-note">&quot;{item.catatan_tambahan}&quot;</div>
                                  )}
                                </div>
                              </td>
                              <td className="tc">
                                {outOfStock ? (
                                  <div className="map-result">
                                    <div className="mr-main">
                                      <span className="mr-produk" style={{ color: 'var(--danger)', fontWeight: 'bold' }}>🚫 KOSONG</span>
                                    </div>
                                  </div>
                                ) : activeSelection ? (
                                  <div className="map-result">
                                    <div className="mr-main">
                                      <span className="mr-produk text-slate-800 dark:text-white">{activeSelection.nama_produk_lengkap || activeSelection.nama_dagang}</span>
                                      <span className={`mr-badge ${activeSelection.is_bpjs ? 'mrb-bpjs' : 'mrb-paten'}`}>
                                        {activeSelection.is_bpjs ? 'BPJS' : 'Paten'}
                                      </span>
                                    </div>
                                    <div className={`mr-stock ${activeSelection.totalStock > 50 ? 'ok' : 'low'}`}>
                                      ✓ Stok: {activeSelection.totalStock} tablet
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-400">Tidak Mapped</span>
                                )}
                              </td>
                              <td className="tc">
                                <div className="alt-wrap">
                                  {alternatives.length > 0 ? (
                                    alternatives.map((alt: any) => (
                                      <div key={alt.id} className="alt-item text-slate-500 hover:text-red-600 dark:text-slate-400">
                                        <div className="alt-dot"></div>
                                        <span className="alt-name">{alt.nama_dagang}</span>
                                      </div>
                                    ))
                                  ) : (
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500">—</span>
                                  )}
                                </div>
                              </td>
                              <td className="tc">
                                <div className="flag-wrap">
                                  {rowFlags.map((fl, fIdx) => (
                                    <div key={fIdx} className="flag-item">
                                      <div className={`flag-dot ${fl.dot}`}></div>
                                      <span className="flag-text text-slate-600 dark:text-slate-350" dangerouslySetInnerHTML={{ __html: fl.text }}></span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="tc">
                                <div className="action-btns">
                                  {outOfStock ? (
                                    isRevisionTriggered ? (
                                      <span className="text-[10.5px] font-bold text-rose-700 bg-rose-50 border border-rose-250 dark:border-rose-900/40 px-2.5 py-1 rounded">Revisi Terkirim</span>
                                    ) : (
                                      <button 
                                        type="button" 
                                        className="act-btn ab-return"
                                        onClick={() => handleSendDoctorRevision(idx, itemNamaObat)}
                                      >
                                        Revisi Dokter
                                      </button>
                                    )
                                  ) : (
                                    <>
                                      <button 
                                        type="button" 
                                        className="act-btn ab-ok bg-red-650 hover:bg-red-700 text-white"
                                      disabled={isApproved || statusResep === 'Diproses' || statusResep === 'Selesai'}
                                      onClick={() => approveRow(idx)}
                                      style={isApproved ? { background: '#166534', opacity: 0.7 } : {}}
                                    >
                                      {isApproved ? '✓ Disetujui' : '✓ Setuju'}
                                    </button>
                                    {alternatives.length > 0 && (
                                      <button 
                                        type="button" 
                                        className="act-btn ab-change border border-slate-200 dark:border-white/10"
                                        disabled={isApproved || statusResep === 'Diproses' || statusResep === 'Selesai'}
                                        onClick={() => handleOpenSubstitution(idx)}
                                      >
                                        Ganti
                                      </button>
                                    )}
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr className="row-ok border-b border-slate-100 dark:border-white/5">
                          <td className="tc tc-no"><div className="row-num rn-ok">1</div></td>
                          <td className="tc" colSpan={5}>
                            <div className="text-center text-slate-400 py-3 font-bold text-xs">
                              Tidak ada detail obat yang dikirim dalam resep ini.
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Puyer Compounded Checklist (Renders dynamically if puyer is detected) */}
                {activeResep.rencana_terapi_plan?.includes('R/ Puyer Racikan') && (
                  <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-white/5 rounded-2xl p-4.5 space-y-3.5 text-left shadow-2xs">
                    <h4 className="text-[11px] font-black uppercase text-slate-400 letter-spacing: .05em border-b border-slate-150 dark:border-white/5 pb-1">
                      🧪 Checklist Proses Meracik Puyer / Kapsul (Standar Pelayanan Apoteker):
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {[
                        { id: 'step1', title: '1. Verifikasi resep & kalkulasi dosis', desc: 'Dosis terverifikasi sesuai BB pasien 24kg dan instruksi khusus dr. Raka.' },
                        { id: 'step2', title: '2. Timbang bahan baku sediaan', desc: 'Timbang bahan Amoxicillin, PCT, Cetirizine secara presisi.' },
                        { id: 'step3', title: '3. Gerus & campur (geometric dilution)', desc: 'Gerus bahan terkecil (Cetirizine) terlebih dahulu, tambahkan bahan lain bertahap.' },
                        { id: 'step4', title: '4. Tambah Lactosa qs & homogenkan', desc: 'Tambahkan bahan pengisi Lactosa secukupnya agar total keseragaman bobot tercapai.' },
                        { id: 'step5', title: '5. Bagi rata ke sejumlah bungkus', desc: 'Bagi rata sediaan homogen ke 10 bungkus puyer secara seragam.' },
                        { id: 'step6', title: '6. Kemas sediaan & tempel etiket', desc: 'Kemas dalam kertas puyer, plastik klip, cetak etiket label otomatis.' }
                      ].map(step => {
                        const checked = compCheckList[step.id];
                        return (
                          <label 
                            key={step.id} 
                            style={{ display: 'flex', gap: '8px', padding: '8px 10px', background: checked ? 'var(--accent-light)' : 'var(--surface2)', border: '0.5px solid', borderColor: checked ? 'var(--accent-border)' : '#E2E8F0', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.1s' }}
                            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5"
                          >
                            <input 
                              type="checkbox"
                              checked={checked || false}
                              onChange={e => setCompCheckList({ ...compCheckList, [step.id]: e.target.checked })}
                              className="mt-0.5 shrink-0"
                            />
                            <div>
                              <span className="block text-xs font-black text-slate-800 dark:text-white" style={checked ? { color: 'var(--accent)' } : {}}>{step.title}</span>
                              <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">{step.desc}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SAFETY 3S CHECKLIST */}
                <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-250 dark:border-amber-900/30 rounded-2xl p-4 text-left shadow-3xs space-y-3">
                  <h4 className="text-[11px] font-black text-amber-700 dark:text-amber-500 uppercase tracking-wider block">
                    ⚠️ Protokol Keamanan Farmasi Klinik (Double-Check 3S):
                  </h4>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2.5 bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-white/10 cursor-pointer hover:bg-slate-50 transition-all select-none text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <input 
                        type="checkbox" 
                        checked={checkIdentitas}
                        onChange={e => setCheckIdentitas(e.target.checked)}
                        disabled={statusResep === 'Diproses' || statusResep === 'Selesai'}
                      />
                      <span>Cocokkan Identitas Fisik Pasien (Nama, Tanggal Lahir, atau NIK) sesuai Etiket</span>
                    </label>
                    <label className="flex items-center gap-2.5 bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-white/10 cursor-pointer hover:bg-slate-50 transition-all select-none text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <input 
                        type="checkbox" 
                        checked={checkDosis}
                        onChange={e => setCheckDosis(e.target.checked)}
                        disabled={statusResep === 'Diproses' || statusResep === 'Selesai'}
                      />
                      <span>Validasi Jumlah Fisik Obat, Kekuatan Sediaan, dan Ketepatan Racikan Dosis</span>
                    </label>
                    <label className="flex items-center gap-2.5 bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-white/10 cursor-pointer hover:bg-slate-50 transition-all select-none text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <input 
                        type="checkbox" 
                        checked={checkAturanPakai}
                        onChange={e => setCheckAturanPakai(e.target.checked)}
                        disabled={statusResep === 'Diproses' || statusResep === 'Selesai'}
                      />
                      <span>Siap Memberikan Edukasi Aturan Pakai (Kapan Harus Diminum & Efek Samping Obat)</span>
                    </label>
                  </div>
                </div>

                {/* KEMBALIKAN KE DOKTER */}
                <div className="bg-white dark:bg-slate-900/50 p-4 border border-slate-200 dark:border-white/10 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-800 dark:text-white text-xs block text-left">Kembalikan ke Dokter</span>
                    <button className="act-btn ab-return px-3 py-1.5 text-[11px] cursor-pointer" onClick={toggleReturn}>Kirim catatan ke dokter</button>
                  </div>
                  <div className="text-[11.5px] text-slate-400 text-left">Jika ada obat yang tidak bisa dipenuhi atau perlu konfirmasi klinis</div>
                  
                  {returnPanelOpen && (
                    <div className="return-panel border border-rose-250 dark:border-rose-900/40">
                      <div className="rp-title font-bold text-xs">Pilih alasan kembalikan ke dokter:</div>
                      <div className="rp-reasons">
                        {reasonsList.map(reason => {
                          const isSelected = selectedReasons.has(reason);
                          return (
                            <div 
                              key={reason} 
                              className={`rp-reason ${isSelected ? 'sel' : ''}`}
                              onClick={() => toggleReason(reason)}
                            >
                              {reason}
                            </div>
                          );
                        })}
                      </div>
                      <textarea 
                        className="rp-note bg-white dark:bg-slate-950 text-slate-800 dark:text-white border border-slate-200 dark:border-white/10" 
                        placeholder="Tambah catatan untuk dokter (opsional)..."
                        value={returnNote}
                        onChange={e => setReturnNote(e.target.value)}
                      ></textarea>
                      <button className="rp-send bg-rose-600 hover:bg-rose-700" onClick={sendReturn}>Kirim ke dokter dr. Raka</button>
                    </div>
                  )}
                </div>
                </div>

                {/* SUMMARY BAR */}
                <div className="summary-bar bg-white dark:bg-slate-950 p-4 border border-slate-200 dark:border-white/10">
                  <div className="sb-item"><div className="sb-label">Total obat</div><div className="sb-val text-slate-800 dark:text-white">{itemsCount}</div></div>
                  <div className="sb-sep"></div>
                  <div className="sb-item"><div className="sb-label">Disetujui</div><div className="sb-val ok" id="count-ok">{approvedCount}</div></div>
                  <div className="sb-sep"></div>
                  <div className="sb-item"><div className="sb-label">Perlu cek</div><div className="sb-val warn">{itemsCount - approvedCount}</div></div>
                  <div className="sb-sep"></div>
                  <div className="sb-item"><div className="sb-label">Diblokir</div><div className="sb-val danger">0</div></div>
                  <div className="sb-sp"></div>
                  <button className="sb-draft border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400" onClick={() => alert('Draft verifikasi disimpan!')}>Simpan draft</button>
                  {statusResep === 'Terkirim' ? (
                    isEverythingApproved ? (
                      <button 
                        type="button"
                        className="sb-approve bg-blue-600 hover:bg-blue-700 font-extrabold text-white" 
                        id="siapkan-btn" 
                        onClick={() => handleSimpanPending()}
                        style={{ background: '#1d4ed8' }}
                      >
                        💾 Simpan &amp; Siapkan Obat →
                      </button>
                    ) : (
                      <button 
                        type="button"
                        className="sb-approve bg-red-650 hover:bg-red-700 font-extrabold text-white" 
                        id="approve-all-btn" 
                        onClick={() => approveAll(itemsCount)}
                      >
                        Setujui Semua &amp; Siapkan Obat →
                      </button>
                    )
                  ) : statusResep === 'Diproses' ? (
                    <div className="flex gap-2 w-full justify-end">
                      <button 
                        type="button"
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 font-extrabold text-white rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer text-xs" 
                        id="panggil-btn" 
                        onClick={() => handlePanggilPasien()}
                      >
                        🔊 Panggil Pasien
                      </button>
                      <button 
                        type="button"
                        className="sb-approve bg-emerald-600 hover:bg-emerald-700 font-extrabold text-white" 
                        id="serahkan-btn" 
                        onClick={() => handleSerahkanObat()}
                        style={{ background: '#166534' }}
                      >
                        ✔️ Serahkan Obat &amp; Selesaikan
                      </button>
                    </div>
                  ) : (
                    <button 
                      type="button"
                      className="sb-approve bg-slate-400 font-extrabold text-white cursor-not-allowed" 
                      disabled
                      style={{ background: '#64748b' }}
                    >
                      ✔️ Resep Selesai &amp; Diserahkan
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-28 text-slate-400 font-bold text-xs bg-slate-50/50 dark:bg-slate-950/20 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
                Silakan pilih salah satu nama pasien di antrean panel kiri untuk memuat lembar resep obat.
              </div>
            )}
          </div>
        </div>

        {/* ================= SUBSTITUTION MODAL ================= */}
        {substitutionModalOpen && activeResep && (
          <div className="change-modal">
            <div className="modal-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10">
              <div className="modal-hdr border-b border-slate-100 dark:border-white/5">
                <span className="modal-title text-slate-800 dark:text-white" id="modal-title">
                  Ganti Produk — {(() => {
                    const item = activeResep.kunjungan?.resep?.[0]?.resep_item?.[subTargetIdx];
                    return item ? (item.nama_obat || item.master_obat?.nama_produk_lengkap || 'Obat') : 'Obat';
                  })()}
                </span>
                <span className="modal-close text-slate-400 hover:text-slate-600 font-bold text-xl" onClick={() => setSubstitutionModalOpen(false)}>×</span>
              </div>
              <div className="modal-body">
                <div>
                  <div className="modal-label">Pilih produk pengganti</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }} id="modal-options">
                    {(() => {
                      if (subTargetIdx < 0) return null;
                      const item = activeResep.kunjungan?.resep?.[0]?.resep_item?.[subTargetIdx];
                      const isBpjsPatient = activeResep.rencana_terapi_plan?.includes('BPJS');
                      const { allCandidates } = mapPrescriptionItemToProducts(item, isBpjsPatient);
                      
                      if (allCandidates.length === 0) {
                        return <div className="text-xs text-slate-400 py-2">Tidak ada produk sejenis di database.</div>;
                      }
                      
                      return allCandidates.map((cand: any) => {
                        const isSelected = selectedAltProduct?.id === cand.id;
                        const isLowStok = cand.totalStock < (item?.jumlah || 1);
                        const isExp = cand.isExpiredOrSoon;
                        const canSelect = !isLowStok && !isExp;
                        
                        return (
                          <div 
                            key={cand.id}
                            className={`alt-option border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-950 flex justify-between items-center transition-all ${isSelected ? 'selected' : ''}`}
                            style={!canSelect ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                            onClick={() => canSelect && setSelectedAltProduct(cand)}
                          >
                            <div className="ao-radio"><div className="ao-dot" style={{ display: isSelected ? 'block' : 'none' }}></div></div>
                            <div className="ao-info text-left">
                              <div className="ao-name text-slate-800 dark:text-white">{cand.nama_produk_lengkap || cand.nama_dagang}</div>
                              <div className="ao-detail text-slate-500 dark:text-slate-400">
                                Stok: {cand.totalStock} tablet &middot; Exp: {cand.obat_stok?.[0]?.expired_date ? new Date(cand.obat_stok[0].expired_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short' }) : '—'}
                              </div>
                              <div className="ao-badges">
                                <span className={`mr-badge ${cand.is_bpjs ? 'mrb-bpjs' : 'mrb-paten'}`}>{cand.is_bpjs ? 'BPJS' : 'Paten'}</span>
                                <span className="mr-badge mrb-generik">{cand.tipe_produk === 'generik' ? 'Generik' : 'Paten'}</span>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
                <div>
                  <div className="modal-label">Alasan penggantian (wajib dicatat)</div>
                  <textarea 
                    className="modal-reason bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white border border-slate-200 dark:border-white/10" 
                    placeholder="Contoh: stok produk utama habis, diganti produk setara..."
                    value={subReason}
                    onChange={e => setSubReason(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer border-t border-slate-100 dark:border-white/5">
                <button className="mf-cancel border border-slate-200 dark:border-white/10 text-slate-500" onClick={() => setSubstitutionModalOpen(false)}>Batal</button>
                <button className="mf-save bg-red-650 hover:bg-red-700 text-white font-extrabold" onClick={handleApplySubstitution}>Simpan Penggantian</button>
              </div>
            </div>
          </div>
        )}

        {/* ================= DELETE RESEP ORDER MODAL ================= */}
        {deleteModalOpen && activeResep && (
          <div className="change-modal">
            <div className="modal-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10">
              <div className="modal-hdr border-b border-slate-100 dark:border-white/5">
                <span className="modal-title text-slate-800 dark:text-white font-extrabold text-sm flex items-center gap-1.5">
                  <span>🗑️ Batalkan / Hapus Order Resep</span>
                </span>
                <span className="modal-close text-slate-400 hover:text-slate-600 font-bold text-xl cursor-pointer" onClick={() => setDeleteModalOpen(false)}>×</span>
              </div>
              <div className="modal-body">
                <div className="text-xs text-rose-600 dark:text-rose-400 leading-relaxed font-extrabold bg-rose-50 dark:bg-rose-950/20 p-3 rounded-lg border border-rose-200 dark:border-rose-900/30">
                  Tindakan ini akan menghapus data sediaan resep order #{activeResep.kunjungan?.resep?.[0]?.no_resep || ''} dari antrean farmasi apotek secara permanen di database. Pastikan konfirmasi alasan pembatalan ini!
                </div>
                <div>
                  <div className="modal-label">Alasan pembatalan / penghapusan resep (Wajib) *</div>
                  <textarea 
                    className="modal-reason bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white border border-slate-200 dark:border-white/10" 
                    placeholder="mis. Dokter membatalkan order resep, kesalahan dosis, pasien menolak mengambil obat..."
                    value={deleteReason}
                    onChange={e => setDeleteReason(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer border-t border-slate-100 dark:border-white/5">
                <button className="mf-cancel border border-slate-200 dark:border-white/10 text-slate-500" onClick={() => setDeleteModalOpen(false)}>Batal</button>
                <button className="mf-save bg-rose-650 hover:bg-rose-700 text-white font-extrabold" onClick={handleDeleteOrder}>Hapus Resep Sekarang</button>
              </div>
            </div>
          </div>
        )}

        {/* AUDIT LOGS DISPLAY */}
        {auditLogs.length > 0 && (
          <div style={{ background: '#1E293B', border: '0.5px solid var(--border)', borderRadius: '8px', padding: '14px', marginTop: '16px', color: '#F1F5F9', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '0.5px solid #475569', paddingBottom: '6px', marginBottom: '8px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8' }}>
              <span>📋</span>
              <span>Live Audit Log — Transaksi & Pembatalan Resep</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: 'var(--mono)', fontSize: '10.5px' }}>
              {auditLogs.map((log, index) => (
                <div key={index} style={{ background: '#0F172A', border: '0.5px solid #334155', padding: '8px 10px', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#64748B', marginBottom: '4px' }}>
                    <span>⏱️ {log.timestamp}</span>
                    <span style={{ color: '#FCA5A5', border: '0.5px solid #7F1D1D', background: '#450A0A', padding: '0 4px', borderRadius: '3px', fontWeight: 'bold' }}>AUDIT SECURE</span>
                  </div>
                  <div>
                    <strong>Pasien:</strong> {log.pasien} | <strong>Resep Asal:</strong> {log.resepItem}
                  </div>
                  <div style={{ marginTop: '2px' }}>
                    🚫 <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>{log.dariObat}</span> ➔ 🟢 <span style={{ color: '#86EFAC', fontWeight: 'bold' }}>{log.keObat}</span>
                  </div>
                  <div style={{ marginTop: '3px', color: '#F8FAFC' }}>
                    <strong>Alasan:</strong> &quot;{log.alasan}&quot; &bull; Apoteker: {log.apoteker}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MasterLayout>
  );
}