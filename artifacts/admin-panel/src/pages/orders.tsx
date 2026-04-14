import { useState } from "react";
import {
  useGetOrders,
  useCreateOrder,
  useUpdateOrder,
  useDeleteOrder,
  getGetOrdersQueryKey,
} from "@workspace/api-client-react";
import type { Order } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2, X } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { formatVND, formatDate } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";

const ORDER_STATUSES = ["Chờ xử lý", "Đã phân công", "Đang vận chuyển", "Đã hoàn thành", "Đã hủy"];

interface FormData {
  orderCode: string;
  goodsDescription: string;
  customerName: string;
  customerPhone: string;
  origin: string;
  destination: string;
  status: string;
  price: string;
  note: string;
}

const emptyForm: FormData = {
  orderCode: "",
  goodsDescription: "",
  customerName: "",
  customerPhone: "",
  origin: "",
  destination: "",
  status: "Chờ xử lý",
  price: "",
  note: "",
};

function OrderModal({
  order,
  onClose,
}: {
  order: Order | null;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormData>(
    order
      ? {
          orderCode: order.orderCode,
          goodsDescription: order.goodsDescription || "",
          customerName: order.customerName,
          customerPhone: order.customerPhone || "",
          origin: order.origin,
          destination: order.destination,
          status: order.status,
          price: order.price?.toString() || "",
          note: order.note || "",
        }
      : emptyForm
  );
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createMutation = useCreateOrder();
  const updateMutation = useUpdateOrder();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      orderCode: form.orderCode,
      goodsDescription: form.goodsDescription || undefined,
      customerName: form.customerName,
      customerPhone: form.customerPhone || undefined,
      origin: form.origin,
      destination: form.destination,
      status: form.status,
      price: form.price ? Number(form.price) : undefined,
      note: form.note || undefined,
    };
    const onSuccess = () => {
      queryClient.invalidateQueries({ queryKey: getGetOrdersQueryKey() });
      toast({ title: order ? "Đã cập nhật đơn hàng" : "Đã tạo đơn hàng mới" });
      onClose();
    };
    const onError = () => toast({ title: "Có lỗi xảy ra", variant: "destructive" });
    if (order) {
      updateMutation.mutate({ id: order.id, data }, { onSuccess, onError });
    } else {
      createMutation.mutate({ data }, { onSuccess, onError });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">{order ? "Chỉnh sửa đơn hàng" : "Tạo đơn hàng mới"}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Mã đơn hàng *</label>
              <input required value={form.orderCode} onChange={set("orderCode")} className={inputClass} placeholder="DH-001" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Trạng thái</label>
              <select value={form.status} onChange={set("status")} className={inputClass}>
                {ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Mô tả hàng hóa</label>
            <input value={form.goodsDescription} onChange={set("goodsDescription")} className={inputClass} placeholder="Hàng điện tử..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Tên khách hàng *</label>
              <input required value={form.customerName} onChange={set("customerName")} className={inputClass} placeholder="Nguyễn Văn A" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Số điện thoại</label>
              <input value={form.customerPhone} onChange={set("customerPhone")} className={inputClass} placeholder="0901234567" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Điểm xuất phát *</label>
              <input required value={form.origin} onChange={set("origin")} className={inputClass} placeholder="Hà Nội" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Điểm đến *</label>
              <input required value={form.destination} onChange={set("destination")} className={inputClass} placeholder="TP. Hồ Chí Minh" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Giá trị (VND)</label>
            <input type="number" value={form.price} onChange={set("price")} className={inputClass} placeholder="1500000" />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Ghi chú</label>
            <textarea value={form.note} onChange={set("note")} className={`${inputClass} resize-none`} rows={2} placeholder="Ghi chú thêm..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className={secondaryBtnClass}>Hủy</button>
            <button type="submit" disabled={isLoading} className={primaryBtnClass}>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              {order ? "Cập nhật" : "Tạo mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { data: orders, isLoading } = useGetOrders();
  const deleteMutation = useDeleteOrder();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editOrder, setEditOrder] = useState<Order | null | "new">(null);

  const handleDelete = (order: Order) => {
    if (!confirm(`Xóa đơn hàng "${order.orderCode}"?`)) return;
    deleteMutation.mutate({ id: order.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetOrdersQueryKey() });
        toast({ title: "Đã xóa đơn hàng" });
      },
      onError: () => toast({ title: "Có lỗi xảy ra", variant: "destructive" }),
    });
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Đơn hàng</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Quản lý danh sách đơn hàng</p>
        </div>
        <button data-testid="button-create-order" onClick={() => setEditOrder("new")} className={primaryBtnClass}>
          <Plus className="h-4 w-4 mr-1.5" /> Tạo đơn hàng
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : !orders || orders.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Chưa có đơn hàng nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className={thClass}>Mã đơn</th>
                  <th className={thClass}>Khách hàng</th>
                  <th className={thClass}>Hàng hóa</th>
                  <th className={thClass}>Tuyến đường</th>
                  <th className={thClass}>Trạng thái</th>
                  <th className={`${thClass} text-right`}>Giá trị</th>
                  <th className={thClass}>Ngày tạo</th>
                  <th className={`${thClass} text-center`}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order: Order, i: number) => (
                  <tr key={order.id} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                    <td className={tdClass}><span className="font-mono text-xs font-medium">{order.orderCode}</span></td>
                    <td className={tdClass}>
                      <div className="font-medium text-foreground">{order.customerName}</div>
                      <div className="text-xs text-muted-foreground">{order.customerPhone}</div>
                    </td>
                    <td className={tdClass}><span className="text-xs text-muted-foreground">{order.goodsDescription || "—"}</span></td>
                    <td className={tdClass}><span className="text-xs text-muted-foreground">{order.origin} → {order.destination}</span></td>
                    <td className={tdClass}><StatusBadge status={order.status} /></td>
                    <td className={`${tdClass} text-right font-medium`}>{formatVND(order.price)}</td>
                    <td className={`${tdClass} text-xs text-muted-foreground`}>{formatDate(order.createdAt)}</td>
                    <td className={`${tdClass} text-center`}>
                      <div className="flex items-center justify-center gap-1">
                        <button data-testid={`button-edit-order-${order.id}`} onClick={() => setEditOrder(order)} className={iconBtnClass}><Pencil className="h-3.5 w-3.5" /></button>
                        <button data-testid={`button-delete-order-${order.id}`} onClick={() => handleDelete(order)} className={`${iconBtnClass} text-destructive hover:bg-destructive/10`}><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editOrder !== null && (
        <OrderModal
          order={editOrder === "new" ? null : editOrder}
          onClose={() => setEditOrder(null)}
        />
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
