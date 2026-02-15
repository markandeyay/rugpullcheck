interface RiskLabelProps {
  label: "LOW" | "MEDIUM" | "HIGH";
  size?: "sm" | "md";
}

export default function RiskLabel({ label, size = "md" }: RiskLabelProps) {
  const colors = {
    LOW: "bg-risk-low/10 text-risk-low border-risk-low/20",
    MEDIUM: "bg-risk-medium/10 text-risk-medium border-risk-medium/20",
    HIGH: "bg-risk-high/10 text-risk-high border-risk-high/20",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${colors[label]} ${sizes[size]}`}
    >
      {label}
    </span>
  );
}
