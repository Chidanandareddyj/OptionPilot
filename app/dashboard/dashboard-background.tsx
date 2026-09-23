export default function DashboardBackground() {
  return (
    <div aria-hidden="true" className="sky pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="cloud" style={{ top: "4%", right: "-5%", width: "45vw", height: "15vh", opacity: 0.6 }} />
      <div className="cloud" style={{ bottom: "10%", left: "-10%", width: "50vw", height: "30vh", opacity: 0.5 }} />
      <div className="cloud" style={{ bottom: "-5%", right: "-10%", width: "55vw", height: "35vh", opacity: 0.65 }} />
      <img src="/everest.jpg" alt="" className="absolute inset-0 h-full w-full scale-105 object-cover object-bottom opacity-40 blur-lg" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#03112e]/95 via-[#04153b]/82 to-[#03112e]/97" />
    </div>
  );
}
