import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const formSchema = z.object({
  port: z.number().min(1).max(65535),
  username: z.string().optional(),
  password: z.string().optional(),
  browserPath: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { toast } = useToast();
  
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/settings'],
    enabled: open,
  });
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      port: 85,
      username: "",
      password: "",
      browserPath: "",
    },
  });
  
  useEffect(() => {
    if (settings && open) {
      form.reset({
        port: settings.port,
        username: settings.username || "",
        password: settings.password || "",
        browserPath: settings.browserPath || "",
      });
    }
  }, [settings, form, open]);
  
  const updateSettings = useMutation({
    mutationFn: async (data: FormData) => {
      if (settings) {
        const res = await apiRequest("PATCH", `/api/settings/${settings.id}`, data);
        return await res.json();
      }
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Your settings have been saved successfully.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Save Settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: FormData) => {
    updateSettings.mutate(data);
  };
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div>
              <h4 className="text-base font-medium mb-3">Server Configuration</h4>
              
              <FormField
                control={form.control}
                name="port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Port</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="85" 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value))} 
                        value={field.value}
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500 mt-1">Default: 85</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div>
              <h4 className="text-base font-medium mb-3">Authentication</h4>
              
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter username" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Enter password" 
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div>
              <h4 className="text-base font-medium mb-3">Browser Configuration</h4>
              
              <FormField
                control={form.control}
                name="browserPath"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Browser Path</FormLabel>
                    <div className="flex">
                      <FormControl>
                        <Input 
                          placeholder="Auto-detected" 
                          className="rounded-r-none" 
                          {...field}
                          value={field.value || ""}
                          readOnly
                        />
                      </FormControl>
                      <Button type="button" className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200">
                        Browse
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Auto-detected Chrome/Edge path</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter className="pt-4 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-whatsapp-green hover:bg-whatsapp-dark-green text-white"
                disabled={updateSettings.isPending}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
