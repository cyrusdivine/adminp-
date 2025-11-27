import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from './../utils/supabase/info';

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);
export default function BalanceEditor({ targetUserId }:any) {
  const [balanceInput, setBalanceInput] = useState("");
  
  // Function to update balance
  async function updateBalance() {
    const newBalance = Number(balanceInput); // convert to number

    if (isNaN(newBalance)) {
      alert("Balance must be a number");
      return;
    }

    // Update the user's balance
    const { error } = await supabase
      .from("user_balances")
      .update({  balance: newBalance })
      .eq("user_id", targetUserId);

    if (error) {
      console.log(error);
      alert("Failed to update balance");
    } else {
      alert("Balance updated!");
      setBalanceInput(""); // reset input
    }
  }

  return (
    <div className="flex items-center">
      <input
        type="text"
        placeholder="edit balance"
        value={balanceInput}
        onChange={(e) => setBalanceInput(e.target.value)}
        className="ml-4 w-56 bg-white text-black rounded-full px-3 py-1 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm"
      />

      <button
        onClick={updateBalance}
        className="ml-2 px-3 py-1 rounded-full bg-white/10 text-white border border-white/20 hover:bg-white/20"
      >
        ok
      </button>
    </div>
  );
}
