import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/layout/Sidebar";
import { Profile } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, Copy, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function UrlSendPage() {
  const [, setLocation] = useLocation();
  const [profile, setProfile] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [generatedUrl, setGeneratedUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  
  const { data: profiles, isLoading } = useQuery<Profile[]>({
    queryKey: ['/api/profiles'],
  });
  
  useEffect(() => {
    if (profile && phone && message) {
      const baseUrl = window.location.origin;
      const encodedMessage = encodeURIComponent(message);
      const url = `${baseUrl}/send?from=${profile}&to=${phone}&message=${encodedMessage}`;
      setGeneratedUrl(url);
    } else {
      setGeneratedUrl("");
    }
  }, [profile, phone, message]);
  
  const handleCopyUrl = () => {
    if (generatedUrl) {
      navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      
      toast({
        title: "URL Copied",
        description: "The URL has been copied to your clipboard.",
      });
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  };
  
  const formatMessage = (format: string) => {
    let updatedMessage = message;
    
    switch (format) {
      case "bold":
        updatedMessage = `*${updatedMessage}*`;
        break;
      case "italic":
        updatedMessage = `_${updatedMessage}_`;
        break;
      case "strike":
        updatedMessage = `~${updatedMessage}~`;
        break;
      case "code":
        updatedMessage = "```" + updatedMessage + "```";
        break;
      case "monospace":
        updatedMessage = "`" + updatedMessage + "`";
        break;
      default:
        break;
    }
    
    setMessage(updatedMessage);
  };
  
  const addEmoji = (emoji: string) => {
    setMessage(prevMessage => prevMessage + emoji);
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto p-6 bg-whatsapp-background">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-whatsapp-teal">Send Messages via URL</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* URL Builder Card */}
            <Card className="shadow-md">
              <CardHeader className="bg-whatsapp-teal text-white rounded-t-lg">
                <CardTitle>URL Message Builder</CardTitle>
                <CardDescription className="text-gray-100">
                  Create a URL to send WhatsApp messages directly
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label htmlFor="profile" className="text-gray-700">Select Profile</Label>
                  <Select value={profile} onValueChange={setProfile}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a profile" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoading ? (
                        <SelectItem value="loading" disabled>Loading profiles...</SelectItem>
                      ) : profiles && profiles.length > 0 ? (
                        profiles.map(p => (
                          <SelectItem key={p.id} value={p.label}>{p.label}</SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>No profiles found</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="phone" className="text-gray-700">Recipient Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="Example: 1234567890"
                    className="w-full"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">Include country code without + or 00</p>
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <Label htmlFor="message" className="text-gray-700">Message</Label>
                    <div className="space-x-1">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="text-xs px-2 h-6"
                        onClick={() => formatMessage("bold")}
                      >
                        <strong>B</strong>
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="text-xs px-2 h-6 italic"
                        onClick={() => formatMessage("italic")}
                      >
                        <em>I</em>
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="text-xs px-2 h-6 line-through"
                        onClick={() => formatMessage("strike")}
                      >
                        S
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="text-xs px-2 h-6 font-mono"
                        onClick={() => formatMessage("monospace")}
                      >
                        M
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    id="message"
                    placeholder="Type your message here..."
                    className="w-full min-h-[120px]"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label className="text-gray-700 block mb-2">Quick Emojis</Label>
                  <div className="flex flex-wrap gap-2">
                    {["👍", "❤️", "😊", "🙏", "👏", "🎉", "👌", "✅", "⭐", "🔥"].map(emoji => (
                      <Button
                        key={emoji}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-lg"
                        onClick={() => addEmoji(emoji)}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Generated URL Card */}
            <Card className="shadow-md">
              <CardHeader className="bg-whatsapp-green text-white rounded-t-lg">
                <CardTitle>Generated URL</CardTitle>
                <CardDescription className="text-gray-100">
                  Use this URL to send messages directly
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-6">
                {generatedUrl ? (
                  <>
                    <div className="p-3 bg-gray-50 rounded-lg border break-all">
                      {generatedUrl}
                    </div>
                    
                    <div className="mt-4">
                      <p className="text-sm text-gray-700 mb-2">
                        <strong>Preview:</strong> This URL will send the following message to {phone || '[phone number]'} using the {profile || '[profile]'} profile:
                      </p>
                      <div className="p-3 bg-whatsapp-light-green rounded-lg whitespace-pre-wrap">
                        {message}
                      </div>
                    </div>
                  </>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Fill in all fields to generate a URL
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setProfile("");
                    setPhone("");
                    setMessage("");
                  }}
                >
                  Clear Form
                </Button>
                
                <Button
                  className="bg-whatsapp-green hover:bg-whatsapp-dark-green text-white"
                  disabled={!generatedUrl}
                  onClick={handleCopyUrl}
                >
                  {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  Copy URL
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <Card className="mt-6 shadow-md bg-white">
            <CardHeader className="bg-gray-100 rounded-t-lg">
              <CardTitle>How to Use URL Messaging</CardTitle>
            </CardHeader>
            
            <CardContent className="pt-4">
              <div className="space-y-4">
                <p>
                  URL-based WhatsApp messaging allows you to create links that, when clicked, will automatically
                  send a predefined message to a specified recipient using your selected profile.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="p-4 border rounded-lg">
                    <p className="font-semibold text-whatsapp-teal mb-2">1. Create</p>
                    <p className="text-sm">Build your message with the form above</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="font-semibold text-whatsapp-teal mb-2">2. Copy</p>
                    <p className="text-sm">Copy the generated URL</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="font-semibold text-whatsapp-teal mb-2">3. Share</p>
                    <p className="text-sm">Share the URL with others or integrate in your applications</p>
                  </div>
                </div>
                
                <Alert className="bg-whatsapp-light-green">
                  <AlertDescription>
                    This feature requires your WhatsApp Multi-Profile Manager to be running and the selected profile to be connected.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}