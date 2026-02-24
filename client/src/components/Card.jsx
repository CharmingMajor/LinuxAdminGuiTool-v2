export default function Card({ title, icon: Icon, children, className = '', action }) {
  return (
    <div className={`card ${className}`}>
      {(title || Icon) && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-9 h-9 rounded-lg bg-brand-muted flex items-center justify-center">
                <Icon size={18} className="text-brand" />
              </div>
            )}
            {title && <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
