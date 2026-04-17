import { useState, useMemo } from "react";
import {
  useGetVehicles,
  useCreateVehicle,
  useUpdateVehicle,
  useDeleteVehicle,
  getGetVehiclesQueryKey,
} from "@workspace/api-client-react";
import type { Vehicle } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2, X, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { useToast } from "@/hooks/use-toast";

const VEHICLE_STATUSES = ["Sẵn sàng", "Bảo trì", "Đang sử dụng"];
const PAGE_SIZE = 10;

interface FormData {
  licensePlate: string;
  type: string;
  capacity: string;
  status: string;
  note: string;
}

const emptyForm: FormData = { licensePlate: "", type: "", capacity: "", status: "Sẵn sàng", note: "" };

function VehicleModal({ vehicle, onClose }: { vehicle: Vehicle | null; onClose: () => void }) {
  const [form, setForm] = useState<FormData>(
    vehicle
      ? { licensePlate: vehicle.licensePlate, type: vehicle.type || "", capacity: vehicle.capacity?.toString() || "", status: vehicle.status, note: vehicle.note || "" }
      : emptyForm
  );
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createMutation = useCreateVehicle();
  const updateMutation = useUpdateVehicle();
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      licensePlate: form.licensePlate,
      type: form.type || undefined,
      capacity: form.capacity ? Number(form.capacity) : undefined,
      status: form.status,
      note: form.note || undefined,
    };
    const onSuccess = () => {
      queryClient.invalidateQueries({ queryKey: getGetVehiclesQueryKey() });
      toast({ title: vehicle ? "Đã cập nhật phương tiện" : "Đã thêm phương tiện mới" });
      onClose();
    };
    const onError = () => toast({ title: "Có lỗi xảy ra", variant: "destructive" });
    if (vehicle) {
      updateMutation.mutate({ id: vehicle.id, data }, { onSuccess, onError });
    } else {
      createMutation.mutate({ data }, { onSuccess, onError });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">{vehicle ? "Chỉnh sửa phương tiện" : "Thêm phương tiện mới"}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Biển số *</label>
              <input required value={form.licensePlate} onChange={set("licensePlate")} className={inputClass} placeholder="51A-12345" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Loại xe</label>
              <input value={form.type} onChange={set("type")} className={inputClass} placeholder="Xe tải, xe container..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Tải trọng (tấn)</label>
              <input type="number" value={form.capacity} onChange={set("capacity")} className={inputClass} placeholder="5" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Trạng thái</label>
              <select value={form.status} onChange={set("status")} className={inputClass}>
                {VEHICLE_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Ghi chú</label>
            <textarea value={form.note} onChange={set("note")} className={`${inputClass} resize-none`} rows={2} placeholder="Ghi chú..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className={secondaryBtnClass}>Hủy</button>
            <button type="submit" disabled={isLoading} className={primaryBtnClass}>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              {vehicle ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VehiclesPage() {
  const { data: vehicles, isLoading } = useGetVehicles();
  const deleteMutation = useDeleteVehicle();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editVehicle, setEditVehicle] = useState<Vehicle | null | "new">(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!vehicles) return [];
    return vehicles.filter((v: Vehicle) => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        v.licensePlate.toLowerCase().includes(q) ||
        (v.type || "").toLowerCase().includes(q) ||
        (v.note || "").toLowerCase().includes(q);
      const matchStatus = !statusFilter || v.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [vehicles, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSearch = (val: string) => { setSearch(val); setPage(1); };
  const handleStatus = (val: string) => { setStatusFilter(val); setPage(1); };

  const handleDelete = (v: Vehicle) => {
    if (!confirm(`Xóa phương tiện "${v.licensePlate}"?`)) return;
    deleteMutation.mutate({ id: v.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetVehiclesQueryKey() });
        toast({ title: "Đã xóa phương tiện" });
      },
      onError: () => toast({ title: "Có lỗi xảy ra", variant: "destructive" }),
    });
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Phương tiện</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Quản lý đội phương tiện vận tải</p>
        </div>
        <button data-testid="button-create-vehicle" onClick={() => setEditVehicle("new")} className={primaryBtnClass}>
          <Plus className="h-4 w-4 mr-1.5" /> Thêm phương tiện
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Tìm theo biển số, loại xe..."
            className={`${inputClass} pl-9`}
          />
        </div>
        <select value={statusFilter} onChange={(e) => handleStatus(e.target.value)} className={`${inputClass} sm:w-44`}>
          <option value="">Tất cả trạng thái</option>
          {VEHICLE_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : paginated.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            {search || statusFilter ? "Không tìm thấy phương tiện phù hợp." : "Chưa có phương tiện nào."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className={thClass}>Biển số</th>
                  <th className={thClass}>Loại xe</th>
                  <th className={thClass}>Tải trọng</th>
                  <th className={thClass}>Trạng thái</th>
                  <th className={thClass}>Ghi chú</th>
                  <th className={`${thClass} text-center`}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((v: Vehicle, i: number) => (
                  <tr key={v.id} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                    <td className={tdClass}><span className="font-mono font-semibold text-foreground">{v.licensePlate}</span></td>
                    <td className={tdClass}>{v.type || "—"}</td>
                    <td className={tdClass}>{v.capacity != null ? `${v.capacity} tấn` : "—"}</td>
                    <td className={tdClass}><StatusBadge status={v.status} /></td>
                    <td className={`${tdClass} text-muted-foreground text-xs`}>{v.note || "—"}</td>
                    <td className={`${tdClass} text-center`}>
                      <div className="flex items-center justify-center gap-1">
                        <button data-testid={`button-edit-vehicle-${v.id}`} onClick={() => setEditVehicle(v)} className={iconBtnClass}><Pencil className="h-3.5 w-3.5" /></button>
                        <button data-testid={`button-delete-vehicle-${v.id}`} onClick={() => handleDelete(v)} className={`${iconBtnClass} text-destructive hover:bg-destructive/10`}><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-muted-foreground">
            <span>
              Hiển thị {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} / {filtered.length} phương tiện
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="p-1 rounded hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2">Trang {safePage} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="p-1 rounded hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {editVehicle !== null && (
        <VehicleModal vehicle={editVehicle === "new" ? null : editVehicle} onClose={() => setEditVehicle(null)} />
      )}
    </div>
  );
}

const inputClass = "w-full px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow";
const primaryBtnClass = "inline-flex items-center px-3.5 py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors";
const secondaryBtnClass = "inline-flex items-center px-3.5 py-2 border border-border text-foreground rounded-md text-sm font-medium hover:bg-muted transition-colors";
const iconBtnClass = "p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors";
const thClass = "text-left px-4 py-3 text-xs font-semibold text-muted-foreground";
const tdClass = "px-4 py-3";
