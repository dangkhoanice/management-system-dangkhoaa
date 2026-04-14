import { useGetDashboardSummary } from "@workspace/api-client-react";
import { ShoppingCart, Truck, User2, CheckCircle, Clock, XCircle, DollarSign, Loader2 } from "lucide-react";
import { formatVND, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: summary, isLoading } = useGetDashboardSummary();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Bảng điều khiển</h1>
        <p className="text-sm text-muted-foreground mt-1">Tổng quan hoạt động vận tải</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Tổng đơn hàng" value={summary.totalOrders} icon={ShoppingCart} color="bg-blue-100 text-blue-600" />
        <StatCard label="Chờ xử lý" value={summary.pendingOrders} icon={Clock} color="bg-amber-100 text-amber-600" />
        <StatCard label="Hoàn thành" value={summary.completedOrders} icon={CheckCircle} color="bg-green-100 text-green-600" />
        <StatCard label="Đã hủy" value={summary.cancelledOrders} icon={XCircle} color="bg-red-100 text-red-600" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Tổng tài xế" value={`${summary.availableDrivers}/${summary.totalDrivers} sẵn sàng`} icon={User2} color="bg-purple-100 text-purple-600" />
        <StatCard label="Tổng phương tiện" value={`${summary.availableVehicles}/${summary.totalVehicles} sẵn sàng`} icon={Truck} color="bg-indigo-100 text-indigo-600" />
        <StatCard label="Doanh thu" value={formatVND(summary.totalRevenue)} icon={DollarSign} color="bg-emerald-100 text-emerald-600" />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Đơn hàng gần đây</h2>
        </div>
        {summary.recentOrders && summary.recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Mã đơn</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Khách hàng</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Tuyến đường</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Trạng thái</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Giá trị</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Ngày tạo</th>
                </tr>
              </thead>
              <tbody>
                {summary.recentOrders.map((order: any, i: number) => (
                  <tr key={order.id} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                    <td className="px-5 py-3 font-mono text-xs font-medium text-foreground">{order.orderCode}</td>
                    <td className="px-5 py-3 text-foreground">{order.customerName}</td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">{order.origin} → {order.destination}</td>
                    <td className="px-5 py-3"><StatusBadge status={order.status} /></td>
                    <td className="px-5 py-3 text-right font-medium text-foreground">{formatVND(order.price)}</td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">Chưa có đơn hàng nào.</div>
        )}
      </div>
    </div>
  );
}
