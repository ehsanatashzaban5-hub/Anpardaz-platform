import AnHooshScreen from "../../../../mobile/src/AnHoosh";

/**
 * An Hoosh web surface intentionally reuses the approved mobile An Hoosh UI
 * as its visual source of truth. Backend/auth/model APIs remain the same.
 * Keep this adapter thin: visual changes belong in the canonical AnHoosh UI.
 */
export default function WebHoosh({ onNavigate }: { onNavigate: (p: any) => void }) {
  return <AnHooshScreen onBack={() => onNavigate("home")} />;
}
