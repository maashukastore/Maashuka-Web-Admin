import { getPaginatedOrders } from "../action";
import OrdersList from "../../components/Orders/OrderList";

export const metadata = {
  title: "Orders Fulfillment Tower | Maashuka Admin",
};

export default async function AdminOrdersPage() {
  // Pre-load primary execution records before rendering
  const initialData = await getPaginatedOrders({
    page: 1,
    pageSize: 10,
    status: "all",
    search: ""
  });

  return (
    <div className="space-y-8 text-left">
      <div>
        <h1 className="text-2xl font-serif font-bold text-slate-900">Orders Management</h1>
        <p className="text-xs text-slate-400 mt-0.5 font-medium">
          Monitor transactional customer histories, assign delivery statuses, and handle package fulfillment workflows.
        </p>
      </div>

      {/* Render the interactive Client Table view */}
      <OrdersList initialOrders={initialData} />
    </div>
  );
}