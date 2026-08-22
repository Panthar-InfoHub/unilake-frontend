import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import type { SavedAddress, CreateAddressInput, UpdateAddressInput } from "@/app/types/address";
import { useCountryHydration } from "@/hooks/useCountryHydration";
import { useCountryStore } from "@/stores/useCountryStore";
import { Loader2 } from "lucide-react";

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

interface AddressFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialData: SavedAddress | null;
  onSave: (data: CreateAddressInput | UpdateAddressInput) => Promise<void>;
}

export function AddressFormModal({
  open,
  onOpenChange,
  mode,
  initialData,
  onSave,
}: AddressFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isLoading: isCountriesLoading } = useCountryHydration();
  const countries = useCountryStore((state) => state.countries);

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
      country: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (mode === "edit" && initialData) {
        form.reset({
          label: initialData.label || "",
          name: initialData.name,
          line1: initialData.line1,
          line2: initialData.line2 || "",
          city: initialData.city,
          state: initialData.state,
          zip: initialData.zip,
          country: initialData.country,
          phone: initialData.phone,
        });
      } else {
        form.reset({
          label: "",
          name: "",
          line1: "",
          line2: "",
          city: "",
          state: "",
          zip: "",
          country: "",
          phone: "",
        });
      }
    }
  }, [open, mode, initialData, form]);

  const onSubmit = async (values: AddressFormValues) => {
    setIsSubmitting(true);
    try {
      if (mode === "create") {
        await onSave({
          ...values,
          label: values.label || null,
          line2: values.line2 || null,
        } as CreateAddressInput);
      } else {
        // Partial update logic
        const changedData: UpdateAddressInput = {};
        if (values.label !== (initialData?.label || "")) changedData.label = values.label || null;
        if (values.name !== initialData?.name) changedData.name = values.name;
        if (values.line1 !== initialData?.line1) changedData.line1 = values.line1;
        if (values.line2 !== (initialData?.line2 || "")) changedData.line2 = values.line2 || null;
        if (values.city !== initialData?.city) changedData.city = values.city;
        if (values.state !== initialData?.state) changedData.state = values.state;
        if (values.zip !== initialData?.zip) changedData.zip = values.zip;
        if (values.country !== initialData?.country) changedData.country = values.country;
        if (values.phone !== initialData?.phone) changedData.phone = values.phone;

        if (Object.keys(changedData).length > 0) {
           await onSave(changedData);
        }
      }
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] font-poppins rounded-3xl border-2 border-[#914A8C] p-0 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100 bg-gray-50/50">
          <DialogTitle className="text-xl font-bold text-[#914A8C]">
            {mode === "create" ? "Add New Address" : "Edit Address"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
              
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-semibold text-sm">Label (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Home, Office, Grandma's House" className="h-11 rounded-xl bg-gray-50 border-gray-200 focus-visible:ring-[#914A8C]" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs text-red-500" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold text-sm">Recipient Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" className="h-11 rounded-xl bg-gray-50 border-gray-200 focus-visible:ring-[#914A8C]" {...field} />
                      </FormControl>
                      <FormMessage className="text-xs text-red-500" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold text-sm">Phone Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="+1234567890" className="h-11 rounded-xl bg-gray-50 border-gray-200 focus-visible:ring-[#914A8C]" {...field} />
                      </FormControl>
                      <FormMessage className="text-xs text-red-500" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="line1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-semibold text-sm">Address Line 1 *</FormLabel>
                    <FormControl>
                      <Input placeholder="Street address, P.O. box" className="h-11 rounded-xl bg-gray-50 border-gray-200 focus-visible:ring-[#914A8C]" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="line2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-semibold text-sm">Address Line 2 (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Apartment, suite, unit, building, floor, etc." className="h-11 rounded-xl bg-gray-50 border-gray-200 focus-visible:ring-[#914A8C]" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs text-red-500" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold text-sm">City *</FormLabel>
                      <FormControl>
                        <Input placeholder="City" className="h-11 rounded-xl bg-gray-50 border-gray-200 focus-visible:ring-[#914A8C]" {...field} />
                      </FormControl>
                      <FormMessage className="text-xs text-red-500" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold text-sm">State / Province *</FormLabel>
                      <FormControl>
                        <Input placeholder="State" className="h-11 rounded-xl bg-gray-50 border-gray-200 focus-visible:ring-[#914A8C]" {...field} />
                      </FormControl>
                      <FormMessage className="text-xs text-red-500" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <FormField
                  control={form.control}
                  name="zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold text-sm">ZIP / Postal Code *</FormLabel>
                      <FormControl>
                        <Input placeholder="ZIP Code" className="h-11 rounded-xl bg-gray-50 border-gray-200 focus-visible:ring-[#914A8C]" {...field} />
                      </FormControl>
                      <FormMessage className="text-xs text-red-500" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold text-sm">Country *</FormLabel>
                      <Select
                        disabled={isCountriesLoading}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                           <SelectTrigger className="h-11 rounded-xl bg-gray-50 border-gray-200 focus:ring-[#914A8C]">
                             <SelectValue placeholder={isCountriesLoading ? "Loading..." : "Select Country"} />
                           </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[200px]">
                          {countries.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                              {c.name} ({c.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs text-red-500" />
                    </FormItem>
                  )}
                />
              </div>

            </div>

            <DialogFooter className="p-6 border-t border-gray-100 bg-gray-50/50 mt-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="rounded-xl font-bold border-gray-300 text-gray-700 hover:bg-gray-100 h-11 px-6"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl font-bold bg-[#914A8C] hover:bg-[#7a3e75] text-white h-11 px-8 shadow-sm"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "create" ? "Save Address" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
