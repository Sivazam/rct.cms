import orderService, { IOrder, IOrderItem, ICustomerInfo } from './orderService';
import productService, { Product, Variant } from './productService';
import categoryService, { Category } from './categoryService';
import variantService, { IVariant } from './variantService';
import discountService, { IDiscount } from './discountService';
import userService, { IUser } from './userService';

export {
  // Order Service
  orderService,
  type IOrder,
  type IOrderItem,
  type ICustomerInfo,
  
  // Product Service
  productService,
  type Product,
  type Variant,
  
  // Category Service
  categoryService,
  type Category,
  
  // Variant Service
  variantService,
  type IVariant,
  
  // Discount Service
  discountService,
  type IDiscount,
  
  // User Service
  userService,
  type IUser,
};

// Default exports
const services = {
  orderService,
  productService,
  categoryService,
  variantService,
  discountService,
  userService,
};

export default services;