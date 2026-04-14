import { useState } from "react";
import { useGetUsers, useCreateUser, getGetUsersQueryKey } from "@workspace/api-client-react";
import type { SafeUser } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, X, ShieldCheck, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function CreateUserModal({ onClose }: { onClose: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createMutation = useCreateUser();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      { data: { username, password, isAdmin } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetUsersQueryKey() });
          toast({ title: "Đã tạo người dùng mới" });
          onClose();
        },
        onError: () => toast({ title: "Có lỗi xảy ra (tên đăng nhập có thể đã tồn tại)", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-lg w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Tạo người dùng mới</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Tên đăng nhập *</label>
            <input required value={username} onChange={(e) => setUsername(e.target.value)} className={inputClass} placeholder="nguyen_van_a" autoComplete="off" />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Mật khẩu *</label>
            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="Ít nhất 6 ký tự" autoComplete="new-password" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isAdmin" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} className="h-4 w-4 rounded border-input accent-primary" />
            <label htmlFor="isAdmin" className="text-sm text-foreground cursor-pointer">Cấp quyền quản trị viên</label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className={secondaryBtnClass}>Hủy</button>
            <button type="submit" disabled={createMutation.isPending} className={primaryBtnClass}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Tạo người dùng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { data: users, isLoading } = useGetUsers();
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Người dùng</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Quản lý tài khoản hệ thống</p>
        </div>
        <button data-testid="button-create-user" onClick={() => setShowModal(true)} className={primaryBtnClass}>
          <Plus className="h-4 w-4 mr-1.5" /> Tạo người dùng
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : !users || users.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Chưa có người dùng nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className={thClass}>ID</th>
                  <th className={thClass}>Tên đăng nhập</th>
                  <th className={thClass}>Vai trò</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user: SafeUser, i: number) => (
                  <tr key={user.id} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                    <td className={`${tdClass} text-muted-foreground font-mono text-xs`}>{user.id}</td>
                    <td className={tdClass}>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-foreground">{user.username}</span>
                      </div>
                    </td>
                    <td className={tdClass}>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${user.isAdmin ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {user.isAdmin ? <ShieldCheck className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                        {user.isAdmin ? "Quản trị viên" : "Nhân viên"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && <CreateUserModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

const inputClass = "w-full px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow";
const primaryBtnClass = "inline-flex items-center px-3.5 py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors";
const secondaryBtnClass = "inline-flex items-center px-3.5 py-2 border border-border text-foreground rounded-md text-sm font-medium hover:bg-muted transition-colors";
const thClass = "text-left px-4 py-3 text-xs font-semibold text-muted-foreground";
const tdClass = "px-4 py-3";
