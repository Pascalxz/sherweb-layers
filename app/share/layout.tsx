// Layout du partage public : styles du design system (le segment /share est hors /app).
import "@/app/sherweb-ui/tokens.css";
import "@/app/sherweb-ui/shell.css";
import "@/app/sherweb-ui/views.css";

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
