import { useState } from "react";
import {
  useGetDrivers,
  useCreateDriver,
  useUpdateDriver,
  useDeleteDriver,
  getGetDriversQueryKey,
} from "@workspace/api-client-react";
import type { Driver } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2, X } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { useToast } from "@/hooks/use-toast";

const DRIVER_STATUSES = ["Sẵn sàng", "Nghỉ phép", "Đang đi chuyến"];

interface FormData {
  name: string;
  phone: string;
  licenseNumber: string;
  status: string;
}

const emptyForm: FormData = { name: "", phone: "", licenseNumber: "", status: "Sẵn sàng" };

function DriverModal({ driver, onClose }: { driver: Driver | null; onClose: () => void }) {
  const [form, setForm] = useState<FormData>(
    driver
      ? { name: driver.name, phone: driver.phone || "", licenseNumber: driver.licenseNumber || "", status: driver.status }
      : emptyForm
  );
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createMutation = useCreateDriver();
  const updateMutation = useUpdateDriver();
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: form.name,
      phone: form.phone || undefined,
      licenseNumber: form.licenseNumber || undefined,
      status: form.status,
    };
    const onSuccess = () => {
      queryClient.invalidateQueries({ queryKey: getGetDriversQueryKey() });
      toast({ title: driver ? "Đã cập nhật tài xế" : "Đã thêm tài xế mới" });
      onClose();
    };
    const onError = () => toast({ title: "Có lỗi xảy ra", variant: "destructive" });
    if (driver) {
      updateMutation.mutate({ id: driver.id, data }, { onSuccess, onError });
    } else {
      createMutation.mutate({ data }, { onSuccess, onError });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">{driver ? "Chỉnh sửa tài xế" : "Thêm tài xế mới"}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Họ tên *</label>
            <input required value={form.name} onChange={set("name")} className={inputClass} placeholder="Nguyễn Văn B" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Số điện thoại</label>
              <input value={form.phone} onChange={set("phone")} className={inputClass} placeholder="0901234567" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Số bằng lái</label>
              <input value={form.licenseNumber} onChange={set("licenseNumber")} className={inputClass} placeholder="B2-123456" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Trạng thái</label>
            <select value={form.status} onChange={set("status")} className={inputClass}>
              {DRIVER_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className={secondaryBtnClass}>Hủy</button>
            <button type="submit" disabled={isLoading} className={primaryBtnClass}>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              {driver ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DriversPage() {
  const { data: drivers, isLoading } = useGetDrivers();
  const deleteMutation = useDeleteDriver();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editDriver, setEditDriver] = useState<Driver | null | "new">(null);

  const handleDelete = (d: Driver) => {
    if (!confirm(`Xóa tài xế "${d.name}"?`)) return;
    deleteMutation.mutate({ id: d.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDriversQueryKey() });
        toast({ title: "Đã xóa tài xế" });
      },
      onError: () => toast({ title: "Có lỗi xảy ra", variant: "destructive" }),
    });
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Tài xế</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Quản lý danh sách tài xế</p>
        </div>
        <button data-testid="button-create-driver" onClick={() => setEditDriver("new")} className={primaryBtnClass}>
          <Plus className="h-4 w-4 mr-1.5" /> Thêm tài xế
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : !drivers || drivers.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Chưa có tài xế nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className={thClass}>Họ tên</th>
                  <th className={thClass}>Số điện thoại</th>
                  <th className={thClass}>Số bằng lái</th>
                  <th className={thClass}>Trạng thái</th>
                  <th className={`${thClass} text-center`}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((d: Driver, i: number) => (
                  <tr key={d.id} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                    <td className={tdClass}><span className="font-medium text-foreground">{d.name}</span></td>
                    <td className={tdClass}>{d.phone || "—"}</td>
                    <td className={tdClass}><span className="font-mono text-xs">{d.licenseNumber || "—"}</span></td>
                    <td className={tdClass}><StatusBadge status={d.status} /></td>
                    <td className={`${tdClass} text-center`}>
                      <div className="flex items-center justify-center gap-1">
                        <button data-testid={`button-edit-driver-${d.id}`} onClick={() => setEditDriver(d)} className={iconBtnClass}><Pencil className="h-3.5 w-3.5" /></button>
                        <button data-testid={`button-delete-driver-${d.id}`} onClick={() => handleDelete(d)} className={`${iconBtnClass} text-destructive hover:bg-destructive/10`}><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editDriver !== null && (
        <DriverModal driver={editDriver === "new" ? null : editDriver} onClose={() => setEditDriver(null)} />
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
