//The page that displays to credit purchase options
import TopHeadings from "./TopHeadings";
import CoinIcon from "../../images/coinsEmoticon.png";


const CreditsPage = () => {
//static credit buy options
  const creditBuyOptions = [
    { title: "1000 credits", price: "5.99 £" },
    { title: "3000 credits", price: "13.99 £" },
    { title: "2000 credits", price: "9.99 £" },
    { title: "4000 credits", price: "17.99 £" },
    { title: "5000 credits", price: "22.99 £" },
  ];

//history list
  const creditHistory = [
    { timeStamp: "21.06.2025 : 12:11", type: "1000 credits purchased" },
  ];

  return (
  
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#1B1340] to-[#C1B3E0] text-white px-4">
           <TopHeadings posClass="absolute top-2 left-4" />  

        <div className="justify-self-start">
        </div>
         {/* Left column contains the credit purchase options and the right one the hitory of purchases */}
      <div className="flex justify-center items-start gap-6 mt-24">
        <div className="bg-white/10 w-[420px] h-[550px] rounded-3xl shadow-lg p-4 text-white/70">
          <h2 className="text-lg mb-4">Credit Packs</h2>
        
        {/* credit pack grid */}
          <div className="grid grid-cols-2 gap-4">
            {creditBuyOptions.map((pack, index) => (
              <button
                key={index}
                className="bg-white/10 rounded-2xl shadow-md p-3 flex flex-col items-center justify-center hover:bg-white/15 transition"
              >
                <span className="text-white/90 font-semibold">{pack.title}</span>
                <img
                  src={CoinIcon}
                  alt="coin"
                  className="w-10 h-10 object-contain my-2"
                />
                <span className="text-sm">{pack.price}</span>
              </button>
            ))}
          </div>
          {/* Promo code input section */}

          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm font-semibold text-white/80">Promo code</span>
            <input
              type="text"
              placeholder="..."
              className="flex-1 bg-white/15 rounded-2xl px-3 py-1 text-sm text-white placeholder:text-white/50 outline-none"
            />
          </div>
        </div>
          {/* List of credit purchase history */}

        <div className="bg-white/10 w-[220px] h-[400px] rounded-3xl shadow-lg p-4 text-white/70">
          <h2 className="text-lg mb-2">Purchase History</h2>

          <ul className="space-y-2">
            {creditHistory.map((item, index) => (
              <li
                key={index}
                className="bg-white/10 p-2 rounded-xl shadow-sm text-sm text-white/90"
              >
                <span className="font-semibold">{item.timeStamp}</span> / {item.type}
              </li>
            ))}
            {/* Displayed if no purchases have been made */}
            {creditHistory.length === 0 && (
              <li className="text-white/50">No purchases yet.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreditsPage;