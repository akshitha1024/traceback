export default function Badge({ type = "LOST" }) {
  const cls = type === "FOUND" 
    ? "bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold" 
    : "bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-semibold";
  return <span className={cls}>{type}</span>;
}
