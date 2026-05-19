import { createContext, useContext, useState, type ReactNode } from "react";
import {
  businessInformation,
  workspaceProfile,
  type BusinessInformation,
  type WorkspaceProfile,
} from "@/modules/workspace-settings/workspace-settings.data";

type WorkspaceSettingsContextValue = {
  business: BusinessInformation;
  profile: WorkspaceProfile;
  updateBusiness: (business: BusinessInformation) => void;
  updateProfile: (profile: WorkspaceProfile) => void;
};

const WorkspaceSettingsContext = createContext<WorkspaceSettingsContextValue | null>(null);

export function WorkspaceSettingsProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState(workspaceProfile);
  const [business, setBusiness] = useState(businessInformation);

  return (
    <WorkspaceSettingsContext.Provider
      value={{
        business,
        profile,
        updateBusiness: setBusiness,
        updateProfile: setProfile,
      }}
    >
      {children}
    </WorkspaceSettingsContext.Provider>
  );
}

export function useWorkspaceSettings() {
  const context = useContext(WorkspaceSettingsContext);

  if (!context) {
    throw new Error("useWorkspaceSettings must be used within WorkspaceSettingsProvider");
  }

  return context;
}
