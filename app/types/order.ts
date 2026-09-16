export type OrderStatus =
  | "CREATED"
  | "PAID"
  | "GENERATED"
  | "CONFIRMED"
  | "SHIPROCKET_FAILED"
  | "READY_TO_SHIP"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export const ORDER_STATUSES: OrderStatus[] = [
  "CREATED",
  "PAID",
  "GENERATED",
  "CONFIRMED",
  "SHIPROCKET_FAILED",
  "READY_TO_SHIP",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export type OrderSortBy = "createdAt" | "updatedAt";
export type SortOrder = "asc" | "desc";

export interface AdminOrdersFilters {
  page?: number;
  pageSize?: number;
  status?: OrderStatus;
  search?: string;
  sortBy?: OrderSortBy;
  sortOrder?: SortOrder;
}

export interface AdminOrderRow {
  id: string;
  createdAt: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  /** Prisma Decimal serialised — a string, never a number. */
  amount: string;
  currency: string;
  status: OrderStatus;
  trackingStatus: string | null;
  awbNumber: string | null;
  courierName: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  childName: string | null;
  comicTitle: string;
}

export interface AdminOrdersPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AdminOrdersResponse {
  orders: AdminOrderRow[];
  pagination: AdminOrdersPagination;
}

export interface PublicOrderStatus {
  code: string;
  label: string;
}

export interface AdminOrderDetail {
  id: string;
  createdAt: string;
  updatedAt: string;

  amount: string;
  currency: string;
  countryCode: string;
  coverType: "HARDCOVER" | "SOFTCOVER";

  status: OrderStatus;
  publicStatus: PublicOrderStatus;

  customer: {
    notificationEmail: string | null;
    /** Null when the session was never attached to a logged-in account. */
    user: { id: string; name: string | null; email: string } | null;
  };

  shipping: {
    name: string | null;
    line1: string | null;
    line2: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    country: string | null;
    phone: string | null;
  };

  payment: {
    razorpayOrderId: string | null;
    razorpayPaymentId: string | null;
  };

  pdf: {
    pdfUrl: string | null;
    pdfDownloadUrl: string | null;
    pdfDownloadExpiry: string | null;
  };

  shipment: {
    shiprocketOrderId: string | null;
    shiprocketShipmentId: string | null;
    awbNumber: string | null;
    courierId: number | null;
    courierName: string | null;
    /** Raw Shiprocket string — admin-only, never shown to customers. */
    trackingStatus: string | null;
    trackingUrl: string | null;
    trackingUpdatedAt: string | null;
    isInternational: boolean;
  };

  dimensions: {
    finalLength: number | null;
    finalBreadth: number | null;
    finalHeight: number | null;
    finalWeight: number | null;
  };

  timestamps: {
    awbGeneratedAt: string | null;
    labelGeneratedAt: string | null;
    pickupScheduledDate: string | null;
    pickupGeneratedAt: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
  };

  session: {
    id: string;
    childName: string | null;
    pronounKey: "HE" | "SHE" | "THEY" | null;
    age: number | null;
    comic: { id: string; title: string; coverThumbnailUrls: string[] };
  };

  webhookEvents: WebhookEvent[];
}

export interface WebhookEvent {
  id: string;
  source: string;
  eventId: string;
  eventType: string;
  processedAt: string;
  payloadJson: unknown;
}

export interface ConfirmDimensionsInput {
  length: number;
  breadth: number;
  height: number;
  weight: number;
}

export interface ConfirmDimensionsResponse {
  awbCode: string;
  courierName: string;
  pickupScheduledDate: string | null;
}

export interface RetryShiprocketResponse {
  shiprocketOrderId: string;
  shiprocketShipmentId: string;
  status: "READY_TO_SHIP";
  /** True when Shiprocket already had the shipment and we only reconciled our DB. */
  recovered: boolean;
}

export interface LabelResponse {
  labelUrl: string;
  message: string;
}

export interface TrackActivity {
  date: string | null;
  courierStatus: string;
  activity: string;
  location: string;
  shiprocketStatusLabel: string;
}

export interface RefreshTrackingResponse {
  shiprocket: {
    /** "pending" means no courier scans yet — normal right after AWB assignment. */
    state: "pending" | "tracked";
    currentStatus: string;
    courierName: string;
    trackUrl: string;
    estimatedDelivery: string | null;
    activities: TrackActivity[];
    pickupDate: string | null;
    deliveredDate: string | null;
  };
  /** What actually changed in our DB. All null when only trackingUpdatedAt moved. */
  updated: {
    orderStatus: OrderStatus | null;
    trackingStatus: string | null;
    trackingUrl: string | null;
    courierName: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
  };
}
