import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "outline" | "purple" | "success" | "danger" | "warn";

const variantClass: Record<Variant, string> = {
  primary: "btn",
  outline: "btn btn-outline",
  purple: "btn btn-purple",
  success: "btn btn-success",
  danger: "btn btn-danger",
  warn: "btn btn-warn",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={`${variantClass[variant]} ${className}`} {...props} />;
}
