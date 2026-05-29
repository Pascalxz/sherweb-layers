// Layout du segment /app : charge les styles du design « Sherweb Layer ».
import "@/app/sherweb-ui/tokens.css";
import "@/app/sherweb-ui/shell.css";
import "@/app/sherweb-ui/views.css";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
