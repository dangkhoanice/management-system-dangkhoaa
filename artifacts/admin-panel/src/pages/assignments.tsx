import { useState } from "react";
import {
  useGetAssignments,
  useCreateAssignment,
  useDeleteAssignment,
  getGetAssignmentsQueryKey,
  useGetOrders,
  useGetVehicles,
  useGetDrivers,
} from "@workspace/api-client-react";
import type { AssignmentWithDetails, Order, Vehicle, Driver } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Loader2, X } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { useToast } from "@/hooks/use-toast";

function AssignmentModal({ onClose }: { onClose: () => void }) {
  const { data: orders } = useGetOrders();
  const { data: vehicles } = useGetVehicles();
  const { data: drivers } = useGetDrivers();

  const [orderId, setOrderId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createMutation = useCreateAssignment();

  const pendingOrders = orders?.filter((o: Order) => o.status === "Chờ xử lý") ?? [];
  const availableVehicles = vehicles?.filter((v: Vehicle) => v.status === "Sẵn sàng") ?? [];
  const availableDrivers = drivers?.filter((d: Driver) => d.status === "Sẵn sàng") ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || !vehicleId || !driverId) {
      toast({ title: "Vui lòng chọn đầy đủ thông tin", variant: "destructive" });
      return;
    }
    createMutation.mutate(
      { data: { orderId: Number(orderId), vehicleId: Number(vehicleId), driverId: Number(driverId) } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetAssignmentsQueryKey() });
          toast({ title: "Đã tạo phân công thành công" });
          onClose();
        },
        onError: () => toast({ title: "Có lỗi xảy ra", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Tạo phân công mới</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Đơn hàng *</label>
            <select value={orderId} onChange={(e) => setOrderId(e.target.value)} className={inputClass} required>
              <option value="">-- Chọn đơn hàng chờ xử lý --</option>
              {pendingOrders.map((o: Order) => (
                <option key={o.id} value={o.id}>{o.orderCode} — {o.customerName} ({o.origin} → {o.destination})</option>
              ))}
            </select>
            {pendingOrders.length === 0 && <p className="text-xs text-muted-foreground mt-1">Không có đơn hàng nào đang chờ xử lý.</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Phương tiện *</label>
            <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className={inputClass} required>
              <option value="">-- Chọn phương tiện --</option>
              {availableVehicles.map((v: Vehicle) => (
                <option key={v.id} value={v.id}>{v.licensePlate}{v.type ? ` — ${v.type}` : ""}{v.capacity ? ` (${v.capacity}T)` : ""}</option>
              ))}
            </select>
            {availableVehicles.length === 0 && <p className="text-xs text-muted-foreground mt-1">Không có phương tiện nào sẵn sàng.</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Tài xế *</label>
            <select value={driverId} onChange={(e) => setDriverId(e.target.value)} className={inputClass} required>
              <option value="">-- Chọn tài xế --</option>
              {availableDrivers.map((d: Driver) => (
                <option key={d.id} value={d.id}>{d.name}{d.phone ? ` — ${d.phone}` : ""}</option>
              ))}
            </select>
            {availableDrivers.length === 0 && <p className="text-xs text-muted-foreground mt-1">Không có tài xế nào sẵn sàng.</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className={secondaryBtnClass}>Hủy</button>
            <button type="submit" disabled={createMutation.isPending} className={primaryBtnClass}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Tạo phân công
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AssignmentsPage() {
  const { data: assignments, isLoading } = useGetAssignments();
  const deleteMutation = useDeleteAssignment();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);

  const handleDelete = (a: AssignmentWithDetails) => {
    if (!confirm("Xóa phân công này?")) return;
    deleteMutation.mutate({ id: a.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAssignmentsQueryKey() });
        toast({ title: "Đã xóa phân công" });
      },
      onError: () => toast({ title: "Có lỗi xảy ra", variant: "destructive" }),
    });
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Phân công</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Quản lý phân công chuyến vận chuyển</p>
        </div>
        <button data-testid="button-create-assignment" onClick={() => setShowModal(true)} className={primaryBtnClass}>
          <Plus className="h-4 w-4 mr-1.5" /> Tạo phân công
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : !assignments || assignments.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Chưa có phân công nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className={thClass}>Đơn hàng</th>
                  <th className={thClass}>Tuyến đường</th>
                  <th className={thClass}>Phương tiện</th>
                  <th className={thClass}>Tài xế</th>
                  <th className={thClass}>Trạng thái</th>
                  <th className={thClass}>Thời gian phân công</th>
                  <th className={thClass}>Hoàn thành</th>
                  <th className={`${thClass} text-center`}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a: AssignmentWithDetails, i: number) => (
                  <tr key={a.id} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                    <td className={tdClass}>
                      <div className="font-mono text-xs font-semibold text-foreground">{a.order?.orderCode ?? `#${a.orderId}`}</div>
                      <div className="text-xs text-muted-foreground">{a.order?.customerName}</div>
                    </td>
                    <td className={`${tdClass} text-xs text-muted-foreground`}>
                      {a.order ? `${a.order.origin} → ${a.order.destination}` : "—"}
                    </td>
                    <td className={tdClass}>
                      <span className="font-mono text-xs font-medium">{a.vehicle?.licensePlate ?? `#${a.vehicleId}`}</span>
                    </td>
                    <td className={tdClass}>{a.driver?.name ?? `#${a.driverId}`}</td>
                    <td className={tdClass}><StatusBadge status={a.order?.status ?? "—"} /></td>
                    <td className={`${tdClass} text-xs text-muted-foreground`}>{formatDateTime(a.assignedAt)}</td>
                    <td className={`${tdClass} text-xs text-muted-foreground`}>{a.completedAt ? formatDateTime(a.completedAt) : "—"}</td>
                    <td className={`${tdClass} text-center`}>
                      <button data-testid={`button-delete-assignment-${a.id}`} onClick={() => handleDelete(a)} className={`p-1.5 rounded hover:bg-muted text-destructive hover:bg-destructive/10 transition-colors`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && <AssignmentModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

const inputClass = "w-full px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow";
const primaryBtnClass = "inline-flex items-center px-3.5 py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors";
const secondaryBtnClass = "inline-flex items-center px-3.5 py-2 border border-border text-foreground rounded-md text-sm font-medium hover:bg-muted transition-colors";
const thClass = "text-left px-4 py-3 text-xs font-semibold text-muted-foreground";
const tdClass = "px-4 py-3";
