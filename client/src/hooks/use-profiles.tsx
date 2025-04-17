import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Profile, InsertProfile, MessageData } from "@shared/schema";

export function useProfiles() {
  const {
    data: profiles = [],
    isLoading,
    error,
  } = useQuery<Profile[]>({
    queryKey: ["/api/profiles"],
  });

  // Create a new profile
  const createProfile = useMutation({
    mutationFn: async (profileData: Partial<InsertProfile>) => {
      const res = await apiRequest("POST", "/api/profiles", profileData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
    },
  });

  // Connect a profile (initialize WhatsApp)
  const connectProfile = useMutation({
    mutationFn: async (profileId: number) => {
      const res = await apiRequest("POST", `/api/profiles/${profileId}/connect`);
      return await res.json();
    },
  });

  // Reconnect a profile
  const reconnectProfile = useMutation({
    mutationFn: async (profileId: number) => {
      const res = await apiRequest("POST", `/api/profiles/${profileId}/reconnect`);
      return await res.json();
    },
  });

  // Delete a profile
  const deleteProfile = useMutation({
    mutationFn: async (profileId: number) => {
      await apiRequest("DELETE", `/api/profiles/${profileId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
    },
  });

  // Send a message
  const sendMessage = useMutation({
    mutationFn: async (data: { profileId: number, to: string, message: string }) => {
      const { profileId, to, message } = data;
      const res = await apiRequest("POST", `/api/profiles/${profileId}/send`, { to, message });
      return await res.json();
    },
  });

  // Initialize all profiles
  const initializeAllProfiles = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", "/api/initialize-all-profiles");
      return await res.json();
    },
  });

  return {
    profiles,
    isLoading,
    error,
    createProfile,
    connectProfile,
    reconnectProfile,
    deleteProfile,
    sendMessage,
    initializeAllProfiles,
  };
}
