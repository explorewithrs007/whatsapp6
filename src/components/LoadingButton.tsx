import { AppIcons } from "@/components/icons";
import { Button, type ButtonProps } from "@/components/ui/button";

type LoadingButtonProps = ButtonProps & {
  isLoading?: boolean;
  loadingText?: string;
};

export function LoadingButton({
  children,
  disabled,
  isLoading = false,
  loadingText,
  ...props
}: LoadingButtonProps) {
  return (
    <Button disabled={disabled || isLoading} {...props}>
      {isLoading ? <AppIcons.refresh className="h-4 w-4 animate-spin" /> : null}
      {isLoading ? loadingText ?? children : children}
    </Button>
  );
}
