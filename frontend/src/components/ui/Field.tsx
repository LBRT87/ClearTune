import { InputHTMLAttributes } from "react";

export function Field({
  label,
  error,
  success,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; success?: string }) {
  return (
    <div className={`field max-w-[340px] mb-5 ${error ? "err" : ""} ${className}`}>
      <label>{label}</label>
      <input {...props} />
      {error && <p className="text-red text-base mt-2">{error}</p>}
      {success && <p className="text-green text-base mt-2">{success}</p>}
    </div>
  );
}
