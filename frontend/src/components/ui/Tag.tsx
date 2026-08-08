type Variant = "neutral" | "purple" | "green" | "red" | "yellow" | "solid";

const variantClass: Record<Variant, string> = {
  neutral: "tag",
  purple: "tag tag-purple",
  green: "tag tag-green",
  red: "tag tag-red",
  yellow: "tag tag-yellow",
  solid: "tag tag-solid",
};

export function Tag({ variant = "neutral", children }: { variant?: Variant; children: React.ReactNode }) {
  return <span className={variantClass[variant]}>{children}</span>;
}
