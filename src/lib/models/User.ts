export interface IUser {
  id?: string;
  phoneNumber: string;
  name?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  addresses?: Array<{
    id?: string;
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    isDefault?: boolean;
    createdAt?: string;
  }>;
  orderIds?: string[];
  createdAt?: any;
  updatedAt?: any;
}

export interface IUserWithOrders extends IUser {
  orders?: any[];
}