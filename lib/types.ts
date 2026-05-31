export type PaginationResult<T> = {
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  data: T[];
};

export type Product = {
  id: number;
  name: string;
  description: string;
  pictureUrl: string;
  imageUrls: string[];
  price: number;
  discountPercentage: number;
  priceAfterDiscount: number;
  colors: string[];
  sizes: string[];
  material: string;
  gender: string;
  stockQuantity: number;
  isFeatured: boolean;
  isActive: boolean;
  brandId: number;
  typeId: number;
  brandName: string;
  typeName: string;
};

export type ProductUpsert = {
  name: string;
  description: string;
  pictureUrl: string;
  imageUrls: string[];
  price: number;
  discountPercentage: number;
  colors: string[];
  sizes: string[];
  material: string;
  gender: string;
  stockQuantity: number;
  isFeatured: boolean;
  isActive: boolean;
  brandId: number;
  typeId?: number;
};

export type CatalogOption = {
  id: number;
  name: string;
};

export type CartItem = {
  productId: number;
  productName: string;
  pictureUrl: string;
  color: string;
  size: string;
  unitPrice: number;
  originalPrice: number;
  discountPercentage: number;
  quantity: number;
  lineTotal: number;
};

export type Cart = {
  id: string;
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  updatedAt: string;
};

export type ShippingFee = {
  deliveryMethod: string;
  description: string;
  shippingFee: number;
};

export type CheckoutForm = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  street: string;
  city: string;
  country: string;
};

export type PaymentMethod = "cash_on_delivery" | "instapay";

export type Order = {
  id: string;
  userEmail: string;
  phoneNumber: string;
  orderDate: string;
  address: {
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    country: string;
  };
  deliveryMethod: string;
  paymentMethod?: string;
  shippingFee: number;
  orderState: string;
  items: Array<{
    productName: string;
    productPictureUrl: string;
    color: string;
    size: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  total: number;
};

export type UserSession = {
  email: string;
  displayName: string;
  token: string;
};
