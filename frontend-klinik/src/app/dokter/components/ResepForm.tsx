import React, { useState, useEffect, useRef } from 'react';
import { API_URL } from '@/lib/api';

// Static default medicines fallback if backend is offline or loading
const DEFAULT_MEDS = [
  { id: 'amox-500-gen', zat: 'Amoxicillin', dosis: '500mg', rute: 'oral', freq: '3x1', tipe: 'generik', stok: true, bpjs: true, produk: 'Amoxicillin 500mg — Generik BPJS' },
  { id: 'amox-500-pat', zat: 'Amoxicillin', dosis: '500mg', rute: 'oral', freq: '3x1', tipe: 'paten', stok: true, bpjs: false, produk: 'Amoxan 500mg — Sanbe' },
  { id: 'amlo-5-gen', zat: 'Amlodipine', dosis: '5mg', rute: 'oral', freq: '1x1', tipe: 'generik', stok: true, bpjs: true, produk: 'Amlodipine 5mg — Generik BPJS' },
  { id: 'amlo-10-gen', zat: 'Amlodipine', dosis: '10mg', rute: 'oral', freq: '1x1', tipe: 'generik', stok: true, bpjs: true, produk: 'Amlodipine 10mg — Generik BPJS' },
  { id: 'metf-500-gen', zat: 'Metformin HCl', dosis: '500mg', rute: 'oral', freq: '2x1', tipe: 'generik', stok: true, bpjs: true, produk: 'Metformin 500mg — Generik BPJS' },
  { id: 'metf-850-gen', zat: 'Metformin HCl', dosis: '850mg', rute: 'oral', freq: '2x1', tipe: 'generik', stok: true, bpjs: true, produk: 'Metformin 850mg — Generik BPJS' },
  { id: 'ator-20-gen', zat: 'Atorvastatin', dosis: '20mg', rute: 'oral', freq: '1x1', tipe: 'generik', stok: true, bpjs: true, produk: 'Atorvastatin 20mg — Generik BPJS' },
  { id: 'capt-12-gen', zat: 'Captopril', dosis: '12.5mg', rute: 'oral', freq: '2x1', tipe: 'generik', stok: true, bpjs: true, produk: 'Captopril 12.5mg — Generik BPJS' },
  { id: 'omep-20-gen', zat: 'Omeprazole', dosis: '20mg', rute: 'oral', freq: '1x1', tipe: 'generik', stok: true, bpjs: true, produk: 'Omeprazole 20mg — Generik BPJS' },
  { id: 'pct-500-gen', zat: 'Paracetamol', dosis: '500mg', rute: 'oral', freq: '3x1', tipe: 'generik', stok: true, bpjs: true, produk: 'Paracetamol 500mg — Generik BPJS' },
  { id: 'pct-500-pat', zat: 'Paracetamol', dosis: '500mg', rute: 'oral', freq: '3x1', tipe: 'paten', stok: true, bpjs: false, produk: 'Sanamol 500mg — Sanbe' },
  { id: 'mtx-25-gen', zat: 'Methotrexate', dosis: '25mg', rute: 'oral', freq: '1xSeminggu', tipe: 'generik', stok: true, bpjs: true, produk: 'Methotrexate 25mg — Generik BPJS' }
];

const RUTE_OPTIONS = ['oral', 'sublingual', 'IV', 'IM', 'SC', 'topikal', 'inhalasi', 'suppositoria'];

const FREQ_OPTIONS = [
  '1x1', '2x1', '3x1', '4x1', '1x½', '2x½', '3x½',
  '1-0-1', '1-1-1', '1-0-0', '0-0-1', '1-1-0', '0-1-1', '½-0-½',
  'setiap 8 jam', 'setiap 12 jam', 'setiap 24 jam', 'prn (jika perlu)', 'stat'
];

interface PrescribedDrug {
  id_obat: string;
  nama_obat: string;
  jumlah: number;
  aturan_pakai: string;
  catatan_tambahan: string;
}

interface ResepFormProps {
  prescribedDrugs: PrescribedDrug[];
  setPrescribedDrugs?: (drugs: PrescribedDrug[]) => void;
  activePasien?: any;
  historyKunjungan?: any[];
  selectedObatId?: string;
  setSelectedObatId?: (val: string) => void;
  jumlahObat?: number;
  setJumlahObat?: (val: number) => void;
  aturanPakai?: string;
  setAturanPakai?: (val: string) => void;
  catatanObat?: string;
  setCatatanObat?: (val: string) => void;
  handleAddDrug?: () => void;
  handleRemoveDrug?: (id: string) => void;
}

interface RowItem {
  id: string;
  zat: string;
  dosis: string;
  rute: string;
  freq: string;
  dur: string;
  jml: string;
  catatan: string;
  flag: 'ok' | 'warn' | 'danger';
  flagMsg: string;
  dbItem: any | null;
}

interface RacikanBahan {
  id: string;
  zat: string;
  dosis: string; // can be number or empty string
  satuan: string;
  notasi: string;
  dbItem: any | null;
}

