import { useQuery } from "@tanstack/react-query";
import { Expense } from "@shared/schema";
import { Link } from "wouter";
import { getStatusBadgeColor, getStatusTranslation, formatDate, formatCurrency, getExpenseCategoryIcon } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function ExpenseReports() {
  const { data: expenses, isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const recentExpenses = expenses?.slice(0, 3) || [];

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Note Spese Recenti</h2>
        <Link href="/expenses">
          <a className="text-primary text-sm hover:underline">Gestisci spese</a>
        </Link>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          {recentExpenses.length > 0 ? (
            recentExpenses.map((expense) => {
              const iconClass = expense.category === "restaurant" 
                ? "bg-warning bg-opacity-10 text-warning" 
                : expense.category === "transport" 
                ? "bg-primary-light bg-opacity-10 text-primary-light"
                : "bg-success bg-opacity-10 text-success";
              
              return (
                <div key={expense.id} className="flex p-3 border rounded-md hover:bg-neutral-lightest">
                  <div className="mr-3">
                    <div className={`w-10 h-10 rounded-full ${iconClass} flex items-center justify-center`}>
                      <i className={`ri-${getExpenseCategoryIcon(expense.category)} text-xl`}></i>
                    </div>
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-semibold">{expense.description}</h3>
                    <div className="text-xs text-neutral-medium mt-1">{formatDate(expense.date)}</div>
                  </div>
                  <div className="self-center text-right">
                    <div className="font-semibold">{formatCurrency(expense.amount)}</div>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadgeColor(expense.status)}`}>
                      {getStatusTranslation(expense.status)}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center p-6 text-neutral-medium">
              Nessuna nota spese recente.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
