export function Avatar({ url, name }: { url: string; name: string }) {
  const initials = name ? name.slice(0, 2).toUpperCase() : '??';
  const hue = name
    ? name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
    : 0;

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-1 ring-white/10"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white/90 ring-1 ring-white/10"
      style={{ background: `hsl(${hue}, 60%, 35%)` }}
    >
      {initials}
    </div>
  );
}
