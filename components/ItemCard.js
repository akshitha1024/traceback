import Link from "next/link";
import Badge from "./Badge";

export default function ItemCard({ id, type, title, location, date, ago, category }) {
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
      <div className="mb-3 flex items-center gap-2">
        <Badge type={type} />
        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">{category}</span>
        {ago && <span className="ml-auto text-xs text-gray-500 font-medium">{ago}</span>}
      </div>
      <div className="mb-3 aspect-[4/3] rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200" />
      <div className="font-semibold text-gray-900 mb-1">{title}</div>
      <div className="text-sm text-gray-600 mb-3">
        {location} • {date}
      </div>
      <Link
        href={`/items/${id}`}
        className="inline-flex bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
      >
        VIEW DETAILS
      </Link>
    </div>
  );
}
