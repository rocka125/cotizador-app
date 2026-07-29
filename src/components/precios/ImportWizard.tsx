"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { parseExcelFile, type ParseExcelResult } from "@/lib/priceList/parseExcel";

type Step = "archivo" | "revisar" | "guardando" | "listo";

export function ImportWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("archivo");
  const [fileName, setFileName] = useState("");
  const [versionName, setVersionName] = useState("");
  const [result, setResult] = useState<ParseExcelResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveResult, setSaveResult] = useState<{ total: number } | null>(null);

  const onDrop = useCallback(async (accepted: File[]) => {
    const file = accepted[0];
    if (!file) return;
    setError(null);
    setFileName(file.name);
    setVersionName(file.name.replace(/\.[^.]+$/, "").replace(/_/g, " "));
    try {
      const parsed = await parseExcelFile(file);
      if (parsed.products.length === 0) {
        setError("No se encontraron productos. Asegúrate de subir la lista de precios AMER de Fortinet.");
        return;
      }
      setResult(parsed);
      setStep("revisar");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo leer el archivo");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    multiple: false,
  });

  async function handleGuardar() {
    if (!result) return;
    setStep("guardando");
    setError(null);
    try {
      const res = await fetch("/api/price-list/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: versionName, products: result.products }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Error al guardar");
        setStep("revisar");
        return;
      }
      setSaveResult({ total: body.total });
      setStep("listo");
      router.refresh();
    } catch {
      setError("Error de conexión al guardar");
      setStep("revisar");
    }
  }

  function reset() {
    setStep("archivo");
    setResult(null);
    setError(null);
    setSaveResult(null);
    setFileName("");
  }

  const steps: { id: Step; label: string }[] = [
    { id: "archivo", label: "1. Archivo" },
    { id: "revisar", label: "2. Revisar" },
    { id: "guardando", label: "3. Guardar" },
  ];
  const stepOrder: Step[] = ["archivo", "revisar", "guardando", "listo"];
  const currentIdx = stepOrder.indexOf(step);

  return (
    <div className="rounded-2xl border p-6" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
      <div className="flex items-center gap-2 mb-6">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{
                background: currentIdx >= i ? "var(--shell-accent)" : "rgba(255,255,255,0.06)",
                color: currentIdx >= i ? "#fff" : "rgba(255,255,255,0.4)",
              }}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && <span className="text-white/20">→</span>}
          </div>
        ))}
      </div>

      {error && <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">{error}</div>}

      {step === "archivo" && (
        <div
          {...getRootProps()}
          className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors"
          style={{
            borderColor: isDragActive ? "var(--shell-accent)" : "rgba(255,140,26,0.3)",
            background: isDragActive ? "rgba(255,140,26,0.08)" : "transparent",
          }}
        >
          <input {...getInputProps()} />
          <p className="text-white font-medium mb-1">Arrastra tu Excel aquí</p>
          <p className="text-white/40 text-sm">o haz clic para seleccionar · .xlsx / .xls</p>
        </div>
      )}

      {step === "revisar" && result && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <span className="font-mono">{fileName}</span>
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Nombre de la versión</label>
            <input
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>

          {result.omittedSheets.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-300 space-y-1">
              <p className="font-semibold">⚠ {result.omittedSheets.length} hoja(s) no importada(s):</p>
              {result.omittedSheets.map((o, i) => (
                <p key={i}>
                  <strong>{o.nombre}</strong> ({o.razon})
                </p>
              ))}
            </div>
          )}
          {result.crossCategorySkus.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-300">
              ⚠ {result.crossCategorySkus.length} SKU(s) aparecen en más de una categoría — se usó la última hoja procesada.
            </div>
          )}

          <div className="bg-black/20 rounded-xl p-4">
            <p className="text-white font-semibold mb-3">{result.products.length.toLocaleString("es-MX")} productos listos para guardar</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {result.sheetSummary.map((s) => (
                <div key={s.nombre} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                  <span className="text-xs text-white/70 truncate">{s.nombre}</span>
                  <span className="text-xs font-mono" style={{ color: "var(--shell-accent)" }}>
                    {s.count.toLocaleString("es-MX")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={reset} className="px-4 py-2 rounded-lg border border-white/10 text-white/60 text-sm hover:bg-white/5">
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              className="ml-auto px-5 py-2 rounded-lg text-white text-sm font-semibold"
              style={{ background: "var(--shell-accent)" }}
            >
              Guardar y activar
            </button>
          </div>
        </div>
      )}

      {step === "guardando" && <p className="text-white/60 text-sm">Guardando productos…</p>}

      {step === "listo" && saveResult && (
        <div className="text-center py-6">
          <p className="text-green-400 font-semibold mb-1">✓ Lista actualizada</p>
          <p className="text-white/50 text-sm mb-4">{saveResult.total.toLocaleString("es-MX")} productos importados y activados.</p>
          <button onClick={reset} className="px-4 py-2 rounded-lg border border-white/10 text-white/70 text-sm hover:bg-white/5">
            Importar otra
          </button>
        </div>
      )}
    </div>
  );
}
