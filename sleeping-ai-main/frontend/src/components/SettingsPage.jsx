import TopHeadings from "./TopHeadings";
import Notifications from "./Notifications";
// Displays the user settings
const SettingsPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-[#1B1340] to-[#C1B3E0] text-white px-4">
     {/* Header */}
    <TopHeadings posClass="absolute top-2 left-4" />  
          {/* two panels */}
      <div className="flex justify-center items-start gap-6 mt-24">
          {/* notifications */}
        <div className="bg-white/10 w-[220px] h-[400px] rounded-3xl shadow-lg p-4 text-white/70">
          <h2 className="text-lg mb-2">Notifications</h2>
          <Notifications />
        </div>
          {/* accessibility (placeholder) */}
        <div className="bg-white/10 w-[220px] h-[400px] rounded-3xl shadow-lg p-4 text-white/70">
          <h2 className="text-lg mb-2">Accessibility</h2>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;