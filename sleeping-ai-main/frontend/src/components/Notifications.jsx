import TopHeadings from "./TopHeadings";
//Notifications 
const Notifications = () => {
  return (
    <div className="space-y-1">
          <TopHeadings posClass="absolute top-2 left-4" />  

      <label className="flex items-center gap-3">
        <input type="checkbox" defaultChecked />
        <span className="text-white/65 text-sm">Test notification</span>
      </label>
    </div>
  );
};

export default Notifications;
