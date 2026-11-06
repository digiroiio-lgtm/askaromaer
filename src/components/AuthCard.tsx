import Image from "next/image";
export function AuthShell({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return (
    <div className="container-x py-10 md:py-14 grid md:grid-cols-2 gap-10 items-center max-w-[1040px]">
      <div className="relative hidden md:block h-[460px] rounded-[22px] overflow-hidden shadow-card">
        <Image src="/images/hero/sunset-woman.jpg" alt="" fill sizes="50vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-teal-950/70 to-transparent" />
        <p className="absolute bottom-6 left-6 right-6 font-display text-white text-[30px] leading-tight">Know before you go.</p>
      </div>
      <div>
        <h1 className="text-[40px] leading-tight">{title}</h1>
        <p className="text-ink-2 mt-2">{text}</p>
        <div className="card p-6 mt-6">{children}</div>
      </div>
    </div>
  );
}
