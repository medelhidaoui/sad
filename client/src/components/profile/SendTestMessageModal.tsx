import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { SendIcon, Loader2 } from "lucide-react";
import { useProfiles } from "@/hooks/use-profiles";
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

interface SendTestMessageModalProps {
  open: boolean;
  onClose: () => void;
  profileId: number;
  profileLabel: string;
}

const formSchema = z.object({
  to: z.string().trim().min(1, "Phone number is required"),
  message: z.string().trim().min(1, "Message is required"),
});

type FormData = z.infer<typeof formSchema>;

export function SendTestMessageModal({ open, onClose, profileId, profileLabel }: SendTestMessageModalProps) {
  const { sendMessage } = useProfiles();
  const { toast } = useToast();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      to: "",
      message: "",
    },
  });
  
  const onSubmit = async (data: FormData) => {
    try {
      await sendMessage.mutateAsync({
        profileId,
        to: data.to,
        message: data.message,
      });
      
      toast({
        title: "Message Sent",
        description: `Your message has been sent successfully via ${profileLabel}.`,
      });
      
      onClose();
      form.reset();
    } catch (error) {
      toast({
        title: "Failed to Send Message",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Test Message</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <div className="flex">
                    <div className="inline-flex items-center px-3 text-gray-500 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md">
                      +
                    </div>
                    <FormControl>
                      <Input 
                        placeholder="Enter phone number" 
                        className="rounded-l-none" 
                        {...field} 
                      />
                    </FormControl>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Include country code (e.g. 1 for US)</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter your message" 
                      className="resize-none" 
                      rows={4} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-whatsapp-green hover:bg-whatsapp-dark-green text-white flex items-center"
                disabled={sendMessage.isPending}
              >
                {sendMessage.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <SendIcon className="mr-2 h-4 w-4" />
                    Send Message
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
