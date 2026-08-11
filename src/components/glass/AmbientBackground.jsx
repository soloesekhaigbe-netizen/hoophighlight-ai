// Subtle ambient light behind the whole app — blurred orange/blue gradient blobs
// floating over a near-black navy base. Purely decorative.
export default function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-44 right-[-12%] h-[42rem] w-[42rem] rounded-full bg-[#FF5A1F]/12 blur-[150px] animate-float" />
      <div className="absolute bottom-[-22%] left-[-12%] h-[38rem] w-[38rem] rounded-full bg-[#3C78FF]/10 blur-[160px] animate-float" style={{ animationDelay: "2.5s" }} />
      <div className="absolute top-1/2 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF5A1F]/5 blur-[170px]" />
    </div>
  );
}