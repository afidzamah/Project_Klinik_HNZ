import React from 'react';

interface MockFormProps {
  activeTab: string;
}

export default function MockForm({ activeTab }: MockFormProps) {
  return (
    <div className="text-center py-20 space-y-3 animate-fadeIn">
      <span className="text-4xl">📝</span>
      <h4 className="font-extrabold text-slate-800 text-sm">{activeTab}</h4>
      <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
        Dokumen {activeTab} klinis ini bersifat opsional untuk kunjungan rawat jalan aktif ini. Data parameter terintegrasi otomatis.
      </p>
    </div>
  );
}