export default function ResepForm({
  prescribedDrugs,
  setPrescribedDrugs,
  activePasien,
  historyKunjungan = []
}: ResepFormProps) {
  // Modes: 'standar' = Standard prescription grid, 'racikan' = Compounded prescription, 'riwayat' = History
  const [resepMode, setResepMode] = useState<'standar' | 'racikan' | 'riwayat'>('standar');

  const [masterObatDb, setMasterObatDb] = useState<any[]>(DEFAULT_MEDS);
  
  // ==================== STATE: RESEP STANDAR ====================
  const [rows, setRows] = useState<RowItem[]>([]);
  const [focusedRow, setFocusedRow] = useState<number>(-1);
  const [focusedCol, setFocusedCol] = useState<number>(-1);
  
  // Autocomplete state
  const [acOpenRow, setAcOpenRow] = useState<number>(-1);
  const [acOpenType, setAcOpenType] = useState<'standar' | 'racikan' | null>(null);
  const [acResults, setAcResults] = useState<any[]>([]);
  const [acIndex, setAcIndex] = useState<number>(-1);
  const [acQuery, setAcQuery] = useState<string>('');

  const cellRefs = useRef<{ [key: string]: HTMLInputElement | HTMLSelectElement | null }>({});
  const bahanCellRefs = useRef<{ [key: string]: HTMLInputElement | HTMLSelectElement | null }>({});

  // ==================== STATE: RESEP RACIKAN ====================
  const [namaRacikan, setNamaRacikan] = useState<string>('');
  const [jenisSediaan, setJenisSediaan] = useState<string>('');
  const [jumlahBungkus, setJumlahBungkus] = useState<number | ''>('');
  const [bbPasien, setBbPasien] = useState<number | ''>('');
  const [dosisPerPemberian, setDosisPerPemberian] = useState<number | ''>('');
  
  const [bahanList, setBahanList] = useState<RacikanBahan[]>([]);

  const [racikanFreq, setRacikanFreq] = useState<string>('');
  const [racikanWaktu, setRacikanWaktu] = useState<string>('');
  const [racikanCara, setRacikanCara] = useState<string>('');
  const [racikanCatatan, setRacikanCatatan] = useState<string>('');
  const [showNotasiLegend, setShowNotasiLegend] = useState<boolean>(false);

  // Fetch Real Master Obat from database bridge on mount
  useEffect(() => {
    const fetchRealMasterObat = async () => {
      try {
        const res = await fetch(`${API_URL}/resep/master-obat`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const mapped = data.map((item: any) => ({
              id: item.id,
              zat: item.zat_aktif?.nama_generik || item.nama_dagang,
              dosis: item.kekuatan_dosis || '',
              rute: item.rute_pemberian || 'oral',
              freq: item.zat_aktif?.frekuensi_default || '1x1',
              tipe: item.tipe_produk === 'paten' ? 'paten' : 'generik',
              stok: (item.obat_stok?.reduce((acc: number, s: any) => acc + (s.stok_tersedia ?? 0), 0) ?? 0) > 0,
              bpjs: item.is_bpjs,
              produk: item.nama_produk_lengkap || item.nama_dagang,
              rawZat: item.zat_aktif
            }));
            setMasterObatDb(mapped);
          }
        }
      } catch (err) {
        console.error('Gagal fetch master obat, menggunakan fallback offline:', err);
      }
    };
    fetchRealMasterObat();
  }, []);

  // Initialize standard prescription grid rows
  useEffect(() => {
    if (rows.length === 0) {
      if (prescribedDrugs && prescribedDrugs.length > 0) {
        // Separate standard items from any compounded items
        const standardOnly = prescribedDrugs.filter(d => !d.nama_obat.startsWith('R/ '));
        const compoundedOnly = prescribedDrugs.find(d => d.nama_obat.startsWith('R/ '));

        if (standardOnly.length > 0) {
          const mappedRows = standardOnly.map((d, index) => {
            const dbItem = masterObatDb.find(o => o.id === d.id_obat || o.produk.toLowerCase().includes(d.nama_obat.toLowerCase()));
            return {
              id: d.id_obat || `row-${Date.now()}-${index}`,
              zat: d.nama_obat,
              dosis: dbItem?.dosis || '',
              rute: dbItem?.rute || 'oral',
              freq: d.aturan_pakai || '1x1',
              dur: '10', // Default duration
              jml: d.jumlah?.toString() || '',
              catatan: d.catatan_tambahan || '',
              flag: 'ok' as const,
              flagMsg: '',
              dbItem: dbItem || null
            };
          });
          setRows(mappedRows);
        } else {
          setRows([
            createEmptyRow(`row-init-1`),
            createEmptyRow(`row-init-2`),
            createEmptyRow(`row-init-3`)
          ]);
        }

        // Hydrate compounded prescription if it exists
        if (compoundedOnly) {
          try {
            const rawName = compoundedOnly.nama_obat; // e.g. R/ Puyer Racikan (Puyer / Serbuk — 10 unit)
            const sedMatch = rawName.match(/R\/ Puyer Racikan \((.*?) —/);
            if (sedMatch && sedMatch[1]) setJenisSediaan(sedMatch[1]);
            
            setJumlahBungkus(compoundedOnly.jumlah || 10);

            // Parse detailed notes to extract BB, Dosis, Cara, and Bahan
            const notes = compoundedOnly.catatan_tambahan || '';
            const bbMatch = notes.match(/BB Pasien:\s*(\d+)/);
            if (bbMatch && bbMatch[1]) setBbPasien(parseInt(bbMatch[1]));

            const dosMatch = notes.match(/Dosis Pemberian:\s*(\d+)/);
            if (dosMatch && dosMatch[1]) setDosisPerPemberian(parseInt(dosMatch[1]));

            const instMatch = notes.match(/Instruksi:\n([\s\S]*)/);
            if (instMatch && instMatch[1]) setRacikanCatatan(instMatch[1].trim());

            // Extract rules for freq, cara, waktu
            const rules = compoundedOnly.aturan_pakai || '';
            const parts = rules.split(' ');
            if (parts[0]) setRacikanFreq(parts[0]);
            
            const timingText = rules.includes('Setelah makan') ? 'Setelah makan' : rules.includes('Sebelum makan') ? 'Sebelum makan' : 'Bebas';
            setRacikanWaktu(timingText);

            const caraMatch = rules.match(/\((.*?)\)/);
            if (caraMatch && caraMatch[1]) setRacikanCara(caraMatch[1]);

            // Reconstruct bahanList from notes
            const bahanBlock = notes.match(/Bahan:\n([\s\S]*?)(?:\n\nInstruksi:|$)/);
            if (bahanBlock && bahanBlock[1]) {
              const lines = bahanBlock[1].split('\n').filter(Boolean);
              const mappedBahan = lines.map((line, idx) => {
                // e.g. 1. Amoxicillin 125 mg -> Total: 1250 mg
                // or 4. Lactosa (pengisi) [qs] -> Total: qs (auto)
                const namePart = line.replace(/^\d+\.\s*/, '').split('->')[0].trim();
                const cleanName = namePart.replace(/\s\d+.*?$/, '').replace(/\[.*?\]$/, '').trim();
                const doseMatch = namePart.match(/(\d+(?:\.\d+)?)\s*(\w+)/);
                const isQs = namePart.includes('[qs]') || namePart.includes('qs');
                
                return {
                  id: `b-load-${idx}-${Date.now()}`,
                  zat: cleanName,
                  dosis: isQs ? '' : (doseMatch ? doseMatch[1] : ''),
                  satuan: isQs ? 'qs' : (doseMatch ? doseMatch[2] : 'mg'),
                  notasi: isQs ? 'qs' : '',
                  dbItem: null
                };
              });
              if (mappedBahan.length > 0) setBahanList(mappedBahan);
            }
          } catch (e) {
            console.error('Gagal memparsing resep racikan:', e);
          }
        }
      } else {
        // Start with 3 empty standard rows
        setRows([
          createEmptyRow(`row-init-1`),
          createEmptyRow(`row-init-2`),
          createEmptyRow(`row-init-3`)
        ]);
      }
    }
  }, [prescribedDrugs, masterObatDb]);



  const createEmptyRow = (id?: string) => ({
    id: id || `row-${Date.now()}-${Math.random()}`,
    zat: '',
    dosis: '',
    rute: 'oral',
    freq: '',
    dur: '',
    jml: '',
    catatan: '',
    flag: 'ok' as const,
    flagMsg: '',
    dbItem: null
  });

  // ==================== UNIFIED SYNCHRONIZATION BACK TO PORTAL ====================
  const syncToParent = (
    standardRows: RowItem[], 
    currentBahan?: RacikanBahan[], 
    currentSediaan?: string, 
    currentJml?: number, 
    currentFreq?: string, 
    currentWaktu?: string, 
    currentCara?: string, 
    currentNotes?: string, 
    currentBb?: number, 
    currentDosisPemberian?: number,
    currentNamaRacikan?: string
  ) => {
    if (!setPrescribedDrugs) return;

    // 1. Process Standard Prescription Items
    const filledStandard = standardRows.filter(r => r.zat.trim() !== '');
    const mappedStandard = filledStandard.map(r => ({
      id_obat: r.dbItem?.id || r.id,
      nama_obat: r.zat,
      jumlah: parseInt(r.jml) || 0,
      aturan_pakai: r.freq,
      catatan_tambahan: r.catatan
    }));

    // 2. Process Compounded Recipe Items
    const activeBahan = currentBahan || bahanList;
    const filledBahan = activeBahan.filter(b => b.zat.trim() !== '');

    if (filledBahan.length > 0) {
      const sediaan = currentSediaan || jenisSediaan;
      const jmlBungkus = currentJml !== undefined ? currentJml : jumlahBungkus;
      const freq = currentFreq || racikanFreq;
      const waktu = currentWaktu || racikanWaktu;
      const cara = currentCara || racikanCara;
      const notes = currentNotes || racikanCatatan;
      const bb = currentBb !== undefined ? currentBb : bbPasien;
      const dPemberian = currentDosisPemberian !== undefined ? currentDosisPemberian : dosisPerPemberian;
      const name = currentNamaRacikan !== undefined ? currentNamaRacikan : namaRacikan;

      const nameRx = `R/ ${name || 'Puyer Racikan'} (${sediaan} — ${jmlBungkus} unit)`;
      const ruleRx = `${freq} ${waktu} (${cara})`;

      // Serialize ingredients beautifully
      const bahanDetails = filledBahan.map((b, idx) => {
        const notasiStr = b.notasi ? ` [${b.notasi}]` : '';
        const rawDose = parseFloat(b.dosis) || 0;
        const totalStr = b.notasi === 'qs' ? 'qs (auto)' : `${(rawDose * jmlBungkus).toLocaleString('id-ID')} ${b.satuan}`;
        return `${idx + 1}. ${b.zat} ${b.dosis ? `${b.dosis} ${b.satuan}` : ''}${notasiStr} -> Total: ${totalStr}`;
      }).join('\n');

      const catatanTambahan = `BB Pasien: ${bb} kg\nDosis Pemberian: ${dPemberian} unit\n\nBahan:\n${bahanDetails}\n\nInstruksi:\n${notes}`;

      mappedStandard.push({
        id_obat: 'custom-racikan-uuid-placeholder', // Optional UUID indicator
        nama_obat: nameRx,
        jumlah: jmlBungkus,
        aturan_pakai: ruleRx,
        catatan_tambahan: catatanTambahan
      });
    }

    setPrescribedDrugs(mappedStandard);
  };

  // ==================== ADVANCED CLINICAL PARSING & RULES ====================
  const parseAturanPakai = (input: string): { normalized: string; multiplier: number } => {
    if (!input || !input.trim()) return { normalized: '', multiplier: 0 };
    
    let clean = input.toLowerCase().trim();
    clean = clean.replace(/\./g, '');
    clean = clean.replace(/\s+/g, ' ');

    // Rule A: XYZ Indonesian patterns
    const polaRegex = /^(\d|½|1\/2)-(\d|½|1\/2)-(\d|½|1\/2)(?:-(\d|½|1\/2))?$/;
    if (polaRegex.test(clean)) {
      const match = clean.match(polaRegex);
      if (match) {
        const parts = match.slice(1).filter(Boolean).map(val => {
          if (val === '½' || val === '1/2') return 0.5;
          return parseFloat(val) || 0;
        });

        const multiplier = parts.reduce((acc, curr) => acc + curr, 0);
        let normalized = '';
        if (clean === '1-0-1') normalized = '2x1 (pagi & malam)';
        else if (clean === '1-0-0') normalized = '1x1 (pagi)';
        else if (clean === '0-0-1') normalized = '1x1 (malam)';
        else if (clean === '1-1-1') normalized = '3x1 (pagi, siang, malam)';
        else if (clean === '1-1-0') normalized = '2x1 (pagi & siang)';
        else if (clean === '0-1-1') normalized = '2x1 (siang & malam)';
        else if (clean === '½-0-½' || clean === '1/2-0-1/2') normalized = '2x½ (pagi & malam)';
        else if (clean === '1-0-½' || clean === '1-0-1/2') normalized = 'pagi 1, malam ½';
        else if (clean === '2-1-2') normalized = 'pagi 2, siang 1, malam 2';
        else if (clean === '1-1-1-1') normalized = '4x1 (tiap 6 jam)';
        else {
          normalized = `${parts.length}x per hari (${clean})`;
        }
        return { normalized, multiplier };
      }
    }

    // Rule B: Latin Token Map
    let multiplier = 1;
    let timing = '';

    if (clean.includes('3x1') || clean.includes('tds') || clean.includes('ter die sumendus') || clean.includes('tid')) {
      multiplier = 3;
    } else if (clean.includes('2x1') || clean.includes('bid') || clean.includes('bis die') || clean.includes('bd')) {
      multiplier = 2;
    } else if (clean.includes('4x1') || clean.includes('qid') || clean.includes('quater in die')) {
      multiplier = 4;
    } else if (clean.includes('1x1') || clean.includes('od') || clean.includes('omni die') || clean.includes('once daily')) {
      multiplier = 1;
    } else if (clean.includes('1x½') || clean.includes('1x1/2')) {
      multiplier = 0.5;
    } else if (clean.includes('2x½') || clean.includes('2x1/2')) {
      multiplier = 1;
    } else if (clean.includes('3x½') || clean.includes('3x1/2')) {
      multiplier = 1.5;
    } else if (clean.includes('setiap 8 jam') || clean.includes('q8h')) {
      multiplier = 3;
    } else if (clean.includes('setiap 12 jam') || clean.includes('q12h')) {
      multiplier = 2;
    } else if (clean.includes('setiap 4 jam') || clean.includes('q4h')) {
      multiplier = 6;
    } else if (clean.includes('setiap 6 jam') || clean.includes('q6h')) {
      multiplier = 4;
    } else if (clean.includes('prn') || clean.includes('sos') || clean.includes('bila perlu') || clean.includes('kalau perlu')) {
      multiplier = 0;
    } else if (clean.includes('stat') || clean.includes('segera')) {
      multiplier = 1;
    } else if (clean.includes('hs') || clean.includes('hora somni') || clean.includes('sebelum tidur') || clean.includes('nocte')) {
      multiplier = 1;
      timing = 'sebelum tidur';
    } else if (clean.includes('mane') || clean.includes('pagi')) {
      multiplier = 1;
      timing = 'pagi';
    }

    if (clean.includes('ac') || clean.includes('ante cibum') || clean.includes('sebelum makan')) {
      timing = 'sebelum makan';
    } else if (clean.includes('pc') || clean.includes('post cibum') || clean.includes('setelah makan') || clean.includes('sesudah makan') || clean.includes('makan')) {
      timing = 'setelah makan';
    }

    let normalized = '';
    const multiplierStr = multiplier === 0.5 ? '1x½' : multiplier === 1.5 ? '3x½' : `${multiplier}x1`;
    
    if (multiplier === 0) {
      normalized = `prn (${timing || 'jika perlu'})`;
    } else if (clean.includes('setiap') || clean.includes('q4h') || clean.includes('q6h') || clean.includes('q8h') || clean.includes('q12h')) {
      normalized = clean.includes('8') ? '3x1 (tiap 8 jam)' : clean.includes('12') ? '2x1 (tiap 12 jam)' : clean.includes('6') ? '4x1 (tiap 6 jam)' : clean;
    } else if (clean.includes('seminggu') || clean.includes('weekly')) {
      normalized = '1xSeminggu';
      multiplier = 0.14;
    } else {
      normalized = `${multiplierStr}${timing ? ` (${timing})` : ''}`;
    }

    return { normalized, multiplier };
  };

  const autoCalcJml = (freqInput: string, durInput: string): string => {
    if (!freqInput || !durInput) return '';
    const { multiplier } = parseAturanPakai(freqInput);
    const days = parseInt(durInput) || 0;
    if (multiplier === 0 || days === 0) return '';
    const total = Math.ceil(multiplier * days);
    return `${total} tab`;
  };

  // ==================== WORKSTATION STANDARD GRID CALCS & CDSS ====================
  const runRowCalculations = (row: RowItem, index: number, updatedRows: RowItem[]) => {
    const newJml = autoCalcJml(row.freq, row.dur);
    row.jml = newJml;

    const isPatientAllergic = activePasien?.kunjungan?.asesmen_keperawatan?.[0]?.alergi_obat?.toLowerCase().includes('penisilin') ||
                              activePasien?.kunjungan?.asesmen_keperawatan?.[0]?.alergi_obat?.toLowerCase().includes('penicillin');
    
    row.flag = 'ok';
    row.flagMsg = '';

    if (row.zat && isPatientAllergic) {
      const lowerZat = row.zat.toLowerCase();
      if (lowerZat.includes('amoxicillin') || lowerZat.includes('ampicillin') || lowerZat.includes('penisilin') || lowerZat.includes('penicillin')) {
        row.flag = 'danger';
        row.flagMsg = 'Pasien alergi Penisilin — waspadai bahaya cross-reactivity dengan antibiotik Beta-Lactam!';
      }
    }

    if (row.zat && row.flag !== 'danger') {
      updatedRows.forEach((otherRow, otherIndex) => {
        if (index !== otherIndex && otherRow.zat) {
          const zA = row.zat.toLowerCase();
          const zB = otherRow.zat.toLowerCase();

          if ((zA.includes('amox') && zB.includes('metho')) || (zA.includes('metho') && zB.includes('amox'))) {
            row.flag = 'danger';
            row.flagMsg = 'Major Interaction: Amoxicillin menurunkan ekskresi ginjal dari Methotrexate, risiko supresi sumsum tulang belakang / hepatotoksisitas fatal!';
          } else if ((zA.includes('amlo') && zB.includes('capto')) || (zA.includes('capto') && zB.includes('amlo'))) {
            row.flag = row.flag === 'danger' ? 'danger' : 'warn';
            row.flagMsg = 'Moderate Interaction: Kombinasi antihipertensi ganda — pantau TD secara ketat, waspadai risiko hipotensi berat.';
          } else if ((zA.includes('ator') && zB.includes('amlo')) || (zA.includes('amlo') && zB.includes('ator'))) {
            row.flag = row.flag === 'danger' ? 'danger' : 'warn';
            row.flagMsg = 'Moderate Interaction: Amlodipine dapat meningkatkan paparan sistemik Atorvastatin — batasi dosis Atorvastatin maks 20mg/hari.';
          } else if ((zA.includes('metf') && zB.includes('metho')) || (zA.includes('metho') && zB.includes('metf'))) {
            row.flag = row.flag === 'danger' ? 'danger' : 'warn';
            row.flagMsg = 'Minor Interaction: Keduanya dieliminasi di ginjal — pantau laju eGFR ginjal secara berkala.';
          }
        }
      });
    }

    const nextRows = [...updatedRows];
    nextRows[index] = row;
    setRows(nextRows);
    syncToParent(nextRows);
  };

  const handleCellChange = (index: number, field: keyof RowItem, val: string) => {
    const nextRows = [...rows];
    const row = { ...nextRows[index] };
    
    if (field === 'freq') {
      row.freq = val;
      const { normalized } = parseAturanPakai(val);
      row.catatan = normalized ? `Normalisasi: ${normalized}` : '';
    } else {
      (row as any)[field] = val;
    }

    nextRows[index] = row;
    setRows(nextRows);
    runRowCalculations(row, index, nextRows);
  };

  // Keyboard Navigation Events
  const handleKeyDown = (e: React.KeyboardEvent, index: number, col: number) => {
    const isAcOpen = acOpenRow === index && acOpenType === 'standar';
    const cols = [1, 2, 3, 4, 5, 7];

    if (isAcOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setAcIndex(prev => Math.min(prev + 1, acResults.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setAcIndex(prev => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        if (acIndex >= 0 && acResults[acIndex]) {
          e.preventDefault();
          selectAutocompleteItem(index, acResults[acIndex]);
          return;
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setAcOpenRow(-1);
        setAcOpenType(null);
        return;
      }
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const colIndex = cols.indexOf(col);
      if (e.shiftKey) {
        if (colIndex > 0) {
          focusCell(index, cols[colIndex - 1]);
        } else if (index > 0) {
          focusCell(index - 1, cols[cols.length - 1]);
        }
      } else {
        if (colIndex < cols.length - 1) {
          focusCell(index, cols[colIndex + 1]);
        } else {
          if (index < rows.length - 1) {
            focusCell(index + 1, cols[0]);
          } else {
            addNewRow();
          }
        }
      }
      return;
    }

    if (e.key === 'Enter' && !isAcOpen) {
      e.preventDefault();
      if (index < rows.length - 1) {
        focusCell(index + 1, 1);
      } else {
        addNewRow();
      }
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault();
      const targetRow = { ...rows[index] };
      const duplicatedRow: RowItem = {
        ...targetRow,
        id: `row-${Date.now()}-${Math.random()}`,
        flag: 'ok',
        flagMsg: ''
      };
      const nextRows = [...rows];
      nextRows.splice(index + 1, 0, duplicatedRow);
      setRows(nextRows);
      syncToParent(nextRows);
      setTimeout(() => {
        focusCell(index + 1, 1);
      }, 50);
      return;
    }

    if (e.key === 'Delete' && col === 1 && !rows[index].zat.trim()) {
      e.preventDefault();
      removeRow(index);
      return;
    }
  };

  const focusCell = (r: number, c: number) => {
    setFocusedRow(r);
    setFocusedCol(c);
    const targetKey = `${r}-${c}`;
    const inp = cellRefs.current[targetKey];
    if (inp) {
      inp.focus();
      if ('select' in inp) {
        inp.select();
      }
    }
  };

  const addNewRow = (initialData?: Partial<RowItem>) => {
    const newRow = {
      ...createEmptyRow(),
      ...initialData
    };
    const nextRows = [...rows, newRow];
    setRows(nextRows);
    syncToParent(nextRows);
    
    const newIndex = nextRows.length - 1;
    setTimeout(() => {
      focusCell(newIndex, 1);
    }, 50);
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    const nextRows = rows.filter((_, i) => i !== index);
    setRows(nextRows);
    syncToParent(nextRows);
    setAcOpenRow(-1);
    setAcOpenType(null);

    const targetIndex = index > 0 ? index - 1 : 0;
    setTimeout(() => {
      focusCell(targetIndex, 1);
    }, 50);
  };

  // Standard Autocomplete Query Matching
  const handleZatInput = (index: number, val: string) => {
    handleCellChange(index, 'zat', val);
    setAcQuery(val);

    if (!val || val.trim().length < 2) {
      setAcOpenRow(-1);
      setAcOpenType(null);
      return;
    }

    const q = val.toLowerCase();
    const matches = masterObatDb.filter(o =>
      o.zat.toLowerCase().includes(q) || o.produk.toLowerCase().includes(q)
    );

    setAcResults(matches);
    setAcIndex(matches.length > 0 ? 0 : -1);
    setAcOpenRow(matches.length > 0 ? index : -1);
    setAcOpenType(matches.length > 0 ? 'standar' : null);
  };

  const selectAutocompleteItem = (index: number, item: any) => {
    const nextRows = [...rows];
    const row = { ...nextRows[index] };
    
    row.zat = `${item.zat} ${item.dosis}`;
    row.dosis = item.dosis;
    row.rute = item.rute;
    row.freq = item.freq;
    row.dbItem = item;
    
    const { normalized } = parseAturanPakai(item.freq);
    row.catatan = normalized ? `Normalisasi: ${normalized}` : '';

    nextRows[index] = row;
    setRows(nextRows);
    setAcOpenRow(-1);
    setAcOpenType(null);
    runRowCalculations(row, index, nextRows);

    setTimeout(() => {
      focusCell(index, 4);
    }, 50);
  };

  // Carry over past prescription
  const handleCopyPrevPrescription = () => {
    if (historyKunjungan.length <= 1) return;
    const lastVisit = historyKunjungan[1];
    const lastItems = lastVisit?.resep?.[0]?.resep_item;
    if (!lastItems || lastItems.length === 0) return;

    const mapped = lastItems.map((item: any, idx: number) => {
      const dbItem = masterObatDb.find(o => o.id === item.id_obat);
      const name = dbItem ? dbItem.produk : (item.master_obat?.nama_produk_lengkap || 'Obat Medis');
      return {
        id: item.id_obat || `prev-row-${Date.now()}-${idx}`,
        zat: name,
        dosis: dbItem?.dosis || item.master_obat?.kekuatan_dosis || '',
        rute: dbItem?.rute || item.master_obat?.rute_pemberian || 'oral',
        freq: item.aturan_pakai || '1x1',
        dur: '30',
        jml: item.jumlah?.toString() || '',
        catatan: item.catatan_tambahan || '',
        flag: 'ok' as const,
        flagMsg: '',
        dbItem: dbItem || null
      };
    });

    setRows(mapped);
    syncToParent(mapped);
    setTimeout(() => {
      focusCell(0, 1);
    }, 100);
  };

  // ==================== WORKSTATION COMPOUNDING (RACIKAN) LOGIC ====================
  const focusBahanCell = (r: number, c: number) => {
    const key = `bahan-${r}-${c}`;
    const el = bahanCellRefs.current[key];
    if (el) {
      el.focus();
      if ('select' in el) el.select();
    }
  };

  const handleAddBahan = () => {
    const newB = {
      id: `b-racik-${Date.now()}-${Math.random()}`,
      zat: '',
      dosis: '',
      satuan: 'mg',
      notasi: '',
      dbItem: null
    };
    const nextBahan = [...bahanList, newB];
    setBahanList(nextBahan);
    syncToParent(rows, nextBahan);
    const newIdx = nextBahan.length - 1;
    setTimeout(() => focusBahanCell(newIdx, 0), 50);
  };

  const handleRemoveBahan = (idx: number) => {
    if (bahanList.length <= 1) return;
    const nextBahan = bahanList.filter((_, i) => i !== idx);
    setBahanList(nextBahan);
    syncToParent(rows, nextBahan);
    const targetIdx = idx > 0 ? idx - 1 : 0;
    setTimeout(() => focusBahanCell(targetIdx, 0), 50);
  };

  const handleBahanKeyDown = (e: React.KeyboardEvent, idx: number, col: number) => {
    const isAcOpen = acOpenRow === idx && acOpenType === 'racikan';
    const cols = [0, 1, 2, 3]; // zat, dosis, satuan, notasi

    if (isAcOpen) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setAcIndex(prev => Math.min(prev + 1, acResults.length - 1)); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setAcIndex(prev => Math.max(prev - 1, 0)); return; }
      if (e.key === 'Enter' || e.key === 'Tab') {
        if (acIndex >= 0 && acResults[acIndex]) { e.preventDefault(); selectBahanAutocompleteItem(idx, acResults[acIndex]); return; }
      }
      if (e.key === 'Escape') { e.preventDefault(); setAcOpenRow(-1); setAcOpenType(null); return; }
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const ci = cols.indexOf(col);
      if (e.shiftKey) {
        if (ci > 0) focusBahanCell(idx, cols[ci - 1]);
        else if (idx > 0) focusBahanCell(idx - 1, cols[cols.length - 1]);
      } else {
        if (ci < cols.length - 1) focusBahanCell(idx, cols[ci + 1]);
        else if (idx < bahanList.length - 1) focusBahanCell(idx + 1, cols[0]);
        else handleAddBahan();
      }
      return;
    }

    if (e.key === 'Enter' && !isAcOpen) {
      e.preventDefault();
      if (idx < bahanList.length - 1) focusBahanCell(idx + 1, 0);
      else handleAddBahan();
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault();
      const dup: RacikanBahan = { ...bahanList[idx], id: `b-racik-${Date.now()}-${Math.random()}` };
      const nextBahan = [...bahanList];
      nextBahan.splice(idx + 1, 0, dup);
      setBahanList(nextBahan);
      syncToParent(rows, nextBahan);
      setTimeout(() => focusBahanCell(idx + 1, 0), 50);
      return;
    }

    if (e.key === 'Delete' && col === 0 && !bahanList[idx].zat.trim()) {
      e.preventDefault();
      handleRemoveBahan(idx);
      return;
    }
  };

  const handleBahanCellChange = (idx: number, field: keyof RacikanBahan, val: string) => {
    const nextBahan = [...bahanList];
    const b = { ...nextBahan[idx] };
    (b as any)[field] = val;

    // Custom updates for special notations
    if (field === 'notasi') {
      if (val === 'qs') {
        b.satuan = 'qs';
        b.dosis = '';
      } else if (b.satuan === 'qs') {
        b.satuan = 'mg';
      }
    }

    nextBahan[idx] = b;
    setBahanList(nextBahan);
    syncToParent(rows, nextBahan);
  };

  // Compounding Autocomplete
  const handleBahanZatInput = (idx: number, val: string) => {
    handleBahanCellChange(idx, 'zat', val);
    setAcQuery(val);

    if (!val || val.trim().length < 2) {
      setAcOpenRow(-1);
      setAcOpenType(null);
      return;
    }

    const q = val.toLowerCase();
    const matches = masterObatDb.filter(o =>
      o.zat.toLowerCase().includes(q) || o.produk.toLowerCase().includes(q)
    );

    setAcResults(matches);
    setAcIndex(matches.length > 0 ? 0 : -1);
    setAcOpenRow(matches.length > 0 ? idx : -1);
    setAcOpenType(matches.length > 0 ? 'racikan' : null);
  };

  const selectBahanAutocompleteItem = (idx: number, item: any) => {
    const nextBahan = [...bahanList];
    const b = { ...nextBahan[idx] };
    
    b.zat = item.zat;
    b.dosis = item.dosis ? item.dosis.replace(/[a-zA-Z]/g, '') : '';
    b.satuan = item.dosis ? item.dosis.replace(/[\d\.]/g, '') : 'mg';
    b.dbItem = item;

    nextBahan[idx] = b;
    setBahanList(nextBahan);
    setAcOpenRow(-1);
    setAcOpenType(null);
    syncToParent(rows, nextBahan);
  };

  // ==================== METRICS & ALERTS SUMMARY ====================
  const allWarnings = rows
    .filter(r => r.flag !== 'ok' && r.flagMsg)
    .map(r => ({ level: r.flag, text: r.flagMsg, zat: r.zat }));

  const hasPastPrescription = historyKunjungan.length > 1 && historyKunjungan[1]?.resep?.[0]?.resep_item?.length > 0;

  return (
    <div className="space-y-4.5 animate-fadeIn select-none">
      
      {/* 1-Click Carry Over Banner */}
      {hasPastPrescription && resepMode === 'standar' && (
        <div className="flex justify-between items-center bg-indigo-50/70 dark:bg-slate-900/80 border border-indigo-100 dark:border-indigo-950/30 p-3.5 rounded-2xl animate-pulse">
          <div className="flex items-center gap-2.5 text-xs text-indigo-700 dark:text-indigo-400 font-bold">
            <span className="text-base">✦</span>
            <span>Resep bulan lalu tersedia ({historyKunjungan[1].resep[0].resep_item.length} obat)</span>
          </div>
          <button
            type="button"
            onClick={handleCopyPrevPrescription}
            className="flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:brightness-110 text-white font-extrabold text-[11px] tracking-wide shadow-md active:scale-95 transition-all cursor-pointer"
          >
            Salin resep sebelumnya ↗
          </button>
        </div>
      )}

      {/* MODE SWITCHER: STANDAR VS RACIKAN */}
      <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-white/5">
        <div>
          <h3 className="font-extrabold text-slate-800 dark:text-white text-sm flex items-center gap-2">
            <span>💊 Lembar Resep Digital</span>
            <span className="text-[10px] bg-slate-150 dark:bg-slate-800 text-slate-500 rounded-md px-2 py-0.5 font-bold uppercase tracking-wider">
              {resepMode === 'standar' ? 'Obat Standar' : resepMode === 'racikan' ? 'Racikan' : 'Riwayat Order'}
            </span>
          </h3>
          <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wide">
            {resepMode === 'standar' ? 'Excel-like workstation • Keyboard-first' : resepMode === 'racikan' ? 'Compounding editor • Pediatric & Special mixes' : 'Previous orders audit trail & editor reloader'}
          </p>
        </div>

        {/* Dynamic Preset Color Theme Switcher tabs */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-black">
          <button
            type="button"
            onClick={() => setResepMode('standar')}
            className={`flex items-center gap-1.5 px-4.5 py-2 rounded-lg cursor-pointer transition-all duration-150 ${
              resepMode === 'standar' 
                ? 'bg-white dark:bg-slate-900 text-red-650 dark:text-white shadow-xs' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            💊 Obat Standar
          </button>
          <button
            type="button"
            onClick={() => setResepMode('racikan')}
            className={`flex items-center gap-1.5 px-4.5 py-2 rounded-lg cursor-pointer transition-all duration-150 ${
              resepMode === 'racikan' 
                ? 'bg-white dark:bg-slate-900 text-red-650 dark:text-white shadow-xs' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            🧪 Resep Racikan
          </button>
          <button
            type="button"
            onClick={() => setResepMode('riwayat')}
            className={`flex items-center gap-1.5 px-4.5 py-2 rounded-lg cursor-pointer transition-all duration-150 ${
              resepMode === 'riwayat' 
                ? 'bg-white dark:bg-slate-900 text-red-650 dark:text-white shadow-xs' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            📋 Riwayat Resep
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ==================== WORKSPACE: STANDAR ================ */}
      {/* ======================================================== */}
      {resepMode === 'standar' && (
        <>
          <div className="overflow-visible rounded-2xl border border-slate-200 dark:border-white/10 shadow-3xs bg-white dark:bg-slate-900/30">
            <table className="w-full text-left border-collapse table-fixed select-none">
              <colgroup>
                <col className="w-9" />
                <col className="w-56" />
                <col className="w-24" />
                <col className="w-24" />
                <col className="w-32" />
                <col className="w-20" />
                <col className="w-24" />
                <col className="w-auto" />
                <col className="w-10" />
              </colgroup>
              <thead>
                <tr className="bg-slate-50 dark:bg-[#2D3748] border-b border-slate-200 dark:border-white/5 text-[9.5px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="py-2.5 text-center">#</th>
                  <th className="py-2.5 px-3">Zat aktif / nama obat</th>
                  <th className="py-2.5 px-3">Dosis</th>
                  <th className="py-2.5 px-3">Rute</th>
                  <th className="py-2.5 px-3">Aturan Pakai</th>
                  <th className="py-2.5 px-3">Durasi</th>
                  <th className="py-2.5 px-3">Jml ⚡</th>
                  <th className="py-2.5 px-3">Catatan / Normalisasi</th>
                  <th className="py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const isRowFocused = focusedRow === i;
                  const hasAlert = row.flag !== 'ok';
                  
                  return (
                    <tr 
                      key={row.id}
                      className={`border-b border-slate-100 dark:border-white/5 transition-all text-xs ${
                        row.flag === 'danger' 
                          ? 'bg-rose-50/50 dark:bg-rose-950/20' 
                          : row.flag === 'warn' 
                            ? 'bg-amber-50/30 dark:bg-amber-950/10' 
                            : ''
                      } ${isRowFocused ? 'bg-blue-50/40 dark:bg-slate-800/40' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/10'}`}
                    >
                      <td className="py-1 text-center font-mono font-extrabold text-[10.5px] text-slate-400">
                        {i + 1}
                      </td>

                      <td className={`py-1 px-1.5 relative ${isRowFocused ? 'z-50' : 'z-10'}`}>
                        <div className="w-full relative">
                          <input
                            ref={el => { cellRefs.current[`${i}-1`] = el; }}
                            type="text"
                            placeholder="Ketik nama zat/obat..."
                            value={row.zat}
                            onChange={e => handleZatInput(i, e.target.value)}
                            onKeyDown={e => handleKeyDown(e, i, 1)}
                            onFocus={() => { setFocusedRow(i); setFocusedCol(1); }}
                            className="w-full h-8 px-2 rounded-lg bg-transparent border-0 outline-none text-xs font-bold text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-red-500/20"
                            autoComplete="off"
                          />
                          
                          {acOpenRow === i && acOpenType === 'standar' && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => { setAcOpenRow(-1); setAcOpenType(null); }} />
                              <div className="absolute left-0 top-9 w-85 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl p-2 z-50 max-h-56 overflow-y-auto animate-scale-up">
                                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest px-2 mb-1.5">Master Obat Terdaftar</span>
                                <div className="space-y-1">
                                  {acResults.map((item, idx) => {
                                    const isActive = acIndex === idx;
                                    const hasStock = item.stok;
                                    return (
                                      <div
                                        key={item.id}
                                        onMouseDown={e => { e.preventDefault(); selectAutocompleteItem(i, item); }}
                                        className={`flex items-start justify-between rounded-lg p-2.5 cursor-pointer text-xs transition-all ${
                                          isActive 
                                            ? 'bg-red-50 dark:bg-slate-800 text-red-700 dark:text-white font-extrabold' 
                                            : 'text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                        }`}
                                      >
                                        <div className="min-w-0 flex-1 pr-2">
                                          <h4 className="font-extrabold truncate">{item.zat} {item.dosis}</h4>
                                          <span className="block text-[9px] text-slate-400 font-semibold truncate mt-0.5">{item.produk}</span>
                                        </div>
                                        <div className="flex flex-col gap-1 items-end shrink-0">
                                          {item.tipe === 'generik' ? (
                                            <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded ${
                                              item.bpjs ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/50' : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                                            }`}>
                                              {item.bpjs ? 'BPJS' : 'Generik'}
                                            </span>
                                          ) : (
                                            <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">Paten</span>
                                          )}
                                          {!hasStock && (
                                            <span className="text-[8px] font-extrabold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 px-1 py-0.2 rounded">Habis</span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-1 px-1.5">
                        <input
                          ref={el => { cellRefs.current[`${i}-2`] = el; }}
                          type="text"
                          placeholder="mis. 500mg"
                          value={row.dosis}
                          onChange={e => handleCellChange(i, 'dosis', e.target.value)}
                          onKeyDown={e => handleKeyDown(e, i, 2)}
                          onFocus={() => { setFocusedRow(i); setFocusedCol(2); }}
                          className="w-full h-8 px-2 rounded-lg bg-transparent border-0 outline-none text-xs font-bold text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-red-500/20"
                        />
                      </td>

                      <td className="py-1 px-1.5">
                        <select
                          ref={el => { cellRefs.current[`${i}-3`] = el; }}
                          value={row.rute}
                          onChange={e => handleCellChange(i, 'rute', e.target.value)}
                          onKeyDown={e => handleKeyDown(e, i, 3)}
                          onFocus={() => { setFocusedRow(i); setFocusedCol(3); }}
                          className="w-full h-8 px-2 rounded-lg bg-transparent border-0 outline-none text-xs font-bold text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-red-500/20 cursor-pointer appearance-none animate-fadeIn"
                        >
                          {RUTE_OPTIONS.map(o => (
                            <option key={o} value={o} className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-205">{o}</option>
                          ))}
                        </select>
                      </td>

                      <td className="py-1 px-1.5">
                        <input
                          ref={el => { cellRefs.current[`${i}-4`] = el; }}
                          type="text"
                          placeholder="mis. tds pc / 1-0-1"
                          value={row.freq}
                          onChange={e => handleCellChange(i, 'freq', e.target.value)}
                          onKeyDown={e => handleKeyDown(e, i, 4)}
                          onFocus={() => { setFocusedRow(i); setFocusedCol(4); }}
                          className="w-full h-8 px-2 rounded-lg bg-transparent border-0 outline-none text-xs font-bold text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-red-500/20"
                          list="freq-workstation-list"
                        />
                      </td>

                      <td className="py-1 px-1.5">
                        <input
                          ref={el => { cellRefs.current[`${i}-5`] = el; }}
                          type="text"
                          placeholder="hari"
                          value={row.dur}
                          onChange={e => handleCellChange(i, 'dur', e.target.value)}
                          onKeyDown={e => handleKeyDown(e, i, 5)}
                          onFocus={() => { setFocusedRow(i); setFocusedCol(5); }}
                          className="w-full h-8 px-2 rounded-lg bg-transparent border-0 outline-none text-xs font-bold text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-red-500/20"
                        />
                      </td>

                      <td className="py-1 px-1.5">
                        <input
                          type="text"
                          value={row.jml}
                          readOnly
                          tabIndex={-1}
                          title="Kalkulasi otomatis (Frekuensi x Durasi)"
                          className="w-full h-8 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-black text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed select-none text-center shadow-inner"
                        />
                      </td>

                      <td className="py-1 px-1.5 relative pr-8">
                        <input
                          ref={el => { cellRefs.current[`${i}-7`] = el; }}
                          type="text"
                          placeholder="Catatan opsional..."
                          value={row.catatan}
                          onChange={e => handleCellChange(i, 'catatan', e.target.value)}
                          onKeyDown={e => handleKeyDown(e, i, 7)}
                          onFocus={() => { setFocusedRow(i); setFocusedCol(7); }}
                          className="w-full h-8 px-2 rounded-lg bg-transparent border-0 outline-none text-xs font-bold text-slate-700 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-red-500/20"
                        />
                        {hasAlert && (
                          <span 
                            className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-sm cursor-help select-none ${
                              row.flag === 'danger' ? 'text-red-500 hover:scale-110' : 'text-amber-500 hover:scale-110'
                            } transition-transform`}
                            title={row.flagMsg}
                          >
                            {row.flag === 'danger' ? '🚫' : '⚠️'}
                          </span>
                        )}
                      </td>

                      <td className="py-1 pr-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => removeRow(i)}
                          title="Hapus baris obat ini (Delete)"
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-transparent hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-650 cursor-pointer active:scale-90 transition-all font-mono font-extrabold text-sm"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* GRID SUMMARIES ROW */}
          <div className="flex bg-slate-50 dark:bg-slate-800/40 p-4.5 rounded-2xl border border-slate-200 dark:border-white/5 items-center justify-between shadow-2xs">
            <button
              type="button"
              onClick={() => addNewRow()}
              className="flex items-center gap-1.5 text-xs font-black text-red-650 hover:text-red-700 transition-colors cursor-pointer"
            >
              ➕ Tambah baris obat <span className="text-[10px] bg-red-55 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono border border-red-200/30 ml-1.5 font-bold">Enter</span> di baris terakhir
            </button>

            <div className="flex gap-6 items-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              <div>
                Total Obat: <strong className="text-slate-800 dark:text-white font-black">{rows.filter(r => r.zat.trim() !== '').length}</strong>
              </div>
              <div>
                Peringatan CDSS: <strong className={allWarnings.length > 0 ? 'text-red-600 font-black' : 'text-slate-800 dark:text-white'}>{allWarnings.length}</strong>
              </div>
            </div>
          </div>

          {/* CDSS SAFETY BANNER */}
          {allWarnings.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 rounded-2xl p-4.5 space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-black text-amber-800 dark:text-amber-400 uppercase tracking-widest border-b border-amber-200/30 dark:border-white/5 pb-2">
                <span>⚠️</span>
                <span>Clinical CDSS Safety & Interaction Alert Cockpit</span>
              </div>
              <div className="space-y-2.5">
                {allWarnings.map((w, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 leading-normal">
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                      w.level === 'danger' ? 'bg-red-500 shadow-md shadow-red-500/20' : 'bg-amber-500'
                    }`} />
                    <div>
                      <strong className="text-slate-900 dark:text-white font-extrabold">{w.zat}</strong>: {w.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ======================================================== */}
      {/* ==================== WORKSPACE: RACIKAN ================ */}
      {/* ======================================================== */}
      {resepMode === 'racikan' && (
        <div className="space-y-5 animate-slideUp">
          
          {/* SEDIAAN & UTILITIES BLOCK */}
          <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-2xs space-y-4">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-100 dark:border-white/5">
              🧪 Resep Racikan — Formulasi Campuran
            </h4>
            
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Nama Racikan Custom *</label>
              <input
                type="text"
                value={namaRacikan}
                onChange={(e) => {
                  const val = e.target.value;
                  setNamaRacikan(val);
                  syncToParent(rows, bahanList, jenisSediaan, jumlahBungkus, racikanFreq, racikanWaktu, racikanCara, racikanCatatan, bbPasien, dosisPerPemberian, val);
                }}
                placeholder="Contoh: Puyer Flu & Batuk Anak, Salep Kulit Gatal, dll."
                className="w-full text-xs font-bold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 p-2.5 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-red-400 text-slate-800 dark:text-white"
              />
            </div>
            
            <div className="flex flex-col gap-4.5 md:flex-row md:items-center">
              <div className="flex-1 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Jenis Sediaan *</label>
                <div className="flex flex-wrap gap-2">
                  {['Puyer / Serbuk', 'Kapsul', 'Sirup / Suspensi', 'Salep / Krim', 'Tetes', 'Suppositoria'].map(s => {
                    const isSel = jenisSediaan === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setJenisSediaan(s);
                          syncToParent(rows, bahanList, s, jumlahBungkus, racikanFreq, racikanWaktu, racikanCara, racikanCatatan, bbPasien, dosisPerPemberian);
                        }}
                        className={`px-4.5 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          isSel 
                            ? 'bg-red-50 dark:bg-slate-800 text-red-650 dark:text-white border-red-500 dark:border-white/20 font-black shadow-3xs' 
                            : 'bg-white dark:bg-slate-900 text-slate-650 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:bg-slate-50'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Jumlah unit / bungkus *</label>
                <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-white/10">
                  <input
                    type="number"
                    value={jumlahBungkus}
                    onChange={e => {
                      const v = e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 1);
                      setJumlahBungkus(v);
                      syncToParent(rows, bahanList, jenisSediaan, v, racikanFreq, racikanWaktu, racikanCara, racikanCatatan, bbPasien, dosisPerPemberian);
                    }}
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900/50 text-xs font-bold text-slate-800 dark:text-white outline-none border-r border-slate-200 dark:border-white/10 focus:bg-white"
                  />
                  <span className="bg-slate-100 dark:bg-slate-800 px-3 flex items-center text-[10.5px] font-black text-slate-400 uppercase whitespace-nowrap shrink-0">bungkus</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Berat badan pasien</label>
                <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-white/10">
                  <input
                    type="number"
                    value={bbPasien}
                    onChange={e => {
                      const v = e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 1);
                      setBbPasien(v);
                      syncToParent(rows, bahanList, jenisSediaan, jumlahBungkus, racikanFreq, racikanWaktu, racikanCara, racikanCatatan, v, dosisPerPemberian);
                    }}
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900/50 text-xs font-bold text-slate-800 dark:text-white outline-none border-r border-slate-200 dark:border-white/10 focus:bg-white"
                  />
                  <span className="bg-slate-100 dark:bg-slate-800 px-3 flex items-center text-[10.5px] font-black text-slate-400 uppercase whitespace-nowrap shrink-0">kg</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Dosis per pemberian</label>
                <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-white/10">
                  <input
                    type="number"
                    value={dosisPerPemberian}
                    onChange={e => {
                      const v = e.target.value === '' ? '' : Math.max(0.1, parseFloat(e.target.value) || 0.1);
                      setDosisPerPemberian(v);
                      syncToParent(rows, bahanList, jenisSediaan, jumlahBungkus, racikanFreq, racikanWaktu, racikanCara, racikanCatatan, bbPasien, v);
                    }}
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900/50 text-xs font-bold text-slate-800 dark:text-white outline-none border-r border-slate-200 dark:border-white/10 focus:bg-white"
                  />
                  <span className="bg-slate-100 dark:bg-slate-800 px-3 flex items-center text-[10.5px] font-black text-slate-400 uppercase whitespace-nowrap shrink-0">bungkus</span>
                </div>
              </div>
            </div>
          </div>

          {/* BAHAN TABLE */}
          <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl overflow-visible shadow-2xs">
            <div className="p-4 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-slate-900/40">
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                💊 Komposisi Bahan Racikan
              </h4>
              <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider">
                Tab pindah kolom • Enter baris baru
              </span>
            </div>

            <table className="w-full text-left border-collapse table-fixed select-none">
              <colgroup>
                <col className="w-10" />
                <col className="w-64" />
                <col className="w-28" />
                <col className="w-28" />
                <col className="w-40" />
                <col className="w-36" />
                <col className="w-12" />
              </colgroup>
              <thead>
                <tr className="bg-slate-50 dark:bg-[#2D3748] border-b border-slate-200 dark:border-white/5 text-[9px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="py-2 text-center">#</th>
                  <th className="py-2 px-3">Zat aktif / bahan</th>
                  <th className="py-2 px-3">Dosis per bungkus</th>
                  <th className="py-2 px-3">Satuan</th>
                  <th className="py-2 px-3">Notasi khusus</th>
                  <th className="py-2 px-3">Total kebutuhan ⚡</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {bahanList.map((b, idx) => {
                  const rawDose = parseFloat(b.dosis) || 0;
                  const isQs = b.notasi === 'qs';
                  const computedTotal = isQs ? 'qs (auto)' : `${(rawDose * jumlahBungkus).toLocaleString('id-ID')} ${b.satuan}`;
                  
                  return (
                    <tr 
                      key={b.id}
                      className={`border-b border-slate-100 dark:border-white/5 transition-all text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/10 ${
                        isQs ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''
                      }`}
                    >
                      <td className="py-1.5 text-center font-mono font-extrabold text-[10.5px] text-slate-400">
                        {idx + 1}
                      </td>

                      <td className="py-1.5 px-3 relative">
                        <input
                          ref={el => { bahanCellRefs.current[`bahan-${idx}-0`] = el; }}
                          type="text"
                          placeholder="Nama zat aktif..."
                          value={b.zat}
                          onChange={e => handleBahanZatInput(idx, e.target.value)}
                          onKeyDown={e => handleBahanKeyDown(e, idx, 0)}
                          className="w-full h-8 px-2 rounded-lg bg-transparent border-0 outline-none text-xs font-bold text-slate-850 dark:text-white focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-red-500/20"
                          autoComplete="off"
                        />
                        
                        {acOpenRow === idx && acOpenType === 'racikan' && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => { setAcOpenRow(-1); setAcOpenType(null); }} />
                            <div className="absolute left-0 top-9 w-85 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl p-2 z-50 max-h-56 overflow-y-auto">
                              <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest px-2 mb-1.5">Pilih Zat Aktif</span>
                              <div className="space-y-1">
                                {acResults.map((item, idy) => {
                                  const isActive = acIndex === idy;
                                  return (
                                    <div
                                      key={item.id}
                                      onMouseDown={e => { e.preventDefault(); selectBahanAutocompleteItem(idx, item); }}
                                      className={`rounded-lg p-2 cursor-pointer text-xs transition-all ${
                                        isActive 
                                          ? 'bg-red-50 dark:bg-slate-800 text-red-700 dark:text-white font-extrabold' 
                                          : 'text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                      }`}
                                    >
                                      <h4 className="font-extrabold truncate">{item.zat} {item.dosis}</h4>
                                      <span className="block text-[9px] text-slate-400 font-semibold truncate">{item.produk}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </>
                        )}
                      </td>

                      <td className="py-1.5 px-3">
                        <input
                          ref={el => { bahanCellRefs.current[`bahan-${idx}-1`] = el; }}
                          type="text"
                          placeholder={isQs ? '—' : 'Dosis...'}
                          value={b.dosis}
                          disabled={isQs}
                          onChange={e => handleBahanCellChange(idx, 'dosis', e.target.value)}
                          onKeyDown={e => handleBahanKeyDown(e, idx, 1)}
                          className={`w-full h-8 px-2 rounded-lg bg-transparent border-0 outline-none text-xs font-bold focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-red-500/20 text-slate-850 dark:text-white ${
                            isQs ? 'text-slate-400 dark:text-slate-500 cursor-not-allowed' : ''
                          }`}
                        />
                      </td>

                      <td className="py-1.5 px-3">
                        <select
                          ref={el => { bahanCellRefs.current[`bahan-${idx}-2`] = el; }}
                          value={b.satuan}
                          onChange={e => handleBahanCellChange(idx, 'satuan', e.target.value)}
                          onKeyDown={e => handleBahanKeyDown(e, idx, 2)}
                          className="w-full h-8 px-2 rounded-lg bg-transparent border-0 outline-none text-xs font-bold focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-red-500/20 cursor-pointer text-slate-850 dark:text-white"
                        >
                          <option value="mg" className="bg-white dark:bg-slate-900 text-slate-700">mg</option>
                          <option value="g" className="bg-white dark:bg-slate-900 text-slate-700">g</option>
                          <option value="mcg" className="bg-white dark:bg-slate-900 text-slate-700">mcg</option>
                          <option value="ml" className="bg-white dark:bg-slate-900 text-slate-700">ml</option>
                          <option value="tetes" className="bg-white dark:bg-slate-900 text-slate-700">tetes</option>
                          <option value="qs" className="bg-white dark:bg-slate-900 text-slate-700">qs</option>
                        </select>
                      </td>

                      <td className="py-1.5 px-3">
                        <select
                          ref={el => { bahanCellRefs.current[`bahan-${idx}-3`] = el; }}
                          value={b.notasi}
                          onChange={e => handleBahanCellChange(idx, 'notasi', e.target.value)}
                          onKeyDown={e => handleBahanKeyDown(e, idx, 3)}
                          className="w-full h-8 px-2 rounded-lg bg-transparent border-0 outline-none text-xs font-bold focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-red-500/20 cursor-pointer text-slate-855 dark:text-white"
                        >
                          <option value="" className="bg-white dark:bg-slate-900 text-slate-700">— normal —</option>
                          <option value="aa" className="bg-white dark:bg-slate-900 text-slate-700">aa (sama rata)</option>
                          <option value="qs" className="bg-white dark:bg-slate-900 text-slate-700">qs (secukupnya)</option>
                          <option value="ad" className="bg-white dark:bg-slate-900 text-slate-700">ad (sampai)</option>
                          <option value="div" className="bg-white dark:bg-slate-900 text-slate-700">div (bagi rata)</option>
                        </select>
                      </td>

                      <td className="py-1.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {computedTotal}
                      </td>

                      <td className="py-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveBahan(idx)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-transparent hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-650 cursor-pointer font-mono font-extrabold text-sm active:scale-90 transition-all"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="p-3 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/40">
              <button
                type="button"
                onClick={handleAddBahan}
                className="flex items-center gap-1 text-xs font-bold text-red-650 hover:text-red-700 transition-colors cursor-pointer"
              >
                ➕ Tambah Bahan Racikan
              </button>
            </div>
          </div>

          {/* REFERENSI LEGEND WIDGET */}
          <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-2xs space-y-3.5">
            <h4
              onClick={() => setShowNotasiLegend(!showNotasiLegend)}
              className="text-xs font-extrabold text-slate-400 uppercase tracking-widest pb-1.5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between cursor-pointer hover:text-slate-600 select-none"
            >
              <span>📖 Referensi Notasi Khusus Racikan</span>
              <span className="text-[9px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md hover:bg-slate-200/80 transition-colors">
                {showNotasiLegend ? '▲ COLLAPSE' : '▼ EXPAND'}
              </span>
            </h4>
            
            {showNotasiLegend && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs animate-fadeIn">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/80 border border-slate-150 dark:border-white/5 rounded-xl">
                  <span className="font-mono font-black text-[11px] text-indigo-700 dark:text-indigo-400 block mb-1">aa / ana</span>
                  <span className="text-[10.5px] text-slate-400 font-semibold leading-relaxed">Bagian sama rata — semua bahan dibagi jumlah yang sama.</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/80 border border-slate-150 dark:border-white/5 rounded-xl">
                  <span className="font-mono font-black text-[11px] text-indigo-700 dark:text-indigo-400 block mb-1">qs / quantum satis</span>
                  <span className="text-[10.5px] text-slate-400 font-semibold leading-relaxed">Secukupnya — farmasis menentukan jumlah agar total benar.</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/80 border border-slate-150 dark:border-white/5 rounded-xl">
                  <span className="font-mono font-black text-[11px] text-indigo-700 dark:text-indigo-400 block mb-1">ad / usque ad</span>
                  <span className="text-[10.5px] text-slate-400 font-semibold leading-relaxed">Sampai mencapai total volume/berat tertentu — misal ad 100ml.</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/80 border border-slate-150 dark:border-white/5 rounded-xl">
                  <span className="font-mono font-black text-[11px] text-indigo-700 dark:text-indigo-400 block mb-1">div / divide</span>
                  <span className="text-[10.5px] text-slate-400 font-semibold leading-relaxed">Bagi rata — total berat bahan dibagi sejumlah bungkus/kapsul.</span>
                </div>
              </div>
            )}
          </div>

          {/* DYNAMIC CALCULATOR BOX */}
          <div className="p-4 bg-indigo-50/40 dark:bg-slate-900/85 border border-indigo-150 dark:border-indigo-950/50 rounded-2xl space-y-3 shadow-3xs">
            <div className="text-xs font-black text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5 uppercase tracking-widest pb-1 border-b border-indigo-200/30 dark:border-white/5">
              <span>⚡</span>
              <span>Kalkulasi Otomatis Sediaan Racikan</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-white dark:bg-slate-950 border border-indigo-100 dark:border-white/5 rounded-xl shadow-2xs">
                <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wide block mb-0.5">Jumlah Sediaan</span>
                <span className="font-mono font-black text-slate-800 dark:text-white text-base block">{jumlahBungkus}</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase">bungkus / kapsul</span>
              </div>

              {bahanList.slice(0, 3).map((b, idx) => {
                const rawDose = parseFloat(b.dosis) || 0;
                const totalText = b.notasi === 'qs' ? 'qs (auto)' : `${(rawDose * jumlahBungkus).toLocaleString('id-ID')} ${b.satuan}`;
                return (
                  <div key={b.id} className="p-3 bg-white dark:bg-slate-950 border border-indigo-100 dark:border-white/5 rounded-xl shadow-2xs">
                    <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wide block mb-0.5 truncate">Total {b.zat || `Bahan ${idx + 1}`}</span>
                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm block truncate">{totalText}</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">kebutuhan total</span>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-indigo-50/50 dark:bg-slate-900 rounded-xl font-mono text-[10.5px] text-indigo-700 dark:text-indigo-300 leading-normal border border-indigo-200/20">
              <strong>Formula Kalkulasi:</strong> dosis per bungkus × {jumlahBungkus} bungkus = total kebutuhan bahan baku. (Bahan pengisi pengisi / Lactose diset ke &apos;qs&apos; untuk penyesuaian homogenisasi).
            </div>
          </div>

          {/* ATURAN PAKAI & CATATAN */}
          <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-2xs space-y-4">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-100 dark:border-white/5">
              📋 Aturan Pakai & Catatan Racikan
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Frekuensi pemberian *</label>
                <input
                  type="text"
                  placeholder="mis. 3x1 bungkus / 3x1"
                  value={racikanFreq}
                  onChange={e => {
                    const val = e.target.value;
                    setRacikanFreq(val);
                    syncToParent(rows, bahanList, jenisSediaan, jumlahBungkus, val, racikanWaktu, racikanCara, racikanCatatan, bbPasien, dosisPerPemberian);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 text-xs font-bold outline-none text-slate-800 dark:text-white focus:bg-white focus:ring-2 focus:ring-red-500/20"
                  list="freq-workstation-list"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Waktu minum</label>
                <div className="flex flex-wrap gap-1.5">
                  {['Setelah makan', 'Sebelum makan', 'Bebas'].map(w => {
                    const isSel = racikanWaktu === w;
                    return (
                      <button
                        key={w}
                        type="button"
                        onClick={() => {
                          setRacikanWaktu(w);
                          syncToParent(rows, bahanList, jenisSediaan, jumlahBungkus, racikanFreq, w, racikanCara, racikanCatatan, bbPasien, dosisPerPemberian);
                        }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          isSel 
                            ? 'bg-red-50 dark:bg-slate-800 text-red-650 dark:text-white border-red-200' 
                            : 'bg-slate-50 dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-white/5 hover:bg-slate-100'
                        }`}
                      >
                        {w}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Cara penyajian</label>
                <div className="flex flex-wrap gap-1.5">
                  {['Langsung diminum', 'Larutkan dalam air', 'Campur susu'].map(c => {
                    const isSel = racikanCara === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setRacikanCara(c);
                          syncToParent(rows, bahanList, jenisSediaan, jumlahBungkus, racikanFreq, racikanWaktu, c, racikanCatatan, bbPasien, dosisPerPemberian);
                        }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          isSel 
                            ? 'bg-red-50 dark:bg-slate-800 text-red-650 dark:text-white border-red-200' 
                            : 'bg-slate-50 dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-white/5 hover:bg-slate-100'
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Catatan khusus untuk farmasi</label>
              <textarea
                value={racikanCatatan}
                onChange={e => {
                  setRacikanCatatan(e.target.value);
                  syncToParent(rows, bahanList, jenisSediaan, jumlahBungkus, racikanFreq, racikanWaktu, racikanCara, e.target.value, bbPasien, dosisPerPemberian);
                }}
                placeholder="Instruksi racikan tambahan..."
                className="w-full min-h-[56px] p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 text-xs font-bold outline-none text-slate-800 dark:text-white focus:bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ==================== WORKSPACE: RIWAYAT ================= */}
      {/* ======================================================== */}
      {resepMode === 'riwayat' && (
        <div className="space-y-4 animate-slideUp bg-white dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-3xs">
          <div className="text-left">
            <h4 className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-wider mb-1 font-bold">
              📋 Riwayat Pemesanan Resep Pasien
            </h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
              Menampilkan daftar resep yang telah diorder sebelumnya. Anda dapat memuat ulang resep untuk diedit.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-white/5 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-wider text-slate-400 font-bold">
                  <th className="p-3">Tanggal Kunjungan</th>
                  <th className="p-3">No. Resep</th>
                  <th className="p-3">Daftar Obat</th>
                  <th className="p-3">Status Apotek</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const visitsWithResep = (historyKunjungan || []).filter(
                    (v: any) => v.resep && v.resep.length > 0 && v.resep[0].resep_item?.length > 0
                  );

                  if (visitsWithResep.length === 0) {
                    return (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 font-bold">
                          ⚠️ Belum ada riwayat resep digital untuk pasien ini.
                        </td>
                      </tr>
                    );
                  }

                  return visitsWithResep.map((v: any, index: number) => {
                    const rx = v.resep[0];
                    const tgl = v.tgl_kunjungan 
                      ? new Date(v.tgl_kunjungan).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—';
                    
                    let statusColor = 'text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/10 border-amber-200';
                    if (rx.status_resep === 'Selesai') {
                      statusColor = 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/10 border-emerald-250';
                    } else if (rx.status_resep === 'Dibatalkan' || rx.status_resep === 'DIBATALKAN / DIHAPUS') {
                      statusColor = 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/10 border-rose-250';
                    }

                    return (
                      <tr 
                        key={rx.id_resep || index} 
                        className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 text-slate-700 dark:text-slate-200 font-semibold"
                      >
                        <td className="p-3 font-mono">{tgl}</td>
                        <td className="p-3 font-mono font-bold text-red-650 dark:text-red-400">{rx.no_resep}</td>
                        <td className="p-3 max-w-[280px]">
                          <div className="space-y-1">
                            {rx.resep_item.map((item: any, iIdx: number) => {
                              const dName = item.nama_obat || (item.master_obat?.nama_produk_lengkap || item.master_obat?.nama_dagang) || 'Obat Medis';
                              return (
                                <div key={iIdx} className="truncate text-[11px]">
                                  • {dName} <span className="text-[10px] text-slate-400 font-normal">({item.jumlah} unit &middot; {item.aturan_pakai})</span>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full border text-[9.5px] font-black uppercase ${statusColor}`}>
                            {rx.status_resep || 'Terkirim'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (!setPrescribedDrugs) return;
                              // Load previous items into editor!
                              const reloaded = rx.resep_item.map((item: any) => ({
                                id_obat: item.obat_id || item.id_obat || 'custom-racikan-uuid-placeholder',
                                nama_obat: item.nama_obat || (item.master_obat?.nama_produk_lengkap || item.master_obat?.nama_dagang) || 'Obat Medis',
                                jumlah: item.jumlah,
                                aturan_pakai: item.aturan_pakai,
                                catatan_tambahan: item.catatan_tambahan || ''
                              }));
                              setPrescribedDrugs(reloaded);
                              setResepMode('standar');
                              alert(`✅ Resep #${rx.no_resep} berhasil dimuat ke editor! Silakan sesuaikan obat di tab "Obat Standar".`);
                            }}
                            className="bg-red-650 hover:bg-red-700 text-white font-extrabold text-[10px] px-3 py-1.5 rounded-lg cursor-pointer transition-colors shadow-2xs border-none"
                          >
                            🔄 Edit / Duplikat
                          </button>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FREQUENCY MAPPING OPTIONS DATALIST */}
      <datalist id="freq-workstation-list">
        {FREQ_OPTIONS.map(f => (
          <option key={f} value={f} />
        ))}
      </datalist>
      
    </div>
  );
}
