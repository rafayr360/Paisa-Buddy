import { NavLink } from "react-router-dom";
import { LayoutDashboard, ReceiptText, Wallet, PiggyBank, BarChart3, Settings } from "lucide-react";
import { cn } from "../lib/utils";

const navigation = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Transactions", path: "/transactions", icon: ReceiptText },
  { name: "Budgets", path: "/budgets", icon: Wallet },
  { name: "Savings", path: "/savings", icon: PiggyBank },
  { name: "Reports", path: "/reports", icon: BarChart3 },
  { name: "Settings", path: "/settings", icon: Settings },
];

export default function Sidebar() {
  return (
    <div className="flex flex-col w-64 bg-background border-r border-border h-screen sticky top-0">
      <div className="flex flex-col h-full px-6 py-8">
        <div className="flex items-center mb-12">
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight uppercase">Paisa Buddy</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mt-0.5">Smart Finance Manager</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-primary/5 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
                  {item.name}
                </>
              )}
            </NavLink>
          ))}
        </nav>

      </div>
    </div>
  );
}
