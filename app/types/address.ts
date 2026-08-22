export interface SavedAddress {
  id: string;
  userId: string;
  label: string | null;
  name: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;      // ISO alpha-2
  phone: string;
  isDefault: boolean;   // read-only — server-controlled
  createdAt: string;
  updatedAt: string;
}

export type CreateAddressInput = Omit<
  SavedAddress, "id" | "userId" | "isDefault" | "createdAt" | "updatedAt"
>;

export type UpdateAddressInput = Partial<CreateAddressInput>;
