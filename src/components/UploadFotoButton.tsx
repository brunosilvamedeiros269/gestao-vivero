'use client';
import { Camera } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export function UploadFotoButton({ loteId }: { loteId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.target.files || event.target.files.length === 0) return;
    
    const file = event.target.files[0];
    setLoading(true);

    try {
      // 1. Fazer o Upload para o Storage
      const fileName = `${loteId}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
      const { error: uploadError } = await supabase.storage
        .from('fotos_evolutivas')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      // 2. Pegar URL Pública
      const { data: { publicUrl } } = supabase.storage.from('fotos_evolutivas').getPublicUrl(fileName);

      // 3. Inserir o registro no banco de dados
      const { error: insertError } = await supabase.from('fotos_evolutivas').insert({
        lote_plantio_id: loteId,
        url_foto: publicUrl,
        status_no_momento: 'Em Crescimento' // Simplificado para esse estágio do Lote
      });

      if (insertError) throw insertError;
      
      // Atualizar a página para mostrar a nova foto na UI
      router.refresh();
      
    } catch (err: any) {
      alert(`Erro no upload: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 w-full max-w-md mx-auto px-6 flex justify-center z-50 left-0 right-0">
      <label className="bg-gradient-to-r from-primary to-primary-container text-on-primary flex items-center gap-2 px-8 py-4 rounded-[2rem] shadow-[0_20px_40px_rgba(27,28,26,0.15)] hover:shadow-[0_20px_40px_rgba(27,28,26,0.25)] transition-all transform hover:-translate-y-1 w-full justify-center text-lg font-bold cursor-pointer">
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          onChange={handleFileChange} 
          className="hidden" 
          disabled={loading}
        />
        <Camera size={24} />
        {loading ? 'Enviando...' : 'Registrar Foto da Evolução'}
      </label>
    </div>
  );
}
