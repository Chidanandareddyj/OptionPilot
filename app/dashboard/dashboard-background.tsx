export default function DashboardBackground() {
  return (
    <div aria-hidden="true" className="sky pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Atmospheric cloud elements matching landing page aesthetic */}
      <div
        className="cloud"
        style={{ top: "3%", right: "-6%", width: "50vw", height: "14vh", opacity: 0.6, transform: "rotate(-7deg)", filter: "blur(20px)" }}
      />
      <div
        className="cloud"
        style={{ top: "16%", right: "6%", width: "34vw", height: "7vh", opacity: 0.45, transform: "rotate(-5deg)", filter: "blur(16px)" }}
      />
      <div
        className="cloud"
        style={{ top: "24%", right: "-4%", width: "26vw", height: "6vh", opacity: 0.35, transform: "rotate(-4deg)", filter: "blur(16px)" }}
      />
      <div
        className="cloud"
        style={{ bottom: "6%", left: "-10%", width: "52vw", height: "32vh", opacity: 0.5 }}
      />
      <div
        className="cloud"
        style={{ bottom: "-6%", right: "-12%", width: "56vw", height: "36vh", opacity: 0.6 }}
      />
      <div
        className="cloud"
        style={{ bottom: "14%", right: "4%", width: "42vw", height: "18vh", opacity: 0.4 }}
      />
      {/* Clean sky gradient layering deepening into deep navy floor (#061f52) without AI photo tropes */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#03112e]/90 via-[#04153b]/80 to-[#061f52]/95" />
    </div>
  );
}

