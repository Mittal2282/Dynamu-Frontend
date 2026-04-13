export function H2({ children, className = '', style = {} }) {
  return (
    <h2 className={`text-3xl sm:text-4xl font-bold text-white leading-[1.12] ${className}`} style={style}>
      {children}
    </h2>
  );
}
