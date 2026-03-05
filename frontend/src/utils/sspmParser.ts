/**
 * Parser per file .sspm (Sync Smash Project Map)
 * Format: Testo con JSON
 */

export interface SSPMMetadata {
  title: string;
  artist: string;
  difficulty: number;
  bpm: number;
  duration: number;
  noteCount: number;
  tags?: string[]; // Categorie/tag della mappa
}

/**
 * Estrae metadati da file .sspm
 * Supporta formato testo con JSON
 */
export const parseSSPMFile = async (file: File): Promise<SSPMMetadata> => {
  return new Promise(async (resolve, reject) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const text = new TextDecoder().decode(arrayBuffer);
      
      console.log('📋 File content:', text.substring(0, 200));

      // Cerca JSON nel file
      const startIdx = text.indexOf('{');
      const endIdx = text.lastIndexOf('}');
      
      if (startIdx !== -1 && endIdx !== -1) {
        try {
          let jsonStr = text.substring(startIdx, endIdx + 1);
          const data = JSON.parse(jsonStr);
          
          if (data.title || data.artist || data.mapper) {
            const metadata: SSPMMetadata = {
              title: String(data.title || 'Untitled').trim(),
              artist: String(data.mapper || 'Unknown').trim(), // Invertito: mapper dal file → artist
              difficulty: parseFloat(data.difficulty) || 5.0,
              bpm: parseInt(data.bpm) || 120,
              duration: parseInt(data.duration) || 0,
              noteCount: parseInt(data.noteCount) || 0,
            };
            console.log('✅ Metadata extracted from JSON');
            resolve(metadata);
            return;
          }
        } catch (parseErr) {
          console.log('ℹ️  JSON parsing failed, using filename fallback');
        }
      }

      // FALLBACK: Estrai da nome file
      const fileName = file.name;
      const nameWithoutExt = fileName.replace('.sspm', '').replace(/\s+/g, ' ');
      const parts = nameWithoutExt.split('-').map(p => p.trim()).filter(p => p);

      const fallbackMetadata: SSPMMetadata = {
        title: parts[parts.length - 1] || 'Untitled',
        artist: parts[0] || 'Unknown',
        difficulty: 5.0,
        bpm: 120,
        duration: 180000,
        noteCount: 300,
      };

      console.log('⚠️  Using fallback metadata from filename');
      resolve(fallbackMetadata);
    } catch (error: any) {
      console.error('❌ Parser error:', error.message);
      reject(new Error(`Errore nel parsing del file: ${error.message}`));
    }
  });
};
