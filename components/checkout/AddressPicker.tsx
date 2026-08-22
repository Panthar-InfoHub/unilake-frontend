"use client";

import { useState, useEffect } from "react";
import { useAddresses, useCreateAddress } from "@/hooks/useAddresses";
import { SessionSnapshot } from "@/app/types/session";
import { updateSession } from "@/app/actions/session";
import { toast } from "sonner";
import { Loader2, Plus, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCountryStore } from "@/stores/useCountryStore";
import { useCountryHydration } from "@/hooks/useCountryHydration";
import { SavedAddress } from "@/app/types/address";

const addressSchema = z.object({
  label: z.string().max(50, "Maximum 50 characters").optional().or(z.literal("")),
  name: z.string().min(1, "Recipient name is required").max(100, "Maximum 100 characters"),
  line1: z.string().min(1, "Address line 1 is required").max(200, "Maximum 200 characters"),
  line2: z.string().max(200, "Maximum 200 characters").optional().or(z.literal("")),
  city: z.string().min(1, "City is required").max(100, "Maximum 100 characters"),
  state: z.string().min(1, "State is required").max(100, "Maximum 100 characters"),
  zip: z.string().min(1, "ZIP/Postal code is required").max(20, "Maximum 20 characters"),
  country: z.string().length(2, "Must be a valid 2-letter country code"),
  phone: z.string().min(5, "Phone number too short").max(20, "Phone number too long"),
});

type AddressFormValues = z.infer<typeof addressSchema>;

interface AddressPickerProps {
  sessionId: string;
  snapshot: SessionSnapshot;
  onAddressApplied: () => void;
}

export default function AddressPicker({ sessionId, snapshot, onAddressApplied }: AddressPickerProps) {
  const { data: addresses, isLoading: isAddressesLoading } = useAddresses();
  const { mutateAsync: createAddressAsync } = useCreateAddress();
  
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Set default selection when addresses load
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId && !isAddingNew) {
      const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
      setSelectedAddressId(defaultAddr.id);
    } else if (addresses && addresses.length === 0) {
      setIsAddingNew(true);
    }
  }, [addresses, selectedAddressId, isAddingNew]);

  // Country store for the form
  const isHydrated = useCountryHydration();
  const { countries, selectedCountry } = useCountryStore();

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: "",
      name: "",
      line1: "",
      line2: "",
      city: "",
      state: "",
      zip: "",
      country: selectedCountry?.code || "",
      phone: "",
    },
  });

  const applyAddressToSession = async (addr: SavedAddress | AddressFormValues) => {
    setIsApplying(true);
    try {
      await updateSession(sessionId, {
        shippingName: addr.name,
        shippingLine1: addr.line1,
        shippingLine2: addr.line2 || undefined,
        shippingCity: addr.city,
        shippingState: addr.state,
        shippingZip: addr.zip,
        shippingCountry: addr.country,
        shippingPhone: addr.phone,
      });
      onAddressApplied();
    } catch (error) {
      console.error("Failed to apply address:", error);
      toast.error("Failed to apply shipping address. Please try again.");
    } finally {
      setIsApplying(false);
    }
  };

  const handleSelectAddress = async (id: string) => {
    setSelectedAddressId(id);
    setIsAddingNew(false);
  };

  const handleUseSelected = async () => {
    if (!selectedAddressId) return;
    const addr = addresses?.find(a => a.id === selectedAddressId);
    if (!addr) return;
    await applyAddressToSession(addr);
  };

  const onSubmitNewAddress = async (values: AddressFormValues) => {
    setIsApplying(true);
    try {
      // 1. Save it to their address book
      const newAddr = await createAddressAsync({
        ...values,
        label: values.label || null,
        line2: values.line2 || null,
      });
      // 2. Apply to session
      await applyAddressToSession(newAddr);
      setIsAddingNew(false);
      setSelectedAddressId(newAddr.id);
    } catch (error) {
      console.error("Failed to save new address:", error);
      toast.error("Failed to save address.");
      setIsApplying(false);
    }
  };

  if (isAddressesLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm flex justify-center py-12">
        <Loader2 className="animate-spin text-[#3F3C95]" size={32} />
      </div>
    );
  }

  // Check if session already has full shipping data
  const hasFullShipping = 
    snapshot.shippingName &&
    snapshot.shippingLine1 &&
    snapshot.shippingCity &&
    snapshot.shippingState &&
    snapshot.shippingZip &&
    snapshot.shippingCountry &&
    snapshot.shippingPhone;

  return (
    <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#3F3C95]">Shipping Address</h2>
        {hasFullShipping && !isApplying && (
          <div className="flex items-center gap-1 text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            <Check size={16} /> Applied
          </div>
        )}
      </div>

      {!isAddingNew && addresses && addresses.length > 0 && (
        <div className="space-y-4">
          <div className="grid gap-3">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                onClick={() => handleSelectAddress(addr.id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedAddressId === addr.id 
                    ? "border-[#3F3C95] bg-[#3F3C95]/5" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">{addr.name}</span>
                    {addr.label && (
                      <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md">
                        {addr.label}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-0.5">
                  <p>{addr.line1}</p>
                  {addr.line2 && <p>{addr.line2}</p>}
                  <p>{addr.city}, {addr.state} {addr.zip}</p>
                  <p>{addr.country}</p>
                  <p className="pt-1 text-gray-500">📞 {addr.phone}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={handleUseSelected}
              disabled={isApplying || !selectedAddressId}
              className="flex-1 bg-[#3F3C95] hover:bg-[#3F3C95]/90 text-white rounded-full font-bold h-12"
            >
              {isApplying ? <Loader2 className="animate-spin" size={20} /> : "Use this address"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddingNew(true)}
              className="flex-1 rounded-full font-bold h-12 border-2 border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              <Plus size={18} className="mr-2" /> Add new address
            </Button>
          </div>
        </div>
      )}

      {isAddingNew && (
        <div className={addresses && addresses.length > 0 ? "pt-4 border-t border-gray-100 mt-4" : ""}>
          {addresses && addresses.length > 0 && (
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800">Add New Address</h3>
              <button 
                onClick={() => setIsAddingNew(false)}
                className="text-sm font-semibold text-[#3F3C95] hover:underline"
              >
                Cancel
              </button>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitNewAddress)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 234 567 8900" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="line1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 1</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="line2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 2 (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Apt 4B" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="New York" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State / Province</FormLabel>
                      <FormControl>
                        <Input placeholder="NY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP / Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="10001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={!isHydrated}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Home, Work" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isApplying}
                className="w-full bg-[#3F3C95] hover:bg-[#3F3C95]/90 text-white rounded-full font-bold h-12 mt-2"
              >
                {isApplying ? <Loader2 className="animate-spin" size={20} /> : "Save & Use Address"}
              </Button>
            </form>
          </Form>
        </div>
      )}
    </div>
  );
}
