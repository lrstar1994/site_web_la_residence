type AdminVisibilityFieldProps = {
  checked: boolean;
  label: string;
  name?: string;
  onChange: (checked: boolean) => void;
};

export function AdminVisibilityField({
  checked,
  label,
  name = "is_active",
  onChange,
}: AdminVisibilityFieldProps) {
  return (
    <label className="admin-news-form-field admin-checkbox-field">
      <input
        name={name}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}
