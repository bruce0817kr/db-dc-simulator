interface TextInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  inputMode?: "text" | "numeric" | "decimal";
  suffix?: string;
  placeholder?: string;
}

export function TextInput({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  inputMode = "text",
  suffix,
  placeholder,
}: TextInputProps) {
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          inputMode={inputMode}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`min-h-[44px] w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-blue-500 ${
            suffix ? "pr-10" : ""
          } ${
            error
              ? "border-red-400 focus:ring-red-400"
              : "border-gray-300 focus:border-blue-500"
          }`}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 text-sm text-gray-500">
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
