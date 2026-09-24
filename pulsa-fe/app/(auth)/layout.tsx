export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-[#651e34] text-slate-950">
      {children}
    </div>
  );
}
