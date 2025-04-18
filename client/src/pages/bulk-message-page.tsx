import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Profile } from "@shared/schema";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { UploadCloud, Send, FileText, AlertTriangle, Check, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Popover, PopoverTrigger, PopoverContent } from '@radix-ui/react-popover'


type CSVRow = {
  phone: string;
  message: string;
  variables?: Record<string, string>;
};

export default function BulkMessagePage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedProfile, setSelectedProfile] = useState<string>("");
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [templateMessage, setTemplateMessage] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [delayBetween, setDelayBetween] = useState(5);

  const { data: profiles, isLoading } = useQuery<Profile[]>({
    queryKey: ['/api/profiles'],
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rows = parseCSV(text);
        setCsvData(rows);

        toast({
          title: "CSV Uploaded",
          description: `Successfully loaded ${rows.length} recipients.`,
        });
      } catch (error) {
        toast({
          title: "Error Parsing CSV",
          description: "Failed to parse the CSV file. Please check the format.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    };

    reader.onerror = () => {
      toast({
        title: "Error Reading File",
        description: "There was an error reading the file.",
        variant: "destructive",
      });
      setIsUploading(false);
    };

    reader.readAsText(file);
  };

  const processTemplate = (template: string, variables?: Record<string, string>): string => {
    if (!template) return "";
    if (!variables) return template;

    let result = template;
    // Replace variables
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`@${key}`, 'g'), value);
    }

    // Keep formatting intact
    return result;
  };

  const parseCSV = (text: string): CSVRow[] => {
    // Split by newlines and filter empty lines
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");

    if (lines.length === 0) {
      throw new Error("CSV file appears to be empty");
    }

    const headers = lines[0].split(',').map(header => header.trim());

    if (!headers[0] || headers[0].toLowerCase() !== 'phone') {
      throw new Error("First column must be 'phone'");
    }

    const rows: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      // Skip empty lines
      if (!lines[i].trim()) continue;

      // More robust CSV parsing - handle quoted values with commas inside
      let values: string[] = [];
      let currentValue = "";
      let insideQuotes = false;

      for (let char of lines[i]) {
        if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
          values.push(currentValue.trim());
          currentValue = "";
        } else {
          currentValue += char;
        }
      }

      // Add the last value
      values.push(currentValue.trim());

      // Remove quotes from values if they exist
      values = values.map(val => val.replace(/^"(.*)"$/, '$1'));

      if (values.length < 2) continue;

      const row: CSVRow = {
        phone: values[0],
        message: templateMessage || '', // Use template message instead of CSV message
        variables: {}
      };

      // Parse all columns except phone as variables
      for (let j = 1; j < values.length && j < headers.length; j++) {
        if (headers[j]) {
          row.variables![headers[j]] = values[j];
        }
      }

      rows.push(row);
    }

    return rows;
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };



  const sendBulkMessages = async () => {
    if (!selectedProfile || csvData.length === 0) {
      toast({
        title: "Cannot Send Messages",
        description: "Please select a profile and upload CSV data first.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    setSentCount(0);

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];

      try {
        // Process template if template message is set, otherwise use the message from CSV
        const finalMessage = templateMessage 
          ? processTemplate(templateMessage, row.variables)
          : row.message;

        await apiRequest("POST", "/api/send-message", {
          profileLabel: selectedProfile,
          to: row.phone,
          message: finalMessage
        });

        setSentCount(prev => prev + 1);

        // Add delay between messages
        if (i < csvData.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delayBetween * 1000));
        }
      } catch (error) {
        toast({
          title: "Failed to Send Message",
          description: `Error sending to ${row.phone}. Continuing with next recipient.`,
          variant: "destructive",
        });
      }
    }

    setIsSending(false);
    toast({
      title: "Bulk Send Complete",
      description: `Successfully sent ${sentCount} out of ${csvData.length} messages.`,
    });
  };

  const addFormattingTag = (format: string) => {
    let updatedMessage = templateMessage;
    const selection = window.getSelection();

    if (selection && selection.toString()) {
      const selectedText = selection.toString();

      let formattedText = selectedText;
      switch (format) {
        case "bold":
          formattedText = `*${selectedText}*`;
          break;
        case "italic":
          formattedText = `_${selectedText}_`;
          break;
        case "strikethrough":
          formattedText = `~${selectedText}~`;
          break;
        case "monospace":
          formattedText = `\`${selectedText}\``;
          break;
        case "code":
          formattedText = `\`\`\`${selectedText}\`\`\``;
          break;
      }

      // Replace the selection with formatted text in the textarea
      const start = templateMessage.indexOf(selectedText);
      if (start !== -1) {
        updatedMessage = templateMessage.substring(0, start) + 
                        formattedText + 
                        templateMessage.substring(start + selectedText.length);
      }
    } else {
      // No selection, add format tags where cursor is
      switch (format) {
        case "bold":
          updatedMessage += "*text*";
          break;
        case "italic":
          updatedMessage += "_text_";
          break;
        case "strikethrough":
          updatedMessage += "~text~";
          break;
        case "monospace":
          updatedMessage += "`text`";
          break;
        case "code":
          updatedMessage += "```code```";
          break;
      }
    }

    setTemplateMessage(updatedMessage);
  };

  const downloadSampleCSV = () => {
    const sampleData = 
      "phone,message,name,company\n" +
      "1234567890,Hello {name} from {company}!,John,Acme Inc\n" +
      "9876543210,Hi {name}! How are you today?,Jane,XYZ Corp";

    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'whatsapp_bulk_sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-6 bg-whatsapp-background">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-whatsapp-teal">Bulk Message Sender</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuration Card */}
            <Card className="shadow-md">
              <CardHeader className="bg-whatsapp-teal text-white rounded-t-lg">
                <CardTitle>Message Configuration</CardTitle>
                <CardDescription className="text-gray-100">
                  Set up your bulk message campaign
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label htmlFor="profile" className="text-gray-700">Select WhatsApp Profile</Label>
                  <Select value={selectedProfile} onValueChange={setSelectedProfile}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a profile" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoading ? (
                        <SelectItem value="loading" disabled>Loading profiles...</SelectItem>
                      ) : profiles && profiles.length > 0 ? (
                        profiles.map(profile => (
                          <SelectItem key={profile.id} value={profile.label}>
                            {profile.label}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>No profiles found</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="delay" className="text-gray-700">Delay Between Messages (seconds)</Label>
                  </div>
                  <Input
                    id="delay"
                    type="number"
                    min={3}
                    max={60}
                    value={delayBetween}
                    onChange={(e) => setDelayBetween(Number(e.target.value))}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Recommended: 5+ seconds to avoid being blocked by WhatsApp
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <Label htmlFor="csv-upload" className="text-gray-700">Upload Recipient CSV</Label>
                    <Button 
                      variant="link" 
                      className="text-xs text-whatsapp-teal"
                      onClick={downloadSampleCSV}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Download Sample
                    </Button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    id="csv-upload"
                    accept=".csv"
                    className="sr-only"
                    onChange={handleFileChange}
                  />

                  <Button
                    onClick={handleUploadClick}
                    variant="outline"
                    className="w-full h-24 border-dashed border-2 text-gray-500 hover:text-whatsapp-teal hover:border-whatsapp-teal"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <UploadCloud className="h-5 w-5 mr-2" />
                    )}
                    {csvData.length > 0 
                      ? `${csvData.length} recipients loaded. Click to replace.` 
                      : "Click to upload CSV file"}
                  </Button>

                  <p className="text-xs text-gray-500 mt-1">
                    Format: phone,message,custom_variable1,custom_variable2,...
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="template" className="text-gray-700">
                      Message Template (Optional)
                    </Label>
                    <div className="flex items-center space-x-2">
                      {csvData.length > 0 && csvData[0].variables && (
                        <Select
                          onValueChange={(value) => {
                            setTemplateMessage(templateMessage + `@${value}`);
                          }}
                        >
                          <SelectTrigger className="w-[140px] h-7">
                            <SelectValue placeholder="Insert variable" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(csvData[0].variables).map((key) => (
                              <SelectItem key={key} value={key}>
                                @{key}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <div className="space-x-1">
                        <Button 
                          type="button" 
                          variant="outline" 
                        size="sm" 
                        className="text-xs px-2 h-6"
                        onClick={() => addFormattingTag("bold")}
                      >
                        <strong>B</strong>
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="text-xs px-2 h-6 italic"
                        onClick={() => addFormattingTag("italic")}
                      >
                        <em>I</em>
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        className="text-xs px-2 h-6 line-through"
                        onClick={() => addFormattingTag("strikethrough")}
                      >
                        S
                      </Button>
                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm" 
                        className="text-xs px-2 h-6 font-mono"
                        onClick={() => addFormattingTag("monospace")}
                      >
                        M
                      </Button>
                    </div>
                    </div>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="p-2">
                        😊 Add Emoji
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-4">
                        <div>
                          <h4 className="mb-2 text-sm font-medium text-whatsapp-teal">Smileys & People</h4>
                          <div className="grid grid-cols-8 gap-2">
                            {"😀 😃 😄 😁 😅 😂 🤣 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚 😋 😛 😝 😜 🤪 🤨 🧐 🤓 😎".split(" ").map(emoji => (
                              <Button
                                key={emoji}
                                variant="ghost"
                                size="sm"
                                className="p-1 h-8 hover:bg-whatsapp-light-green transition-colors"
                                onClick={() => setTemplateMessage(prev => prev + emoji)}
                              >
                                {emoji}
                              </Button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="mb-2 text-sm font-medium text-whatsapp-teal">Gestures & Body</h4>
                          <div className="grid grid-cols-8 gap-2">
                            {"👋 🤚 🖐 ✋ 🖖 👌 🤌 🤏 ✌️ 🤞 🫰 🤟 🤘 🤙 👈 👉 👆 🖕 👇 ☝️ 👍 👎 ✊ 👊 🤛 🤜 👏 🙌 👐 🤲".split(" ").map(emoji => (
                              <Button
                                key={emoji}
                                variant="ghost"
                                size="sm"
                                className="p-1 h-8 hover:bg-whatsapp-light-green transition-colors"
                                onClick={() => setTemplateMessage(prev => prev + emoji)}
                              >
                                {emoji}
                              </Button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="mb-2 text-sm font-medium text-whatsapp-teal">Objects & Symbols</h4>
                          <div className="grid grid-cols-8 gap-2">
                            {"❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❣️ 💕 💞 💓 💗 💖 💘 💝 💟 ☮️ ✝️ ☪️ 🕉️ ☸️ ✡️ 🔯 🕎 ☯️ ☦️".split(" ").map(emoji => (
                              <Button
                                key={emoji}
                                variant="ghost"
                                size="sm"
                                className="p-1 h-8 hover:bg-whatsapp-light-green transition-colors"
                                onClick={() => setTemplateMessage(prev => prev + emoji)}
                              >
                                {emoji}
                              </Button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="mb-2 text-sm font-medium text-whatsapp-teal">Business & Work</h4>
                          <div className="grid grid-cols-8 gap-2">
                            {"💼 📁 📂 🗂️ 📅 📆 🗓️ 📇 📈 📉 📊 📋 📌 📍 📎 🖇️ 📏 📐 ✂️ 🗃️ 🗄️ 🗑️ 🔒 🔓 🔏 🔐 🔑 🗝️ 🪪 🏷️".split(" ").map(emoji => (
                              <Button
                                key={emoji}
                                variant="ghost"
                                size="sm"
                                className="p-1 h-8 hover:bg-whatsapp-light-green transition-colors"
                                onClick={() => setTemplateMessage(prev => prev + emoji)}
                              >
                                {emoji}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Textarea
                    id="template"
                    className="min-h-[120px]"
                    placeholder="Enter message template with variables like {name}, {company}, etc. Leave blank to use messages from CSV."
                    value={templateMessage}
                    onChange={(e) => setTemplateMessage(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Variables in {"{braces}"} will be replaced with values from CSV.
                  </p>
                </div>
              </CardContent>

              <CardFooter className="border-t border-gray-200 pt-4">
                <Button
                  className="ml-auto bg-whatsapp-green hover:bg-whatsapp-dark-green text-white"
                  disabled={!selectedProfile || csvData.length === 0 || isSending}
                  onClick={sendBulkMessages}
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Sending ({sentCount}/{csvData.length})
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Bulk Messages
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Preview Card */}
            <Card className="shadow-md">
              <CardHeader className="bg-whatsapp-green text-white rounded-t-lg">
                <CardTitle>Message Preview</CardTitle>
                <CardDescription className="text-gray-100">
                  Preview your message with variables
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-6">
                <div className="p-4 bg-whatsapp-light rounded-lg">
                  <Label className="text-sm font-medium mb-2 block">Template Message</Label>
                  <div className="whitespace-pre-wrap bg-whatsapp-message p-3 rounded border">
                    {templateMessage || "No template message set"}
                  </div>
                </div>

                {csvData.length > 0 && (
                  <div className="p-4 bg-whatsapp-light rounded-lg">
                    <Label className="text-sm font-medium mb-2 block">Sample Preview</Label>
                    <div className="whitespace-pre-wrap bg-whatsapp-message p-3 rounded border">
                      {processTemplate(templateMessage, csvData[0]?.variables)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recipients Card */}
            <Card className="shadow-md mt-6">
              <CardHeader className="bg-whatsapp-green text-white rounded-t-lg">
                <CardTitle>Recipients Preview</CardTitle>
                <CardDescription className="text-gray-100">
                  Preview of loaded recipient data
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-6">
                {csvData.length > 0 ? (
                  <div className="border rounded-md overflow-auto max-h-[400px]">
                    <Table>
                      <TableHeader className="bg-gray-50 sticky top-0">
                        <TableRow>
                          <TableHead className="w-[150px]">Phone</TableHead>
                          <TableHead>Message</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvData.map((row, index) => (
                          <TableRow key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <TableCell className="font-medium">{row.phone}</TableCell>
                            <TableCell className="whitespace-pre-wrap break-words">
                              {templateMessage ? processTemplate(templateMessage, row.variables) : row.message}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-md">
                    <AlertTriangle className="h-10 w-10 text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium text-gray-700">No Data Loaded</h3>
                    <p className="text-sm text-gray-500 max-w-xs mt-2">
                      Upload a CSV file to see a preview of your recipients and messages.
                    </p>
                  </div>
                )}

                {csvData.length > 0 && (
                  <div className="mt-4 text-sm text-gray-600">
                    <Check className="inline-block h-4 w-4 text-whatsapp-green mr-1" />
                    {csvData.length} recipients loaded
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6 shadow-md">
            <CardHeader className="bg-gray-100">
              <CardTitle>WhatsApp Formatting Guide</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-whatsapp-teal mb-2">Text Formatting</h3>
                  <ul className="space-y-2 text-sm">
                    <li><strong>Bold:</strong> *text*</li>
                    <li><em>Italic:</em> _text_</li>
                    <li><del>Strikethrough:</del> ~text~</li>
                    <li><code>Monospace:</code> `text`</li>
                    <li><pre className="inline">Code block:</pre> ```code```</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-whatsapp-teal mb-2">Variables</h3>
                  <ul className="space-y-2 text-sm">
                    <li>Variable format: @variable_name</li>
                    <li>Example: Hello @name from @company!</li>
                    <li>Variables must match CSV column headers</li>
                    <li>First column must be phone</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}