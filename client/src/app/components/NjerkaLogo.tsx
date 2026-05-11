import { Link } from "react-router-dom";

const NjerkaLogo = ({ className, text, size }: { className?: string, text?: boolean, size?: 'small' | 'medium' | 'large' }) => {
  const sizeClass = size === 'small' ? 'w-10 h-10' : size === 'medium' ? 'w-14 h-14' : 'w-20 h-20';
  const dimensions = size === 'small' ? '40' : size === 'medium' ? '56' : '80';
  
  return (
    <Link className={`hover:scale-95 duration-300 cursor-pointer flex items-center justify-center gap-2 ${className}`} to="/">
      <img
        src="/image.png"
        alt="Njerka AI Health Platform Logo"
        width={dimensions}
        height={dimensions}
        className={`${sizeClass} mix-blend-multiply`}
        decoding="async"
      />
      {text && <span className="font-extrabold text-sm sm:text-xl md:text-2xl p-0 text-green-800 tracking-tight">Njerka</span>}
    </Link>
  );
};

export default NjerkaLogo;