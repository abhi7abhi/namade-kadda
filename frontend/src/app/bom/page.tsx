"use client";

import { useEffect, useState } from "react";
import PageGuide from "@/components/PageGuide";
import {
  Layers,
  PlusCircle,
  Download,
  Trash2,
  Edit2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileSpreadsheet,
  Cpu
} from "lucide-react";
import { api, BOMProject, BOMItem } from "@/lib/api";

export default function BOMPage() {
  const [projects, setProjects] = useState<BOMProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<BOMProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New Item State
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [partName, setPartName] = useState("");
  const [material, setMaterial] = useState("SS 304");
  const [dimensions, setDimensions] = useState("100mm x 50mm x 3mm");
  const [quantity, setQuantity] = useState(100);
  const [unit, setUnit] = useState("pcs");
  const [process, setProcess] = useState("CNC Milling");
  const [unitCost, setUnitCost] = useState(14.5);
  const [notes, setNotes] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getBOMProjects();
      setProjects(data);
      if (data.length > 0 && !selectedProject) {
        setSelectedProject(data[0]);
      } else if (selectedProject) {
        const updated = data.find((p) => p.id === selectedProject.id);
        if (updated) setSelectedProject(updated);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load BOM projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !partName.trim()) return;

    try {
      await api.addBOMItem(selectedProject.id, {
        part_name: partName.trim(),
        material,
        dimensions,
        quantity,
        unit,
        manufacturing_process: process,
        estimated_unit_cost: unitCost,
        specification_status: "SPECIFIED",
        notes
      });
      setShowAddItemModal(false);
      setPartName("");
      setSuccessMessage("Line item successfully added to BOM!");
      await fetchProjects();
    } catch (err: any) {
      setError(err.message || "Failed to add BOM item");
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm("Are you sure you want to remove this line item?")) return;
    try {
      await api.deleteBOMItem(itemId);
      setSuccessMessage("Line item deleted from BOM.");
      await fetchProjects();
    } catch (err: any) {
      setError(err.message || "Failed to delete item");
    }
  };

  const handleGenerateDraftBOM = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const generated = await api.generateDraftBOM({
        sourcing_request_id: 1,
        title: "BOM - High Precision Assembly (AI Synthesized)"
      });
      setSuccessMessage("Engineering Agent produced draft BOM line items!");
      await fetchProjects();
      setSelectedProject(generated);
    } catch (err: any) {
      setError(err.message || "Failed to generate draft BOM");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#1f242f]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">Engineering Bill of Materials (BOM)</h1>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-[#18212e] text-emerald-400 border border-emerald-900/50 font-bold">
              SUBTOTAL AUTO-CALCULATED
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Component parts breakdown, unit cost amortization, material specifications, and CSV export.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateDraftBOM}
            disabled={isGenerating}
            className="px-3.5 py-1.5 rounded bg-[#161a23] hover:bg-[#1f2433] text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isGenerating ? "Synthesizing Draft..." : "AI Generate Draft BOM"}
          </button>
          {selectedProject && (
            <a
              href={api.getBOMCsvExportUrl(selectedProject.id)}
              download
              className="px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </a>
          )}
        </div>
      </div>

      {/* Page Guide */}
      <PageGuide
        route="bom"
        steps={[
          "Select an existing BOM project or create a new assembly hierarchy.",
          "Add manual component line items or click 'AI Generate Draft BOM' to synthesize parts.",
          "Review the auto-calculated subtotal and download the finished bill of materials as a CSV."
        ]}
        tip="CSV export generates a standard spreadsheet ready for ERP or production planning systems."
        demoNote="AI-generated BOM drafts are engineering estimates requiring certified mechanical review."
      />

      {successMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-200 text-xs">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Two-Column View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: BOM Project Select (1 col) */}
        <div className="p-4 rounded-lg bg-[#141821] border border-[#212735] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#212735]">
            <span className="text-xs font-semibold text-slate-200">BOM Assemblies</span>
            <span className="text-[10px] font-mono text-slate-500">{projects.length} PROJECTS</span>
          </div>

          <div className="space-y-2">
            {projects.map((proj) => {
              const isSelected = selectedProject?.id === proj.id;
              return (
                <button
                  key={proj.id}
                  onClick={() => setSelectedProject(proj)}
                  className={`w-full text-left p-2.5 rounded border text-xs transition-all ${
                    isSelected
                      ? "bg-[#191f2c] border-emerald-500/50"
                      : "bg-[#10131a] border-[#212735] hover:border-[#2f384c]"
                  }`}
                >
                  <p className="font-semibold text-slate-200 truncate">{proj.title}</p>
                  <div className="flex items-center justify-between mt-1 text-[11px] font-mono">
                    <span className="text-emerald-400 font-bold">${proj.total_estimated_cost.toLocaleString()}</span>
                    <span className="text-slate-500">{proj.items.length} parts</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: BOM Items Ledger (3 cols) */}
        {selectedProject ? (
          <div className="lg:col-span-3 space-y-4">
            <div className="p-5 rounded-lg bg-[#141821] border border-[#212735] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#212735]">
                <div>
                  <h2 className="text-base font-bold text-slate-100">{selectedProject.title}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedProject.description}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Total Assembly Subtotal</span>
                  <span className="text-xl font-mono text-emerald-400 font-bold">
                    ${selectedProject.total_estimated_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
                    {selectedProject.currency}
                  </span>
                </div>
              </div>

              {/* Disclaimer Banner */}
              <div className="p-2.5 rounded bg-amber-950/20 border border-amber-900/40 text-amber-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  AI-generated draft — engineering review required. Does not generate or claim validated, production-ready CAD drawings or certified manufacturable geometry.
                </span>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#1f2533] text-slate-400 font-mono text-[10px] uppercase">
                      <th className="pb-2">Part Name</th>
                      <th className="pb-2">Material</th>
                      <th className="pb-2">Dimensions</th>
                      <th className="pb-2">Process</th>
                      <th className="pb-2">Qty</th>
                      <th className="pb-2">Unit Cost</th>
                      <th className="pb-2">Subtotal</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1b202c]">
                    {selectedProject.items.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-500 text-xs">
                          No components or line items added to this BOM yet. Click &quot;Add Line Item&quot; or synthesize using &quot;AI Generate Draft BOM&quot;.
                        </td>
                      </tr>
                    ) : (
                      selectedProject.items.map((item) => (
                        <tr key={item.id} className="hover:bg-[#181d27] transition-colors">
                          <td className="py-2.5 font-medium text-slate-200">
                            <div>
                              <span>{item.part_name}</span>
                              {item.description && (
                                <span className="block text-[10px] text-slate-500">{item.description}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 text-slate-300 font-mono text-[11px]">{item.material || "N/A"}</td>
                          <td className="py-2.5 text-slate-400 font-mono text-[11px]">{item.dimensions || "N/A"}</td>
                          <td className="py-2.5 text-slate-400">{item.manufacturing_process || "Fabrication"}</td>
                          <td className="py-2.5 font-mono text-slate-300">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="py-2.5 font-mono text-slate-400">${item.estimated_unit_cost.toFixed(2)}</td>
                          <td className="py-2.5 font-mono text-emerald-400 font-bold">${item.total_cost.toFixed(2)}</td>
                          <td className="py-2.5">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#101319] text-slate-400 border border-[#212735]">
                              {item.specification_status}
                            </span>
                          </td>
                          <td className="py-2.5 text-right">
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors"
                              title="Delete Line Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Add Item Button */}
              <div className="pt-2 border-t border-[#212735] flex justify-end">
                <button
                  onClick={() => setShowAddItemModal(true)}
                  className="px-3.5 py-1.5 rounded bg-[#181e2b] hover:bg-[#222b3d] text-slate-200 border border-[#2a3449] text-xs font-semibold flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-400" /> Add Line Item
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-3 p-12 text-center rounded-lg bg-[#141821] border border-[#212735] text-slate-500 text-xs">
            Select a project on the left or generate a draft BOM.
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAddItem} className="bg-[#141822] border border-[#273042] rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 pb-2 border-b border-[#212735]">
              Add Bill of Materials Line Item
            </h3>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Part Name</label>
              <input
                type="text"
                value={partName}
                onChange={(e) => setPartName(e.target.value)}
                required
                placeholder="e.g. Laser Cut Base Plate"
                className="w-full bg-[#10131a] border border-[#232938] rounded p-2 text-xs text-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Material</label>
                <input
                  type="text"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="w-full bg-[#10131a] border border-[#232938] rounded p-2 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Process</label>
                <input
                  type="text"
                  value={process}
                  onChange={(e) => setProcess(e.target.value)}
                  className="w-full bg-[#10131a] border border-[#232938] rounded p-2 text-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Quantity</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full bg-[#10131a] border border-[#232938] rounded p-2 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Unit</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-[#10131a] border border-[#232938] rounded p-2 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Est Unit Cost ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={unitCost}
                  onChange={(e) => setUnitCost(Number(e.target.value))}
                  className="w-full bg-[#10131a] border border-[#232938] rounded p-2 text-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddItemModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded"
              >
                Save Line Item
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
