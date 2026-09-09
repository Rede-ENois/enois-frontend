import { useThemeToggleController } from "@/utils/theme/use-theme-toggle-controller";

export function ThemeToggle() {
  const { Icon, label, toggleTheme } = useThemeToggleController();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="grid h-10 w-10 place-items-center rounded-full text-text-subtle transition hover:bg-surface-2 hover:text-primary"
      aria-label={label}
      title={label}
    >
      <Icon className="h-5 w-5 transition-transform duration-300 ease-out" />
    </button>
  );
}
