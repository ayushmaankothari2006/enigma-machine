import { useState } from 'react';
import { Header, InputCard, OutputCard, SettingsCard } from './components';
import { useEnigma } from './hooks';

export function App() {
  const enigma = useEnigma();
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportPDF = async () => {
    if (isExportingPdf) return;
    try {
      setIsExportingPdf(true);
      const { exportEnigmaPDF } = await import('./utils');
      exportEnigmaPDF({
        rotors: enigma.rotors,
        inputText: enigma.inputText,
        outputText: enigma.outputText,
      });
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/70 via-slate-100 to-orange-50/40 text-slate-800 antialiased selection:bg-orange-500 selection:text-white pb-16">
      {/* Header with Brand & PDF Export */}
      <Header onExportPDF={handleExportPDF} isExportingPdf={isExportingPdf} />

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-8 space-y-6 sm:space-y-8">
        
        {/* ROW 1: Input Text & Output Text Cards Side-by-Side */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-stretch">
          <InputCard
            value={enigma.inputText}
            onChange={enigma.setInputText}
            onClear={enigma.clearInput}
            onLoadSample={enigma.loadSampleText}
          />

          <OutputCard
            value={enigma.outputText}
            onUseOutputAsInput={enigma.useOutputAsInput}
          />
        </section>

        {/* ROW 2: Machine Settings Dashboard Card Spanning Full Width */}
        <section>
          <SettingsCard
            rotors={enigma.rotors}
            onPositionStep={enigma.stepPosition}
            onPositionDirectChange={enigma.setPosition}
            onRingStep={enigma.stepRing}
            onTurnoverNotchChange={enigma.setTurnoverNotch}
            onResetPositions={enigma.resetPositionsToDefaults}
            onRandomizeSettings={enigma.randomizeSettings}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
