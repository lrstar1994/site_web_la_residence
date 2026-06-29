import { cloneElement, isValidElement, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "primary" | "secondary";
};

export function Button({
  asChild = false,
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  const classes = cn(
    "inline-flex min-h-11 items-center justify-center rounded-md px-5 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2",
    variant === "primary" &&
      "bg-accent text-accent-foreground hover:bg-accent/90",
    variant === "secondary" &&
      "border border-border bg-white text-foreground hover:border-accent hover:text-accent",
    className,
  );

  if (asChild && isValidElement<{ className?: string }>(props.children)) {
    return cloneElement(props.children, {
      className: cn(classes, props.children.props.className),
    });
  }

  return <button className={classes} {...props} />;
}
