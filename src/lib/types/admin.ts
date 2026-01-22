export type Admin = {
  uid: string;
  email: string;
  name?: string;
  role?: "super_admin" | "admin";
  createdAt?: string | number;
};
