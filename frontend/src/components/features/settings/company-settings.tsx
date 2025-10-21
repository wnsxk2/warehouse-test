'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const companySchema = z.object({
  name: z.string().min(1, 'Company name is required').max(200),
  address: z.string().min(1, 'Address is required').max(500),
});

type CompanyFormData = z.infer<typeof companySchema>;

export function CompanySettings() {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  // Mock company data - replace with actual company data from context/API
  const currentCompany = {
    name: 'Acme Corporation',
    address: '123 Business Street, Suite 100, New York, NY 10001',
  };

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: currentCompany.name,
      address: currentCompany.address,
    },
  });

  const onSubmit = async (data: CompanyFormData) => {
    setIsUpdating(true);
    try {
      // TODO: Implement company update API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast({
        title: 'Success',
        description: 'Company information updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update company information',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Company Information</h3>
        <p className="text-sm text-muted-foreground">
          Manage your company details and settings
        </p>
      </div>

      <Separator />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter company name" {...field} />
                </FormControl>
                <FormDescription>
                  This is your company&apos;s legal or registered name
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Address</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter company address"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Your company&apos;s physical or registered address
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button type="submit" disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
