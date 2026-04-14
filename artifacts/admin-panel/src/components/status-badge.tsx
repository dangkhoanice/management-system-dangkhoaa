import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; className: string }> = {
  "Sẵn sàng": { label: "Sẵn sàng", className: "bg-green-100 text-green-700" },
  "Bảo trì": { label: "Bảo trì", className: "bg-amber-100 text-amber-700" },
  "Đang sử dụng": { label: "Đang sử dụng", className: "bg-blue-100 text-blue-700" },
  "Nghỉ phép": { label: "Nghỉ phép", className: "bg-gray-100 text-gray-600" },
  "Đang đi chuyến": { label: "Đang đi chuyến", className: "bg-blue-100 text-blue-700" },
  "Chờ xử lý": { label: "Chờ xử lý", className: "bg-gray-100 text-gray-600" },
  "Đã phân công": { label: "Đã phân công", className: "bg-blue-100 text-blue-700" },
  "Đang vận chuyển": { label: "Đang vận chuyển", className: "bg-orange-100 text-orange-700" },
  "Đã hoàn thành": { label: "Đã hoàn thành", className: "bg-green-100 text-green-700" },
  "Đã hủy": { label: "Đã hủy", className: "bg-red-100 text-red-700" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? { label: status, className: "bg-gray-100 text-gray-600" };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", config.className)}>
      {config.label}
    </span>
  );
}
